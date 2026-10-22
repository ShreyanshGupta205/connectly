-- =====================================================================
-- Connectly: Dedicated Least-Privilege Role & View for Edge OpenGraph (api/og.mjs)
--
-- This script configures a dedicated read-only role (og_reader) and a restricted
-- public view (public.public_profiles) for social preview crawlers and edge bots.
--
-- ARCHITECTURAL OVERVIEW & RECOMMENDATION:
-- Two implementation variants are provided below.
--
-- [RECOMMENDED] VARIANT A: Owner-Privileged View (Without security_invoker)
--   - The view executes under the privileges of its owner (postgres).
--   - og_reader receives ZERO permissions (table-level or column-level) on base tables.
--   - Direct queries to public.profiles or private columns (e.g. email) are completely denied.
--   - Base-table RLS does NOT block edge bots (which connect without user JWTs), preventing
--     subtle RLS breakage during high-concurrency crawler bursts.
--   - Why this is recommended: Guarantees strict least-privilege boundary, prevents
--     column leakage, and avoids edge-case failures with connection poolers.
--
-- VARIANT B: Invoker-Privileged View (WITH security_invoker = true)
--   - The view executes under caller context (og_reader) (PostgreSQL 15+).
--   - og_reader REQUIRES an explicit column-level GRANT on public.profiles:
--       GRANT SELECT (username, name, tagline, bio, avatar_url, theme_id) ON public.profiles TO og_reader;
--   - AND requires an explicit RLS policy on public.profiles:
--       CREATE POLICY "og_reader_select_policy" ON public.profiles FOR SELECT TO og_reader USING (...);
--   - Trade-off: If base table RLS changes or column grants are misconfigured, the view
--     will fail with "permission denied for table profiles".
--
-- INSTRUCTIONS FOR FOUNDER:
-- Review this script. Do NOT commit real passwords to git.
-- Execute manually in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<project-ref>/sql/new
-- (Zero live DB access rule: This script is reviewed and executed manually by the founder).
-- =====================================================================


-- =====================================================================
-- PART 1: Role Creation & Baseline Hardening (Common to both variants)
-- =====================================================================

-- 1. Create the dedicated read-only role for edge bot queries
-- Replace 'YOUR_STRONG_PASSWORD_HERE' with a secure random secret before executing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'og_reader') THEN
    CREATE ROLE og_reader WITH LOGIN PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
  END IF;
END
$$;

-- 2. Grant minimal connection and schema usage permissions
GRANT CONNECT ON DATABASE postgres TO og_reader;
GRANT USAGE ON SCHEMA public TO og_reader;

-- 3. Hardening: Revoke default table, sequence, and routine privileges from og_reader
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM og_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM og_reader;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM og_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM og_reader;


-- =====================================================================
-- CHOOSE ONE VARIANT BELOW (VARIANT A IS RECOMMENDED)
-- =====================================================================

-- =====================================================================
-- [RECOMMENDED] VARIANT A: Owner-Privileged View (Without security_invoker)
-- =====================================================================
-- In Variant A, the view runs as owner (postgres). og_reader is granted SELECT
-- strictly on the view and has zero access to the base table public.profiles.

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    username,
    name,
    tagline,
    bio,
    avatar_url,
    theme_id
FROM public.profiles
WHERE username IS NOT NULL 
  AND username != '';

ALTER VIEW public.public_profiles OWNER TO postgres;

-- Lock down the view: REVOKE ALL from anon, authenticated, and PUBLIC
REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;

-- Grant SELECT strictly on the view to og_reader
GRANT SELECT ON public.public_profiles TO og_reader;


/*
-- =====================================================================
-- VARIANT B: Invoker-Privileged View (security_invoker = true)
-- (Uncomment this section ONLY if you choose Variant B over Variant A)
-- =====================================================================

CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
    username,
    name,
    tagline,
    bio,
    avatar_url,
    theme_id
FROM public.profiles
WHERE username IS NOT NULL 
  AND username != '';

ALTER VIEW public.public_profiles OWNER TO postgres;

-- Lock down the view from standard API roles
REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_profiles TO og_reader;

-- Under security_invoker = true, og_reader executes the view query directly
-- and therefore REQUIRES column-level privileges on public.profiles:
GRANT SELECT (username, name, tagline, bio, avatar_url, theme_id) 
ON public.profiles TO og_reader;

-- Ensure RLS policy allows og_reader to read public rows
DROP POLICY IF EXISTS "og_reader_select_policy" ON public.profiles;
CREATE POLICY "og_reader_select_policy" 
ON public.profiles 
FOR SELECT 
TO og_reader 
USING (username IS NOT NULL AND username != '');
-- =====================================================================
*/


-- =====================================================================
-- VERIFICATION QUERY BLOCK (Run as postgres in Supabase SQL Editor)
-- =====================================================================
-- This verification block proves that og_reader can read allowed public fields
-- for real handles, but is strictly DENIED access to private columns (like email)
-- or unauthorized tables.

-- Switch context to og_reader
SET ROLE og_reader;

-- 1. POSITIVE TEST: Must SUCCEED. Fetches real handle row from the view.
SELECT username, name, tagline, avatar_url, theme_id 
FROM public.public_profiles 
WHERE LOWER(username) = 'shreyansh';

-- 2. NEGATIVE TEST: Must FAIL (ERROR: column "email" does not exist).
-- Proves private column 'email' cannot be accessed via the public_profiles view.
SELECT username, email 
FROM public.public_profiles 
WHERE LOWER(username) = 'shreyansh';

-- 3. NEGATIVE TEST: Must FAIL (ERROR: permission denied for table profiles).
-- Proves direct base-table query for private columns is blocked by PostgreSQL.
SELECT email FROM public.profiles WHERE LOWER(username) = 'shreyansh';

-- 4. NEGATIVE TEST: Must FAIL (ERROR: permission denied for table profiles).
-- Proves direct SELECT * on base profiles table is blocked.
SELECT * FROM public.profiles LIMIT 1;

-- 5. NEGATIVE TEST: Must FAIL (ERROR: permission denied for table profile_analytics).
-- Proves og_reader cannot view telemetry or analytics.
SELECT * FROM public.profile_analytics LIMIT 1;

-- 6. NEGATIVE TEST: Must FAIL (ERROR: permission denied).
-- Proves og_reader cannot modify or insert data.
UPDATE public.public_profiles SET name = 'Unauthorized' WHERE username = 'shreyansh';

-- Reset context back to administrative owner
RESET ROLE;

-- 7. NEGATIVE TEST: Must FAIL (ERROR: permission denied for view public_profiles).
-- Proves anon API role cannot access the view.
SET ROLE anon;
SELECT * FROM public.public_profiles LIMIT 1;
RESET ROLE;

-- 8. NEGATIVE TEST: Must FAIL (ERROR: permission denied for view public_profiles).
-- Proves authenticated API role cannot access the view directly.
SET ROLE authenticated;
SELECT * FROM public.public_profiles LIMIT 1;
RESET ROLE;

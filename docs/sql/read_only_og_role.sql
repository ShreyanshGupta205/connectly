-- =====================================================================
-- Connectly: Dedicated Least-Privilege Role & View for Edge OpenGraph (api/og.mjs)
--
-- SCHEMA AUDIT FINDING:
-- Inspection of public.profiles confirms there is NO 'is_public' or 'is_published' column
-- in the active schema. All claimed profiles are currently public.
-- The view filters on valid active usernames (WHERE username IS NOT NULL AND username != '').
-- If an 'is_published' boolean column is added later, uncomment the filter clause below.
--
-- REVIEW INSTRUCTIONS FOR FOUNDER:
-- Review this SQL script before execution. Do NOT commit real passwords to git.
-- Execute manually in Supabase SQL Editor (Dashboard -> Project -> SQL Editor).
-- Do NOT run this automatically via agent.
-- =====================================================================

-- 1. Create a secure view exposing ONLY the fields required for OG preview tags.
-- Using security_invoker = true ensures underlying RLS is evaluated in caller context (PostgreSQL 15+).
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
  AND username != ''
  -- AND is_published = true -- Uncomment if 'is_published' column is added to public.profiles
;

ALTER VIEW public.public_profiles OWNER TO postgres;

-- 2. Explicitly REVOKE ALL permissions on the view from anon and authenticated roles.
-- Supabase automatically grants broad schema defaults to API roles; this closes the vector.
REVOKE ALL ON public.public_profiles FROM anon, authenticated;

-- 3. Create the dedicated read-only role for edge bot queries
-- Replace 'YOUR_STRONG_PASSWORD_HERE' with a secure random secret before executing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'og_reader') THEN
    CREATE ROLE og_reader WITH LOGIN PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
  END IF;
END
$$;

-- 4. Grant minimal connection and schema usage permissions
GRANT CONNECT ON DATABASE postgres TO og_reader;
GRANT USAGE ON SCHEMA public TO og_reader;

-- 5. Revoke access from base tables to enforce least-privilege boundary
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM og_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM og_reader;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM og_reader;

-- 6. Grant SELECT strictly on the public_profiles view to og_reader
GRANT SELECT ON public.public_profiles TO og_reader;

-- Prevent future table default permission leaks to og_reader
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM og_reader;


-- =====================================================================
-- 7. VERIFICATION QUERY BLOCK (Run as postgres in Supabase SQL Editor)
-- =====================================================================
-- Step A: Test as og_reader (Must succeed on view, fail on raw tables)
SET ROLE og_reader;

-- Test 1 (Should SUCCEED): Read public profile fields from view
SELECT username, name, tagline, avatar_url, theme_id 
FROM public.public_profiles 
WHERE LOWER(username) = 'shreyansh';

-- Test 2 (Should FAIL - permission denied for table profiles):
-- Direct base table access must be blocked
SELECT * FROM public.profiles LIMIT 1;

-- Test 3 (Should FAIL - permission denied for table profile_analytics):
SELECT * FROM public.profile_analytics LIMIT 1;

-- Test 4 (Should FAIL - permission denied):
-- og_reader is read-only and cannot write or update
UPDATE public.public_profiles SET name = 'Unauthorized' WHERE username = 'shreyansh';

RESET ROLE;

-- Step B: Verify anon and authenticated roles have zero access to public_profiles view
SET ROLE anon;
-- Should FAIL: permission denied for view public_profiles
SELECT * FROM public.public_profiles LIMIT 1;
RESET ROLE;

SET ROLE authenticated;
-- Should FAIL: permission denied for view public_profiles
SELECT * FROM public.public_profiles LIMIT 1;
RESET ROLE;

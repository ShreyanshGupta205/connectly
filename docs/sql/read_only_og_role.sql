-- Connectly: Read-Only Postgres Role & View for Edge OpenGraph (api/og.mjs)
-- REVIEW INSTRUCTIONS FOR FOUNDER:
-- Review this SQL script. Do NOT commit passwords.
-- Execute in Supabase SQL Editor (Dashboard -> Project -> SQL Editor).

-- 1. Create a secure public view exposing ONLY the public profile fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    username,
    name,
    tagline,
    bio,
    avatar_url,
    theme_id
FROM public.profiles;

ALTER VIEW public.public_profiles OWNER TO postgres;

-- 2. Create the dedicated read-only role
-- Replace 'YOUR_SECURE_PASSWORD_HERE' with a strong random secret before running
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'og_reader') THEN
    CREATE ROLE og_reader WITH LOGIN PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
  END IF;
END
$$;

-- 3. Grant minimal connection and schema permissions
GRANT CONNECT ON DATABASE postgres TO og_reader;
GRANT USAGE ON SCHEMA public TO og_reader;

-- 4. Grant SELECT strictly on the public_profiles view
GRANT SELECT ON public.public_profiles TO og_reader;

-- 5. Revoke access from base tables to enforce least privilege
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM og_reader;
GRANT SELECT ON public.public_profiles TO og_reader;

-- Prevent future table default permission leaks
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM og_reader;

-- VERIFICATION QUERY (Test as og_reader):
-- SET ROLE og_reader;
-- SELECT * FROM public.public_profiles WHERE LOWER(username) = 'shreyansh'; -- Should succeed
-- SELECT * FROM public.profiles; -- Should FAIL: permission denied for table profiles
-- RESET ROLE;

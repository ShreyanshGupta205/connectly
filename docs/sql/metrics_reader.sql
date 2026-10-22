-- =====================================================================
-- Connectly: Least-Privilege Read-Only Metrics Aggregation View & Role
--
-- Target Database: Production Supabase (Executed manually by founder)
-- Security:
--   - Role 'metrics_reader' has ZERO access to raw tables (profiles, analytics, etc.)
--   - Role 'metrics_reader' has SELECT only on view 'public_metrics'
--   - ZERO PII: Contains exclusively aggregate numeric counts
--   - Excludes seed/internal usernames: shreyansh, sarah, alex, demo, test, admin
-- =====================================================================

-- 1. Create the Aggregate View
CREATE OR REPLACE VIEW public_metrics AS
SELECT 
  -- Total profile count
  (SELECT COUNT(*) FROM profiles) AS total_profiles,

  -- Activated profiles: >=3 links, >=1 share, >=1 like, excluding test/seed handles
  (SELECT COUNT(*) FROM profiles 
   WHERE LOWER(username) NOT IN ('shreyansh', 'sarah', 'alex', 'demo', 'test', 'admin')
     AND jsonb_array_length(COALESCE(links, '[]'::jsonb)) >= 3
     AND COALESCE((stats->>'shares')::int, 0) >= 1
     AND COALESCE((stats->>'likes')::int, 0) >= 1
  ) AS activated_profiles,

  -- Total platform engagement aggregates
  (SELECT COALESCE(SUM((stats->>'shares')::int), 0) FROM profiles) AS total_shares,
  (SELECT COALESCE(SUM((stats->>'likes')::int), 0) FROM profiles) AS total_likes,
  (SELECT COALESCE(SUM((stats->>'qrScans')::int), 0) FROM profiles) AS total_qr_scans,
  (SELECT COALESCE(SUM((stats->>'views')::int), 0) FROM profiles) AS total_views,

  -- Source-specific visit attribution counts (from profile_analytics if present)
  (SELECT COUNT(*) FROM profile_analytics WHERE referrer ILIKE '%?s=share%' OR referrer ILIKE '%source=share%') AS visits_from_share,
  (SELECT COUNT(*) FROM profile_analytics WHERE referrer ILIKE '%?s=qr%' OR referrer ILIKE '%source=qr%') AS visits_from_qr,
  (SELECT COUNT(*) FROM profile_analytics WHERE referrer ILIKE '%?s=poster%' OR referrer ILIKE '%source=poster%') AS visits_from_poster;

-- 2. Create Dedicated Least-Privilege Role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metrics_reader') THEN
    CREATE ROLE metrics_reader WITH LOGIN PASSWORD 'REPLACE_WITH_SECURE_METRICS_PASSWORD';
  END IF;
END $$;

-- 3. Grant Strict Least-Privilege Permissions
GRANT USAGE ON SCHEMA public TO metrics_reader;
GRANT SELECT ON public_metrics TO metrics_reader;

-- 4. Revoke everything else in schema public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM metrics_reader;
GRANT SELECT ON public_metrics TO metrics_reader; -- Re-grant view only
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM metrics_reader;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM metrics_reader;

-- =====================================================================
-- VERIFICATION SQL FOR FOUNDER
-- Run as metrics_reader:
-- =====================================================================
/*
SET ROLE metrics_reader;

-- 1. This MUST SUCCEED (returns aggregate numbers only):
SELECT * FROM public_metrics;

-- 2. This MUST FAIL (permission denied for table profiles):
SELECT * FROM profiles LIMIT 1;

-- 3. This MUST FAIL (permission denied for table profile_analytics):
SELECT * FROM profile_analytics LIMIT 1;

RESET ROLE;
*/

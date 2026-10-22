-- =====================================================================
-- Connectly: Autonomous Multi-Agent Growth Framework Schema (PR #1)
--
-- Tables:
--   1. tasks: Distributed asynchronous task queue for agent collaboration
--   2. agent_runs: Audit log of every agent execution, model, tokens, latency, cost
--   3. learnings: High-confidence insights derived from performance & rejections
--   4. experiments: A/B testing hypotheses, variants, metrics, and winners
--   5. post_performance: Attribution link connecting published copy to real metrics
--   6. prompt_versions: System prompt versions with benchmark scores & auto-rollback
--   7. agent_settings: Global controls (emergency kill switch, rate limits)
-- =====================================================================

-- 1. Tasks Queue Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  assigned_agent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  priority INT NOT NULL DEFAULT 5,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB DEFAULT NULL,
  parent_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_status_agent_priority 
  ON tasks(status, assigned_agent, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_parent 
  ON tasks(parent_task_id);

-- 2. Agent Execution Runs Audit
CREATE TABLE IF NOT EXISTS agent_runs (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  latency_ms INT NOT NULL DEFAULT 0,
  cost_cents NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_created 
  ON agent_runs(agent, created_at DESC);

-- 3. Shared Learnings Store (Self-Improvement Memory)
CREATE TABLE IF NOT EXISTS learnings (
  id TEXT PRIMARY KEY,
  insight TEXT NOT NULL,
  evidence TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'content',
  source_experiment_id TEXT,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.50,
  times_used INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learnings_active_confidence 
  ON learnings(active, confidence DESC);

-- 4. A/B Growth Experiments Table
CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  hypothesis TEXT NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  metric TEXT NOT NULL DEFAULT 'shares',
  status TEXT NOT NULL DEFAULT 'running',
  winner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_experiments_status 
  ON experiments(status);

-- 5. Post Performance & Metric Attribution
CREATE TABLE IF NOT EXISTS post_performance (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  hook_style TEXT,
  audience TEXT,
  copy_preview TEXT,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  signups INT NOT NULL DEFAULT 0,
  activations INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_performance_platform 
  ON post_performance(platform, created_at DESC);

-- 6. System Prompt Versions (For Auto-Rollback)
CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  version TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_agent_active 
  ON prompt_versions(agent, active);

-- 7. Agent System Settings & Emergency Kill Switch
CREATE TABLE IF NOT EXISTS agent_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial System Settings (Kill Switch = false, Rate limits)
INSERT INTO agent_settings (key, value, updated_at)
VALUES 
  ('kill_switch', '{"is_paused": false, "reason": null, "paused_at": null}'::jsonb, NOW()),
  ('rate_limits', '{"max_daily_tasks": 100, "max_concurrent_runs": 2, "cost_ceiling_cents": 500}'::jsonb, NOW())
ON CONFLICT (key) DO NOTHING;

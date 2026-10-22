/**
 * Database Guard and Safety Isolation
 * Enforces HARD RULE 2:
 * Tests, evals, and the agent runtime must ABORT immediately if any database URL
 * host contains 'supabase'.
 */

export function assertSafeDatabaseUrl(url, contextName = 'Database') {
  if (!url) return;
  
  const raw = String(url).trim();
  if (!raw) return;

  if (raw.toLowerCase().includes('supabase')) {
    const errorMsg = `[HARD SAFETY VIOLATION] ${contextName} connection string points to a Supabase host! Production database access is strictly prohibited. Aborting immediately.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const parsed = new URL(raw);
    if (parsed.hostname.toLowerCase().includes('supabase')) {
      const errorMsg = `[HARD SAFETY VIOLATION] ${contextName} hostname '${parsed.hostname}' contains 'supabase'! Production database access is strictly prohibited. Aborting immediately.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  } catch (err) {
    if (err.message.includes('[HARD SAFETY VIOLATION]')) {
      throw err;
    }
    if (raw.toLowerCase().includes('supabase')) {
      throw new Error(`[HARD SAFETY VIOLATION] ${contextName} contains 'supabase'. Aborting.`);
    }
  }
}

/**
 * Validates active database URLs for agent runtime and tests
 */
export function validateAgentEnvironmentDbSafety() {
  // If agent runtime is enabled or tests are running, verify agent DB URLs
  if (process.env.AGENTS_ENABLED === 'true') {
    if (process.env.AGENT_DATABASE_URL) {
      assertSafeDatabaseUrl(process.env.AGENT_DATABASE_URL, 'AGENT_DATABASE_URL');
    }
    if (process.env.METRICS_DATABASE_URL) {
      assertSafeDatabaseUrl(process.env.METRICS_DATABASE_URL, 'METRICS_DATABASE_URL');
    }
  }

  if (process.env.NODE_ENV === 'test') {
    if (process.env.TEST_DATABASE_URL) {
      assertSafeDatabaseUrl(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
    }
    if (process.env.AGENT_DATABASE_URL) {
      assertSafeDatabaseUrl(process.env.AGENT_DATABASE_URL, 'AGENT_DATABASE_URL');
    }
  }
}

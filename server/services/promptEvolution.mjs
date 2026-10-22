/**
 * Prompt Evolution & Auto-Rollback Engine
 * Tracks prompt versions for each agent, measures rejection/benchmark scores,
 * and automatically rolls back to stable baselines if a version degrades.
 */

let memoryPromptVersions = new Map();

export function clearMemoryPromptVersions() {
  memoryPromptVersions.clear();
}

/**
 * Register a new prompt version for an agent
 */
export async function registerPromptVersion(pool, {
  agent,
  version,
  systemPrompt,
  benchmarkScore = 1.0,
  isActive = true
}) {
  const record = {
    agent,
    version,
    system_prompt: systemPrompt,
    benchmark_score: Number(benchmarkScore) || 1.0,
    is_active: Boolean(isActive),
    rejection_count: 0,
    approval_count: 0,
    created_at: new Date().toISOString()
  };

  const key = `${agent}:${version}`;

  if (pool) {
    try {
      if (isActive) {
        // Deactivate other versions for this agent
        await pool.query('UPDATE prompt_versions SET is_active = false WHERE agent = $1;', [agent]);
      }
      await pool.query(
        `INSERT INTO prompt_versions (
          agent, version, system_prompt, benchmark_score, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (agent, version) DO UPDATE SET
          system_prompt = EXCLUDED.system_prompt,
          benchmark_score = EXCLUDED.benchmark_score,
          is_active = EXCLUDED.is_active;`,
        [agent, version, systemPrompt, record.benchmark_score, record.is_active]
      );
      return record;
    } catch (err) {
      console.warn('[PromptEvolution] DB insert warning, using memory:', err.message);
    }
  }

  if (isActive) {
    for (const [k, v] of memoryPromptVersions.entries()) {
      if (v.agent === agent) v.is_active = false;
    }
  }

  memoryPromptVersions.set(key, record);
  return record;
}

/**
 * Record a Brand Gate evaluation outcome for an agent prompt version
 * Automatically triggers rollback if rejection rate spikes.
 */
export async function recordPromptEvaluation(pool, { agent, version, approved = true }) {
  const key = `${agent}:${version}`;
  let record = memoryPromptVersions.get(key);

  if (!record) {
    record = {
      agent,
      version,
      system_prompt: 'Default baseline',
      benchmark_score: 1.0,
      is_active: true,
      rejection_count: 0,
      approval_count: 0
    };
  }

  if (approved) {
    record.approval_count = (record.approval_count || 0) + 1;
  } else {
    record.rejection_count = (record.rejection_count || 0) + 1;
  }

  // ── Auto-Rollback Guardrail ──
  // If rejection count >= 2 and rejection rate > 30%, automatically rollback
  const total = record.approval_count + record.rejection_count;
  const rejectionRate = total > 0 ? (record.rejection_count / total) : 0;

  let rolledBack = false;
  let activeVersion = version;

  if (record.rejection_count >= 2 && rejectionRate > 0.3) {
    record.is_active = false;
    rolledBack = true;

    // Find previous stable version (e.g. v1.0)
    for (const [k, v] of memoryPromptVersions.entries()) {
      if (v.agent === agent && v.version !== version) {
        v.is_active = true;
        activeVersion = v.version;
        break;
      }
    }

    if (pool) {
      try {
        await pool.query(
          `UPDATE prompt_versions SET is_active = false WHERE agent = $1 AND version = $2;`,
          [agent, version]
        );
        await pool.query(
          `UPDATE prompt_versions SET is_active = true WHERE agent = $1 AND version != $2;`,
          [agent, version]
        );

        // Record auto-rollback learning
        await pool.query(
          `INSERT INTO learnings (
            id, insight, evidence, category, confidence, active, created_at, updated_at
          ) VALUES ($1, $2, $3, 'prompt_evolution', 0.95, true, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;`,
          [
            'learn_rollback_' + Date.now(),
            `Auto-rollback: Agent "${agent}" rolled back prompt from ${version} due to ${Math.round(rejectionRate * 100)}% rejection rate.`,
            `Failed ${record.rejection_count} of ${total} brand gate reviews.`
          ]
        );
      } catch (err) {
        console.warn('[PromptEvolution] DB auto-rollback warning:', err.message);
      }
    }
  }

  memoryPromptVersions.set(key, record);

  return {
    agent,
    version,
    approved,
    rejectionRate: Math.round(rejectionRate * 100),
    rolledBack,
    currentActiveVersion: activeVersion
  };
}

/**
 * Get the currently active prompt version for an agent
 */
export async function getActivePromptVersion(pool, agent) {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM prompt_versions WHERE agent = $1 AND is_active = true LIMIT 1;',
        [agent]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[PromptEvolution] DB active prompt query warning:', err.message);
    }
  }

  for (const v of memoryPromptVersions.values()) {
    if (v.agent === agent && v.is_active) return v;
  }

  return {
    agent,
    version: 'v1.0',
    system_prompt: 'Default system prompt',
    is_active: true
  };
}

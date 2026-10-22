/**
 * A/B Growth Experiment Engine
 * Automates hypothesis testing across copy hooks, channels, and onboarding nudges.
 * Evaluates winners and derives permanent learnings for the agent team.
 */

let memoryExperiments = new Map();

export function clearMemoryExperiments() {
  memoryExperiments.clear();
}

/**
 * Register a new A/B growth experiment
 */
export async function createExperiment(pool, {
  hypothesis,
  variantA,
  variantB,
  metric = 'shares'
}) {
  const id = 'exp_' + Date.now();
  const experiment = {
    id,
    hypothesis,
    variant_a: variantA,
    variant_b: variantB,
    metric,
    status: 'running',
    winner: null,
    observations: { variantA: { samples: 0, conversions: 0 }, variantB: { samples: 0, conversions: 0 } },
    created_at: new Date().toISOString(),
    completed_at: null
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO experiments (
          id, hypothesis, variant_a, variant_b, metric, status, winner, created_at
        ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, NOW());`,
        [id, hypothesis, JSON.stringify(variantA), JSON.stringify(variantB), metric, 'running', null]
      );
      return experiment;
    } catch (err) {
      console.warn('[ExperimentEngine] DB insert failed, using memory:', err.message);
    }
  }

  memoryExperiments.set(id, experiment);
  return experiment;
}

/**
 * Record conversion observation for an experiment variant
 */
export async function recordObservation(pool, experimentId, variantKey, didConvert = false) {
  let exp = memoryExperiments.get(experimentId);

  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM experiments WHERE id = $1;', [experimentId]);
      if (res.rows.length > 0) {
        exp = res.rows[0];
      }
    } catch (err) {
      console.warn('[ExperimentEngine] DB fetch failed:', err.message);
    }
  }

  if (!exp) return null;

  if (!exp.observations) {
    exp.observations = { variantA: { samples: 0, conversions: 0 }, variantB: { samples: 0, conversions: 0 } };
  }

  const target = variantKey === 'a' ? exp.observations.variantA : exp.observations.variantB;
  target.samples += 1;
  if (didConvert) {
    target.conversions += 1;
  }

  // Check if winner can be declared (minimum 5 samples per variant)
  const a = exp.observations.variantA;
  const b = exp.observations.variantB;
  let winner = null;

  if (a.samples >= 5 && b.samples >= 5) {
    const rateA = a.conversions / a.samples;
    const rateB = b.conversions / b.samples;

    if (rateA > rateB && rateA >= rateB * 1.3) {
      winner = 'variant_a';
    } else if (rateB > rateA && rateB >= rateA * 1.3) {
      winner = 'variant_b';
    }
  }

  if (winner) {
    exp.status = 'completed';
    exp.winner = winner;
    exp.completed_at = new Date().toISOString();

    // ── Derive Permanent Learning ──
    const winningVariant = winner === 'variant_a' ? exp.variant_a : exp.variant_b;
    const learningInsight = `A/B Experiment Winner: "${winningVariant.label || winner}" outperforms on metric "${exp.metric}".`;

    if (pool) {
      try {
        await pool.query(
          `UPDATE experiments SET status = 'completed', winner = $1, completed_at = NOW() WHERE id = $2;`,
          [winner, experimentId]
        );
        const learningId = 'learn_' + Date.now();
        await pool.query(
          `INSERT INTO learnings (
            id, insight, evidence, category, source_experiment_id, confidence, active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;`,
          [
            learningId,
            learningInsight,
            `Observed conversions: Variant A (${a.conversions}/${a.samples}), Variant B (${b.conversions}/${b.samples})`,
            'growth_experiment',
            experimentId,
            0.90,
            true
          ]
        );
      } catch (err) {
        console.warn('[ExperimentEngine] Failed to persist winner and learning to DB:', err.message);
      }
    }
  }

  memoryExperiments.set(experimentId, exp);
  return exp;
}

/**
 * List all active or completed experiments
 */
export async function listExperiments(pool, { status = null } = {}) {
  if (pool) {
    try {
      let query = 'SELECT * FROM experiments';
      const params = [];
      if (status) {
        params.push(status);
        query += ' WHERE status = $1';
      }
      query += ' ORDER BY created_at DESC;';
      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      console.warn('[ExperimentEngine] DB query failed, returning memory:', err.message);
    }
  }

  let list = Array.from(memoryExperiments.values());
  if (status) list = list.filter(e => e.status === status);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

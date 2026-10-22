process.env.VERCEL = '1';
process.env.NODE_ENV = 'test';
import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  createExperiment,
  recordObservation,
  listExperiments,
  clearMemoryExperiments
} from '../server/services/experimentEngine.mjs';

import {
  registerPromptVersion,
  recordPromptEvaluation,
  getActivePromptVersion,
  clearMemoryPromptVersions
} from '../server/services/promptEvolution.mjs';

const { default: app, pool } = await import('../server/index.mjs');

// Minimal in-memory request simulator
async function simulatedRequest(app, method, url, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json', ...headers },
      body,
    };

    let statusCode = 200;
    let responseHeaders = {};

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(name, value) {
        responseHeaders[name.toLowerCase()] = value;
        return this;
      },
      json(data) {
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data
        });
      },
      send(data) {
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data
        });
      }
    };

    app.handle(req, res);
  });
}

describe('PR #5: Autonomous Feedback Loop (Measure -> Learn -> Evolve)', () => {
  beforeEach(() => {
    clearMemoryExperiments();
    clearMemoryPromptVersions();
  });

  after(async () => {
    if (pool) {
      await pool.end();
    }
  });

  // ── A/B Growth Experiment Engine Tests ──

  test('createExperiment initializes hypothesis with running status and typed variants', async () => {
    const exp = await createExperiment(null, {
      hypothesis: 'Data-backed hooks generate 50% more profile shares than curiosity hooks',
      variantA: { label: 'Data-backed hook with hackathon stats', hookStyle: 'data_backed' },
      variantB: { label: 'Curiosity hook questioning Linktree', hookStyle: 'curiosity' },
      metric: 'shares'
    });

    assert.ok(exp.id.startsWith('exp_'));
    assert.equal(exp.status, 'running');
    assert.equal(exp.winner, null);
    assert.equal(exp.metric, 'shares');
  });

  test('recordObservation declares winner and completes experiment when threshold met', async () => {
    const exp = await createExperiment(null, {
      hypothesis: 'Variant A converts better',
      variantA: { label: 'Data-backed Hook' },
      variantB: { label: 'Generic Hook' },
      metric: 'clicks'
    });

    // Record 5 samples for A with 4 conversions (80% conv)
    for (let i = 0; i < 5; i++) {
      await recordObservation(null, exp.id, 'a', i < 4);
    }

    // Record 5 samples for B with 1 conversion (20% conv)
    for (let i = 0; i < 5; i++) {
      await recordObservation(null, exp.id, 'b', i === 0);
    }

    const updated = await recordObservation(null, exp.id, 'a', true);
    assert.equal(updated.status, 'completed');
    assert.equal(updated.winner, 'variant_a');
    assert.ok(updated.completed_at);
  });

  // ── Prompt Evolution & Auto-Rollback Tests ──

  test('registerPromptVersion stores version and getActivePromptVersion retrieves it', async () => {
    await registerPromptVersion(null, {
      agent: 'content',
      version: 'v1.0',
      systemPrompt: 'Stable baseline v1.0',
      benchmarkScore: 0.95,
      isActive: true
    });

    const active = await getActivePromptVersion(null, 'content');
    assert.equal(active.version, 'v1.0');
    assert.equal(active.is_active, true);
  });

  test('recordPromptEvaluation triggers auto-rollback when rejection rate exceeds threshold', async () => {
    // 1. Establish stable baseline v1.0
    await registerPromptVersion(null, {
      agent: 'content',
      version: 'v1.0',
      systemPrompt: 'Stable baseline v1.0',
      benchmarkScore: 0.95,
      isActive: false
    });

    // 2. Deploy experimental v1.2
    await registerPromptVersion(null, {
      agent: 'content',
      version: 'v1.2',
      systemPrompt: 'Aggressive experimental prompt v1.2',
      benchmarkScore: 0.80,
      isActive: true
    });

    // 3. Record evaluations: 2 rejections out of 2 reviews (100% rejection rate)
    await recordPromptEvaluation(null, { agent: 'content', version: 'v1.2', approved: false });
    const eval2 = await recordPromptEvaluation(null, { agent: 'content', version: 'v1.2', approved: false });

    assert.equal(eval2.rolledBack, true);
    assert.equal(eval2.currentActiveVersion, 'v1.0');

    // Verify v1.0 is active again
    const active = await getActivePromptVersion(null, 'content');
    assert.equal(active.version, 'v1.0');
    assert.equal(active.is_active, true);
  });

  // ── HTTP Endpoints Tests ──

  test('HTTP API: POST /api/agent/experiments and GET /api/agent/experiments', async () => {
    const postRes = await simulatedRequest(app, 'POST', '/api/agent/experiments', {
      hypothesis: 'Poster CTA converts 2x better',
      variantA: { label: 'Direct QR Link' },
      variantB: { label: 'Generic Homepage' },
      metric: 'signups'
    });
    assert.equal(postRes.status, 201);
    assert.equal(postRes.body.success, true);
    assert.ok(postRes.body.experiment.id);

    const getRes = await simulatedRequest(app, 'GET', '/api/agent/experiments');
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);
    assert.ok(Array.isArray(getRes.body.experiments));
    assert.ok(getRes.body.experiments.length >= 1);
  });

  test('HTTP API: POST & GET /api/agent/prompts endpoints manage versioning', async () => {
    const registerRes = await simulatedRequest(app, 'POST', '/api/agent/prompts', {
      agent: 'outreach',
      version: 'v1.0',
      systemPrompt: 'Technical outreach specialist'
    });
    assert.equal(registerRes.status, 201);
    assert.equal(registerRes.body.success, true);

    const activeRes = await simulatedRequest(app, 'GET', '/api/agent/prompts/outreach/active');
    assert.equal(activeRes.status, 200);
    assert.equal(activeRes.body.success, true);
    assert.equal(activeRes.body.activePrompt.version, 'v1.0');
  });
});

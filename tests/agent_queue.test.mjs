delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  enqueueTask,
  claimNextTask,
  completeTask,
  failTask,
  listTasks,
  getQueueStats
} from '../server/services/agentQueue.mjs';

import {
  isSystemPaused,
  getKillSwitchStatus,
  setKillSwitch
} from '../server/services/killSwitch.mjs';

import { runAgentTask } from '../server/services/agentRunner.mjs';
import { createTestClient } from './testServer.mjs';

const { default: app, pool } = await import('../server/index.mjs');

describe('PR #1: Autonomous Multi-Agent Framework & Task Queue', () => {
  let client;

  before(async () => {
    client = await createTestClient(app);
  });
  beforeEach(async () => {
    // Reset kill switch before each test
    await setKillSwitch(null, false, 'Reset for testing');
  });

  test('enqueueTask generates typed task with priority and queued status', async () => {
    const task = await enqueueTask(null, {
      type: 'draft_content',
      assignedAgent: 'content',
      input: { platform: 'x', topic: 'Connectly builder launch' },
      priority: 2,
      maxRetries: 3
    });

    assert.ok(task.id.startsWith('task_'));
    assert.equal(task.type, 'draft_content');
    assert.equal(task.assigned_agent, 'content');
    assert.equal(task.status, 'queued');
    assert.equal(task.priority, 2);
    assert.equal(task.retry_count, 0);
    assert.equal(task.input.platform, 'x');
  });

  test('claimNextTask transitions queued task to running for target agent', async () => {
    const enqueued = await enqueueTask(null, {
      type: 'fact_check',
      assignedAgent: 'brand_gate',
      input: { draftId: 'draft-99' },
      priority: 1
    });

    const claimed = await claimNextTask(null, 'brand_gate');
    assert.ok(claimed);
    assert.equal(claimed.id, enqueued.id);
    assert.equal(claimed.status, 'running');
    assert.ok(claimed.started_at);

    // Second claim should return null since queue for brand_gate is now empty
    const nextClaim = await claimNextTask(null, 'brand_gate');
    assert.equal(nextClaim, null);
  });

  test('completeTask updates status to completed and records output', async () => {
    const task = await enqueueTask(null, {
      type: 'growth_analysis',
      assignedAgent: 'growth_analyst',
      input: { period: '7d' }
    });

    await claimNextTask(null, 'growth_analyst');
    const completed = await completeTask(null, task.id, {
      activatedCount: 1,
      target: 30,
      dropoffStage: 'links_added'
    });

    assert.ok(completed);
    assert.equal(completed.status, 'completed');
    assert.equal(completed.output.activatedCount, 1);
    assert.ok(completed.finished_at);
  });

  test('failTask retries when retry_count < max_retries, and fails when exhausted', async () => {
    const task = await enqueueTask(null, {
      type: 'scrape_builder_profiles',
      assignedAgent: 'outreach',
      maxRetries: 2
    });

    // 1st failure: should re-queue
    const retry1 = await failTask(null, task.id, 'Timeout on network request');
    assert.equal(retry1.status, 'queued');
    assert.equal(retry1.retry_count, 1);
    assert.equal(retry1.error, 'Timeout on network request');

    // 2nd failure: should mark failed permanently
    const retry2 = await failTask(null, task.id, 'Timeout on network request');
    assert.equal(retry2.status, 'failed');
    assert.equal(retry2.retry_count, 2);
    assert.ok(retry2.finished_at);
  });

  test('Emergency Kill Switch halts task claiming and aborts agent executions', async () => {
    await enqueueTask(null, {
      type: 'generate_post',
      assignedAgent: 'content',
      input: { topic: 'emergency check' }
    });

    // Activate Kill Switch
    await setKillSwitch(null, true, 'Safety halt test');
    const paused = await isSystemPaused(null);
    assert.equal(paused, true);

    // claimNextTask must return null while paused
    const claimAttempt = await claimNextTask(null, 'content');
    assert.equal(claimAttempt, null);

    // runAgentTask must immediately reject
    await assert.rejects(
      async () => {
        await runAgentTask(null, {
          agentName: 'content',
          systemPrompt: 'System',
          userPrompt: 'User prompt'
        });
      },
      /System kill switch is active/
    );

    // Deactivate Kill Switch
    await setKillSwitch(null, false, 'Resume testing');
    const resumedClaim = await claimNextTask(null, 'content');
    assert.ok(resumedClaim);
    assert.equal(resumedClaim.status, 'running');
  });

  test('HTTP API: POST /api/agent/tasks validates input and enqueues task', async () => {
    // Missing required fields
    const invalidRes = await client.request('POST', '/api/agent/tasks', {});
    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.body.success, false);

    // Valid task enqueue
    const validRes = await client.request('POST', '/api/agent/tasks', {
      type: 'review_hook',
      assignedAgent: 'brand_gate',
      input: { hook: 'Stop using linktree' },
      priority: 3
    });
    assert.equal(validRes.status, 201);
    assert.equal(validRes.body.success, true);
    assert.ok(validRes.body.task.id);
    assert.equal(validRes.body.task.assigned_agent, 'brand_gate');
  });

  test('HTTP API: GET /api/agent/stats returns queue and killSwitch telemetry', async () => {
    const res = await client.request('GET', '/api/agent/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.queue !== undefined);
    assert.equal(typeof res.body.queue.total, 'number');
    assert.ok(res.body.killSwitch !== undefined);
    assert.equal(typeof res.body.killSwitch.is_paused, 'boolean');
  });

  test('HTTP API: POST /api/agent/kill-switch toggles system emergency pause', async () => {
    const pauseRes = await client.request('POST', '/api/agent/kill-switch', {
      isPaused: true,
      reason: 'API trigger test'
    });
    assert.equal(pauseRes.status, 200);
    assert.equal(pauseRes.body.success, true);
    assert.equal(pauseRes.body.killSwitch.is_paused, true);

    const getRes = await client.request('GET', '/api/agent/kill-switch');
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.is_paused, true);
    assert.equal(getRes.body.reason, 'API trigger test');

    // Unpause
    const unpauseRes = await client.request('POST', '/api/agent/kill-switch', {
      isPaused: false
    });
    assert.equal(unpauseRes.body.killSwitch.is_paused, false);
  });

  after(async () => {
    if (client) {
      await client.close();
    }
    if (pool) {
      await pool.end();
    }
  });
});

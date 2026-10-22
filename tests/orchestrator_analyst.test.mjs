process.env.VERCEL = '1';
process.env.NODE_ENV = 'test';
import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import { computeFunnelMetrics, runGrowthAnalysis } from '../server/agents/analyst.mjs';
import { runOrchestratorCycle } from '../server/agents/orchestrator.mjs';
import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  executeTick
} from '../server/services/agentScheduler.mjs';
import { setKillSwitch } from '../server/services/killSwitch.mjs';
import { listTasks } from '../server/services/agentQueue.mjs';

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

describe('PR #2: Orchestrator + Growth Analyst (Observe & Plan Loop)', () => {
  beforeEach(async () => {
    await setKillSwitch(null, false, 'Reset for testing');
    stopScheduler();
  });

  after(async () => {
    stopScheduler();
    if (pool) {
      await pool.end();
    }
  });

  test('computeFunnelMetrics correctly identifies 30-goal progress and multi-link bottleneck', () => {
    const sampleProfiles = [
      { id: '1', links: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], stats: { shares: 2 } }, // Activated
      { id: '2', links: [{ id: 'a' }], stats: { shares: 0 } }, // Dropped before 3 links
      { id: '3', links: [{ id: 'a' }, { id: 'b' }], stats: { shares: 0 } }, // Dropped before 3 links
      { id: '4', links: [{ id: 'a' }], stats: { shares: 0 } }, // Dropped before 3 links
    ];

    const metrics = computeFunnelMetrics(sampleProfiles);
    assert.equal(metrics.totalProfiles, 4);
    assert.equal(metrics.with1Link, 4);
    assert.equal(metrics.with3Links, 1);
    assert.equal(metrics.activated, 1);
    assert.equal(metrics.remaining, 29);
    assert.equal(metrics.bottleneck.stage, 'multi_link_completion');
    assert.ok(metrics.bottleneck.dropoffPercent >= 50);
  });

  test('computeFunnelMetrics detects profile_sharing bottleneck when builders have links but no shares', () => {
    const sampleProfiles = [
      { id: '1', links: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], stats: { shares: 0 } },
      { id: '2', links: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }], stats: { shares: 0 } },
    ];

    const metrics = computeFunnelMetrics(sampleProfiles);
    assert.equal(metrics.with3Links, 2);
    assert.equal(metrics.activated, 0);
    assert.equal(metrics.bottleneck.stage, 'profile_sharing');
  });

  test('runGrowthAnalysis generates typed observation report with recommendations', async () => {
    const mockProfiles = {
      shreyansh: {
        id: 'u1',
        username: 'shreyansh',
        links: [{ id: '1' }, { id: '2' }, { id: '3' }],
        stats: { views: 500, shares: 12 }
      }
    };

    const report = await runGrowthAnalysis(null, mockProfiles);
    assert.ok(report.timestamp);
    assert.equal(report.goal.target, 30);
    assert.equal(report.goal.current, 1);
    assert.equal(report.goal.remaining, 29);
    assert.ok(Array.isArray(report.recommendations));
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.summary.includes('Funnel Health'));
  });

  test('runOrchestratorCycle enqueues daily tasks for content, outreach, and qa agents', async () => {
    const mockProfiles = {
      builder1: {
        id: 'b1',
        username: 'builder1',
        links: [{ id: '1' }, { id: '2' }],
        stats: { shares: 0 }
      }
    };

    const plan = await runOrchestratorCycle(null, mockProfiles);
    assert.equal(plan.status, 'completed');
    assert.ok(plan.cycleId.startsWith('cycle_'));
    assert.ok(plan.tasksEnqueued.length >= 3);

    // Verify task assignments
    const agentsEnqueued = plan.tasksEnqueued.map(t => t.agent);
    assert.ok(agentsEnqueued.includes('content'));
    assert.ok(agentsEnqueued.includes('outreach'));
    assert.ok(agentsEnqueued.includes('qa_engineer'));

    // Check tasks exist in queue
    const queuedTasks = await listTasks(null, { limit: 10 });
    assert.ok(queuedTasks.length >= 3);
  });

  test('runOrchestratorCycle halts when Kill Switch is active', async () => {
    await setKillSwitch(null, true, 'Emergency pause in effect');

    const plan = await runOrchestratorCycle(null, {});
    assert.equal(plan.status, 'paused');
    assert.match(plan.message, /kill switch is active/i);
  });

  test('agentScheduler manages start, stop, and status telemetry', async () => {
    const initialStatus = getSchedulerStatus();
    assert.equal(initialStatus.isRunning, false);

    // Start with 10s test interval
    startScheduler(null, {}, 10000);
    const runningStatus = getSchedulerStatus();
    assert.equal(runningStatus.isRunning, true);
    assert.equal(runningStatus.intervalMs, 10000);

    // Execute single tick directly
    const tickResult = await executeTick(null, {});
    assert.ok(tickResult);
    assert.equal(tickResult.status, 'completed');

    // Stop
    stopScheduler();
    const stoppedStatus = getSchedulerStatus();
    assert.equal(stoppedStatus.isRunning, false);
  });

  test('HTTP API: GET /api/agent/analyst/report returns 200 with funnel report', async () => {
    const res = await simulatedRequest(app, 'GET', '/api/agent/analyst/report');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.report.goal.target, 30);
    assert.ok(Array.isArray(res.body.report.funnel));
    assert.ok(res.body.report.bottleneck);
  });

  test('HTTP API: POST /api/agent/orchestrator/cycle runs autonomous cycle', async () => {
    const res = await simulatedRequest(app, 'POST', '/api/agent/orchestrator/cycle');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.cycleId);
    assert.ok(Array.isArray(res.body.tasksEnqueued));
  });

  test('HTTP API: GET & POST /api/agent/scheduler endpoints toggle scheduler state', async () => {
    const statusRes = await simulatedRequest(app, 'GET', '/api/agent/scheduler/status');
    assert.equal(statusRes.status, 200);
    assert.equal(typeof statusRes.body.isRunning, 'boolean');

    // Toggle on
    const toggleOnRes = await simulatedRequest(app, 'POST', '/api/agent/scheduler/toggle', {
      active: true,
      intervalMs: 30000
    });
    assert.equal(toggleOnRes.status, 200);
    assert.equal(toggleOnRes.body.isRunning, true);

    // Toggle off
    const toggleOffRes = await simulatedRequest(app, 'POST', '/api/agent/scheduler/toggle', {
      active: false
    });
    assert.equal(toggleOffRes.status, 200);
    assert.equal(toggleOffRes.body.isRunning, false);
  });
});

delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
process.env.IGNORE_QUIET_HOURS = 'true'; // Allow tests to run at any hour
import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  acquireOllamaLock,
  releaseOllamaLock,
  isOllamaLockHeld,
  withOllamaLock
} from '../server/services/ollamaLock.mjs';

import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  isQuietHours,
  executeTick,
  TWELVE_HOURS_MS,
  DEFAULT_NIGHTLY_TASK_CAP
} from '../server/services/agentScheduler.mjs';

import { runAgentTask } from '../server/services/agentRunner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCK_FILE = path.resolve(__dirname, '../tools/ollama.lock');

describe('STEP 7: Runner & Resources Hardening (Ollama Lock, Scheduler Defaults, Real Throughput)', () => {

  beforeEach(() => {
    releaseOllamaLock();
    stopScheduler();
  });

  after(() => {
    releaseOllamaLock();
    stopScheduler();
  });

  // ── Global Ollama File Lock Tests ──

  test('acquireOllamaLock creates tools/ollama.lock and releaseOllamaLock cleans it up', async () => {
    assert.equal(isOllamaLockHeld(), false);

    const acquired = await acquireOllamaLock(5000);
    assert.equal(acquired, true);
    assert.equal(fs.existsSync(LOCK_FILE), true);
    assert.equal(isOllamaLockHeld(), true);

    const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
    assert.equal(lockData.pid, process.pid);
    assert.ok(lockData.lockedAt);

    const released = releaseOllamaLock();
    assert.equal(released, true);
    assert.equal(fs.existsSync(LOCK_FILE), false);
    assert.equal(isOllamaLockHeld(), false);
  });

  test('withOllamaLock ensures single-task execution and releases lock on completion or error', async () => {
    let executed = false;
    const result = await withOllamaLock(async () => {
      assert.equal(isOllamaLockHeld(), true);
      executed = true;
      return 'task_success';
    }, { timeoutMs: 5000 });

    assert.equal(executed, true);
    assert.equal(result, 'task_success');
    assert.equal(isOllamaLockHeld(), false, 'Lock must be released after completion');

    // Test error handling
    await assert.rejects(async () => {
      await withOllamaLock(async () => {
        throw new Error('Simulated runner failure');
      }, { timeoutMs: 5000 });
    }, /Simulated runner failure/);

    assert.equal(isOllamaLockHeld(), false, 'Lock must be released even after error');
  });

  // ── Scheduler Defaults & Configuration Tests ──

  test('Scheduler defaults to 2 cycles per day (12 hours) and nightly task cap of 10', () => {
    assert.equal(TWELVE_HOURS_MS, 43200000, '12 hours in milliseconds');
    assert.equal(DEFAULT_NIGHTLY_TASK_CAP, 10, 'Nightly task cap default');

    const status = getSchedulerStatus();
    assert.equal(status.intervalMs, TWELVE_HOURS_MS);
    assert.equal(status.cyclesPerDay, 2);
    assert.equal(status.nightlyTaskCap, 10);
  });

  test('isQuietHours correctly detects late-night window (23:00 to 07:00)', () => {
    // When IGNORE_QUIET_HOURS is set to false:
    delete process.env.IGNORE_QUIET_HOURS;
    const midnight = new Date(2026, 9, 22, 23, 30);
    assert.equal(isQuietHours(midnight), true);

    const threeAm = new Date(2026, 9, 22, 3, 0);
    assert.equal(isQuietHours(threeAm), true);

    const noon = new Date(2026, 9, 22, 12, 0);
    assert.equal(isQuietHours(noon), false);

    process.env.IGNORE_QUIET_HOURS = 'true';
  });

  // ── REAL Ollama Throughput & Latency Measurement ──

  test('Measures REAL throughput with active local Ollama daemon', async () => {
    const fastModel = process.env.AGENT_FAST_MODEL || 'qwen2.5:3b';

    const start = Date.now();
    const result = await runAgentTask(null, {
      agentName: 'throughput_benchmark',
      systemPrompt: 'You are a test evaluator. Respond with one sentence.',
      userPrompt: 'Tell me in 10 words why open source software matters.',
      model: fastModel,
      maxTokens: 128,
      timeoutMs: 30000
    });
    const durationMs = Date.now() - start;
    const durationSeconds = durationMs / 1000;
    const minutesPerTask = (durationSeconds / 60).toFixed(2);

    assert.equal(result.success, true);
    assert.ok(result.text.length > 5);
    assert.ok(result.outputTokens > 0);

    // Compute realistic throughput calculations
    // 8-hour nightly window (480 minutes)
    const nightlyMinutes = 8 * 60;
    const tasksPerNight = Math.min(
      DEFAULT_NIGHTLY_TASK_CAP,
      Math.floor(nightlyMinutes / (Math.max(1, durationSeconds) / 60))
    );

    console.log(`\n  ⚡ REAL THROUGHPUT MEASUREMENT (${fastModel}):`);
    console.log(`     - Task Duration: ${durationSeconds.toFixed(2)}s (${minutesPerTask} min/task)`);
    console.log(`     - Tokens Generated: ${result.outputTokens}`);
    console.log(`     - Output Speed: ${(result.outputTokens / durationSeconds).toFixed(1)} tokens/sec`);
    console.log(`     - Calculated Nightly Capacity: ${tasksPerNight} tasks/night (Cap: ${DEFAULT_NIGHTLY_TASK_CAP})\n`);

    assert.ok(durationSeconds < 60, 'Task must complete within 60s on local GPU');
    assert.ok(tasksPerNight >= 1, 'At least 1 task can complete per night');
  });
});

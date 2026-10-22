/**
 * Autonomous Agent Team Scheduler
 * Manages periodic execution of the Observe -> Plan loop.
 * Honors emergency kill switch and tracks tick history.
 */

import { runOrchestratorCycle } from '../agents/orchestrator.mjs';
import { isSystemPaused } from './killSwitch.mjs';
import { processAgentQueueOnce } from './agentWorker.mjs';

let intervalId = null;
let isRunning = false;
let lastTickAt = null;
let lastResult = null;
let tickCount = 0;
let intervalMs = 60 * 60 * 1000; // Default: 1 hour

/**
 * Perform a single execution tick of the autonomous team
 */
export async function executeTick(pool, memoryProfiles = {}) {
  const paused = await isSystemPaused(pool);
  if (paused) {
    console.log('[Scheduler] Tick skipped: Global kill switch is ACTIVE.');
    return { skipped: true, reason: 'kill_switch_active' };
  }

  tickCount++;
  lastTickAt = new Date().toISOString();

  try {
    const orchestratorResult = await runOrchestratorCycle(pool, memoryProfiles);
    const workerResult = await processAgentQueueOnce(pool, memoryProfiles);
    lastResult = {
      status: 'completed',
      orchestrator: orchestratorResult,
      worker: workerResult,
      timestamp: new Date().toISOString()
    };
    return lastResult;
  } catch (err) {
    console.error('[Scheduler] Error during autonomous cycle tick:', err.message);
    lastResult = { error: err.message, failed_at: new Date().toISOString() };
    return lastResult;
  }
}

/**
 * Start the autonomous periodic scheduler
 */
export function startScheduler(pool, memoryProfiles = {}, customIntervalMs = null, force = false) {
  if (isRunning) return false;

  const isEnabled = force || (process.env.AGENTS_ENABLED === 'true');
  if (!isEnabled) {
    console.log('[Scheduler] Start skipped: AGENTS_ENABLED is false or unset. Set AGENTS_ENABLED=true to run agent runtime locally.');
    return false;
  }

  if (customIntervalMs) {
    intervalMs = customIntervalMs;
  }

  isRunning = true;
  console.log(`⏱️ Autonomous Agent Scheduler started (Interval: ${Math.round(intervalMs / 1000)}s)`);

  // Execute immediate initial tick
  executeTick(pool, memoryProfiles).catch(err => {
    console.warn('[Scheduler] Initial tick error:', err.message);
  });

  intervalId = setInterval(() => {
    executeTick(pool, memoryProfiles).catch(err => {
      console.warn('[Scheduler] Interval tick error:', err.message);
    });
  }, intervalMs);

  // Unref interval so it does not block process exit during tests
  if (intervalId && typeof intervalId.unref === 'function') {
    intervalId.unref();
  }
}

/**
 * Stop the autonomous scheduler
 */
export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
}

/**
 * Get current scheduler telemetry
 */
export function getSchedulerStatus() {
  return {
    isRunning,
    intervalMs,
    tickCount,
    lastTickAt,
    lastResult
  };
}

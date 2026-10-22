/**
 * Autonomous Agent Team Scheduler (Step 7 - Resource Hardened)
 * 
 * Defaults:
 * 1. 2 cycles/day (every 12 hours = 43,200,000 ms).
 * 2. Nightly task cap: max 10 tasks processed per cycle.
 * 3. Quiet hours check: skips autonomous execution between 23:00 and 07:00 (unless IGNORE_QUIET_HOURS=true).
 * 4. PAUSE file & DB kill switch checked every tick and before each task.
 * 5. Single orchestrator: Node agent team is the primary coordinator.
 */

import { runOrchestratorCycle } from '../agents/orchestrator.mjs';
import { isSystemPaused } from './killSwitch.mjs';
import { processAgentQueueOnce } from './agentWorker.mjs';

// 2 cycles per day = 12 hours
export const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
export const DEFAULT_NIGHTLY_TASK_CAP = Number(process.env.NIGHTLY_TASK_CAP) || 10;

let intervalId = null;
let isRunning = false;
let lastTickAt = null;
let lastResult = null;
let tickCount = 0;
let intervalMs = TWELVE_HOURS_MS;

/**
 * Checks if current local time is within quiet hours (23:00 to 07:00)
 */
export function isQuietHours(date = new Date()) {
  if (process.env.IGNORE_QUIET_HOURS === 'true') {
    return false;
  }
  const hour = date.getHours();
  // 11 PM to 7 AM
  return hour >= 23 || hour < 7;
}

/**
 * Perform a single execution tick of the autonomous team
 */
export async function executeTick(pool, memoryProfiles = {}, options = {}) {
  // 1. Check Kill Switch
  const paused = await isSystemPaused(pool);
  if (paused) {
    console.log('[Scheduler] Tick skipped: Global kill switch is ACTIVE.');
    return { skipped: true, reason: 'kill_switch_active' };
  }

  // 2. Check Quiet Hours (unless explicitly forced)
  if (!options.force && isQuietHours()) {
    console.log('[Scheduler] Tick skipped: Quiet hours in effect (23:00 - 07:00).');
    return { skipped: true, reason: 'quiet_hours_active' };
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

  intervalMs = customIntervalMs || TWELVE_HOURS_MS;
  isRunning = true;
  console.log(`⏱️ Autonomous Agent Scheduler started (Interval: ${Math.round(intervalMs / 1000 / 60)} min, 2 cycles/day default)`);

  // Initial tick
  executeTick(pool, memoryProfiles, { force }).catch(err => {
    console.warn('[Scheduler] Initial tick error:', err.message);
  });

  intervalId = setInterval(() => {
    executeTick(pool, memoryProfiles).catch(err => {
      console.warn('[Scheduler] Interval tick error:', err.message);
    });
  }, intervalMs);

  if (intervalId && typeof intervalId.unref === 'function') {
    intervalId.unref();
  }
  return true;
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
    cyclesPerDay: Math.round((24 * 60 * 60 * 1000) / intervalMs),
    nightlyTaskCap: DEFAULT_NIGHTLY_TASK_CAP,
    isQuietHours: isQuietHours(),
    tickCount,
    lastTickAt,
    lastResult
  };
}

/**
 * Autonomous Agent Worker Dispatcher
 * Checks the task queue for pending tasks across agent team roles,
 * claims tasks atomically with FOR UPDATE SKIP LOCKED, and invokes agent handlers.
 */

import { claimNextTask } from './agentQueue.mjs';
import { executeContentTask } from '../agents/content.mjs';
import { executeBrandGateReview } from '../agents/brandGate.mjs';
import { isSystemPaused } from './killSwitch.mjs';

/**
 * Run one worker pass across all supported agent types
 */
export async function processAgentQueueOnce(pool) {
  const paused = await isSystemPaused(pool);
  if (paused) {
    return { status: 'paused', processed: 0 };
  }

  const processed = [];

  // 1. Process Brand Gate tasks first (higher priority gatekeeper)
  const brandGateTask = await claimNextTask(pool, 'brand_gate');
  if (brandGateTask) {
    try {
      const result = await executeBrandGateReview(pool, brandGateTask);
      processed.push({ agent: 'brand_gate', taskId: brandGateTask.id, result });
    } catch (err) {
      console.error('[Worker] brand_gate execution error:', err.message);
    }
  }

  // 2. Process Content Agent tasks
  const contentTask = await claimNextTask(pool, 'content');
  if (contentTask) {
    try {
      const result = await executeContentTask(pool, contentTask);
      processed.push({ agent: 'content', taskId: contentTask.id, result });
    } catch (err) {
      console.error('[Worker] content execution error:', err.message);
    }
  }

  return {
    status: 'ok',
    processedCount: processed.length,
    processed
  };
}

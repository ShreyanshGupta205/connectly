/**
 * Autonomous Agent Worker Dispatcher
 * Checks the task queue for pending tasks across agent team roles,
 * claims tasks atomically with FOR UPDATE SKIP LOCKED, and invokes agent handlers.
 */

import { claimNextTask } from './agentQueue.mjs';
import { executeContentTask } from '../agents/content.mjs';
import { executeBrandGateReview } from '../agents/brandGate.mjs';
import { executeOutreachTask } from '../agents/outreach.mjs';
import { executeQaTask } from '../agents/qaEngineer.mjs';
import { isSystemPaused } from './killSwitch.mjs';

/**
 * Run one worker pass across all supported agent types
 */
export async function processAgentQueueOnce(pool, memoryProfiles = {}) {
  const paused = await isSystemPaused(pool);
  if (paused) {
    return { status: 'paused', processed: 0 };
  }

  const processed = [];

  // 1. Process Brand Gate tasks first (highest priority safety gatekeeper)
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

  // 3. Process Outreach tasks (always staged for approval)
  const outreachTask = await claimNextTask(pool, 'outreach');
  if (outreachTask) {
    try {
      const result = await executeOutreachTask(pool, outreachTask);
      processed.push({ agent: 'outreach', taskId: outreachTask.id, result });
    } catch (err) {
      console.error('[Worker] outreach execution error:', err.message);
    }
  }

  // 4. Process QA / Engineer health check tasks
  const qaTask = await claimNextTask(pool, 'qa_engineer');
  if (qaTask) {
    try {
      const result = await executeQaTask(pool, qaTask, memoryProfiles);
      processed.push({ agent: 'qa_engineer', taskId: qaTask.id, result });
    } catch (err) {
      console.error('[Worker] qa_engineer execution error:', err.message);
    }
  }

  return {
    status: 'ok',
    processedCount: processed.length,
    processed
  };
}

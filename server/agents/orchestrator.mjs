/**
 * Orchestrator Agent
 * The central coordinator of the autonomous growth team.
 *
 * Responsibilities:
 * 1. Triggers Growth Analyst observation cycle to detect the current funnel bottleneck.
 * 2. Retrieves high-confidence shared learnings from past performance.
 * 3. Synthesizes a daily plan and enqueues typed tasks for Content, Outreach, and QA agents.
 * 4. Enforces rate limits and avoids queue flooding.
 */

import { enqueueTask, listTasks } from '../services/agentQueue.mjs';
import { runGrowthAnalysis } from './analyst.mjs';
import { isSystemPaused } from '../services/killSwitch.mjs';

const MAX_PENDING_TASKS_PER_AGENT = 3;

/**
 * Execute a complete Orchestrator Observe -> Plan -> Enqueue cycle
 */
export async function runOrchestratorCycle(pool, memoryProfiles = {}) {
  // 1. Guardrail check: Emergency Kill Switch
  const paused = await isSystemPaused(pool);
  if (paused) {
    return {
      status: 'paused',
      message: 'Orchestrator cycle skipped: System kill switch is active.',
      timestamp: new Date().toISOString()
    };
  }

  const cycleId = 'cycle_' + Date.now();

  // 2. Observe: Run Growth Analyst
  const analysis = await runGrowthAnalysis(pool, memoryProfiles);

  // 3. Retrieve Shared Learnings from memory store
  let activeLearnings = [];
  if (pool) {
    try {
      const learnRes = await pool.query(
        'SELECT insight, category, confidence FROM learnings WHERE active = true ORDER BY confidence DESC LIMIT 5;'
      );
      activeLearnings = learnRes.rows;
    } catch (err) {
      console.warn('[Orchestrator] learnings query warning:', err.message);
    }
  }

  // 4. Check current pending queue depth to enforce rate limits
  const pendingTasks = await listTasks(pool, { status: 'queued', limit: 100 });
  const pendingByAgent = {};
  for (const t of pendingTasks) {
    pendingByAgent[t.assigned_agent] = (pendingByAgent[t.assigned_agent] || 0) + 1;
  }

  const tasksEnqueued = [];
  const skippedDueToCapacity = [];

  // ── Plan Task 1: Content Agent (Specialized to tackle the diagnosed bottleneck) ──
  const contentAgentPending = pendingByAgent['content'] || 0;
  if (contentAgentPending < MAX_PENDING_TASKS_PER_AGENT) {
    const hookContext = activeLearnings.length > 0 
      ? `Incorporate proven learning: ${activeLearnings[0].insight}`
      : 'Focus on technical proof and hackathon builder credibility';

    // X/Twitter copy
    const xTask = await enqueueTask(pool, {
      type: 'draft_content',
      assignedAgent: 'content',
      priority: 2,
      input: {
        platform: 'x',
        topic: 'How top AI developers display their portfolio links in one verified URL',
        targetAudience: 'hackathon_builders',
        bottleneckTarget: analysis.bottleneck.stage,
        guidance: hookContext,
        cycleId
      }
    });
    tasksEnqueued.push({ id: xTask.id, agent: 'content', type: 'draft_content', platform: 'x' });

    // LinkedIn copy
    const liTask = await enqueueTask(pool, {
      type: 'draft_content',
      assignedAgent: 'content',
      priority: 3,
      input: {
        platform: 'linkedin',
        topic: 'From Hackathon Project to Times of India Feature: Why builder attribution matters',
        targetAudience: 'ai_engineers',
        bottleneckTarget: analysis.bottleneck.stage,
        guidance: 'Professional, technical journey, non-salesy',
        cycleId
      }
    });
    tasksEnqueued.push({ id: liTask.id, agent: 'content', type: 'draft_content', platform: 'linkedin' });
  } else {
    skippedDueToCapacity.push('content');
  }

  // ── Plan Task 2: Outreach / Community Agent ──
  const outreachPending = pendingByAgent['outreach'] || 0;
  if (outreachPending < MAX_PENDING_TASKS_PER_AGENT) {
    const scoutTask = await enqueueTask(pool, {
      type: 'scout_builders',
      assignedAgent: 'outreach',
      priority: 4,
      input: {
        targetNiche: 'IIT Madras & Google Hackathon Builders',
        searchCriteria: 'AI developer building open-source LLM apps',
        limit: 5,
        cycleId
      }
    });
    tasksEnqueued.push({ id: scoutTask.id, agent: 'outreach', type: 'scout_builders' });
  } else {
    skippedDueToCapacity.push('outreach');
  }

  // ── Plan Task 3: QA / Engineer Agent (Profile link audit) ──
  const qaPending = pendingByAgent['qa_engineer'] || 0;
  if (qaPending < MAX_PENDING_TASKS_PER_AGENT) {
    const qaTask = await enqueueTask(pool, {
      type: 'verify_profile_links',
      assignedAgent: 'qa_engineer',
      priority: 5,
      input: {
        usernamesToCheck: ['shreyansh'],
        checkOgStatus: true,
        cycleId
      }
    });
    tasksEnqueued.push({ id: qaTask.id, agent: 'qa_engineer', type: 'verify_profile_links' });
  } else {
    skippedDueToCapacity.push('qa_engineer');
  }

  const planSummary = `Orchestrator planned ${tasksEnqueued.length} task(s) targeting bottleneck '${analysis.bottleneck.stage}' (${analysis.goal.current}/${analysis.goal.target} activated).`;

  return {
    cycleId,
    timestamp: new Date().toISOString(),
    status: 'completed',
    planSummary,
    analysis,
    activeLearningsApplied: activeLearnings.length,
    tasksEnqueued,
    skippedDueToCapacity
  };
}

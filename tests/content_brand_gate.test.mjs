delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateDeterministicDraft,
  executeContentTask,
  CONNECTLY_FACTS
} from '../server/agents/content.mjs';

import {
  validateContentCopy,
  executeBrandGateReview,
  extractTextFromDraft
} from '../server/agents/brandGate.mjs';

import { processAgentQueueOnce } from '../server/services/agentWorker.mjs';
import { enqueueTask, listTasks, clearMemoryQueue } from '../server/services/agentQueue.mjs';
import { setKillSwitch } from '../server/services/killSwitch.mjs';
import { createTestClient } from './testServer.mjs';

const { default: app, pool } = await import('../server/index.mjs');

describe('PR #3: Content Agent + Fact-Check / Brand Gate (Act & Review loop)', () => {
  let client;

  before(async () => {
    client = await createTestClient(app);
  });
  beforeEach(async () => {
    clearMemoryQueue();
    await setKillSwitch(null, false, 'Reset for testing');
  });

  after(async () => {
    if (client) {
      await client.close();
    }
    if (pool) {
      await pool.end();
    }
  });

  test('generateDeterministicDraft produces 3 hook variants (data-backed, curiosity, builder-story)', () => {
    const draft = generateDeterministicDraft('x', 'Hackathon attribution');
    assert.equal(draft.platform, 'x');
    assert.equal(draft.hooks.length, 3);

    const hookStyles = draft.hooks.map(h => h.style);
    assert.ok(hookStyles.includes('data_backed'));
    assert.ok(hookStyles.includes('curiosity'));
    assert.ok(hookStyles.includes('builder_story'));

    assert.ok(draft.body.includes('Connectly'));
    assert.ok(draft.cta.includes('connectly.bio'));
  });

  test('validateContentCopy approves accurate developer copy with real features', () => {
    const goodCopy = 'Why do AI engineers use messy linktrees? Connectly is an open-source bio-link with real-time click tracking, custom QR code badges, and a printable poster for your hackathon demo table. Claim your builder handle: connectly.bio';
    const result = validateContentCopy(goodCopy);

    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.checks.noSpamBuzzwords, true);
    assert.equal(result.checks.noHallucinations, true);
    assert.equal(result.checks.hasRealFeatures, true);
  });

  test('validateContentCopy rejects corporate buzzwords (game-changer, revolutionary)', () => {
    const spammyCopy = 'This revolutionary bio-link is a total game-changer to supercharge your 10x workflow. Check out connectly.bio profile today.';
    const result = validateContentCopy(spammyCopy);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(v => v.includes('game-changer')));
    assert.ok(result.violations.some(v => v.includes('revolutionary')));
    assert.equal(result.checks.noSpamBuzzwords, false);
  });

  test('validateContentCopy rejects hallucinated features (paid subscriptions, AI resumes)', () => {
    const hallucinatedCopy = 'Sign up for our $19/month subscription pricing to unlock the automatic AI resume rewriter on your open-source profile.';
    const result = validateContentCopy(hallucinatedCopy);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(v => v.includes('subscription pricing')));
    assert.ok(result.violations.some(v => v.includes('ai resume rewriter')));
    assert.equal(result.checks.noHallucinations, false);
  });

  test('executeContentTask produces draft and enqueues brand_gate review task', async () => {
    const contentTask = await enqueueTask(null, {
      type: 'draft_content',
      assignedAgent: 'content',
      input: {
        platform: 'x',
        topic: 'Showcase multiple AI demo links'
      }
    });

    const execution = await executeContentTask(null, contentTask);
    assert.equal(execution.status, 'submitted_to_brand_gate');
    assert.ok(execution.draftId);
    assert.ok(execution.brandGateTaskId);

    // Verify Brand Gate task is queued
    const tasks = await listTasks(null, { agent: 'brand_gate' });
    const bgTask = tasks.find(t => t.id === execution.brandGateTaskId);
    assert.ok(bgTask);
    assert.equal(bgTask.status, 'queued');
    assert.equal(bgTask.priority, 1);
  });

  test('executeBrandGateReview rejects invalid copy and records violations', async () => {
    const badReviewTask = await enqueueTask(null, {
      type: 'review_content',
      assignedAgent: 'brand_gate',
      input: {
        draftId: 'draft-bad',
        platform: 'x',
        topic: 'Spam test',
        draftContent: {
          rawText: 'This revolutionary game-changer unlocks your true potential.'
        }
      }
    });

    const reviewResult = await executeBrandGateReview(null, badReviewTask);
    assert.equal(reviewResult.verdict, 'rejected');
    assert.ok(reviewResult.violations.length >= 2);
    assert.equal(reviewResult.stagedInQueue, false);
  });

  test('executeBrandGateReview approves compliant copy and stages for founder review', async () => {
    const compliantReviewTask = await enqueueTask(null, {
      type: 'review_content',
      assignedAgent: 'brand_gate',
      input: {
        draftId: 'draft-good',
        platform: 'x',
        topic: 'Hackathon build',
        draftContent: generateDeterministicDraft('x', 'Hackathon build')
      }
    });

    const reviewResult = await executeBrandGateReview(null, compliantReviewTask);
    assert.equal(reviewResult.verdict, 'approved');
    assert.equal(reviewResult.violations.length, 0);
    assert.equal(reviewResult.stagedInQueue, true);
    assert.ok(reviewResult.stagedPostId);
  });

  test('processAgentQueueOnce executes end-to-end task loop', async () => {
    // 1. Enqueue content task
    await enqueueTask(null, {
      type: 'draft_content',
      assignedAgent: 'content',
      input: { platform: 'x', topic: 'End to end worker test' }
    });

    // 2. Process content task -> generates draft and enqueues brand_gate task
    const pass1 = await processAgentQueueOnce(null);
    assert.equal(pass1.status, 'ok');
    assert.ok(pass1.processedCount >= 1);
    assert.equal(pass1.processed[0].agent, 'content');

    // 3. Process brand_gate task -> reviews and approves draft
    const pass2 = await processAgentQueueOnce(null);
    assert.equal(pass2.status, 'ok');
    assert.ok(pass2.processedCount >= 1);
    assert.equal(pass2.processed[0].agent, 'brand_gate');
    assert.equal(pass2.processed[0].result.verdict, 'approved');
  });

  test('HTTP API: POST /api/agent/content/draft generates 3 hooks', async () => {
    const res = await client.request('POST', '/api/agent/content/draft', {
      platform: 'x',
      topic: 'Developer links'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.draft.hooks.length, 3);
  });

  test('HTTP API: POST /api/agent/brand-gate/validate checks policy violations', async () => {
    const res = await client.request('POST', '/api/agent/brand-gate/validate', {
      text: 'This revolutionary game-changer will disrupt the market.'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.passed, false);
    assert.ok(res.body.violations.length >= 2);
  });
});

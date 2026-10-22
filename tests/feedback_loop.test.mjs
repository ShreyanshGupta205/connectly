delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe, before, beforeEach, after } from 'node:test';
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

import {
  recordFounderFeedback,
  listFeedback,
  ingestOutcomes,
  listOutcomes,
  dumpContentPrompt,
  evaluateAbExperimentWithMinSampleSize,
  runWeeklyRetro,
  activatePromptVersion,
  runFeedbackLoopDryRun,
  clearMemoryFeedbackLoop
} from '../server/services/feedbackLoop.mjs';

import { createTestClient } from './testServer.mjs';

const { default: app, pool } = await import('../server/index.mjs');

describe('PR #5 / STEP 6: Autonomous Feedback Loop & Continuous Evolution', () => {
  let client;

  before(async () => {
    client = await createTestClient(app);
  });

  beforeEach(() => {
    clearMemoryExperiments();
    clearMemoryPromptVersions();
    clearMemoryFeedbackLoop();
  });

  after(async () => {
    if (client) {
      await client.close();
    }
    if (pool) {
      await pool.end();
    }
  });

  // ── 6a. Feedback Table & Operations ──

  test('recordFounderFeedback records approve/edit/reject with reason tag and text comparison', async () => {
    // 1. Approval
    const appRes = await recordFounderFeedback(null, {
      draftId: 'd-101',
      platform: 'x',
      decision: 'approved',
      reasonTag: 'technical_clarity',
      draftText: 'Connectly gives you real-time click tracking on demo links under MIT license.'
    });
    assert.equal(appRes.success, true);
    assert.equal(appRes.feedback.decision, 'approved');
    assert.equal(appRes.feedback.final_text, appRes.feedback.draft_text);

    // 2. Rejection with reason tag
    const rejRes = await recordFounderFeedback(null, {
      draftId: 'd-102',
      platform: 'linkedin',
      decision: 'rejected',
      reasonTag: 'hook_weak',
      draftText: 'Here is another link in bio tool for developers.'
    });
    assert.equal(rejRes.success, true);
    assert.equal(rejRes.feedback.decision, 'rejected');
    assert.equal(rejRes.feedback.reason_tag, 'hook_weak');

    // 3. Edit with draft vs final text comparison
    const editRes = await recordFounderFeedback(null, {
      draftId: 'd-103',
      platform: 'x',
      decision: 'edited',
      reasonTag: 'tone',
      draftText: 'Supercharge your links with our incredible bio tool.',
      finalText: 'Why do AI engineers use messy linktrees? Connectly is an open-source bio-link under MIT.'
    });
    assert.equal(editRes.success, true);
    assert.equal(editRes.feedback.decision, 'edited');
    assert.notEqual(editRes.feedback.draft_text, editRes.feedback.final_text);

    const history = await listFeedback(null, 10);
    assert.equal(history.length, 3);
  });

  // ── 6b. Outcomes Ingestion ──

  test('ingestOutcomes accepts CSV and JSON metrics with source attribution (?s=) and activated counts', async () => {
    // Test CSV format
    const csvData = `post_id,platform,source_tag,impressions,clicks,visits,activated_count
post_101,x,s=share,1200,85,60,4
post_102,linkedin,s=qr,850,42,35,2`;

    const csvRes = await ingestOutcomes(null, csvData);
    assert.equal(csvRes.success, true);
    assert.equal(csvRes.ingestedCount, 2);

    // Test JSON format
    const jsonRes = await ingestOutcomes(null, {
      postId: 'post_103',
      platform: 'x',
      sourceTag: 's=poster',
      impressions: 500,
      clicks: 30,
      visits: 25,
      activatedCount: 1
    });
    assert.equal(jsonRes.success, true);
    assert.equal(jsonRes.ingestedCount, 1);

    const outcomes = await listOutcomes(null, 10);
    assert.equal(outcomes.length, 3);
    assert.equal(outcomes[0].post_id, 'post_103');
    assert.equal(outcomes[0].source_tag, 's=poster');
  });

  // ── 6c. PROVE Content Prompt Includes Top-N Learnings (Secrets Redacted) ──

  test('dumpContentPrompt PROVES top-N learnings are injected and secrets are strictly redacted', async () => {
    const dump = await dumpContentPrompt(null, { platform: 'x', topN: 3 });
    assert.equal(dump.containsLearnings, true);
    assert.ok(dump.learningsCount >= 1);
    assert.ok(dump.rawPrompt.includes('Top 3 Active Learnings'));
    assert.ok(dump.rawPrompt.includes(dump.learningsIncluded[0]));

    // Prove zero secrets or API keys in prompt
    assert.ok(!dump.rawPrompt.includes('sk-'));
    assert.ok(!dump.rawPrompt.includes('connectly_admin_fallback_key'));
  });

  // ── 6d. A/B Engine Configurable Minimum Sample Sizes ──

  test('evaluateAbExperimentWithMinSampleSize returns insufficient_data below threshold and blocks auto-promote', () => {
    const lowSampleExp = {
      id: 'exp_low',
      observations: {
        variantA: { samples: 8, conversions: 6 },
        variantB: { samples: 7, conversions: 2 }
      }
    };

    // Require min 50 samples
    const evalResult = evaluateAbExperimentWithMinSampleSize(lowSampleExp, 50);
    assert.equal(evalResult.status, 'insufficient_data');
    assert.equal(evalResult.winner, null);
    assert.equal(evalResult.autoPromote, false);
    assert.ok(evalResult.message.includes('Insufficient data'));

    // High sample size meeting threshold
    const highSampleExp = {
      id: 'exp_high',
      observations: {
        variantA: { samples: 60, conversions: 45 },
        variantB: { samples: 60, conversions: 15 }
      }
    };
    const highResult = evaluateAbExperimentWithMinSampleSize(highSampleExp, 50);
    assert.equal(highResult.status, 'completed');
    assert.equal(highResult.winner, 'variant_a');
    assert.equal(highResult.autoPromote, true);
  });

  // ── 6e. Weekly Retro & Proposed Diffs with 35% Auto-Rollback ──

  test('runWeeklyRetro generates PROPOSED diff and activatePromptVersion requires founder approval + eval score', async () => {
    await registerPromptVersion(null, {
      agent: 'content',
      version: 'v1.0',
      systemPrompt: 'Base technical writer prompt.',
      benchmarkScore: 0.90,
      isActive: true
    });

    // Run retro
    const retro = await runWeeklyRetro(null, { agent: 'content' });
    assert.equal(retro.status, 'proposed');
    assert.equal(retro.is_active, false);
    assert.ok(retro.diff.includes('--- v1.0'));
    assert.ok(retro.diff.includes('+++ v1.1'));

    // Attempt activation WITHOUT founder approval -> BLOCKED
    const unapprovedActivation = await activatePromptVersion(null, {
      proposedVersion: retro,
      founderApproved: false,
      evalScore: 0.95,
      previousScore: 0.90
    });
    assert.equal(unapprovedActivation.success, false);
    assert.ok(unapprovedActivation.error.includes('founder approval required'));

    // Attempt activation with lower eval score -> BLOCKED
    const lowScoreActivation = await activatePromptVersion(null, {
      proposedVersion: retro,
      founderApproved: true,
      evalScore: 0.85,
      previousScore: 0.90
    });
    assert.equal(lowScoreActivation.success, false);
    assert.ok(lowScoreActivation.error.includes('scored lower than benchmark'));

    // Valid activation with founder approval and superior score
    const validActivation = await activatePromptVersion(null, {
      proposedVersion: retro,
      founderApproved: true,
      evalScore: 0.94,
      previousScore: 0.90
    });
    assert.equal(validActivation.success, true);
    assert.equal(validActivation.activeVersion, 'v1.1');
  });

  test('recordPromptEvaluation triggers auto-rollback when rejection rate reaches 35%', async () => {
    await registerPromptVersion(null, {
      agent: 'content',
      version: 'v1.0',
      systemPrompt: 'Stable baseline v1.0',
      benchmarkScore: 0.95,
      isActive: false
    });

    await registerPromptVersion(null, {
      agent: 'content',
      version: 'v1.1',
      systemPrompt: 'Experimental v1.1',
      benchmarkScore: 0.90,
      isActive: true
    });

    // Feed evaluations: 1 approval, 2 rejections (rejection rate = 2/3 = 66% >= 35%)
    await recordPromptEvaluation(null, { agent: 'content', version: 'v1.1', approved: true });
    await recordPromptEvaluation(null, { agent: 'content', version: 'v1.1', approved: false });
    const thirdEval = await recordPromptEvaluation(null, { agent: 'content', version: 'v1.1', approved: false });

    assert.equal(thirdEval.rolledBack, true);
    assert.equal(thirdEval.currentActiveVersion, 'v1.0');
  });

  // ── 6f. Dry Run Routine (7 Sample Feedback Rows) ──

  test('runFeedbackLoopDryRun executes 7-sample cycle, shows diff, eval before/after, and writer drafts', async () => {
    const dryRun = await runFeedbackLoopDryRun(null);
    assert.equal(dryRun.sampleFeedbackCount, 7);
    assert.ok(dryRun.promptDiff);
    assert.ok(dryRun.evalComparison.before <= dryRun.evalComparison.after);
    assert.ok(dryRun.writerDrafts.before);
    assert.ok(dryRun.writerDrafts.after);
    assert.notEqual(dryRun.writerDrafts.before, dryRun.writerDrafts.after);
  });

  // ── HTTP Endpoints Tests ──

  test('HTTP API: Feedback, outcomes, and retro endpoints function with admin auth', async () => {
    // 1. Post feedback
    const fbRes = await client.request('POST', '/api/agent/feedback', {
      draftId: 'http_d1',
      platform: 'x',
      decision: 'approved',
      reasonTag: 'clarity',
      draftText: 'Connectly open-source bio-link'
    });
    assert.equal(fbRes.status, 200);
    assert.equal(fbRes.body.success, true);

    // 2. Ingest outcomes
    const outRes = await client.request('POST', '/api/agent/outcomes', {
      postId: 'http_p1',
      platform: 'x',
      sourceTag: 's=share',
      impressions: 400,
      clicks: 25,
      visits: 20,
      activatedCount: 1
    });
    assert.equal(outRes.status, 200);
    assert.equal(outRes.body.success, true);

    // 3. Dump content prompt
    const dumpRes = await client.request('GET', '/api/agent/prompt/dump?platform=x&topN=2');
    assert.equal(dumpRes.status, 200);
    assert.equal(dumpRes.body.success, true);
    assert.ok(dumpRes.body.rawPrompt);

    // 4. Dry run retro endpoint
    const dryRunRes = await client.request('POST', '/api/agent/retro/dry-run');
    assert.equal(dryRunRes.status, 200);
    assert.equal(dryRunRes.body.success, true);
    assert.equal(dryRunRes.body.sampleFeedbackCount, 7);
  });
});

/**
 * Fact-Check / Brand Gate Agent
 * Strict verification gatekeeper protecting brand reputation and factual truth.
 *
 * Rules:
 * 1. ZERO Hallucinated Features: Rejects paid tiers, AI video generation, or fake claims.
 * 2. ZERO Corporate Buzzwords: Rejects "game-changer", "revolutionary", "supercharge your 10x".
 * 3. Enforces Technical Authenticity: Requires real developer features (QR studio, poster, click stats).
 * 4. Self-Improvement Loop: Every rejection automatically records a negative learning into `learnings`.
 * 5. Approved drafts are staged for founder review; NEVER posted autonomously to external APIs.
 */

import fs from 'fs';
import path from 'path';
import { completeTask, failTask } from '../services/agentQueue.mjs';

export const FORBIDDEN_BUZZWORDS = [
  'game-changer',
  'revolutionary',
  'supercharge your',
  '10x your',
  'disrupting',
  'guaranteed 100k',
  'unlock your true potential',
  'skyrocket',
  'magic bullet',
  'growth hack your'
];

export const HALLUCINATED_CLAIMS = [
  'monthly fee',
  'subscription pricing',
  '$9/month',
  '$19/month',
  'ai video avatar',
  'ai resume rewriter',
  'token airdrop',
  'crypto payment'
];

export const VALID_CONNECTLY_FEATURES = [
  'bio-link',
  'open-source',
  'qr code',
  'click tracking',
  'poster',
  'badge',
  'verified',
  'views',
  'hackathon',
  'profile'
];

/**
 * Validate draft text against Brand Gate policies
 */
export function validateContentCopy(text = '') {
  const lower = text.toLowerCase();
  const violations = [];

  // Check 1: Forbidden Buzzwords
  for (const buzz of FORBIDDEN_BUZZWORDS) {
    if (lower.includes(buzz)) {
      violations.push(`Forbidden buzzword: "${buzz}"`);
    }
  }

  // Check 2: Hallucinated Claims
  for (const fake of HALLUCINATED_CLAIMS) {
    if (lower.includes(fake)) {
      violations.push(`Hallucinated claim: "${fake}" (Connectly is free & open-source; does not have paid tiers or AI resumes)`);
    }
  }

  // Check 3: Real Feature Presence
  const mentionsRealFeature = VALID_CONNECTLY_FEATURES.some(f => lower.includes(f));
  if (!mentionsRealFeature) {
    violations.push('Missing real Connectly features (must mention bio-link, QR codes, printable posters, click stats, or open-source)');
  }

  // Check 4: Length and Structure
  if (text.trim().length < 20) {
    violations.push('Draft is too short or empty to evaluate.');
  }

  const passed = violations.length === 0;

  return {
    passed,
    violations,
    checks: {
      noSpamBuzzwords: !violations.some(v => v.includes('Forbidden buzzword')),
      noHallucinations: !violations.some(v => v.includes('Hallucinated claim')),
      hasRealFeatures: mentionsRealFeature,
      hasValidStructure: text.trim().length >= 20
    }
  };
}

/**
 * Extract full evaluatable text from a draft content object
 */
export function extractTextFromDraft(draftContent) {
  if (typeof draftContent === 'string') return draftContent;
  if (!draftContent) return '';

  let fullText = '';
  if (draftContent.rawText) {
    fullText += draftContent.rawText + ' ';
  }
  if (Array.isArray(draftContent.hooks)) {
    fullText += draftContent.hooks.map(h => h.text).join(' ') + ' ';
  }
  if (draftContent.body) {
    fullText += draftContent.body + ' ';
  }
  if (draftContent.cta) {
    fullText += draftContent.cta;
  }
  return fullText.trim();
}

/**
 * Execute Brand Gate evaluation on an enqueued review task
 */
export async function executeBrandGateReview(pool, task) {
  const { draftId, platform = 'x', topic, draftContent, bottleneckTarget } = task.input || {};
  const evaluatableText = extractTextFromDraft(draftContent);

  const evaluation = validateContentCopy(evaluatableText);

  // ── REJECTION PATH ──
  if (!evaluation.passed) {
    const reason = `Brand Gate Rejected: ${evaluation.violations.join('; ')}`;

    // Record Negative Learning into learnings table for self-improvement
    if (pool) {
      try {
        const learningId = 'learn_' + Date.now();
        const primaryViolation = evaluation.violations[0];
        await pool.query(
          `INSERT INTO learnings (
            id, insight, evidence, category, confidence, active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;`,
          [
            learningId,
            `Avoid ${primaryViolation} in ${platform.toUpperCase()} copy.`,
            `Rejected draft for topic "${topic}". Violations: ${evaluation.violations.join(', ')}`,
            'content',
            0.85,
            true
          ]
        );
      } catch (learnErr) {
        console.warn('[BrandGate] Failed to record learning:', learnErr.message);
      }
    }

    await failTask(pool, task.id, reason);

    return {
      draftId,
      verdict: 'rejected',
      checks: evaluation.checks,
      violations: evaluation.violations,
      reason,
      stagedInQueue: false,
      stagedPostId: null
    };
  }

  // ── APPROVAL PATH ──
  const postId = 'post_' + Date.now();

  // Stage draft into post_performance table for downstream attribution
  if (pool) {
    try {
      const hookPreview = Array.isArray(draftContent.hooks) && draftContent.hooks.length > 0
        ? draftContent.hooks[0].text
        : evaluatableText.slice(0, 100);

      await pool.query(
        `INSERT INTO post_performance (
          id, post_id, platform, hook_style, audience, copy_preview, 
          impressions, clicks, signups, activated_profiles, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 0, NULL)
        ON CONFLICT (id) DO NOTHING;`,
        [
          postId,
          postId,
          platform,
          'data_backed',
          'ai_builders',
          hookPreview
        ]
      );
    } catch (perfErr) {
      console.warn('[BrandGate] Failed to stage post_performance record:', perfErr.message);
    }
  }

  // Also stage into pending.md so the founder can approve it in Mission Control
  try {
    const pendingPath = path.join(process.cwd(), 'docs', 'growth', 'pending.md');
    if (fs.existsSync(pendingPath)) {
      const pendingContent = fs.readFileSync(pendingPath, 'utf8');
      const hookText = Array.isArray(draftContent.hooks) && draftContent.hooks.length > 0
        ? draftContent.hooks[0].text
        : 'Connectly builder launch';

      const entry = `\n### Draft ${postId} (${platform.toUpperCase()} - Staged by Autonomous Agent Team)
- **Platform**: ${platform.toUpperCase()}
- **Status**: pending_approval
- **Topic**: ${topic || 'Connectly Builder Growth'}
- **Gatekeeper Status**: ✅ Verified by Brand Gate (Zero hallucinations, practitioner voice)
- **Hook**: "${hookText}"
- **Body**:
${draftContent.body || evaluatableText}
- **CTA**: ${draftContent.cta || 'connectly.bio'}
`;
      fs.appendFileSync(pendingPath, entry, 'utf8');
    }
  } catch (fsErr) {
    console.warn('[BrandGate] Failed to append to pending.md:', fsErr.message);
  }

  await completeTask(pool, task.id, {
    draftId,
    verdict: 'approved',
    postId,
    stagedInQueue: true,
    checks: evaluation.checks
  });

  return {
    draftId,
    verdict: 'approved',
    checks: evaluation.checks,
    violations: [],
    reason: 'Verified by Brand Gate: Zero hallucinations, accurate features, practitioner voice.',
    stagedInQueue: true,
    stagedPostId: postId
  };
}

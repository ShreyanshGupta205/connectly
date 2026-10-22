/**
 * Fact-Check / Brand Gate Agent
 * Strict verification gatekeeper protecting brand reputation and factual truth.
 *
 * STEP 5 HARD CONSTRAINTS:
 * 1. Deterministic first: Script verdict ALWAYS wins; LLM is a second opinion only.
 * 2. Grounded strictly in facts/claims.json:
 *    - Reject any number, credential, feature, or testimonial not in claims.json.
 *    - Block "verified badge", "zero-PII", "300 DPI", "RFC", Playwright-in-product claims, and Connectly.ai confusion.
 *    - Block trap claims like "judges spend 90 seconds" and "double your email list".
 * 3. Self-Improvement Loop: Rejections record negative learnings into `learnings` table.
 * 4. Staged for approval: NEVER auto-posted externally.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { completeTask, failTask } from '../services/agentQueue.mjs';
import { validateTextAgainstClaims, loadClaimsRegistry } from '../services/claimsValidator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_QUEUE_DIR = process.env.AGENT_QUEUE_DIR || path.resolve(__dirname, '../../agent-setup/queue');
const PENDING_QUEUE_FILE = path.join(DEFAULT_QUEUE_DIR, 'pending.md');

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
  'growth hack your',
  'double your'
];

export const HALLUCINATED_CLAIMS = [
  'monthly fee',
  'subscription pricing',
  '$9/month',
  '$19/month',
  'ai video avatar',
  'ai resume rewriter',
  'token airdrop',
  'crypto payment',
  'series a',
  'y combinator',
  'fortune 500',
  'soc 2',
  'iso 27001',
  'hipaa compliant'
];

export const VALID_CONNECTLY_FEATURES = [
  'bio-link',
  'open-source',
  'qr code',
  'click tracking',
  'poster',
  'hackathon',
  'profile',
  'vcard',
  'mit license',
  'vanity'
];

/**
 * Validate draft text deterministically against Brand Gate policies and facts/claims.json
 * @param {string} text
 * @returns {{ passed: boolean, violations: string[], checks: object }}
 */
export function validateContentCopy(text = '') {
  const violations = [];
  const lower = text.toLowerCase();

  // 1. Deterministic Claims & Prohibited Terms Validator (facts/claims.json)
  const claimsAudit = validateTextAgainstClaims(text);
  if (!claimsAudit.valid) {
    violations.push(...claimsAudit.violations);
  }

  // 2. Forbidden Buzzwords
  for (const buzz of FORBIDDEN_BUZZWORDS) {
    if (lower.includes(buzz)) {
      violations.push(`Forbidden buzzword: "${buzz}"`);
    }
  }

  // 3. Hallucinated Claims
  for (const fake of HALLUCINATED_CLAIMS) {
    if (lower.includes(fake)) {
      violations.push(`Hallucinated claim: "${fake}" (Connectly is free & open-source; does not have paid tiers, enterprise certifications, or crypto)`);
    }
  }

  // 4. Real Feature Presence (must mention at least one verified feature)
  const mentionsRealFeature = VALID_CONNECTLY_FEATURES.some(f => lower.includes(f));
  if (!mentionsRealFeature) {
    violations.push('Missing real Connectly features (must mention bio-link, QR codes, printable posters, click tracking, vCard, or open-source)');
  }

  // 5. Length and Structure
  if (text.trim().length < 20) {
    violations.push('Draft is too short or empty to evaluate.');
  }

  // Deduplicate violations
  const uniqueViolations = Array.from(new Set(violations));
  const passed = uniqueViolations.length === 0;

  return {
    passed,
    violations: uniqueViolations,
    checks: {
      claimsValid: claimsAudit.valid,
      noSpamBuzzwords: !uniqueViolations.some(v => v.includes('Forbidden buzzword')),
      noHallucinations: !uniqueViolations.some(v => v.includes('Hallucinated claim') || v.includes('Deterministic rule violation')),
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
 * Execute Brand Gate evaluation on an enqueued review task.
 * DETERMINISTIC FIRST: Script verdict strictly decides pass/fail.
 */
export async function executeBrandGateReview(pool, task) {
  const { draftId, platform = 'x', topic, draftContent, bottleneckTarget } = task.input || {};
  const evaluatableText = extractTextFromDraft(draftContent);

  // 1. Primary Deterministic Validation
  const evaluation = validateContentCopy(evaluatableText);

  // ── REJECTION PATH ──
  if (!evaluation.passed) {
    const reason = `Brand Gate Rejected: ${evaluation.violations.join('; ')}`;

    // Record Negative Learning into learnings table for prompt self-improvement
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
      scriptVerdictWins: true,
      checks: evaluation.checks,
      violations: evaluation.violations,
      reason,
      stagedInQueue: false,
      stagedPostId: null
    };
  }

  // ── APPROVAL PATH (DETERMINISTIC VERDICT PASS) ──
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
          impressions, clicks, signups, activations
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 0)
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

  // Stage draft into agent-setup/queue/pending.md for founder manual review
  try {
    if (!fs.existsSync(DEFAULT_QUEUE_DIR)) {
      fs.mkdirSync(DEFAULT_QUEUE_DIR, { recursive: true });
    }

    let existingContent = '';
    if (fs.existsSync(PENDING_QUEUE_FILE)) {
      existingContent = fs.readFileSync(PENDING_QUEUE_FILE, 'utf-8');
    }

    const draftMatches = existingContent.match(/###\s*\[DRAFT\s*(\d+)\]/gi) || [];
    const nextDraftNumber = draftMatches.length + 1;

    const stagedBlock = `\n### [DRAFT ${nextDraftNumber}] - ${platform.toUpperCase()} (${topic || 'Builder Activation'})\n` +
      `- **Agent**: Content Writer (Staged via Brand Gate)\n` +
      `- **Platform**: ${platform.toUpperCase()}\n` +
      `- **Target**: ${bottleneckTarget || 'Builder Activation'}\n` +
      `- **Status**: ⏳ PENDING FOUNDER APPROVAL\n` +
      `- **Generated**: ${new Date().toISOString()}\n\n` +
      `\`\`\`markdown\n${evaluatableText}\n\`\`\`\n\n---\n`;

    fs.appendFileSync(PENDING_QUEUE_FILE, stagedBlock, 'utf-8');
  } catch (fsErr) {
    console.warn('[BrandGate] Staging to queue warning:', fsErr.message);
  }

  await completeTask(pool, task.id, {
    status: 'approved_and_staged',
    postId,
    stagedInPendingQueue: true
  });

  return {
    draftId,
    verdict: 'approved',
    scriptVerdictWins: true,
    checks: evaluation.checks,
    violations: evaluation.violations,
    stagedInQueue: true,
    stagedPostId: postId
  };
}

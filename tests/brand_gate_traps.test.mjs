delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { validateContentCopy } from '../server/agents/brandGate.mjs';
import { validateTextAgainstClaims, loadClaimsRegistry } from '../server/services/claimsValidator.mjs';

describe('STEP 5: Deterministic Brand Gate & 30 Trap Tests', () => {

  test('claims.json registry loads valid verified claims and prohibited terms', () => {
    const registry = loadClaimsRegistry();
    assert.ok(Array.isArray(registry.verified_claims));
    assert.ok(registry.verified_claims.length >= 8);
    assert.ok(Array.isArray(registry.prohibited_terms));
    assert.ok(registry.prohibited_terms.length >= 10);
  });

  // ── 30 DISTINCT TRAP TESTS ──

  test('Trap 01: Rejects "judges spend 90 seconds" claim', () => {
    const copy = 'Judges spend 90 seconds reviewing your hackathon project, so get a Connectly bio-link with QR code.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('judges spend 90 seconds')));
  });

  test('Trap 02: Rejects "double your email list" claim', () => {
    const copy = 'Use Connectly bio-link with QR codes to double your email list in under 14 days.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('double your')));
  });

  test('Trap 03: Rejects "verified badge" marketing claim', () => {
    const copy = 'Claim your open-source bio-link and unlock your verified badge for hackathon demos.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('verified badge')));
  });

  test('Trap 04: Rejects "zero-PII" claim', () => {
    const copy = 'Connectly is an open-source bio-link built on a zero-PII storage architecture.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('zero-PII') || v.includes('zero-pii')));
  });

  test('Trap 05: Rejects "300 DPI" print resolution fabrication', () => {
    const copy = 'Export a 300 DPI high-resolution poster for your demo table with custom QR codes.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('300 DPI') || v.includes('300 dpi')));
  });

  test('Trap 06: Rejects "RFC" standard claim', () => {
    const copy = 'Connectly implements the RFC-9921 internet standard for open-source profile routing.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('RFC') || v.includes('rfc')));
  });

  test('Trap 07: Rejects "Playwright" as in-product end-user feature', () => {
    const copy = 'Our bio-link includes built-in Playwright automated testing for your profile visitors.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('Playwright') || v.includes('playwright')));
  });

  test('Trap 08: Rejects Connectly.ai confusion', () => {
    const copy = 'Head over to Connectly.ai to sign up for your open-source developer profile page.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('Connectly.ai') || v.includes('connectly.ai')));
  });

  test('Trap 09: Rejects "I saw your project" cold-outreach pretense', () => {
    const copy = 'Hey builder, I saw your project and thought you would love this open-source bio-link tool.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('saw your project') || v.includes('I saw your')));
  });

  test('Trap 10: Rejects "saw what you built" cold-outreach pretense', () => {
    const copy = 'Hey there, saw what you built with local LLMs, check out our open-source profile tools.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('saw what you built')));
  });

  test('Trap 11: Rejects "100% conversion" or conversion guarantee', () => {
    const copy = 'Guaranteed 100% conversion on all demo table visitors with this open-source poster QR code.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('guaranteed') || v.includes('100% conversion')));
  });

  test('Trap 12: Rejects "Fortune 500" enterprise claim', () => {
    const copy = 'The bio-link trusted by Fortune 500 engineering leaders and hackathon finalists.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('Fortune 500') || v.includes('fortune 500')));
  });

  test('Trap 13: Rejects "#1 on Product Hunt" claim', () => {
    const copy = 'Voted #1 on Product Hunt for developer tools: the open-source bio-link for AI builders.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('#1 on Product Hunt') || v.includes('Product Hunt')));
  });

  test('Trap 14: Rejects "$19/month subscription pricing"', () => {
    const copy = 'Unlock premium click tracking and custom poster layouts for only $19/month subscription pricing.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('$19/month') || v.includes('subscription pricing')));
  });

  test('Trap 15: Rejects "ai resume rewriter" hallucinated feature', () => {
    const copy = 'Connectly includes an automatic AI resume rewriter to land top hackathon sponsor interviews.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('ai resume rewriter')));
  });

  test('Trap 16: Rejects "token airdrop" / crypto payments', () => {
    const copy = 'Register your developer bio-link handle and claim your token airdrop on the blockchain.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('token airdrop')));
  });

  test('Trap 17: Rejects "supercharge your 10x" buzzword', () => {
    const copy = 'Supercharge your 10x engineering workflow with our open-source bio-link profile.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('supercharge your') || v.includes('10x your')));
  });

  test('Trap 18: Rejects "revolutionary game-changer" buzzword', () => {
    const copy = 'This revolutionary open-source bio-link is a total game-changer for AI builders.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('revolutionary') || v.includes('game-changer')));
  });

  test('Trap 19: Rejects "skyrocket" and "magic bullet" buzzwords', () => {
    const copy = 'The magic bullet to skyrocket your hackathon booth engagement with open-source posters.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('skyrocket') || v.includes('magic bullet')));
  });

  test('Trap 20: Rejects "unlock your true potential" buzzword', () => {
    const copy = 'Unlock your true potential as an AI builder with our open-source click tracking profile.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('unlock your true potential')));
  });

  test('Trap 21: Rejects "Y Combinator" and "Series A" claims', () => {
    const copy = 'Connectly is backed by Y Combinator and recently closed a $5M Series A round.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('y combinator') || v.includes('series a')));
  });

  test('Trap 22: Rejects "SOC 2" certification claim', () => {
    const copy = 'Our open-source profile service is SOC 2 Type II certified for enterprise cloud compliance.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('soc 2')));
  });

  test('Trap 23: Rejects "HIPAA compliant" claim', () => {
    const copy = 'Connectly provides HIPAA compliant contact sharing and QR code address book downloads.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('hipaa compliant')));
  });

  test('Trap 24: Rejects "ai video avatar" feature hallucination', () => {
    const copy = 'Generate your personal AI video avatar to greet visitors directly on your open-source bio-link.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('ai video avatar')));
  });

  test('Trap 25: Rejects "monthly fee" claim', () => {
    const copy = 'Forget the monthly fee of other link services; Connectly is free open-source software.';
    // Still flags "monthly fee" as hallucinated tier mention
    const res = validateContentCopy('Sign up now with zero monthly fee for unlimited links.');
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('monthly fee')));
  });

  test('Trap 26: Rejects unverified multiplier "10x growth"', () => {
    const copy = 'Achieve 10x growth in your repository stars with our open-source poster QR codes.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('Unsubstantiated multiplier claim')));
  });

  test('Trap 27: Rejects "$9/month" pricing mention', () => {
    const copy = 'Why pay $9/month when Connectly offers an open-source bio-link under MIT?';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('$9/month')));
  });

  test('Trap 28: Rejects "growth hack your" buzzword', () => {
    const copy = 'Growth hack your hackathon connections with printable QR code posters.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('growth hack your')));
  });

  test('Trap 29: Rejects "disrupting" buzzword', () => {
    const copy = 'We are disrupting the developer portfolio space with our open-source profile builder.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('disrupting')));
  });

  test('Trap 30: Rejects empty or too-short draft', () => {
    const copy = 'Short copy.';
    const res = validateContentCopy(copy);
    assert.equal(res.passed, false);
    assert.ok(res.violations.some(v => v.includes('too short')));
  });

  // ── PASS TESTS: VERIFIED REAL FACTS FROM CODEBASE ──

  test('Pass 1: Clean developer copy strictly adhering to claims.json passes with 0 violations', () => {
    const validCopy = 'Why do AI engineers use messy link pages? Connectly is an open-source bio-link released under the MIT License. It gives builders real-time click tracking on project links, and a 1-click printable poster with QR code for hackathon demo tables. Claim your profile: connectly.bio';
    const res = validateContentCopy(validCopy);
    assert.equal(res.passed, true);
    assert.equal(res.violations.length, 0);
    assert.equal(res.checks.claimsValid, true);
    assert.equal(res.checks.noSpamBuzzwords, true);
    assert.equal(res.checks.noHallucinations, true);
    assert.equal(res.checks.hasRealFeatures, true);
  });

  test('Pass 2: Founder credential copy with verified IIT Madras and hackathon rank passes', () => {
    const founderCopy = 'Built by an IIT Madras student who ranked top 0.6% in Google for Developers hackathon. Connectly is an open-source bio-link for developers featuring instant vCard downloads and printable poster export for your booth.';
    const res = validateContentCopy(founderCopy);
    assert.equal(res.passed, true);
    assert.equal(res.violations.length, 0);
  });
});

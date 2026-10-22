delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import {
  generatePosterDesign,
  BRAND_COLORS
} from '../server/agents/designer.mjs';

import {
  generateDesignDoc,
  generateIssueDraft
} from '../server/agents/engineer.mjs';

describe('STEP 8: Designer & Engineer Agent Verification', () => {

  // ── Designer Agent Tests ──

  test('Designer Agent generates valid poster with brand colors, dimensions, and {{SITE_URL}}', () => {
    const brief = {
      username: 'shreyansh',
      displayName: 'Shreyansh Gupta',
      tagline: 'Open-source AI developer and hackathon builder',
      layout: 'a4',
      siteUrlPlaceholder: '{{SITE_URL}}'
    };

    const design = generatePosterDesign(brief);
    assert.equal(design.success, true);
    assert.equal(design.layout, 'a4');
    assert.equal(design.claimsChecked, true);
    assert.equal(design.dimensions.width, 595);
    assert.equal(design.dimensions.height, 842);
    assert.equal(design.brandColors.primary, '#6366f1');
    assert.ok(design.targetQrUrl.includes('{{SITE_URL}}/@shreyansh?s=poster'));
    assert.ok(design.posterSvg.includes('CONNECTLY • OPEN SOURCE BIO-LINK'));
    assert.ok(design.posterSvg.includes('{{SITE_URL}}/@shreyansh?s=poster'));
  });

  test('Designer Agent rejects briefs containing unverified or prohibited claims', () => {
    const badBrief = {
      username: 'builder',
      displayName: 'Builder',
      tagline: 'Get your verified badge and 300 DPI print poster today'
    };

    const design = generatePosterDesign(badBrief);
    assert.equal(design.success, false);
    assert.equal(design.claimsChecked, false);
    assert.ok(design.violations.some(v => v.includes('verified badge') || v.includes('300 DPI')));
  });

  // ── Engineer Agent Tests ──

  test('Engineer Agent generates local design document and guarantees zero GitHub writes', () => {
    const result = generateDesignDoc({
      featureName: 'agent_database_isolation',
      problemStatement: 'Agent tables must never live in public production Supabase instance.',
      proposedSolution: 'Isolate agent tables behind AGENT_DATABASE_URL with RLS and REVOKE ALL.',
      technicalComponents: [
        { name: 'dbGuard.mjs', description: 'Host validator that throws on any supabase DB URLs.' },
        { name: '002 migration', description: 'Idempotent schema for local agent tables.' }
      ],
      securityConsiderations: ['Hard rule: Never connect to production host.']
    });

    assert.equal(result.success, true);
    assert.equal(result.noGithubWrites, true);
    assert.ok(fs.existsSync(result.docPath));
    assert.ok(result.content.includes('# Technical Design Document'));
    assert.ok(result.content.includes('dbGuard.mjs'));
  });

  test('Engineer Agent generates issue draft file with zero network / GitHub API calls', () => {
    const issue = generateIssueDraft({
      title: 'Harden rate limiting for AI telemetry endpoints',
      diagnosis: 'Excessive polling of /api/ai/system may saturate memory buffer.',
      reproductionSteps: [
        'Send 100 requests in 1 second to /api/ai/system',
        'Verify 429 response is returned'
      ],
      suggestedFix: 'Add sliding window token limiter in Express middleware.',
      priority: 'P1'
    });

    assert.equal(issue.success, true);
    assert.equal(issue.noGithubWrites, true);
    assert.equal(issue.publishedToGithub, false);
    assert.ok(fs.existsSync(issue.draftPath));
    assert.ok(issue.content.includes('[ISSUE DRAFT]'));
    assert.ok(issue.content.includes('LOCAL DRAFT (Zero GitHub Writes)'));
  });
});

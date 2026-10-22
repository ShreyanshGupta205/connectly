delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePersonalizedOutreach,
  executeOutreachTask,
  ingestLeadsFromCsvOrPaste,
  deleteLead,
  purgeExpiredLeads,
  listActiveLeads
} from '../server/agents/outreach.mjs';

import { validateTextAgainstClaims } from '../server/services/claimsValidator.mjs';

import {
  auditProfileIntegrity,
  executeQaTask
} from '../server/agents/qaEngineer.mjs';

import { processAgentQueueOnce } from '../server/services/agentWorker.mjs';
import { enqueueTask, listTasks, clearMemoryQueue } from '../server/services/agentQueue.mjs';
import { setKillSwitch } from '../server/services/killSwitch.mjs';
import { createTestClient } from './testServer.mjs';

const { default: app, pool } = await import('../server/index.mjs');

describe('PR #4 / STEP 4: Outreach Privacy & QA Agent Verification', () => {
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

  // ── Step 4 Outreach Privacy Tests ──

  test('generatePersonalizedOutreach generates verified invite strictly adhering to claims.json', () => {
    const lead = {
      name: 'Priya Patel',
      handle: 'priyacodes',
      platform: 'x'
    };

    const outreach = generatePersonalizedOutreach(lead);
    assert.equal(outreach.recipient, 'Priya Patel');
    assert.equal(outreach.status, 'staged_for_founder_approval');
    assert.equal(outreach.canAutoSend, false, 'Outreach must NEVER be auto-sent');
    assert.equal(outreach.claimsValid, true, 'Outreach copy must be valid according to claims.json');
    assert.ok(outreach.message.includes('connectly.bio/@priyacodes'));
    assert.ok(outreach.message.includes('MIT License'));
    // Must NOT contain unverified flattery
    assert.ok(!outreach.message.toLowerCase().includes('saw your project'));
    assert.ok(!outreach.message.toLowerCase().includes('saw what you built'));
  });

  test('Deterministic brand gate flags drafts claiming unverified facts or project flattery', () => {
    const badDraft1 = 'Hey there, I saw your project and saw what you built with Ollama, amazing work!';
    const audit1 = validateTextAgainstClaims(badDraft1);
    assert.equal(audit1.valid, false);
    assert.ok(audit1.violations.some(v => v.includes('saw your project') || v.includes('saw what you built')));

    const badDraft2 = 'Judges spend 90 seconds reviewing demos, and Connectly gives you a verified badge!';
    const audit2 = validateTextAgainstClaims(badDraft2);
    assert.equal(audit2.valid, false);
    assert.ok(audit2.violations.some(v => v.includes('judges spend 90 seconds') || v.includes('verified badge')));
  });

  test('ingestLeadsFromCsvOrPaste ingests CSV with minimal fields and enforces 30-day retention', async () => {
    const csvContent = `handle,name,platform,notes
dev_alex,Alex Chen,x,Hackathon builder
ananya_ai,Ananya Sen,github,Open-source ML
rohan_codes,Rohan,linkedin,AR/VR developer`;

    const res = await ingestLeadsFromCsvOrPaste(csvContent, null);
    assert.equal(res.ingested, 3);
    assert.equal(res.leads.length, 3);

    const first = res.leads[0];
    assert.equal(first.handle, 'dev_alex');
    assert.equal(first.name, 'Alex Chen');
    assert.equal(first.platform, 'x');
    assert.equal(first.notes, 'Hackathon builder');
    assert.equal(first.source, 'manual_paste');

    // Retention limit: 30 days
    const created = new Date(first.created_at).getTime();
    const expires = new Date(first.expires_at).getTime();
    const diffDays = Math.round((expires - created) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 30, 'Lead expires_at must be 30 days from creation');
  });

  test('ingestLeadsFromCsvOrPaste rejects rows with sensitive PII (passwords, SSNs)', async () => {
    const maliciousCsv = `handle,name,platform,notes
clean_user,Clean Person,x,normal
hacker,Bad Actor,x,password123
leaker,Leaker,x,ssn: 000-12-3456`;

    const res = await ingestLeadsFromCsvOrPaste(maliciousCsv, null);
    assert.equal(res.ingested, 1);
    assert.equal(res.errors.length, 2);
  });

  test('deleteLead explicitly deletes lead by ID (privacy deletion command)', async () => {
    const csv = `temp_lead,Temporary Lead,x,to be deleted`;
    const ingestRes = await ingestLeadsFromCsvOrPaste(csv, null);
    const leadId = ingestRes.leads[0].id;

    const delRes = await deleteLead(leadId, null);
    assert.equal(delRes.success, true);
    assert.equal(delRes.deleted, true);

    const active = await listActiveLeads(null);
    assert.ok(!active.some(l => l.id === leadId));
  });

  test('purgeExpiredLeads deletes leads older than retention limit', async () => {
    const csv = `expiring_lead,Old Lead,x,expired`;
    const ingestRes = await ingestLeadsFromCsvOrPaste(csv, null);
    const lead = ingestRes.leads[0];

    // Artificially expire the lead
    lead.expires_at = new Date(Date.now() - 1000).toISOString();

    const purgeRes = await purgeExpiredLeads(null);
    assert.ok(purgeRes.purgedCount >= 1);

    const active = await listActiveLeads(null);
    assert.ok(!active.some(l => l.handle === 'expiring_lead'));
  });

  test('executeOutreachTask idles cleanly when no manual leads exist', async () => {
    // Purge all leads first
    const active = await listActiveLeads(null);
    for (const l of active) {
      await deleteLead(l.id, null);
    }

    const task = await enqueueTask(null, {
      type: 'scout_builders',
      assignedAgent: 'outreach',
      input: { limit: 2 }
    });

    const result = await executeOutreachTask(null, task);
    assert.equal(result.leadsCount, 0);
    assert.equal(result.requiresApproval, true);
    assert.ok(result.message.includes('No manually imported leads found'));
  });

  test('executeOutreachTask processes manual leads without automated scraping', async () => {
    await ingestLeadsFromCsvOrPaste('test_builder,Test Builder,x,hackathon', null);

    const task = await enqueueTask(null, {
      type: 'scout_builders',
      assignedAgent: 'outreach',
      input: { limit: 1 }
    });

    const result = await executeOutreachTask(null, task);
    assert.equal(result.leadsCount, 1);
    assert.equal(result.requiresApproval, true);
    assert.equal(result.stagedMessages[0].status, 'staged_for_founder_approval');
    assert.equal(result.stagedMessages[0].canAutoSend, false);
  });

  // ── QA / Engineer Agent Tests ──

  test('auditProfileIntegrity passes clean verified profile with zero critical issues', () => {
    const cleanProfile = {
      username: 'shreyansh',
      name: 'Shreyansh Gupta',
      links: [
        { title: 'GitHub', url: 'https://github.com/ShreyanshGupta205' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/shreyanshgupta205' },
        { title: 'TOI Feature', url: 'https://timesofindia.indiatimes.com' }
      ],
      stats: { shares: 420 }
    };

    const audit = auditProfileIntegrity(cleanProfile);
    assert.equal(audit.isActivated, true);
    assert.equal(audit.issues.length, 0);
    assert.equal(audit.suggestions.length, 0);
  });

  test('auditProfileIntegrity detects malformed URLs, empty URLs, and non-web protocols', () => {
    const brokenProfile = {
      username: 'broken_user',
      name: 'Broken User',
      links: [
        { title: 'Malformed 1', url: 'not-a-url' },
        { title: 'Empty URL', url: '' },
        { title: 'FTP link', url: 'ftp://files.example.com/demo.zip' },
        { title: 'Valid link', url: 'https://example.com' }
      ],
      stats: { shares: 0 }
    };

    const audit = auditProfileIntegrity(brokenProfile);
    assert.equal(audit.issues.length, 3);
    assert.equal(audit.linkCount, 4);
    assert.ok(audit.issues.some(i => i.code === 'MALFORMED_URL'));
    assert.ok(audit.issues.some(i => i.code === 'MISSING_LINK_URL'));
    assert.ok(audit.issues.some(i => i.code === 'INVALID_PROTOCOL'));
  });

  test('auditProfileIntegrity diagnoses activation gaps and suggests targeted fixes', () => {
    const incompleteProfile = {
      username: 'new_builder',
      name: 'New Builder',
      links: [{ title: 'GitHub', url: 'https://github.com/newbuilder' }],
      stats: { shares: 0 }
    };

    const audit = auditProfileIntegrity(incompleteProfile);
    assert.equal(audit.isActivated, false);
    assert.ok(audit.suggestions.some(s => s.type === 'LINK_ADDITION_RECOMMENDATION'));
    assert.ok(audit.suggestions.some(s => s.type === 'SHARE_RECOMMENDATION'));
  });

  test('executeQaTask runs full health audit across active profiles', async () => {
    const mockProfiles = {
      shreyansh: {
        username: 'shreyansh',
        name: 'Shreyansh Gupta',
        links: [
          { title: 'GitHub', url: 'https://github.com/ShreyanshGupta205' },
          { title: 'Demo', url: 'https://connectly.bio' },
          { title: 'LinkedIn', url: 'https://linkedin.com' }
        ],
        stats: { shares: 10 }
      },
      inactive: {
        username: 'inactive',
        name: 'Inactive User',
        links: [{ title: 'Site', url: 'http://insecure.com' }],
        stats: { shares: 0 }
      }
    };

    const task = await enqueueTask(null, {
      type: 'verify_profile_links',
      assignedAgent: 'qa_engineer',
      input: { usernamesToCheck: ['shreyansh', 'inactive'] }
    });

    const report = await executeQaTask(null, task, mockProfiles);
    assert.equal(report.profilesAudited, 2);
    assert.equal(report.issues.length, 0);
    assert.ok(report.suggestions.length >= 1);
  });

  test('processAgentQueueOnce executes outreach and qa_engineer tasks', async () => {
    // Ingest a lead so outreach has work
    await ingestLeadsFromCsvOrPaste('worker_test_user,Worker Tester,x,notes', null);

    await enqueueTask(null, {
      type: 'scout_builders',
      assignedAgent: 'outreach',
      input: { limit: 1 }
    });

    await enqueueTask(null, {
      type: 'verify_profile_links',
      assignedAgent: 'qa_engineer',
      input: {}
    });

    const workerPass = await processAgentQueueOnce(null, {});
    assert.equal(workerPass.status, 'ok');
    assert.equal(workerPass.processedCount, 2);

    const agents = workerPass.processed.map(p => p.agent);
    assert.ok(agents.includes('outreach'));
    assert.ok(agents.includes('qa_engineer'));
  });

  // ── HTTP Endpoints Tests (with Admin Auth) ──

  test('HTTP API: Outreach endpoints reject requests without valid admin key (401)', async () => {
    const res1 = await client.request('POST', '/api/agent/outreach/import', { csvContent: 'foo,bar' }, { 'x-admin-key': 'invalid_secret_key' });
    assert.equal(res1.status, 401);

    const res2 = await client.request('GET', '/api/agent/outreach/leads', null, { 'x-admin-key': 'invalid_secret_key' });
    assert.equal(res2.status, 401);
  });

  test('HTTP API: POST /api/agent/outreach/import ingests leads and GET /api/agent/outreach/leads returns them', async () => {
    const importRes = await client.request('POST', '/api/agent/outreach/import', {
      csvContent: `http_lead_1,HTTP User,x,imported via test`
    });
    assert.equal(importRes.status, 200);
    assert.equal(importRes.body.success, true);
    assert.equal(importRes.body.ingested, 1);

    const listRes = await client.request('GET', '/api/agent/outreach/leads');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.success, true);
    assert.ok(listRes.body.leads.some(l => l.handle === 'http_lead_1'));
  });

  test('HTTP API: DELETE /api/agent/outreach/leads/:id deletes lead', async () => {
    const importRes = await client.request('POST', '/api/agent/outreach/import', {
      csvContent: `to_delete_lead,Delete Me,x,temporary`
    });
    const leadId = importRes.body.leads[0].id;

    const delRes = await client.request('DELETE', `/api/agent/outreach/leads/${leadId}`);
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);
    assert.equal(delRes.body.deleted, true);
  });

  test('HTTP API: POST /api/agent/outreach/scout returns staged messages requiring approval', async () => {
    await client.request('POST', '/api/agent/outreach/import', {
      csvContent: `scout_target,Scout Target,x,hackathon competitor`
    });

    const res = await client.request('POST', '/api/agent/outreach/scout', {
      targetNiche: 'Hackathon Competitor',
      limit: 1
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.requiresApproval, true);
    assert.ok(res.body.leadsCount >= 1);
  });

  test('HTTP API: GET /api/agent/qa/audit returns profile health report', async () => {
    const res = await client.request('GET', '/api/agent/qa/audit');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.report.timestamp);
    assert.ok(res.body.report.profilesAudited >= 1);
  });
});

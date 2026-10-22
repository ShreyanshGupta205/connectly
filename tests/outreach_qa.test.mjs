process.env.VERCEL = '1';
process.env.NODE_ENV = 'test';
import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePersonalizedOutreach,
  executeOutreachTask,
  TARGET_BUILDER_ARCHETYPES
} from '../server/agents/outreach.mjs';

import {
  auditProfileIntegrity,
  executeQaTask
} from '../server/agents/qaEngineer.mjs';

import { processAgentQueueOnce } from '../server/services/agentWorker.mjs';
import { enqueueTask, listTasks, clearMemoryQueue } from '../server/services/agentQueue.mjs';
import { setKillSwitch } from '../server/services/killSwitch.mjs';

const { default: app, pool } = await import('../server/index.mjs');

// Minimal in-memory request simulator
async function simulatedRequest(app, method, url, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json', ...headers },
      body,
    };

    let statusCode = 200;
    let responseHeaders = {};

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(name, value) {
        responseHeaders[name.toLowerCase()] = value;
        return this;
      },
      json(data) {
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data
        });
      },
      send(data) {
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data
        });
      }
    };

    app.handle(req, res);
  });
}

describe('PR #4: Outreach/Community Agent + QA/Engineer Agent', () => {
  beforeEach(async () => {
    clearMemoryQueue();
    await setKillSwitch(null, false, 'Reset for testing');
  });

  after(async () => {
    if (pool) {
      await pool.end();
    }
  });

  // ── Outreach Agent Tests ──

  test('generatePersonalizedOutreach generates contextual invite and enforces staged approval status', () => {
    const lead = {
      name: 'Priya Patel',
      project: 'FastAPI LLM agent for legal search',
      niche: 'Open Source AI Developer',
      handle: 'priyacodes'
    };

    const outreach = generatePersonalizedOutreach(lead);
    assert.equal(outreach.recipient, 'Priya Patel');
    assert.equal(outreach.status, 'staged_for_approval');
    assert.ok(outreach.message.includes('FastAPI LLM agent for legal search'));
    assert.ok(outreach.message.includes('connectly.bio/@priyacodes'));
    assert.ok(outreach.message.includes('open-source under MIT'));
  });

  test('executeOutreachTask scouts leads and requires founder approval', async () => {
    const task = await enqueueTask(null, {
      type: 'scout_builders',
      assignedAgent: 'outreach',
      input: {
        targetNiche: 'Hackathon Competitor',
        limit: 2
      }
    });

    const result = await executeOutreachTask(null, task);
    assert.equal(result.leadsCount, 2);
    assert.equal(result.requiresApproval, true);
    assert.equal(result.stagedMessages.length, 2);
    assert.equal(result.stagedMessages[0].status, 'staged_for_approval');
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
      username: 'broken_dev',
      name: 'Broken Dev',
      links: [
        { title: 'Empty', url: '' },
        { title: 'Local', url: 'http://localhost:3000/demo' },
        { title: 'FTP', url: 'ftp://ftp.example.com/files' },
        { title: 'Garbage', url: 'not-a-valid-url' }
      ],
      stats: { shares: 0 }
    };

    const audit = auditProfileIntegrity(brokenProfile);
    assert.equal(audit.isActivated, false);

    const issueCodes = audit.issues.map(i => i.code);
    assert.ok(issueCodes.includes('MISSING_LINK_URL'));
    assert.ok(issueCodes.includes('LOCAL_DEV_LINK'));
    assert.ok(issueCodes.includes('INVALID_PROTOCOL'));
    assert.ok(issueCodes.includes('MALFORMED_URL'));
  });

  test('auditProfileIntegrity diagnoses activation gaps and suggests targeted fixes', () => {
    const incompleteProfile = {
      username: 'dev_sarah',
      name: 'Sarah Chen',
      links: [{ title: 'GitHub', url: 'https://github.com/sarah' }],
      stats: { shares: 0 }
    };

    const audit = auditProfileIntegrity(incompleteProfile);
    assert.equal(audit.isActivated, false);

    const suggestionTypes = audit.suggestions.map(s => s.type);
    assert.ok(suggestionTypes.includes('LINK_ADDITION_RECOMMENDATION'));
    assert.ok(suggestionTypes.includes('SHARE_RECOMMENDATION'));

    const linkSuggestion = audit.suggestions.find(s => s.type === 'LINK_ADDITION_RECOMMENDATION');
    assert.equal(linkSuggestion.linksNeeded, 2);
  });

  test('executeQaTask runs full health audit across active profiles', async () => {
    const mockProfiles = {
      p1: {
        username: 'p1',
        name: 'Builder 1',
        links: [{ title: 'GitHub', url: 'https://github.com' }],
        stats: { shares: 0 }
      }
    };

    const task = await enqueueTask(null, {
      type: 'verify_profile_links',
      assignedAgent: 'qa_engineer',
      input: { usernamesToCheck: ['p1'] }
    });

    const report = await executeQaTask(null, task, mockProfiles);
    assert.equal(report.profilesAudited, 1);
    assert.equal(report.criticalIssuesCount, 0);
    assert.ok(Array.isArray(report.suggestions));
    assert.ok(report.suggestions.length > 0);
  });

  test('processAgentQueueOnce executes outreach and qa_engineer tasks', async () => {
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

  // ── HTTP Endpoints Tests ──

  test('HTTP API: POST /api/agent/outreach/scout returns staged messages requiring approval', async () => {
    const res = await simulatedRequest(app, 'POST', '/api/agent/outreach/scout', {
      targetNiche: 'Hackathon Competitor',
      limit: 2
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.requiresApproval, true);
    assert.equal(res.body.leadsCount, 2);
  });

  test('HTTP API: GET /api/agent/qa/audit returns profile health report', async () => {
    const res = await simulatedRequest(app, 'GET', '/api/agent/qa/audit');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.report.timestamp);
    assert.ok(res.body.report.profilesAudited >= 1);
  });
});

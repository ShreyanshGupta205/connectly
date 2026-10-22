delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'fs';
import path from 'path';

import { isSystemPaused, getKillSwitchStatus, setKillSwitch } from '../server/services/killSwitch.mjs';
import { runAgentTask } from '../server/services/agentRunner.mjs';

const { default: app } = await import('../server/index.mjs');

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'connectly_admin_fallback_key';
const PAUSE_FILE = path.join(process.cwd(), 'board', 'PAUSE');

describe('STEP 2: Auth, Rate Limiting & Kill Switch Verification', () => {
  let server;
  let baseUrl;

  before(async () => {
    delete process.env.VERCEL;
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    delete process.env.VERCEL;
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await setKillSwitch(null, false, 'Reset after test');
    if (fs.existsSync(PAUSE_FILE)) {
      fs.unlinkSync(PAUSE_FILE);
    }
  });

  beforeEach(async () => {
    delete process.env.VERCEL;
    await setKillSwitch(null, false, 'Reset before test');
    if (fs.existsSync(PAUSE_FILE)) {
      fs.unlinkSync(PAUSE_FILE);
    }
  });

  test('All /api/agent and /api/ai endpoints return 404 when process.env.VERCEL is set', async () => {
    process.env.VERCEL = '1';
    
    const endpoints = [
      { method: 'GET', url: '/api/ai/system' },
      { method: 'GET', url: '/api/agent/stats' },
      { method: 'GET', url: '/api/agent/kill-switch' },
      { method: 'POST', url: '/api/agent/orchestrator/cycle' },
      { method: 'GET', url: '/api/agent/analyst/report' },
      { method: 'GET', url: '/api/agent/experiments' },
      { method: 'GET', url: '/api/agent/qa/audit' }
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        }
      });
      assert.equal(res.status, 404, `Endpoint ${ep.method} ${ep.url} must return 404 on Vercel`);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.error, /serverless/i);
    }

    delete process.env.VERCEL;
  });

  test('All /api/agent and /api/ai endpoints return 401 when x-admin-key is missing', async () => {
    delete process.env.VERCEL;

    const endpoints = [
      { method: 'GET', url: '/api/ai/system' },
      { method: 'GET', url: '/api/agent/stats' },
      { method: 'GET', url: '/api/agent/kill-switch' },
      { method: 'POST', url: '/api/agent/orchestrator/cycle' },
      { method: 'GET', url: '/api/agent/analyst/report' }
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      });
      assert.equal(res.status, 401, `Endpoint ${ep.method} ${ep.url} must return 401 without admin key`);
      const body = await res.json();
      assert.equal(body.success, false);
    }
  });

  test('Endpoints accept Authorization: Bearer <admin-key>', async () => {
    delete process.env.VERCEL;
    const res = await fetch(`${baseUrl}/api/agent/kill-switch`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${ADMIN_KEY}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  test('Kill switch creates board/PAUSE file and blocks operations mid-run', async () => {
    // 1. Initially not paused
    assert.equal(await isSystemPaused(null), false);
    assert.equal(fs.existsSync(PAUSE_FILE), false);

    // 2. Activate kill switch via setKillSwitch
    await setKillSwitch(null, true, 'Emergency pause during test');
    assert.equal(fs.existsSync(PAUSE_FILE), true);
    assert.equal(await isSystemPaused(null), true);

    // 3. runAgentTask must abort immediately
    await assert.rejects(
      () => runAgentTask(null, {
        agentName: 'content',
        systemPrompt: 'You are an agent',
        userPrompt: 'Write copy'
      }),
      (err) => {
        assert.match(err.message, /kill switch is active/i);
        return true;
      }
    );

    // 4. Deactivate kill switch
    await setKillSwitch(null, false, 'Resume operations');
    assert.equal(fs.existsSync(PAUSE_FILE), false);
    assert.equal(await isSystemPaused(null), false);
  });

  test('Manual board/PAUSE file on filesystem is immediately detected', async () => {
    const dir = path.dirname(PAUSE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PAUSE_FILE, 'External manual pause', 'utf-8');

    // Without DB or memory change, file check detects pause
    assert.equal(await isSystemPaused(null), true);
    const status = await getKillSwitchStatus(null);
    assert.equal(status.is_paused, true);
    assert.equal(status.source, 'file');

    // Remove file
    fs.unlinkSync(PAUSE_FILE);
    assert.equal(await isSystemPaused(null), false);
  });
});

delete process.env.VERCEL;
process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestClient } from './testServer.mjs';

const { default: app } = await import('../server/index.mjs');

describe('AI Mission Control & Growth Engine Endpoints', () => {
  let client;

  before(async () => {
    client = await createTestClient(app);
  });

  after(async () => {
    if (client) await client.close();
  });

  test('GET /api/ai/system returns 404 when process.env.VERCEL is set', async () => {
    process.env.VERCEL = '1';
    const res = await client.request('GET', '/api/ai/system');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    delete process.env.VERCEL;
  });

  test('GET /api/ai/system returns 401 when x-admin-key is missing', async () => {
    delete process.env.VERCEL;
    const res = await client.request('GET', '/api/ai/system', null, { 'x-admin-key': '' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/ai/system returns 200 with system telemetry structure with admin key', async () => {
    delete process.env.VERCEL;
    const res = await client.request('GET', '/api/ai/system');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.ollama !== undefined);
    assert.ok(res.body.gpu !== undefined);
    assert.ok(res.body.hermes !== undefined);
    assert.ok(res.body.server !== undefined);
    assert.equal(typeof res.body.server.port, 'number');
  });

  test('GET /api/ai/queue returns staged drafts from pending.md', async () => {
    delete process.env.VERCEL;
    const res = await client.request('GET', '/api/ai/queue');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.drafts));
    assert.ok(res.body.stats !== undefined);
    assert.equal(typeof res.body.stats.total, 'number');
  });

  test('GET /api/ai/funnel returns activation funnel and progress toward 30', async () => {
    delete process.env.VERCEL;
    const res = await client.request('GET', '/api/ai/funnel');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.goal.target, 30);
    assert.ok(Array.isArray(res.body.funnel));
    assert.ok(res.body.metrics.totalViews >= 0);
  });

  test('POST /api/ai/queue/update rejects missing required fields', async () => {
    delete process.env.VERCEL;
    const res = await client.request('POST', '/api/ai/queue/update', {});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});

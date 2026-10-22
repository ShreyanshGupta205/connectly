import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/index.mjs';

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
    let responseBody = '';

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
        responseBody = JSON.stringify(data);
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data
        });
      },
      send(data) {
        responseBody = data;
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

describe('AI Mission Control & Growth Engine Endpoints', () => {
  test('GET /api/ai/system returns 200 with system telemetry structure', async () => {
    const res = await simulatedRequest(app, 'GET', '/api/ai/system');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.ollama !== undefined);
    assert.ok(res.body.gpu !== undefined);
    assert.ok(res.body.hermes !== undefined);
    assert.ok(res.body.server !== undefined);
    assert.equal(typeof res.body.server.port, 'number');
  });

  test('GET /api/ai/queue returns staged drafts from pending.md', async () => {
    const res = await simulatedRequest(app, 'GET', '/api/ai/queue');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.drafts));
    assert.ok(res.body.stats !== undefined);
    assert.equal(typeof res.body.stats.total, 'number');
  });

  test('GET /api/ai/funnel returns activation funnel and progress toward 30', async () => {
    const res = await simulatedRequest(app, 'GET', '/api/ai/funnel');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.goal.target, 30);
    assert.ok(Array.isArray(res.body.funnel));
    assert.ok(res.body.metrics.totalViews >= 0);
  });

  test('POST /api/ai/queue/update rejects missing required fields', async () => {
    const res = await simulatedRequest(app, 'POST', '/api/ai/queue/update', {});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});

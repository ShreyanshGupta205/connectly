import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Prevent automatic app.listen during import
process.env.VERCEL = '1';
process.env.ADMIN_SECRET_KEY = 'test_secret_admin_key_123';

const { default: app } = await import('../server/index.mjs');

describe('Profile Write Security & Whitelist Enforcement', () => {
  let server;
  let baseUrl;

  before(async () => {
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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('PATCH /api/profiles/:username rejects client attempt to mutate is_verified (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: true }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden field\(s\).*is_verified/i);
  });

  test('PATCH /api/profiles/:username rejects client attempt to mutate isVerified camelCase (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified: true }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden field\(s\).*isVerified/i);
  });

  test('PATCH /api/profiles/:username rejects client attempt to mutate plan (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro_unlimited' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden field\(s\).*plan/i);
  });

  test('PATCH /api/profiles/:username rejects client attempt to mutate email, id, created_at, or stats (400 Bad Request)', async () => {
    for (const field of ['email', 'id', 'created_at', 'createdAt', 'stats']) {
      const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: 'unauthorized_payload' }),
      });

      assert.equal(res.status, 400, `Expected 400 for forbidden field ${field}`);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, new RegExp(`Forbidden field\\(s\\).*${field}`, 'i'));
    }
  });

  test('PUT /api/profiles/:username silently strips restricted fields and preserves original values', async () => {
    // Attempt to forge isVerified, plan, and email via full PUT update
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Shreyansh Updated',
        bio: 'Updated bio text',
        is_verified: true,
        isVerified: true,
        plan: 'enterprise',
        email: 'hacker@malicious.com',
        id: 'tampered-id-123',
        stats: { views: 999999, likes: 888888 },
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    // Allowed fields updated
    assert.equal(data.profile.name, 'Shreyansh Updated');
    assert.equal(data.profile.bio, 'Updated bio text');
    // Restricted fields MUST retain their original server state
    assert.notEqual(data.profile.plan, 'enterprise');
    assert.notEqual(data.profile.email, 'hacker@malicious.com');
    assert.notEqual(data.profile.id, 'tampered-id-123');
    assert.notEqual(data.profile.stats.views, 999999);
  });

  test('POST /api/admin/verify without server credentials returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'shreyansh', isVerified: true }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Unauthorized/i);
  });

  test('POST /api/admin/verify with invalid x-admin-key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/admin/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': 'wrong_invalid_key_attempt'
      },
      body: JSON.stringify({ username: 'shreyansh', isVerified: true }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Unauthorized/i);
  });

  test('POST /api/admin/verify with valid x-admin-key successfully toggles verification', async () => {
    const res = await fetch(`${baseUrl}/api/admin/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': 'test_secret_admin_key_123'
      },
      body: JSON.stringify({ username: 'shreyansh', isVerified: true }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.isVerified, true);
  });
});

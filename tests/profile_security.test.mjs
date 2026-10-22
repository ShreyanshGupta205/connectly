import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Prevent automatic app.listen during import
process.env.VERCEL = '1';
process.env.NODE_ENV = 'test';
process.env.ADMIN_SECRET_KEY = 'test_secret_admin_key_123';

const { default: app } = await import('../server/index.mjs');

describe('Profile Write Security, Ownership & Whitelist Enforcement', () => {
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

  // ── Authentication & Ownership Tests (S3) ──

  test('PUT /api/profiles/:username without auth credentials returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthenticated Attacker' }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Unauthorized/i);
  });

  test('PATCH /api/profiles/:username without auth credentials returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthenticated Attacker' }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Unauthorized/i);
  });

  test('DELETE /api/profiles/:username without auth credentials returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'DELETE',
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Unauthorized/i);
  });

  test('PUT /api/profiles/:username by unauthorized User A on User B returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': 'user-malicious_hacker',
        'x-user-email': 'hacker@evil.com'
      },
      body: JSON.stringify({ name: 'Defaced Name' }),
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden.*Ownership verification failed/i);
  });

  test('PATCH /api/profiles/:username by unauthorized User A on User B returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': 'user-malicious_hacker',
        'x-user-email': 'hacker@evil.com'
      },
      body: JSON.stringify({ bio: 'Defaced bio' }),
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden.*Ownership verification failed/i);
  });

  // ── Whitelist & Forbidden Mutation Tests (S3 & S4) ──

  test('PATCH by legitimate owner with is_verified is rejected (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': 'user-shreyansh'
      },
      body: JSON.stringify({ is_verified: true }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden field\(s\).*is_verified/i);
  });

  test('PATCH by legitimate owner with plan is rejected (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': 'user-shreyansh'
      },
      body: JSON.stringify({ plan: 'pro_unlimited' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Forbidden field\(s\).*plan/i);
  });

  test('PATCH by legitimate owner with email, id, createdAt, or stats is rejected (400 Bad Request)', async () => {
    for (const field of ['email', 'id', 'created_at', 'createdAt', 'stats']) {
      const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'user-shreyansh'
        },
        body: JSON.stringify({ [field]: 'unauthorized_payload' }),
      });

      assert.equal(res.status, 400, `Expected 400 for forbidden field ${field}`);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, new RegExp(`Forbidden field\\(s\\).*${field}`, 'i'));
    }
  });

  test('PUT by legitimate owner updates allowed fields and silently preserves server-controlled fields', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/shreyansh`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': 'user-shreyansh'
      },
      body: JSON.stringify({
        name: 'Shreyansh Verified Builder',
        bio: 'Updated bio by owner',
        is_verified: true,
        plan: 'enterprise',
        email: 'attacker@evil.com',
        id: 'hacked-id',
        stats: { views: 999999, likes: 999999, shares: 999999 },
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    // Allowed fields updated
    assert.equal(data.profile.name, 'Shreyansh Verified Builder');
    assert.equal(data.profile.bio, 'Updated bio by owner');
    // Restricted fields MUST retain their original server state
    assert.notEqual(data.profile.plan, 'enterprise');
    assert.notEqual(data.profile.email, 'attacker@evil.com');
    assert.notEqual(data.profile.id, 'hacked-id');
    assert.notEqual(data.profile.stats.views, 999999);
  });

  // ── Admin Endpoints Protection Tests (S3 & S5) ──

  test('GET /api/admin/overview without admin key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('GET /api/admin/export without admin key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/admin/export`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('POST /api/admin/verify without admin key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'shreyansh', isVerified: true }),
    });

    assert.equal(res.status, 401);
  });

  test('Admin key successfully accesses /api/admin/overview and toggles verification', async () => {
    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { 'x-admin-key': 'test_secret_admin_key_123' },
    });
    assert.equal(overviewRes.status, 200);
    const overviewData = await overviewRes.json();
    assert.equal(overviewData.success, true);
    assert.equal(typeof overviewData.kpis.totalProfiles, 'number');

    const verifyRes = await fetch(`${baseUrl}/api/admin/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': 'test_secret_admin_key_123'
      },
      body: JSON.stringify({ username: 'shreyansh', isVerified: true }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.isVerified, true);
  });

  // ── Atomic Share & North Star Activation Test (S4) ──

  test('POST /api/profiles/:username/share atomically increments shares and calculates activation', async () => {
    // 1. Create a fresh test user
    const uniqueUsername = `builder_${Date.now()}`;
    const signupRes = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUsername,
        name: 'Test Builder',
        email: `${uniqueUsername}@example.com`,
      }),
    });
    assert.equal(signupRes.status, 201);
    const signupData = await signupRes.json();
    assert.equal(signupData.profile.stats.shares, 0);

    // 2. Add 3 links via legitimate PUT update
    const putRes = await fetch(`${baseUrl}/api/profiles/${uniqueUsername}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': `user-${uniqueUsername}`
      },
      body: JSON.stringify({
        links: [
          { id: 'l1', title: 'GitHub', url: 'https://github.com' },
          { id: 'l2', title: 'LinkedIn', url: 'https://linkedin.com' },
          { id: 'l3', title: 'Devfolio', url: 'https://devfolio.co' },
        ],
      }),
    });
    assert.equal(putRes.status, 200);

    // 3. Trigger atomic share
    const shareRes = await fetch(`${baseUrl}/api/profiles/${uniqueUsername}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'whatsapp' }),
    });
    assert.equal(shareRes.status, 200);
    const shareData = await shareRes.json();
    assert.equal(shareData.success, true);
    assert.equal(shareData.shares, 1);
    // North Star condition satisfied: 3 links AND 1 share -> isActivated = true
    assert.equal(shareData.isActivated, true);

    // 4. Verify shares persisted on profile fetch
    const getRes = await fetch(`${baseUrl}/api/profiles/${uniqueUsername}`);
    const getData = await getRes.json();
    assert.equal(getData.profile.stats.shares, 1);
  });

  // ── Client Full Simulated Workflow Test (S4) ──

  test('Simulated client workflow: signup -> edit profile -> add 3 links -> share -> like', async () => {
    const clientUser = `client_${Date.now()}`;

    // Step 1: Sign up
    const step1 = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: clientUser,
        name: 'Hackathon Competitor',
        email: `${clientUser}@test.com`,
        tagline: 'Building cool things',
        bio: 'Demo day team lead',
      }),
    });
    assert.equal(step1.status, 201);
    const profile = (await step1.json()).profile;

    // Step 2: Edit profile (Allowed fields only, never sending stats or isVerified)
    const step2 = await fetch(`${baseUrl}/api/profiles/${clientUser}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': profile.id
      },
      body: JSON.stringify({
        tagline: 'Winner at HackSphere 2026',
        themeId: 'terminal-matrix',
      }),
    });
    assert.equal(step2.status, 200);
    const updated = (await step2.json()).profile;
    assert.equal(updated.tagline, 'Winner at HackSphere 2026');
    assert.equal(updated.themeId, 'terminal-matrix');

    // Step 3: Add 3 links
    const step3 = await fetch(`${baseUrl}/api/profiles/${clientUser}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': profile.id
      },
      body: JSON.stringify({
        links: [
          { id: 'link-1', title: 'Live Demo', url: 'https://demo.app' },
          { id: 'link-2', title: 'GitHub Repo', url: 'https://github.com/team/repo' },
          { id: 'link-3', title: 'Presentation Deck', url: 'https://slides.com' },
        ],
      }),
    });
    assert.equal(step3.status, 200);

    // Step 4: Share profile via atomic endpoint
    const step4 = await fetch(`${baseUrl}/api/profiles/${clientUser}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'twitter' }),
    });
    assert.equal(step4.status, 200);
    const shareRes = await step4.json();
    assert.equal(shareRes.shares, 1);
    assert.equal(shareRes.isActivated, true);

    // Step 5: Visitor likes profile
    const step5 = await fetch(`${baseUrl}/api/profiles/${clientUser}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: 1 }),
    });
    assert.equal(step5.status, 200);
    const likeRes = await step5.json();
    assert.equal(likeRes.likes, 1);
  });
});

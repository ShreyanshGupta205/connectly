import pg from 'pg';
import ogHandler from '../api/og.mjs';

function createMockRes() {
  const headers = {};
  let status = 200;
  let body = '';

  const res = {
    setHeader: (key, val) => {
      headers[key.toLowerCase()] = val;
    },
    status: (s) => {
      status = s;
      return {
        send: (b) => {
          body = b;
          return res;
        }
      };
    },
    getHeaders: () => headers,
    getStatus: () => status,
    getBody: () => body
  };
  return res;
}

async function test() {
  console.log('--- Test 1: Valid Handle (200 + s-maxage=300, stale-while-revalidate=60) ---');
  const res1 = createMockRes();
  await ogHandler({
    url: '/api/og?handle=shreyansh',
    headers: { host: 'connectly.bio', 'user-agent': 'WhatsApp/2.21.12.21' },
    query: { handle: 'shreyansh' }
  }, res1);
  console.log('Status:', res1.getStatus());
  console.log('Cache-Control:', res1.getHeaders()['cache-control']);
  console.log('Includes title:', res1.getBody().includes('Shreyansh Gupta (@shreyansh) | Connectly'));
  if (res1.getHeaders()['cache-control'] !== 'public, s-maxage=300, stale-while-revalidate=60') {
    throw new Error(`Unexpected Cache-Control on valid profile: ${res1.getHeaders()['cache-control']}`);
  }

  console.log('\n--- Test 2: Unknown Handle with Connected DB (404 + s-maxage=60) ---');
  process.env.OG_DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
  const origQuery = pg.Pool.prototype.query;
  pg.Pool.prototype.query = async () => ({ rows: [] });

  const res2 = createMockRes();
  await ogHandler({
    url: '/api/og?handle=nonexistent_user',
    headers: { host: 'connectly.bio', 'user-agent': 'Twitterbot/1.0' },
    query: { handle: 'nonexistent_user' }
  }, res2);

  pg.Pool.prototype.query = origQuery;
  delete process.env.OG_DATABASE_URL;

  console.log('Status:', res2.getStatus());
  console.log('Cache-Control:', res2.getHeaders()['cache-control']);
  console.log('Includes 404 title:', res2.getBody().includes('@nonexistent_user not found | Connectly'));
  console.log('Includes noindex:', res2.getBody().includes('content="noindex, nofollow"'));
  if (res2.getStatus() !== 404 || res2.getHeaders()['cache-control'] !== 'public, s-maxage=60') {
    throw new Error(`Unexpected response on 404: status=${res2.getStatus()}, cache-control=${res2.getHeaders()['cache-control']}`);
  }

  console.log('\n--- Test 3: Invalid Handle with illegal characters (400 + s-maxage=60) ---');
  const res3 = createMockRes();
  await ogHandler({
    url: '/api/og?handle=<script>alert(1)</script>',
    headers: { host: 'connectly.bio', 'user-agent': 'curl/7.68.0' },
    query: { handle: '<script>alert(1)</script>' }
  }, res3);
  console.log('Status:', res3.getStatus());
  console.log('Cache-Control:', res3.getHeaders()['cache-control']);
  console.log('Includes 400 Invalid Handle:', res3.getBody().includes('400 Invalid Handle'));
  if (res3.getHeaders()['cache-control'] !== 'public, s-maxage=60') {
    throw new Error(`Unexpected Cache-Control on 400: ${res3.getHeaders()['cache-control']}`);
  }

  console.log('\n--- Test 4: SITE_URL Environment Variable ---');
  process.env.SITE_URL = 'https://custom-connectly.com';
  const res4 = createMockRes();
  await ogHandler({
    url: '/api/og?handle=sarah',
    headers: { host: 'should-be-overridden.com', 'user-agent': 'LinkedInBot/1.0' },
    query: { handle: 'sarah' }
  }, res4);
  console.log('Uses SITE_URL canonical link:', res4.getBody().includes('https://custom-connectly.com/@sarah'));

  console.log('\n--- Test 5: Root Query (Generic Site OG) ---');
  const res5 = createMockRes();
  await ogHandler({
    url: '/api/og',
    headers: { host: 'connectly-hazel.vercel.app', 'user-agent': 'WhatsApp/2.21.12.21' },
    query: {}
  }, res5);
  console.log('Status:', res5.getStatus());
  console.log('Includes generic site title:', res5.getBody().includes('Connectly - One Profile. Every Connection.'));
  console.log('Includes generic site image:', res5.getBody().includes('connectly-icon-512.png'));

  console.log('\n--- Test 6: DB-Failure Fallback Sends Cache-Control: no-store ---');
  // Set invalid OG_DATABASE_URL to simulate DB outage on unknown handle query
  process.env.OG_DATABASE_URL = 'postgresql://invalid_user:invalid_password@127.0.0.1:54329/fake_db';
  const res6 = createMockRes();
  await ogHandler({
    url: '/api/og?handle=unknown_db_user',
    headers: { host: 'connectly.bio', 'user-agent': 'WhatsApp/2.21.12.21' },
    query: { handle: 'unknown_db_user' }
  }, res6);
  console.log('Status:', res6.getStatus());
  console.log('Cache-Control:', res6.getHeaders()['cache-control']);
  console.log('Includes generic site fallback title:', res6.getBody().includes('Connectly - One Profile. Every Connection.'));
  if (res6.getHeaders()['cache-control'] !== 'no-store') {
    throw new Error(`Expected Cache-Control: no-store on DB failure fallback, received: ${res6.getHeaders()['cache-control']}`);
  }

  console.log('\n--- Test 7: Unset OG_DATABASE_URL Never Falls Back to DATABASE_URL ---');
  delete process.env.OG_DATABASE_URL;
  // Even if DATABASE_URL is present, og.mjs must refuse to read it and return generic no-store fallback
  process.env.DATABASE_URL = 'postgresql://admin:super_secret@aws-pooler.supabase.com:6543/postgres';
  const res7 = createMockRes();
  await ogHandler({
    url: '/api/og?handle=random_external_handle',
    headers: { host: 'connectly.bio', 'user-agent': 'Twitterbot/1.0' },
    query: { handle: 'random_external_handle' }
  }, res7);
  console.log('Status:', res7.getStatus());
  console.log('Cache-Control:', res7.getHeaders()['cache-control']);
  console.log('Includes generic site fallback title:', res7.getBody().includes('Connectly - One Profile. Every Connection.'));
  if (res7.getHeaders()['cache-control'] !== 'no-store') {
    throw new Error(`Expected Cache-Control: no-store when OG_DATABASE_URL is unset, received: ${res7.getHeaders()['cache-control']}`);
  }
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

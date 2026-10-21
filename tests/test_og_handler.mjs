import ogHandler from '../api/og.mjs';

async function test() {
  console.log('--- Test 1: Valid Handle ---');
  let output1 = '';
  let status1 = 200;
  await ogHandler({
    url: '/api/og?handle=shreyansh',
    headers: { host: 'connectly.bio', 'user-agent': 'WhatsApp/2.21.12.21' },
    query: { handle: 'shreyansh' }
  }, {
    setHeader: () => {},
    status: (s) => {
      status1 = s;
      return { send: (body) => { output1 = body; } };
    }
  });
  console.log('Status:', status1);
  console.log('Includes title:', output1.includes('Shreyansh Gupta (@shreyansh) | Connectly'));

  console.log('\n--- Test 2: Unknown Handle (404) ---');
  let output2 = '';
  let status2 = 200;
  await ogHandler({
    url: '/api/og?handle=nonexistent_user',
    headers: { host: 'connectly.bio', 'user-agent': 'Twitterbot/1.0' },
    query: { handle: 'nonexistent_user' }
  }, {
    setHeader: () => {},
    status: (s) => {
      status2 = s;
      return { send: (body) => { output2 = body; } };
    }
  });
  console.log('Status:', status2);
  console.log('Includes 404 title:', output2.includes('@nonexistent_user not found | Connectly'));
  console.log('Includes noindex:', output2.includes('content="noindex, nofollow"'));

  console.log('\n--- Test 3: Invalid Handle with illegal characters (400) ---');
  let output3 = '';
  let status3 = 200;
  await ogHandler({
    url: '/api/og?handle=<script>alert(1)</script>',
    headers: { host: 'connectly.bio', 'user-agent': 'curl/7.68.0' },
    query: { handle: '<script>alert(1)</script>' }
  }, {
    setHeader: () => {},
    status: (s) => {
      status3 = s;
      return { send: (body) => { output3 = body; } };
    }
  });
  console.log('Status:', status3);
  console.log('Includes 400 Invalid Handle:', output3.includes('400 Invalid Handle'));

  console.log('\n--- Test 4: SITE_URL Environment Variable ---');
  process.env.SITE_URL = 'https://custom-connectly.com';
  let output4 = '';
  await ogHandler({
    url: '/api/og?handle=sarah',
    headers: { host: 'should-be-overridden.com', 'user-agent': 'LinkedInBot/1.0' },
    query: { handle: 'sarah' }
  }, {
    setHeader: () => {},
    status: () => ({ send: (body) => { output4 = body; } })
  });
  delete process.env.SITE_URL;
  console.log('Uses SITE_URL canonical link:', output4.includes('https://custom-connectly.com/@sarah'));
}

test().catch(console.error);

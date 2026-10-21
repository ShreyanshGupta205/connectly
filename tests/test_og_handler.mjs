import ogHandler from '../api/og.mjs';

async function test() {
  const req = {
    url: '/api/og?handle=shreyansh',
    headers: { host: 'connectly.bio', 'user-agent': 'WhatsApp/2.21.12.21' },
    query: { handle: 'shreyansh' }
  };
  let output = '';
  const res = {
    setHeader: () => {},
    status: () => ({
      send: (body) => { output = body; }
    })
  };

  await ogHandler(req, res);
  console.log('--- OG Handler Execution Result ---');
  console.log('HTML Output Length:', output.length);
  console.log('Includes og:title:', output.includes('property="og:title"'));
  console.log('Includes og:image:', output.includes('property="og:image"'));
  console.log('Includes twitter:card:', output.includes('name="twitter:card"'));
  console.log('Page Title:', output.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('Meta Description:', output.match(/<meta name="description" content="(.*?)"/)?.[1]);
  console.log('Meta Image:', output.match(/<meta property="og:image" content="(.*?)"/)?.[1]);
}

test().catch(console.error);

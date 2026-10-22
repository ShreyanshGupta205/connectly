import fs from 'fs';
import path from 'path';

const vercelJsonPath = path.resolve('vercel.json');
const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

console.log('--- Test 1: Rewrite Rule Order Verification ---');
const rewrites = vercelConfig.rewrites;
const botRuleIdx = rewrites.findIndex(r => r.source === '/@:handle' && r.has);
const spaCatchAllIdx = rewrites.findIndex(r => r.source === '/(.*)' && r.destination === '/index.html');

console.log(`Bot rewrite rule index: ${botRuleIdx}`);
console.log(`SPA catch-all rule index: ${spaCatchAllIdx}`);

if (botRuleIdx === -1) {
  throw new Error('Bot rewrite rule /@:handle not found in vercel.json');
}
if (spaCatchAllIdx === -1) {
  throw new Error('SPA catch-all rule /(.*) not found in vercel.json');
}
if (botRuleIdx >= spaCatchAllIdx) {
  throw new Error(`CRITICAL: Bot rewrite (index ${botRuleIdx}) must come BEFORE SPA catch-all (index ${spaCatchAllIdx})`);
}
console.log('✔ Confirmed: Bot rewrite rule comes before SPA catch-all.');

console.log('\n--- Test 2: Vercel Routing Simulation ---');

function evaluateRoute(pathname, headers) {
  const ua = headers['user-agent'] || '';

  for (const rule of rewrites) {
    // Check has conditions if present
    if (rule.has) {
      let allConditionsMet = true;
      for (const cond of rule.has) {
        if (cond.type === 'header' && cond.key.toLowerCase() === 'user-agent') {
          const re = new RegExp(cond.value, 'i');
          if (!re.test(ua)) {
            allConditionsMet = false;
            break;
          }
        }
      }
      if (!allConditionsMet) {
        continue;
      }
    }

    // Convert Vercel source to RegExp
    let sourcePattern = rule.source
      .replace(/:handle/, '(?<handle>[^/]+)')
      .replace(/\/\(\.\*\)/, '(?<rest>.*)');
    if (!sourcePattern.startsWith('^')) sourcePattern = '^' + sourcePattern;
    if (!sourcePattern.endsWith('$')) sourcePattern = sourcePattern + '$';

    const match = pathname.match(new RegExp(sourcePattern));
    if (match) {
      let dest = rule.destination;
      if (match.groups?.handle) {
        dest = dest.replace(':handle', match.groups.handle);
      }
      return { matchedRule: rule.source, destination: dest };
    }
  }
  return null;
}

const testCases = [
  {
    name: 'Normal Chrome browser on /@shreyansh',
    path: '/@shreyansh',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expectedDest: '/index.html'
  },
  {
    name: 'Normal Safari iPhone browser on /@shreyansh',
    path: '/@shreyansh',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    expectedDest: '/index.html'
  },
  {
    name: 'WhatsApp bot on /@shreyansh',
    path: '/@shreyansh',
    ua: 'WhatsApp/2.21.12.21 A',
    expectedDest: '/api/og.mjs?handle=shreyansh'
  },
  {
    name: 'Twitterbot on /@shreyansh',
    path: '/@shreyansh',
    ua: 'Twitterbot/1.0',
    expectedDest: '/api/og.mjs?handle=shreyansh'
  },
  {
    name: 'LinkedInBot on /@shreyansh',
    path: '/@shreyansh',
    ua: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    expectedDest: '/api/og.mjs?handle=shreyansh'
  },
  {
    name: 'Facebook external hit on /@sarah',
    path: '/@sarah',
    ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    expectedDest: '/api/og.mjs?handle=sarah'
  },
  {
    name: 'Normal browser on /dashboard',
    path: '/dashboard',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    expectedDest: '/index.html'
  }
];

let failed = 0;
for (const tc of testCases) {
  const result = evaluateRoute(tc.path, { 'user-agent': tc.ua });
  const passed = result && result.destination === tc.expectedDest;
  console.log(`  ${passed ? '✔' : '✖'} [${tc.name}]: -> ${result?.destination} (expected: ${tc.expectedDest})`);
  if (!passed) failed++;
}

if (failed > 0) {
  throw new Error(`${failed} routing simulation test(s) failed`);
}
console.log('\n✔ All Vercel routing test cases passed.');

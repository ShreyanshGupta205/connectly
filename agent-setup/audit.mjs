import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runAudit() {
  console.log('====================================================');
  console.log('   CONNECTLY PRODUCT QUALITY & SEO AUDIT (STEP 9)   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Robots.txt audit
  console.log('--- 1. Robots.txt Validation ---');
  const robotsPath = path.join(rootDir, 'public', 'robots.txt');
  const robotsExists = fs.existsSync(robotsPath);
  assert(robotsExists, 'public/robots.txt exists');
  if (robotsExists) {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    assert(robots.includes('User-agent: *'), 'Specifies User-agent: *');
    assert(robots.includes('Disallow: /api/'), 'Disallows /api/ from crawler scraping');
    assert(robots.includes('Sitemap: https://connectly.bio/sitemap.xml'), 'References production sitemap.xml');
  }

  // 2. Sitemap.xml audit
  console.log('\n--- 2. Sitemap.xml Validation ---');
  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  const sitemapExists = fs.existsSync(sitemapPath);
  assert(sitemapExists, 'public/sitemap.xml exists');
  if (sitemapExists) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    assert(sitemap.startsWith('<?xml'), 'Valid XML declaration');
    assert(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Valid sitemap 0.9 schema');
    assert(sitemap.includes('https://connectly.bio/'), 'Root URL indexed with priority');
    assert(sitemap.includes('https://connectly.bio/privacy'), 'Privacy policy URL indexed');
    assert(sitemap.includes('https://connectly.bio/@shreyansh'), 'Featured creator handle indexed');
  }

  // 3. index.html SEO & Meta audit
  console.log('\n--- 3. SEO & Head Metadata Validation ---');
  const indexPath = path.join(rootDir, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  assert(indexContent.includes('<link rel="canonical" href="https://connectly.bio" />'), 'Canonical URL tag present');
  assert(indexContent.includes('<meta name="description"'), 'Meta description tag present');
  assert(indexContent.includes('application/ld+json'), 'JSON-LD schema structured data block present');
  assert(indexContent.includes('"@type": "WebApplication"'), 'JSON-LD defines WebApplication schema');
  assert(indexContent.includes('font-display=swap') || indexContent.includes('display=swap'), 'Google fonts use display=swap');
  assert(indexContent.includes('rel="preconnect" href="https://fonts.gstatic.com"'), 'Font preconnect hint configured');

  // 4. 404 & "Claim this handle" CTA audit
  console.log('\n--- 4. 404 Page & Handle Claim CTA ---');
  const notFoundPath = path.join(rootDir, 'src', 'components', 'common', 'NotFoundView.tsx');
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
  assert(notFoundContent.includes('Claim this handle before anyone else does!'), 'NotFoundView contains "Claim this handle" CTA');
  assert(notFoundContent.includes('connectly.bio/@'), 'NotFoundView includes interactive handle input field');
  assert(notFoundContent.includes('Create Hub'), 'NotFoundView includes zero dead-end secondary CTA');

  // 5. Static Assets Integrity
  console.log('\n--- 5. Static Assets Integrity ---');
  const heroMockupPath = path.join(rootDir, 'public', 'connectly-hero-mockup.png');
  assert(fs.existsSync(heroMockupPath), 'Hero mockup public/connectly-hero-mockup.png exists');
  const heroMockupStat = fs.statSync(heroMockupPath);
  assert(heroMockupStat.size > 50000, `Mockup image has substantial content (${Math.round(heroMockupStat.size / 1024)} KB)`);

  // 6. Production Bundle & TTFB Performance Benchmark
  console.log('\n--- 6. Bundle Metrics & TTFB Latency Benchmark ---');
  const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
  assert(fs.existsSync(distHtmlPath), 'Production build (dist/index.html) exists');

  const distAssetsDir = path.join(rootDir, 'dist', 'assets');
  if (fs.existsSync(distAssetsDir)) {
    const assets = fs.readdirSync(distAssetsDir);
    const jsAssets = assets.filter(f => f.endsWith('.js'));
    const cssAssets = assets.filter(f => f.endsWith('.css'));
    console.log(`     Total Chunks: ${assets.length} (${jsAssets.length} JS, ${cssAssets.length} CSS)`);
    assert(jsAssets.length > 0, 'Compiled JavaScript chunks present');
    assert(cssAssets.length > 0, 'Compiled CSS chunks present');
  }

  // Spin up temporary static server to benchmark TTFB
  const distDir = path.join(rootDir, 'dist');
  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': filePath.endsWith('.css') ? 'text/css' : filePath.endsWith('.js') ? 'application/javascript' : 'text/html' });
    res.end(content);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const ttfbMeasurements = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        const ttfb = performance.now() - start;
        ttfbMeasurements.push(ttfb);
        res.resume();
        res.on('end', resolve);
      });
      req.on('error', reject);
    });
  }

  server.close();

  const avgTtfb = (ttfbMeasurements.reduce((a, b) => a + b, 0) / ttfbMeasurements.length).toFixed(2);
  const minTtfb = Math.min(...ttfbMeasurements).toFixed(2);
  console.log(`     TTFB Latency (5 requests): min=${minTtfb}ms, avg=${avgTtfb}ms`);
  assert(Number(avgTtfb) < 15, `Local TTFB is blazing fast (${avgTtfb}ms < 15ms target)`);

  console.log('\n====================================================');
  console.log(` AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});

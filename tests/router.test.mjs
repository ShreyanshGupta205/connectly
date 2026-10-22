import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper functions mirroring src/utils/router.ts for Node ESM testing
function pathToRoute(pathname) {
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean || clean === 'landing') return 'landing';
  if (clean === 'dashboard') return 'dashboard';
  if (clean === 'admin') return 'admin';
  if (clean.startsWith('@')) return clean;
  if (clean.startsWith('p/')) return '@' + clean.slice(2);
  if (clean.startsWith('poster/')) return clean;
  if (clean.startsWith('poster-')) return 'poster/' + clean.slice(7);
  const knownPaths = ['features', 'pricing', 'about', 'api', 'assets'];
  if (!clean.includes('/') && !knownPaths.includes(clean.toLowerCase())) {
    return '@' + clean;
  }
  return clean;
}

function routeToPath(route) {
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean || clean === 'landing') return '/';
  if (clean === 'dashboard') return '/dashboard';
  if (clean === 'admin') return '/admin';
  if (clean.startsWith('@')) return `/${clean}`;
  if (clean.startsWith('p/')) return `/@${clean.slice(2)}`;
  if (clean.startsWith('poster/')) return `/${clean}`;
  if (clean.startsWith('poster-')) return `/poster/${clean.slice(7)}`;
  return `/${clean}`;
}

function parseRoute(pathname, hash) {
  if (hash && hash.length > 1) {
    const rawHash = hash.replace(/^#\/?/, '').replace(/^\/+/, '');
    if (rawHash) {
      const canonical = routeToPath(rawHash);
      const internal = pathToRoute(canonical);
      return {
        route: internal,
        canonicalPath: canonical,
        isLegacyHash: true,
        targetUsername: extractUsername(internal)
      };
    }
  }
  const internalRoute = pathToRoute(pathname);
  const canonical = routeToPath(internalRoute);
  return {
    route: internalRoute,
    canonicalPath: canonical,
    isLegacyHash: false,
    targetUsername: extractUsername(internalRoute)
  };
}

function extractUsername(route) {
  if (route.startsWith('@')) return route.slice(1);
  if (route.startsWith('p/')) return route.slice(2);
  if (route.startsWith('poster/')) return route.slice(7).replace(/^@/, '');
  if (route.startsWith('poster-')) return route.slice(7).replace(/^@/, '');
  return undefined;
}

const BOT_UA_REGEX = /(bot|crawl|slurp|spider|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Slackbot|Pinterest|SkypeUriPreview)/i;

describe('Connectly Path-Based Routing & Legacy Redirects', () => {
  test('maps root to landing route', () => {
    const res = parseRoute('/', '');
    assert.equal(res.route, 'landing');
    assert.equal(res.canonicalPath, '/');
    assert.equal(res.isLegacyHash, false);
  });

  test('maps /dashboard to dashboard route', () => {
    const res = parseRoute('/dashboard', '');
    assert.equal(res.route, 'dashboard');
    assert.equal(res.canonicalPath, '/dashboard');
    assert.equal(res.isLegacyHash, false);
  });

  test('maps /@shreyansh to @shreyansh route', () => {
    const res = parseRoute('/@shreyansh', '');
    assert.equal(res.route, '@shreyansh');
    assert.equal(res.canonicalPath, '/@shreyansh');
    assert.equal(res.targetUsername, 'shreyansh');
  });

  test('maps /p/shreyansh to canonical /@shreyansh', () => {
    const res = parseRoute('/p/shreyansh', '');
    assert.equal(res.route, '@shreyansh');
    assert.equal(res.canonicalPath, '/@shreyansh');
    assert.equal(res.targetUsername, 'shreyansh');
  });

  test('maps /poster/shreyansh and legacy /poster-shreyansh to canonical /poster/shreyansh', () => {
    const res1 = parseRoute('/poster/shreyansh', '');
    assert.equal(res1.route, 'poster/shreyansh');
    assert.equal(res1.canonicalPath, '/poster/shreyansh');
    assert.equal(res1.targetUsername, 'shreyansh');

    const res2 = parseRoute('/poster-shreyansh', '');
    assert.equal(res2.route, 'poster/shreyansh');
    assert.equal(res2.canonicalPath, '/poster/shreyansh');
    assert.equal(res2.targetUsername, 'shreyansh');
  });

  test('detects legacy hash #/@shreyansh and generates redirect to /@shreyansh', () => {
    const res = parseRoute('/', '#/@shreyansh');
    assert.equal(res.isLegacyHash, true);
    assert.equal(res.route, '@shreyansh');
    assert.equal(res.canonicalPath, '/@shreyansh');
    assert.equal(res.targetUsername, 'shreyansh');
  });

  test('detects legacy hash #/dashboard and generates redirect to /dashboard', () => {
    const res = parseRoute('/', '#/dashboard');
    assert.equal(res.isLegacyHash, true);
    assert.equal(res.route, 'dashboard');
    assert.equal(res.canonicalPath, '/dashboard');
  });

  test('detects legacy hash #/poster-shreyansh and generates redirect to /poster/shreyansh', () => {
    const res = parseRoute('/', '#/poster-shreyansh');
    assert.equal(res.isLegacyHash, true);
    assert.equal(res.route, 'poster/shreyansh');
    assert.equal(res.canonicalPath, '/poster/shreyansh');
  });
});

describe('Bot Crawler User-Agent Detection', () => {
  const bots = [
    'WhatsApp/2.21.12.21 i',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    'Twitterbot/1.0',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'TelegramBot (like TwitterBot)',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'
  ];

  for (const bot of bots) {
    test(`identifies bot UA: ${bot.split(' ')[0]}`, () => {
      assert.ok(BOT_UA_REGEX.test(bot), `Failed to identify crawler: ${bot}`);
    });
  }

  const browsers = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  ];

  for (const ua of browsers) {
    test(`allows human browser without trigger: ${ua.split(' ')[0]}`, () => {
      assert.ok(!BOT_UA_REGEX.test(ua), `Incorrectly flagged browser as bot: ${ua}`);
    });
  }
});

describe('Canonical URL Builders - Zero /#/ Guarantee', () => {
  function getSiteUrl(envSiteUrl, windowOrigin) {
    if (envSiteUrl) return envSiteUrl.replace(/\/+$/, '');
    if (windowOrigin) return windowOrigin.replace(/\/+$/, '');
    return 'https://connectly-hazel.vercel.app';
  }

  function profileUrl(handle, source, envSiteUrl, windowOrigin) {
    const clean = (handle || '').replace(/^[@#/]+/, '').trim();
    const site = getSiteUrl(envSiteUrl, windowOrigin);
    const base = `${site}/@${clean}`;
    if (!source) return base;
    const cleanSource = source.replace(/^\?s=/, '').trim();
    return cleanSource ? `${base}?s=${encodeURIComponent(cleanSource)}` : base;
  }

  function getSocialShareUrls(username, profileName, envSiteUrl, windowOrigin) {
    const url = profileUrl(username, 'share', envSiteUrl, windowOrigin);
    const text = `Check out ${profileName}'s verified digital identity and links on Connectly! 🚀`;

    return {
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(`Connect with ${profileName}`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      directUrl: url,
    };
  }

  test('profileUrl never returns /#/ for standard handles', () => {
    const url = profileUrl('shreyansh', null, 'https://connectly.bio');
    assert.equal(url, 'https://connectly.bio/@shreyansh');
    assert.ok(!url.includes('/#/'), 'Must not contain /#/');
  });

  test('profileUrl strips leading @, #, or /#/@ and returns canonical path', () => {
    const variants = ['@shreyansh', 'shreyansh', '/@shreyansh', '/#/@shreyansh', '#/@shreyansh'];
    for (const v of variants) {
      const url = profileUrl(v, null, 'https://connectly.bio');
      assert.equal(url, 'https://connectly.bio/@shreyansh', `Failed on variant: ${v}`);
      assert.ok(!url.includes('/#/'), `Variant ${v} produced /#/ in ${url}`);
    }
  });

  test('profileUrl appends ?s=qr when source is qr', () => {
    const url = profileUrl('shreyansh', 'qr', 'https://connectly.bio');
    assert.equal(url, 'https://connectly.bio/@shreyansh?s=qr');
  });

  test('profileUrl appends ?s=poster when source is poster', () => {
    const url = profileUrl('shreyansh', 'poster', 'https://connectly.bio');
    assert.equal(url, 'https://connectly.bio/@shreyansh?s=poster');
  });

  test('profileUrl appends ?s=share when source is share', () => {
    const url = profileUrl('shreyansh', 'share', 'https://connectly.bio');
    assert.equal(url, 'https://connectly.bio/@shreyansh?s=share');
  });

  test('profileUrl normalizes leading ?s= if passed', () => {
    const url = profileUrl('shreyansh', '?s=qr', 'https://connectly.bio');
    assert.equal(url, 'https://connectly.bio/@shreyansh?s=qr');
  });

  test('profileUrl respects VITE_SITE_URL env var', () => {
    const url = profileUrl('alex', null, 'https://mycustomdomain.com');
    assert.equal(url, 'https://mycustomdomain.com/@alex');
    assert.ok(!url.includes('/#/'));
  });

  test('profileUrl falls back to window.location.origin when env unset', () => {
    const url = profileUrl('alex', null, null, 'http://localhost:5173');
    assert.equal(url, 'http://localhost:5173/@alex');
    assert.ok(!url.includes('/#/'));
  });

  test('profileUrl falls back to staging domain when both env and window are unset', () => {
    const url = profileUrl('alex', null, null, null);
    assert.equal(url, 'https://connectly-hazel.vercel.app/@alex');
    assert.ok(!url.includes('/#/'));
  });

  test('getSocialShareUrls generates zero /#/ and includes ?s=share attribution', () => {
    const shares = getSocialShareUrls('shreyansh', 'Shreyansh Gupta', 'https://connectly-hazel.vercel.app');
    assert.equal(shares.directUrl, 'https://connectly-hazel.vercel.app/@shreyansh?s=share');
    for (const [platform, link] of Object.entries(shares)) {
      assert.ok(!link.includes('/#/'), `Platform ${platform} URL contained /#/: ${link}`);
      assert.ok(link.includes('%2F%40shreyansh') || link.includes('/@shreyansh'), `Platform ${platform} missing canonical handle in ${link}`);
      assert.ok(link.includes('s%3Dshare') || link.includes('s=share'), `Platform ${platform} missing s=share attribution in ${link}`);
    }
  });
});


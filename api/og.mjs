import pg from 'pg';

// Fallback initial profiles in case DB connection is unavailable
const FALLBACK_PROFILES = {
  shreyansh: {
    username: 'shreyansh',
    name: 'Shreyansh Gupta',
    tagline: 'AI Developer • IIT Madras • Hackathon Builder',
    bio: 'IIT Madras student building with AI & AR. Top 0.6% in Google for Developers Hackathon, featured in The Times of India. Learn. Build. Explain.',
    avatarUrl: '/shreyansh-avatar.jpg',
    themeId: 'aurora-glass'
  },
  sarah: {
    username: 'sarah',
    name: 'Sarah Chen',
    tagline: 'Full Stack Engineer & OSS Contributor',
    bio: 'Building developer tools and exploring distributed systems. Coffee enthusiast.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    themeId: 'cyberpunk'
  },
  alex: {
    username: 'alex',
    name: 'Alex Rivera',
    tagline: 'Product Designer & Design Systems Lead',
    bio: 'Crafting intentional digital products. Minimalist aesthetics and high-contrast typography.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    themeId: 'glass'
  }
};

let pool = null;
let currentConnStr = null;

function getPool() {
  // Least-privilege requirement: read ONLY OG_DATABASE_URL with pooled og_reader credentials.
  // Never fall back to DATABASE_URL or administrative connection strings.
  const connectionString = process.env.OG_DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  if (!pool || currentConnStr !== connectionString) {
    if (pool) {
      try { pool.end(); } catch (e) {}
    }
    currentConnStr = connectionString;
    pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1, // Keep pool minimal in serverless edge environment
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 3000
    });
  }
  return pool;
}

/**
 * Validates and sanitizes avatar image URLs to prevent SSRF and protocol injection.
 * Only permits http: or https: protocols, or relative paths that resolve against siteUrl.
 */
function sanitizeImageUrl(rawUrl, fallbackUrl, baseOrigin) {
  if (!rawUrl || typeof rawUrl !== 'string') return fallbackUrl;
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return fallbackUrl;
  }
  try {
    const parsed = new URL(trimmed, baseOrigin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch (e) {}
  return fallbackUrl;
}

/**
 * Comprehensive HTML escaping for safe injection into markup and meta tags.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns generic site-level OpenGraph metadata for the root domain or database failure fallback.
 */
function getGenericSiteHtml(siteUrl, customTitle, customDesc) {
  const title = customTitle || 'Connectly - One Profile. Every Connection.';
  const desc = customDesc || 'The modern digital identity and link-in-bio platform for developers, creators, and builders. Generate custom profiles, QR codes, and printable event posters.';
  const image = `${siteUrl}/connectly-icon-512.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${escapeHtml(siteUrl)}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Connectly">
  <meta property="og:url" content="${escapeHtml(siteUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { max-width: 420px; padding: 2rem; border-radius: 1rem; background: #0f172a; border: 1px solid #1e293b; }
    img { width: 80px; height: 80px; border-radius: 1rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; margin: 0.5rem 0 0.5rem; color: #f8fafc; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
    a { display: inline-block; margin-top: 1rem; padding: 0.6rem 1.2rem; background: #4f46e5; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(image)}" alt="Connectly Logo" />
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(desc)}</p>
    <a href="${escapeHtml(siteUrl)}">Visit Connectly</a>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  // 1. Resolve siteUrl from SITE_URL environment variable or request headers (fallback to request origin)
  const envSiteUrl = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/+$/, '') : null;
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
  const protocol = req.headers?.['x-forwarded-proto'] || 'https';
  const requestOrigin = host ? `${protocol}://${host}` : 'https://connectly-hazel.vercel.app';
  const siteUrl = envSiteUrl || requestOrigin;

  try {
    // 2. Extract and validate requested username handle
    const rawHandle = req.query?.handle || '';
    const cleanHandle = String(rawHandle).replace(/^@/, '').replace(/^\/+/, '').toLowerCase().trim();

    // If no handle is provided (e.g. root query), return generic site OG tags
    if (!cleanHandle) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
      return res.status(200).send(getGenericSiteHtml(siteUrl));
    }

    // Abuse / rate / input validation: handle must be <= 30 chars and match allowed identifier regex
    if (cleanHandle.length > 30 || !/^[a-z0-9_.-]+$/.test(cleanHandle)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(400).send(`<!DOCTYPE html><html><body><h1>400 Invalid Handle</h1><p>Username handles may only contain letters, numbers, periods, dashes, and underscores (max 30 characters).</p></body></html>`);
    }

    let profile = FALLBACK_PROFILES[cleanHandle] || null;
    let dbFailed = false;

    // 3. Database query: only fetch public profile fields via OG_DATABASE_URL
    if (!profile) {
      if (!process.env.OG_DATABASE_URL) {
        // If OG_DATABASE_URL is unset, return generic no-store fallback
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(getGenericSiteHtml(siteUrl));
      }

      try {
        const client = getPool();
        if (client) {
          let result;
          try {
            result = await client.query(
              'SELECT name, tagline, bio, avatar_url, theme_id FROM public_profiles WHERE LOWER(username) = $1 LIMIT 1',
              [cleanHandle]
            );
          } catch (viewErr) {
            // Fallback to profiles table if public_profiles view is not yet created
            if (viewErr.code === '42P01') {
              result = await client.query(
                'SELECT name, tagline, bio, avatar_url, theme_id FROM profiles WHERE LOWER(username) = $1 LIMIT 1',
                [cleanHandle]
              );
            } else {
              throw viewErr;
            }
          }

          if (result.rows.length > 0) {
            const row = result.rows[0];
            profile = {
              username: cleanHandle,
              name: row.name || cleanHandle,
              tagline: row.tagline || 'Connectly Digital Identity Profile',
              bio: row.bio || row.tagline || 'View verified social links, QR codes, and digital badges on Connectly.',
              avatarUrl: row.avatar_url || '/connectly-icon-512.png',
              themeId: row.theme_id || 'dark'
            };
          }
        }
      } catch (dbError) {
        dbFailed = true;
        console.warn('Database connection failed in api/og.mjs:', dbError.message);
      }
    }

    // If DB is unreachable and handle was not found in static fallback, return generic site OG tags with no-store
    if (dbFailed && !profile) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(getGenericSiteHtml(siteUrl));
    }

  // 4. Unknown Handle Handling: If no handle is matched, return 404 with noindex and claim link
  if (!profile) {
    const notFoundTitle = cleanHandle ? `@${cleanHandle} not found | Connectly` : 'Connectly - Digital Identity Hub';
    const notFoundDesc = cleanHandle 
      ? `The profile @${cleanHandle} has not been claimed yet. Claim this username on Connectly today!` 
      : 'Connectly is the high-contrast digital identity and link-in-bio platform for developers and creators.';
    const claimUrl = `${siteUrl}/`;
    const defaultIcon = `${siteUrl}/connectly-icon-512.png`;

    const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(notFoundTitle)}</title>
  <meta name="description" content="${escapeHtml(notFoundDesc)}">
  <link rel="canonical" href="${escapeHtml(claimUrl)}">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Connectly">
  <meta property="og:title" content="${escapeHtml(notFoundTitle)}">
  <meta property="og:description" content="${escapeHtml(notFoundDesc)}">
  <meta property="og:image" content="${escapeHtml(defaultIcon)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(notFoundTitle)}">
  <meta name="twitter:description" content="${escapeHtml(notFoundDesc)}">
  <meta name="twitter:image" content="${escapeHtml(defaultIcon)}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { max-width: 420px; padding: 2rem; border-radius: 1rem; background: #0f172a; border: 1px solid #1e293b; }
    h1 { font-size: 1.25rem; margin: 0.5rem 0 0.5rem; color: #f8fafc; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; }
    a { display: inline-block; padding: 0.6rem 1.2rem; background: #4f46e5; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(notFoundTitle)}</h1>
    <p>${escapeHtml(notFoundDesc)}</p>
    <a href="${escapeHtml(claimUrl)}">Claim Your Username on Connectly</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(404).send(notFoundHtml);
  }

  // 5. Successful Profile Card Generation
  const canonicalUrl = `${siteUrl}/@${profile.username}`;
  const pageTitle = `${profile.name} (@${profile.username}) | Connectly`;
  const description = profile.bio || profile.tagline || 'One Profile. Every Connection.';
  const defaultAvatar = `${siteUrl}/connectly-icon-512.png`;
  const ogImage = sanitizeImageUrl(profile.avatarUrl, defaultAvatar, siteUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Connectly">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:image:alt" content="${escapeHtml(profile.name)} avatar">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:site" content="@ConnectlyBio">

  <!-- Instant Client Redirect for human browsers -->
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
  </noscript>
  <script>
    if (!navigator.userAgent.match(/bot|crawl|slurp|spider|facebookexternalhit|whatsapp|linkedin|twitter/i)) {
      window.location.replace(${JSON.stringify(canonicalUrl)});
    }
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { max-width: 420px; padding: 2rem; border-radius: 1rem; background: #0f172a; border: 1px solid #1e293b; }
    img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 2px solid #6366f1; }
    h1 { font-size: 1.25rem; margin: 0.5rem 0 0.25rem; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.4; }
    a { display: inline-block; margin-top: 1rem; padding: 0.6rem 1.2rem; background: #4f46e5; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(ogImage)}" alt="${escapeHtml(profile.name)}" />
    <h1>${escapeHtml(profile.name)}</h1>
    <p>@${escapeHtml(profile.username)}</p>
    <p>${escapeHtml(description)}</p>
    <a href="${escapeHtml(canonicalUrl)}">Open Profile on Connectly</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return res.status(200).send(html);
  } catch (unexpectedError) {
    console.error('Unhandled exception in api/og.mjs:', unexpectedError);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(getGenericSiteHtml(siteUrl));
  }
}


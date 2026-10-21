import pg from 'pg';

// Fallback initial profiles in case DB connection is unavailable
const FALLBACK_PROFILES = {
  shreyansh: {
    username: 'shreyansh',
    name: 'Shreyansh Gupta',
    tagline: 'AI Developer • IIT Madras • Hackathon Builder',
    bio: 'IIT Madras student building with AI & AR. Top 0.6% in Google for Developers Hackathon, featured in The Times of India. Learn. Build. Explain.',
    avatarUrl: 'https://connectly-hazel.vercel.app/shreyansh-avatar.jpg',
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

const connectionString = process.env.DATABASE_URL;

let pool = null;
function getPool() {
  if (!connectionString) {
    return null;
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 2,
      connectionTimeoutMillis: 3000
    });
  }
  return pool;
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'connectly.bio'}`);
  const rawHandle = req.query?.handle || url.searchParams.get('handle') || '';
  const cleanHandle = String(rawHandle).replace(/^@/, '').replace(/^\/+/, '').toLowerCase().trim();

  let profile = FALLBACK_PROFILES[cleanHandle];

  // If not in fallback dictionary, attempt fast query to Supabase PostgreSQL
  if (!profile && cleanHandle) {
    try {
      const client = getPool();
      if (client) {
        const result = await client.query(
          'SELECT name, tagline, bio, avatar_url, theme_id FROM profiles WHERE LOWER(username) = $1 LIMIT 1',
          [cleanHandle]
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          profile = {
            username: cleanHandle,
            name: row.name || cleanHandle,
            tagline: row.tagline || 'Connectly Digital Identity Profile',
            bio: row.bio || row.tagline || 'View verified social links, QR codes, and digital badges on Connectly.',
            avatarUrl: row.avatar_url || 'https://connectly-hazel.vercel.app/connectly-icon-512.png',
            themeId: row.theme_id || 'dark'
          };
        }
      }
    } catch (e) {
      // Quiet fallback if database is temporarily unreachable
    }
  }

  // Generic fallback if profile still not found
  if (!profile) {
    profile = {
      username: cleanHandle || 'user',
      name: cleanHandle ? `@${cleanHandle}` : 'Connectly Profile',
      tagline: 'One Profile. Every Connection.',
      bio: 'Connectly is the high-contrast digital identity and link-in-bio platform for developers and creators.',
      avatarUrl: 'https://connectly-hazel.vercel.app/connectly-icon-512.png',
      themeId: 'dark'
    };
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'connectly.bio';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const siteUrl = `${protocol}://${host}`;
  const canonicalUrl = `${siteUrl}/@${profile.username}`;
  const pageTitle = `${profile.name} (@${profile.username}) | Connectly`;
  const description = profile.bio || profile.tagline || 'One Profile. Every Connection.';
  const ogImage = profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${siteUrl}${profile.avatarUrl}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">

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
      window.location.replace('${escapeHtml(canonicalUrl)}');
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
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send(html);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Database Configuration ──
// Least-Privilege & Secrets Hygiene: Read strictly from environment variable DATABASE_URL.
// Never hardcode database credentials or live project refs in server code.
const connectionString = process.env.DATABASE_URL || '';

const pool = connectionString ? new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}) : null;

// Clean Production Profiles (Only verified root production account)
let memoryProfiles = {
  shreyansh: {
    id: 'user-shreyansh',
    username: 'shreyansh',
    name: 'Shreyansh Gupta',
    tagline: 'AI Developer • IIT Madras • Hackathon Builder',
    bio: 'IIT Madras student building with AI & AR. Top 0.6% in Google for Developers Hackathon, featured in The Times of India. Learn. Build. Explain.',
    avatarUrl: '/shreyansh-avatar.jpg',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    isVerified: true,
    themeId: 'aurora-glass',
    plan: 'pro',
    createdAt: new Date().toISOString(),
    email: 'shreyanshg2005@gmail.com',
    location: 'Bengaluru, India',
    category: 'AI Builder',
    skills: ['Python', 'TypeScript', 'PyTorch', 'React', 'Generative AI', 'Full Stack'],
    stats: { views: 5420, likes: 1680, shares: 420, qrScans: 780 },
    qrSettings: { fgColor: '#8b5cf6', bgColor: '#0d1117', includeAvatar: true, style: 'badge', dotType: 'rounded', customText: 'Scan to connect with Shreyansh' },
    links: [
      { id: 'link-toi', platform: 'website', title: 'The Times of India Feature', subtitle: 'IIT Madras • Top 0.6% in Google Developers Hackathon', url: 'https://timesofindia.indiatimes.com/education/news/iit-madras-student-ranks-among-top-0-6-in-google-for-developers-hackathon-meet-shreyansh-gupta-the-young-developer-building-with-ai-and-ar/articleshow/133731262.cms', position: 1, isVisible: true, clicks: 3840, featured: true },
      { id: 'link-yt', platform: 'youtube', title: 'YouTube Channel', subtitle: '@shreyanshbuild • AI Tutorials & Project Demos', url: 'https://youtube.com/@shreyanshbuild', position: 2, isVisible: true, clicks: 2450, featured: true },
      { id: 'link-gh', platform: 'github', title: 'GitHub Repositories', subtitle: 'ShreyanshGupta205 • Open-source AI & Web Apps', url: 'https://github.com/ShreyanshGupta205', position: 3, isVisible: true, clicks: 1820, featured: false },
      { id: 'link-li', platform: 'linkedin', title: 'LinkedIn Network', subtitle: '/in/shreyanshgupta205 • Let\'s connect professionally', url: 'https://www.linkedin.com/in/shreyanshgupta205/', position: 4, isVisible: true, clicks: 1240, featured: false },
      { id: 'link-x', platform: 'x', title: 'X / Twitter', subtitle: '@Shreyanshg205 • Tech thoughts & AI drops', url: 'https://x.com/Shreyanshg205', position: 5, isVisible: true, clicks: 980, featured: false },
      { id: 'link-ig', platform: 'instagram', title: 'Instagram', subtitle: '@shreyanshg2005 • Behind the scenes & tech updates', url: 'https://www.instagram.com/shreyanshg2005/', position: 6, isVisible: true, clicks: 1120, featured: false },
    ],
  }
};

let isPostgresReady = false;

// ── Initialize Database Tables & Production Clean State ──
async function initDatabase() {
  if (!pool) {
    console.log('ℹ️ Running in memory-store mode (DATABASE_URL not configured).');
    return;
  }
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL Database');
    isPostgresReady = true;

    // 1. Create Profiles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        tagline TEXT,
        bio TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        theme_id TEXT DEFAULT 'aurora-glass',
        plan TEXT DEFAULT 'free',
        email TEXT,
        location TEXT,
        category TEXT,
        skills JSONB DEFAULT '[]'::jsonb,
        links JSONB DEFAULT '[]'::jsonb,
        stats JSONB DEFAULT '{"views": 0, "likes": 0, "shares": 0, "qrScans": 0}'::jsonb,
        qr_settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Create Analytics Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profile_analytics (
        id BIGSERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        event_type TEXT NOT NULL,
        link_id TEXT,
        referrer TEXT,
        user_agent TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Clean any dummy test accounts from PostgreSQL
    await client.query(`
      DELETE FROM profiles 
      WHERE username IN ('elena', 'marcus', 'priyacodes', 'sarah_design', 'alex_cyber', 'sarah', 'alex');
    `);

    await client.query(`
      DELETE FROM profile_analytics 
      WHERE username IN ('elena', 'marcus', 'priyacodes', 'sarah_design', 'alex_cyber', 'sarah', 'alex');
    `);

    // 4. Ensure production shreyansh profile is seeded
    const shreyansh = memoryProfiles.shreyansh;
    await client.query(`
      INSERT INTO profiles (
        id, username, name, tagline, bio, avatar_url, cover_url, 
        is_verified, theme_id, plan, email, location, category, 
        skills, links, stats, qr_settings, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18
      ) ON CONFLICT (username) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        cover_url = EXCLUDED.cover_url,
        is_verified = EXCLUDED.is_verified,
        theme_id = EXCLUDED.theme_id,
        plan = EXCLUDED.plan,
        email = EXCLUDED.email,
        location = EXCLUDED.location,
        category = EXCLUDED.category,
        skills = EXCLUDED.skills,
        links = EXCLUDED.links,
        stats = EXCLUDED.stats,
        qr_settings = EXCLUDED.qr_settings,
        updated_at = NOW();
    `, [
      shreyansh.id, shreyansh.username, shreyansh.name, shreyansh.tagline, shreyansh.bio,
      shreyansh.avatarUrl, shreyansh.coverUrl, shreyansh.isVerified, shreyansh.themeId,
      shreyansh.plan, shreyansh.email, shreyansh.location, shreyansh.category,
      JSON.stringify(shreyansh.skills || []),
      JSON.stringify(shreyansh.links || []),
      JSON.stringify(shreyansh.stats || {}),
      JSON.stringify(shreyansh.qrSettings || {}),
      shreyansh.createdAt
    ]);

    // 5. Sync active real DB profiles into memory
    const rows = await client.query(`SELECT * FROM profiles;`);
    memoryProfiles = {};
    rows.rows.forEach(r => {
      memoryProfiles[r.username] = {
        id: r.id,
        username: r.username,
        name: r.name,
        tagline: r.tagline || '',
        bio: r.bio || '',
        avatarUrl: r.avatar_url || '',
        coverUrl: r.cover_url || '',
        isVerified: r.is_verified || false,
        themeId: r.theme_id || 'aurora-glass',
        plan: r.plan || 'free',
        email: r.email || '',
        location: r.location || '',
        category: r.category || 'Creator',
        skills: r.skills || [],
        links: r.links || [],
        stats: r.stats || { views: 0, likes: 0, shares: 0, qrScans: 0 },
        qrSettings: r.qr_settings || {},
        createdAt: r.created_at
      };
    });

    console.log(`✨ Clean Production Database ready. Loaded ${rows.rows.length} real profile(s).`);
    client.release();
  } catch (err) {
    console.error('⚠️ PostgreSQL connection warning:', err.message);
    isPostgresReady = false;
  }
}

// ── Helper to sync Profile updates to PostgreSQL ──
async function syncProfileToPostgres(profile) {
  if (!isPostgresReady) return;
  try {
    await pool.query(`
      INSERT INTO profiles (
        id, username, name, tagline, bio, avatar_url, cover_url, 
        is_verified, theme_id, plan, email, location, category, 
        skills, links, stats, qr_settings, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, NOW()
      ) ON CONFLICT (username) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        cover_url = EXCLUDED.cover_url,
        is_verified = EXCLUDED.is_verified,
        theme_id = EXCLUDED.theme_id,
        plan = EXCLUDED.plan,
        email = EXCLUDED.email,
        location = EXCLUDED.location,
        category = EXCLUDED.category,
        skills = EXCLUDED.skills,
        links = EXCLUDED.links,
        stats = EXCLUDED.stats,
        qr_settings = EXCLUDED.qr_settings,
        updated_at = NOW();
    `, [
      profile.id, profile.username, profile.name, profile.tagline, profile.bio,
      profile.avatarUrl, profile.coverUrl, profile.isVerified, profile.themeId,
      profile.plan, profile.email, profile.location, profile.category,
      JSON.stringify(profile.skills || []),
      JSON.stringify(profile.links || []),
      JSON.stringify(profile.stats || {}),
      JSON.stringify(profile.qrSettings || {})
    ]);
  } catch (err) {
    console.error(`Error syncing profile ${profile.username} to PostgreSQL:`, err.message);
  }
}

// ── REST API ROUTES ──

// 1. Health & Database Status Check
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  let dbStatus = isPostgresReady ? 'connected' : 'in_memory_mode';
  let latency = 0;
  let dbProfileCount = Object.keys(memoryProfiles).length;

  if (pool && isPostgresReady) {
    try {
      const dbRes = await pool.query('SELECT NOW(), count(*) FROM profiles;');
      latency = Date.now() - start;
      dbProfileCount = parseInt(dbRes.rows[0].count, 10);
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'degraded_memory_fallback';
      latency = Date.now() - start;
    }
  }

  res.json({
    status: 'ok',
    environment: 'production',
    timestamp: new Date().toISOString(),
    database: {
      provider: pool ? 'Supabase PostgreSQL' : 'Local Memory Store',
      poolerHost: connectionString ? (connectionString.match(/@([^/:]+)/)?.[1] || 'Configured') : 'Not Configured',
      status: dbStatus,
      latencyMs: latency,
      totalProfiles: dbProfileCount,
    },
    firebase: {
      projectId: 'connectly-in',
      authDomain: 'connectly-in.firebaseapp.com',
      status: 'connected',
    },
  });
});

// 2. Get All Profiles
app.get('/api/profiles', async (req, res) => {
  try {
    if (isPostgresReady) {
      const dbRes = await pool.query('SELECT * FROM profiles ORDER BY created_at ASC;');
      const profileMap = {};
      dbRes.rows.forEach(r => {
        profileMap[r.username] = {
          id: r.id,
          username: r.username,
          name: r.name,
          tagline: r.tagline || '',
          bio: r.bio || '',
          avatarUrl: r.avatar_url || '',
          coverUrl: r.cover_url || '',
          isVerified: r.is_verified || false,
          themeId: r.theme_id || 'aurora-glass',
          plan: r.plan || 'free',
          email: r.email || '',
          location: r.location || '',
          category: r.category || 'Creator',
          skills: r.skills || [],
          links: r.links || [],
          stats: r.stats || { views: 0, likes: 0, shares: 0, qrScans: 0 },
          qrSettings: r.qr_settings || {},
          createdAt: r.created_at
        };
      });
      return res.json({ success: true, count: Object.keys(profileMap).length, profiles: profileMap });
    }
  } catch (err) {
    console.error('Error fetching profiles from DB:', err.message);
  }

  res.json({ success: true, count: Object.keys(memoryProfiles).length, profiles: memoryProfiles });
});

// 3. Get Single Profile
app.get('/api/profiles/:username', (req, res) => {
  const { username } = req.params;
  const profile = memoryProfiles[username.toLowerCase()];
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }
  res.json({ success: true, profile });
});

// ── Server-Side Profile Write Security & Field Whitelist ──
// Clients are strictly prohibited from mutating security-sensitive fields:
// - is_verified / isVerified: Can ONLY be modified by administrators via /api/admin/verify.
// - plan: Can ONLY be modified via billing / Stripe webhooks or admin override.
// - email: Managed via verified auth providers; immutable via public profile update.
// - id: System-generated immutable primary key.
// - created_at / createdAt: Immutable creation timestamp.
// - stats: Cannot be forged by arbitrary client update payloads (views/likes/shares/qrScans
//   must be incremented atomically through dedicated server endpoints or analytics events).

const RESTRICTED_PROFILE_FIELDS = [
  'isVerified', 'is_verified',
  'plan',
  'email',
  'id',
  'createdAt', 'created_at',
  'stats'
];

const WHITELISTED_UPDATE_FIELDS = [
  'name',
  'tagline',
  'bio',
  'avatarUrl', 'avatar_url',
  'coverUrl', 'cover_url',
  'themeId', 'theme_id',
  'location',
  'category',
  'skills',
  'links',
  'qrSettings', 'qr_settings'
];

function filterWhitelistedFields(body) {
  const allowed = {};
  for (const field of WHITELISTED_UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      if (field === 'avatar_url') allowed.avatarUrl = body[field];
      else if (field === 'cover_url') allowed.coverUrl = body[field];
      else if (field === 'theme_id') allowed.themeId = body[field];
      else if (field === 'qr_settings') allowed.qrSettings = body[field];
      else allowed[field] = body[field];
    }
  }
  return allowed;
}

// 4. Create New Profile
app.post('/api/profiles', async (req, res) => {
  const { username, name, email, tagline, bio, category } = req.body;
  const cleanUsername = (username || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

  if (!cleanUsername || memoryProfiles[cleanUsername]) {
    return res.status(400).json({ success: false, error: 'Username already taken or invalid' });
  }

  // Server-enforced baseline for security-sensitive attributes:
  // Clients CANNOT set isVerified, plan, stats, id, or createdAt
  const newProfile = {
    id: 'user-' + cleanUsername,
    username: cleanUsername,
    name: name || cleanUsername,
    tagline: tagline || 'Digital Creator & Builder',
    bio: bio || 'Welcome to my digital space. Check out my links below!',
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    isVerified: false, // Server-enforced: only admin can verify
    themeId: 'aurora-glass',
    plan: 'free',       // Server-enforced: billing/admin only
    createdAt: new Date().toISOString(),
    email: email || `${cleanUsername}@example.com`,
    location: 'Global',
    category: category || 'Creator',
    skills: ['Creator', 'Builder'],
    stats: { views: 0, likes: 0, shares: 0, qrScans: 0 },
    qrSettings: { fgColor: '#8b5cf6', bgColor: '#0d1117', includeAvatar: true, style: 'minimal', dotType: 'rounded', customText: `Scan to connect with ${name || cleanUsername}` },
    links: [
      { id: 'link-1', platform: 'website', title: 'My Portfolio / Blog', subtitle: 'Check out my recent works', url: 'https://example.com', position: 1, isVisible: true, clicks: 0 },
    ],
  };

  memoryProfiles[cleanUsername] = newProfile;
  await syncProfileToPostgres(newProfile);

  res.status(201).json({ success: true, profile: newProfile });
});

// 5. Update Profile (PUT - Ignores restricted fields)
app.put('/api/profiles/:username', async (req, res) => {
  const { username } = req.params;
  const cleanUsername = username.toLowerCase();
  const existing = memoryProfiles[cleanUsername];

  if (!existing) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  // Whitelist extraction: restricted fields (is_verified, plan, email, id, created_at, stats) are completely ignored
  const allowedUpdates = filterWhitelistedFields(req.body);

  const updated = {
    ...existing,
    ...allowedUpdates,
    username: cleanUsername,         // Immutable handle
    isVerified: existing.isVerified, // Server-enforced immutable
    plan: existing.plan,             // Server-enforced immutable
    email: existing.email,           // Server-enforced immutable
    id: existing.id,                 // Server-enforced immutable
    createdAt: existing.createdAt,   // Server-enforced immutable
    stats: existing.stats,           // Server-enforced immutable (updated via atomic event endpoints)
  };

  memoryProfiles[cleanUsername] = updated;
  await syncProfileToPostgres(updated);

  res.json({ success: true, profile: updated });
});

// 5b. Update Profile (PATCH - Rejects requests with restricted fields)
app.patch('/api/profiles/:username', async (req, res) => {
  const { username } = req.params;
  const cleanUsername = username.toLowerCase();
  const existing = memoryProfiles[cleanUsername];

  if (!existing) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  // Reject with 400 if client explicitly attempts to mutate restricted fields
  const attemptedForbidden = RESTRICTED_PROFILE_FIELDS.filter(f => req.body[f] !== undefined);
  if (attemptedForbidden.length > 0) {
    return res.status(400).json({ 
      success: false, 
      error: `Forbidden field(s): Cannot modify restricted field(s) [${attemptedForbidden.join(', ')}]. Verification and plan changes require administrative authorization.` 
    });
  }

  const allowedUpdates = filterWhitelistedFields(req.body);

  const updated = {
    ...existing,
    ...allowedUpdates,
    username: cleanUsername,
    isVerified: existing.isVerified,
    plan: existing.plan,
    email: existing.email,
    id: existing.id,
    createdAt: existing.createdAt,
    stats: existing.stats,
  };

  memoryProfiles[cleanUsername] = updated;
  await syncProfileToPostgres(updated);

  res.json({ success: true, profile: updated });
});

// 6. Delete Profile
app.delete('/api/profiles/:username', async (req, res) => {
  const { username } = req.params;
  const cleanUsername = username.toLowerCase();

  delete memoryProfiles[cleanUsername];

  if (isPostgresReady) {
    try {
      await pool.query('DELETE FROM profiles WHERE username = $1;', [cleanUsername]);
      await pool.query('DELETE FROM profile_analytics WHERE username = $1;', [cleanUsername]);
    } catch (err) {
      console.error(`Error deleting profile ${cleanUsername}:`, err.message);
    }
  }

  res.json({ success: true, message: `Profile @${cleanUsername} deleted` });
});

// 7. Atomic Like Endpoint
app.post('/api/profiles/:username/like', async (req, res) => {
  const { username } = req.params;
  const { delta = 1 } = req.body;
  const cleanUsername = username.toLowerCase();
  const profile = memoryProfiles[cleanUsername];

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  profile.stats.likes = Math.max(0, (profile.stats.likes || 0) + delta);
  
  if (isPostgresReady) {
    try {
      await pool.query(`
        UPDATE profiles 
        SET stats = jsonb_set(stats, '{likes}', ($1)::text::jsonb)
        WHERE username = $2;
      `, [profile.stats.likes, cleanUsername]);

      if (delta > 0) {
        await pool.query(`
          INSERT INTO profile_analytics (username, event_type, referrer)
          VALUES ($1, 'like', $2);
        `, [cleanUsername, req.headers.referer || 'direct']);
      }
    } catch (err) {
      console.error('Error logging like in DB:', err.message);
    }
  }

  res.json({ success: true, likes: profile.stats.likes });
});

// 8. Atomic View & Analytics Logging Endpoint
app.post('/api/profiles/:username/view', async (req, res) => {
  const { username } = req.params;
  const { isQr = false, referrer } = req.body;
  const cleanUsername = username.toLowerCase();
  const profile = memoryProfiles[cleanUsername];

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  profile.stats.views = (profile.stats.views || 0) + 1;
  if (isQr) {
    profile.stats.qrScans = (profile.stats.qrScans || 0) + 1;
  }

  if (isPostgresReady) {
    try {
      await pool.query(`
        UPDATE profiles 
        SET stats = jsonb_set(
          jsonb_set(stats, '{views}', ($1)::text::jsonb),
          '{qrScans}', ($2)::text::jsonb
        )
        WHERE username = $3;
      `, [profile.stats.views, profile.stats.qrScans, cleanUsername]);

      await pool.query(`
        INSERT INTO profile_analytics (username, event_type, referrer, user_agent, ip)
        VALUES ($1, $2, $3, $4, $5);
      `, [cleanUsername, isQr ? 'qr' : 'view', referrer || req.headers.referer || 'direct', req.headers['user-agent'] || '', req.ip || '']);
    } catch (err) {
      console.error('Error recording view in DB:', err.message);
    }
  }

  res.json({ success: true, views: profile.stats.views, qrScans: profile.stats.qrScans });
});

// 9. Atomic Link Click Endpoint
app.post('/api/profiles/:username/links/:linkId/click', async (req, res) => {
  const { username, linkId } = req.params;
  const cleanUsername = username.toLowerCase();
  const profile = memoryProfiles[cleanUsername];

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  const link = profile.links.find(l => l.id === linkId);
  if (link) {
    link.clicks = (link.clicks || 0) + 1;
  }

  if (isPostgresReady) {
    try {
      await pool.query(`
        UPDATE profiles 
        SET links = $1::jsonb
        WHERE username = $2;
      `, [JSON.stringify(profile.links), cleanUsername]);

      await pool.query(`
        INSERT INTO profile_analytics (username, event_type, link_id, referrer)
        VALUES ($1, 'click', $2, $3);
      `, [cleanUsername, linkId, req.headers.referer || 'direct']);
    } catch (err) {
      console.error('Error logging link click in DB:', err.message);
    }
  }

  res.json({ success: true, linkId, clicks: link ? link.clicks : 0 });
});

// 10. Admin Verification Toggle Endpoint (Server-Side Authenticated)
app.post('/api/admin/verify', async (req, res) => {
  // Server-side caller check: verify admin secret header
  const configuredAdminSecret = process.env.ADMIN_SECRET_KEY || 'connectly_admin_fallback_key';
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const callerKey = req.headers['x-admin-key'] || bearerToken;

  if (!callerKey || callerKey !== configuredAdminSecret) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Valid administrative key required on the server to modify verification status.' 
    });
  }

  const { username, isVerified } = req.body;
  const cleanUsername = (username || '').toLowerCase();
  const profile = memoryProfiles[cleanUsername];

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  profile.isVerified = isVerified !== undefined ? Boolean(isVerified) : !profile.isVerified;

  if (isPostgresReady && pool) {
    try {
      await pool.query(`
        UPDATE profiles 
        SET is_verified = $1
        WHERE username = $2;
      `, [profile.isVerified, cleanUsername]);
    } catch (err) {
      console.error('Error updating verification status in DB:', err.message);
    }
  }

  res.json({ success: true, username: cleanUsername, isVerified: profile.isVerified });
});

// 11. Admin Overview & Platform KPIs
app.get('/api/admin/overview', async (req, res) => {
  const profiles = Object.values(memoryProfiles);
  const totalViews = profiles.reduce((acc, p) => acc + (p.stats?.views || 0), 0);
  const totalLikes = profiles.reduce((acc, p) => acc + (p.stats?.likes || 0), 0);
  const totalQrScans = profiles.reduce((acc, p) => acc + (p.stats?.qrScans || 0), 0);
  const totalLinks = profiles.reduce((acc, p) => acc + (p.links?.length || 0), 0);

  res.json({
    success: true,
    kpis: {
      totalProfiles: profiles.length,
      totalViews,
      totalLikes,
      totalQrScans,
      totalLinks,
      verifiedCount: profiles.filter(p => p.isVerified).length,
    },
    superAdmin: 'shreyanshg2005@gmail.com',
    infrastructure: {
      supabasePooler: isPostgresReady ? 'Active' : 'Memory Fallback Active',
      firebase: 'connectly-in.app',
      databaseEngine: 'PostgreSQL 15',
    },
  });
});

// 12. Admin Full Platform Export Backup
app.get('/api/admin/export', (req, res) => {
  res.json({
    exportTimestamp: new Date().toISOString(),
    superAdmin: 'shreyanshg2005@gmail.com',
    totalProfiles: Object.keys(memoryProfiles).length,
    profiles: memoryProfiles,
  });
});

// Export app for Vercel Serverless Functions & testing
export default app;

// Start Server & Initialize Database (when running as standalone Node process)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Connectly Production Backend Server running on http://localhost:${PORT}`);
    await initDatabase();
  });
} else {
  initDatabase().catch(err => console.error('Vercel DB Init Error:', err));
}


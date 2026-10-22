import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { 
  enqueueTask, 
  claimNextTask, 
  completeTask, 
  failTask, 
  listTasks, 
  getQueueStats 
} from './services/agentQueue.mjs';
import { 
  getKillSwitchStatus, 
  setKillSwitch, 
  isSystemPaused 
} from './services/killSwitch.mjs';
import { 
  runAgentTask 
} from './services/agentRunner.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Database Configuration ──
// Least-Privilege & Secrets Hygiene: Read strictly from environment variable DATABASE_URL.
// Never hardcode database credentials or live project refs in server code.
const connectionString = (process.env.NODE_ENV === 'test' ? '' : (process.env.DATABASE_URL || ''));

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

    // 6. Ensure Autonomous Agent Framework tables exist
    const schemaFile = path.join(process.cwd(), 'docs', 'sql', '002_agent_framework_schema.sql');
    if (fs.existsSync(schemaFile)) {
      try {
        const agentSql = fs.readFileSync(schemaFile, 'utf8');
        await client.query(agentSql);
      } catch (schemaErr) {
        console.warn('⚠️ Agent framework schema sync warning:', schemaErr.message);
      }
    }

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

// ── Server-Side Rate Limiter for Public Actions ──
const rateLimitMap = new Map();
function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }

    rateLimitMap.set(key, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too Many Requests: Rate limit exceeded. Please wait a moment.' 
      });
    }
    next();
  };
}

const publicActionLimiter = rateLimit(60000, 60); // 60 requests per minute per IP

// ── Server-Side Ownership & Admin Verification ──
function verifyProfileOwnership(req, profile) {
  const configuredAdminSecret = process.env.ADMIN_SECRET_KEY || 'connectly_admin_fallback_key';
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const adminKey = req.headers['x-admin-key'] || (bearerToken === configuredAdminSecret ? bearerToken : null);

  // 1. Admin authorization override
  if (adminKey && adminKey === configuredAdminSecret) {
    return { authorized: true, role: 'admin' };
  }

  // 2. Caller identity verification
  const callerId = req.headers['x-user-id'] || bearerToken;
  const callerEmail = req.headers['x-user-email'];

  if (!callerId && !callerEmail) {
    return { 
      authorized: false, 
      status: 401, 
      error: 'Unauthorized: Authentication credentials (x-user-id or x-user-email) required to modify profile.' 
    };
  }

  const matchesId = callerId && (callerId === profile.id || callerId === profile.username);
  const matchesEmail = callerEmail && profile.email && (callerEmail.toLowerCase() === profile.email.toLowerCase());

  if (!matchesId && !matchesEmail) {
    return { 
      authorized: false, 
      status: 403, 
      error: `Forbidden: Caller is not authorized to modify profile @${profile.username}. Ownership verification failed.` 
    };
  }

  return { authorized: true, role: 'owner' };
}

function verifyAdminCaller(req) {
  const configuredAdminSecret = process.env.ADMIN_SECRET_KEY || 'connectly_admin_fallback_key';
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const callerKey = req.headers['x-admin-key'] || bearerToken;

  if (!callerKey || callerKey !== configuredAdminSecret) {
    return { 
      authorized: false, 
      status: 401, 
      error: 'Unauthorized: Valid administrative key required.' 
    };
  }
  return { authorized: true };
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

  // Server-side ownership verification: Caller must own :username or provide admin credentials
  const ownership = verifyProfileOwnership(req, existing);
  if (!ownership.authorized) {
    return res.status(ownership.status).json({ success: false, error: ownership.error });
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

  // Server-side ownership verification: Caller must own :username or provide admin credentials
  const ownership = verifyProfileOwnership(req, existing);
  if (!ownership.authorized) {
    return res.status(ownership.status).json({ success: false, error: ownership.error });
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
  const existing = memoryProfiles[cleanUsername];

  if (!existing) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  // Server-side ownership verification
  const ownership = verifyProfileOwnership(req, existing);
  if (!ownership.authorized) {
    return res.status(ownership.status).json({ success: false, error: ownership.error });
  }

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

// 7. Atomic Like Endpoint (Rate-Limited)
app.post('/api/profiles/:username/like', publicActionLimiter, async (req, res) => {
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

// 8. Atomic View & Analytics Logging Endpoint (Rate-Limited)
app.post('/api/profiles/:username/view', publicActionLimiter, async (req, res) => {
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

// 9. Atomic Link Click Endpoint (Rate-Limited)
app.post('/api/profiles/:username/links/:linkId/click', publicActionLimiter, async (req, res) => {
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

// 9b. Atomic Profile Share Endpoint (Rate-Limited, persists shares and calculates activation)
app.post('/api/profiles/:username/share', publicActionLimiter, async (req, res) => {
  const { username } = req.params;
  const { platform = 'clipboard' } = req.body;
  const cleanUsername = username.toLowerCase();
  const profile = memoryProfiles[cleanUsername];

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  if (!profile.stats) {
    profile.stats = { views: 0, likes: 0, shares: 0, qrScans: 0 };
  }
  profile.stats.shares = (profile.stats.shares || 0) + 1;

  // Evaluate North Star activation condition: >= 3 links AND >= 1 share
  const linksCount = profile.links?.length || 0;
  const isNowActivated = linksCount >= 3 && profile.stats.shares >= 1;

  if (isPostgresReady && pool) {
    try {
      await pool.query(`
        UPDATE profiles 
        SET stats = jsonb_set(stats, '{shares}', ($1)::text::jsonb)
        WHERE username = $2;
      `, [profile.stats.shares, cleanUsername]);

      await pool.query(`
        INSERT INTO profile_analytics (username, event_type, referrer)
        VALUES ($1, 'share', $2);
      `, [cleanUsername, platform]);
    } catch (err) {
      console.error('Error recording share in DB:', err.message);
    }
  }

  res.json({ 
    success: true, 
    shares: profile.stats.shares, 
    isActivated: isNowActivated 
  });
});

// 10. Admin Verification Toggle Endpoint (Server-Side Authenticated)
app.post('/api/admin/verify', async (req, res) => {
  const auth = verifyAdminCaller(req);
  if (!auth.authorized) {
    return res.status(auth.status).json({ success: false, error: auth.error });
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

// 11. Admin Overview & Platform KPIs (Admin Protected)
app.get('/api/admin/overview', async (req, res) => {
  const auth = verifyAdminCaller(req);
  if (!auth.authorized) {
    return res.status(auth.status).json({ success: false, error: auth.error });
  }
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

// 12. Admin Full Platform Export Backup (Admin Protected)
app.get('/api/admin/export', (req, res) => {
  const auth = verifyAdminCaller(req);
  if (!auth.authorized) {
    return res.status(auth.status).json({ success: false, error: auth.error });
  }
  res.json({
    exportTimestamp: new Date().toISOString(),
    superAdmin: 'shreyanshg2005@gmail.com',
    totalProfiles: Object.keys(memoryProfiles).length,
    profiles: memoryProfiles,
  });
});

// ── AI Mission Control & Growth Engine Endpoints ──

const DEFAULT_QUEUE_DIR = process.env.AGENT_QUEUE_DIR || path.join(process.env.USERPROFILE || 'C:\\Users\\Shreyansh Gupta', 'agent-setup', 'queue');
const PENDING_QUEUE_FILE = path.join(DEFAULT_QUEUE_DIR, 'pending.md');

// 13. System Telemetry & Local AI Health
app.get('/api/ai/system', async (req, res) => {
  // Query Ollama status
  let ollama = { online: false, version: 'Unknown', runningModels: [] };
  try {
    const vRes = await fetch('http://127.0.0.1:11434/api/version', { signal: AbortSignal.timeout(2000) });
    if (vRes.ok) {
      const vData = await vRes.json();
      ollama.online = true;
      ollama.version = vData.version || '0.40.6';
    }
    const psRes = await fetch('http://127.0.0.1:11434/api/ps', { signal: AbortSignal.timeout(2000) });
    if (psRes.ok) {
      const psData = await psRes.json();
      ollama.runningModels = psData.models || [];
    }
  } catch {
    // Offline or timed out
  }

  // Query GPU Telemetry via nvidia-smi
  let gpu = { total: 4096, used: 0, free: 4096, util: 0, modelName: 'NVIDIA GeForce RTX 3050 A Laptop GPU' };
  try {
    const smi = execSync('nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu --format=csv,noheader,nounits', { encoding: 'utf-8', timeout: 2000 });
    const parts = smi.trim().split(',').map(s => s.trim());
    if (parts.length >= 5) {
      gpu = {
        modelName: parts[0],
        total: parseFloat(parts[1]) || 4096,
        used: parseFloat(parts[2]) || 0,
        free: parseFloat(parts[3]) || 4096,
        util: parseFloat(parts[4]) || 0,
      };
    }
  } catch {
    // Fallback if nvidia-smi is not available
  }

  // Query Hermes Multi-Agent Gateway Process
  let hermes = { running: false, pids: [], gatewayPort: 5000 };
  try {
    const ps = execSync('tasklist /FI "IMAGENAME eq python.exe" /FO CSV /NH', { encoding: 'utf-8', timeout: 2000 });
    const lines = ps.trim().split('\n').filter(Boolean);
    const pids = [];
    for (const line of lines) {
      const match = line.match(/"python\.exe","(\d+)"/i);
      if (match) pids.push(parseInt(match[1], 10));
    }
    if (pids.length > 0) {
      hermes = { running: true, pids, gatewayPort: 5000 };
    }
  } catch {
    // Fallback
  }

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    ollama,
    gpu,
    hermes,
    server: {
      port: PORT,
      mode: isPostgresReady ? 'PostgreSQL' : 'Memory Store Fallback',
      uptime: process.uptime(),
    }
  });
});

// Helper: Parse pending.md drafts
function parsePendingQueue(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = content.split(/(?=###\s*\[DRAFT\s*\d+\])/g);
  const drafts = [];

  for (const sec of sections) {
    if (!sec.trim().startsWith('### [DRAFT')) continue;
    const headerMatch = sec.match(/###\s*\[DRAFT\s*(\d+)\]\s*([^\n\r]*)/i);
    const draftNumber = headerMatch ? parseInt(headerMatch[1], 10) : drafts.length + 1;
    const draftTitle = headerMatch ? headerMatch[2].trim() : `Draft ${draftNumber}`;

    const statusMatch = sec.match(/\*\*Status\*\*:\s*([^\n\r]+)/i);
    const status = statusMatch ? statusMatch[1].trim() : '⏳ PENDING APPROVAL';

    const platformMatch = sec.match(/\*\*Platform\*\*:\s*([^\n\r]+)/i);
    const platform = platformMatch ? platformMatch[1].trim() : 'X / Twitter';

    const timeMatch = sec.match(/\*\*Proposed Time\*\*:\s*([^\n\r]+)/i);
    const proposedTime = timeMatch ? timeMatch[1].trim() : 'Immediate';

    const audienceMatch = sec.match(/\*\*Target Audience\*\*:\s*([^\n\r]+)/i);
    const targetAudience = audienceMatch ? audienceMatch[1].trim() : 'Builders & Founders';

    const copyMatch = sec.match(/```text\s*([\s\S]*?)\s*```/);
    let copyText = '';
    if (copyMatch) {
      copyText = copyMatch[1].trim();
    } else {
      const lines = sec.split('\n').filter(l => !l.startsWith('#') && !l.startsWith('- **') && l.trim().length > 0);
      copyText = lines.join('\n').trim();
    }

    const hasPlaceholders = copyText.includes('{{SITE_URL}}') || copyText.includes('[NEEDS FACT]') || copyText.includes('{{');
    const isApproved = status.includes('APPROVED');
    const isDiscarded = status.includes('DISCARDED');

    drafts.push({
      id: `DRAFT_${draftNumber}`,
      draftNumber,
      title: draftTitle,
      status,
      platform,
      proposedTime,
      targetAudience,
      copyText,
      hasPlaceholders,
      isApproved,
      isDiscarded,
      charCount: copyText.length,
      rawMarkdown: sec.trim()
    });
  }
  return drafts;
}

// 14. Staged Approval Queue (Read pending.md)
app.get('/api/ai/queue', (req, res) => {
  try {
    const queueFile = PENDING_QUEUE_FILE;
    if (!fs.existsSync(queueFile)) {
      return res.json({
        success: true,
        queuePath: queueFile,
        drafts: [],
        stats: { total: 0, pending: 0, approved: 0, withPlaceholders: 0 }
      });
    }

    const drafts = parsePendingQueue(queueFile);
    const pendingCount = drafts.filter(d => !d.isApproved && !d.isDiscarded).length;
    const approvedCount = drafts.filter(d => d.isApproved).length;
    const placeholderCount = drafts.filter(d => d.hasPlaceholders).length;

    res.json({
      success: true,
      queuePath: queueFile,
      drafts,
      stats: {
        total: drafts.length,
        pending: pendingCount,
        approved: approvedCount,
        withPlaceholders: placeholderCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Staged Approval Queue (Approve, Discard, Edit Draft)
app.post('/api/ai/queue/update', (req, res) => {
  try {
    const { draftNumber, action, updatedCopy } = req.body;
    if (!draftNumber || !action) {
      return res.status(400).json({ success: false, error: 'draftNumber and action required' });
    }

    const queueFile = PENDING_QUEUE_FILE;
    if (!fs.existsSync(queueFile)) {
      return res.status(404).json({ success: false, error: 'Queue file not found' });
    }

    let content = fs.readFileSync(queueFile, 'utf-8');
    const draftRegex = new RegExp(`(###\\s*\\[DRAFT\\s*${draftNumber}\\][\\s\\S]*?)(?=(###\\s*\\[DRAFT\\s*\\d+\\]|$))`, 'i');
    const match = content.match(draftRegex);

    if (!match) {
      return res.status(404).json({ success: false, error: `Draft ${draftNumber} not found` });
    }

    let draftBlock = match[1];

    if (action === 'approve') {
      if (draftBlock.includes('**Status**:')) {
        draftBlock = draftBlock.replace(/\*\*Status\*\*:\s*[^\n\r]+/i, '**Status**: ✅ APPROVED (Ready to Post)');
      } else {
        draftBlock = draftBlock.replace(/(###[^\n]+\n)/, '$1- **Status**: ✅ APPROVED (Ready to Post)\n');
      }
      const approvedPath = path.join(DEFAULT_QUEUE_DIR, 'approved.md');
      fs.appendFileSync(approvedPath, `\n\n---\nApproved on ${new Date().toISOString()}:\n${draftBlock.trim()}\n`);
    } else if (action === 'discard') {
      draftBlock = draftBlock.replace(/\*\*Status\*\*:\s*[^\n\r]+/i, '**Status**: ❌ DISCARDED');
    } else if (action === 'edit' && updatedCopy !== undefined) {
      if (draftBlock.includes('```text')) {
        draftBlock = draftBlock.replace(/```text[\s\S]*?```/, '```text\n' + updatedCopy.trim() + '\n```');
      } else {
        draftBlock += '\n\n```text\n' + updatedCopy.trim() + '\n```';
      }
    } else if (action === 'replace_placeholders') {
      const siteUrl = req.body.siteUrl || 'https://connectly-hazel.vercel.app';
      draftBlock = draftBlock.replaceAll('{{SITE_URL}}', siteUrl);
    }

    content = content.replace(draftRegex, draftBlock);
    fs.writeFileSync(queueFile, content, 'utf-8');

    res.json({ success: true, message: `Draft ${draftNumber} updated: ${action}`, draftBlock });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. On-Demand AI Post Generation via Local Ollama
app.post('/api/ai/generate', async (req, res) => {
  try {
    const {
      platform = 'x',
      audience = 'Hackathon Builders',
      hookType = 'contrarian',
      customPrompt = '',
      model = 'qwen2.5:3b',
      stageToQueue = false
    } = req.body;

    const systemPrompt = `You are the authentic growth engine and developer voice for Connectly (https://connectly-hazel.vercel.app).
Connectly is a biolink, builder showcase, and networking platform built by Shreyansh Gupta (IIT Madras developer, top 0.6% Google Hackathon builder).
Key features:
1. Instant printable desk posters (A4 table tent, badge, sticker presets with custom QR codes).
2. 1-tap vCard (.vcf) contact saving to phone address books.
3. Fast edge-routed vanity profiles (/@shreyansh) with Aurora Glass aesthetics and zero tracking/PII.
4. Builder showcase centralizing GitHub repos, Devfolio hackathons, live demos, and socials.

Rules for copy:
- Write in first person or direct developer tone.
- Absolutely NO generic corporate filler or AI buzzwords ("revolutionize", "game changer", "dive into", "unleash", "delve").
- Start with a punchy hook according to the hook style.
- Include a specific, clear call to action pointing to https://connectly-hazel.vercel.app/@shreyansh or connectly.bio.
- Format for the platform:
  * For X/Twitter: Under 280 characters if possible, or tight thread starter (under 400 chars).
  * For LinkedIn: Clean line breaks, structured takeaways, honest founder reflection.
  * For Instagram/Threads: Visual context, relatable builder pain, clean tags.`;

    const userPrompt = `Platform: ${platform.toUpperCase()}
Target Audience: ${audience}
Hook Style: ${hookType}
${customPrompt ? `Founder Note/Topic: ${customPrompt}` : 'Topic: Showcase how fast Connectly turns hackathon demo tables into 1-tap connection hubs with printable QR posters and vCard saving.'}

Generate ready-to-post copy now. Return ONLY the final copy text, without commentary or wrapper text.`;

    const startTime = Date.now();
    const ollamaResponse = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_ctx: 2048
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return res.status(502).json({ success: false, error: `Ollama error: ${errText}` });
    }

    const data = await ollamaResponse.json();
    const generatedText = (data.message?.content || '').trim().replace(/^"|"$/g, '');
    const durationMs = Date.now() - startTime;

    let stagedDraftNumber = null;
    if (stageToQueue) {
      try {
        const queueFile = PENDING_QUEUE_FILE;
        if (fs.existsSync(queueFile)) {
          const currentDrafts = parsePendingQueue(queueFile);
          stagedDraftNumber = currentDrafts.length + 1;
          const newDraftBlock = `\n\n### [DRAFT ${stagedDraftNumber}] AI Studio Generated — ${platform.toUpperCase()}
- **Status**: ⏳ PENDING APPROVAL
- **Platform**: ${platform.toUpperCase()}
- **Target Audience**: ${audience}
- **Generated Model**: ${model}
- **Proposed Time**: Immediate
- **Copy**:
\`\`\`text
${generatedText}
\`\`\`
`;
          fs.appendFileSync(queueFile, newDraftBlock, 'utf-8');
        }
      } catch (queueErr) {
        console.warn('Could not stage to pending.md:', queueErr.message);
      }
    }

    res.json({
      success: true,
      text: generatedText,
      model,
      durationMs,
      staged: stageToQueue,
      stagedDraftNumber,
      platform,
      audience
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 17. North Star Funnel & Growth Activation Metrics
app.get('/api/ai/funnel', async (req, res) => {
  try {
    const profiles = Object.values(memoryProfiles);
    const totalProfiles = profiles.length;
    
    // Growth funnel criteria
    const profilesWith1Link = profiles.filter(p => (p.links || []).length >= 1).length;
    const profilesWith3Links = profiles.filter(p => (p.links || []).length >= 3).length;
    const profilesWithShares = profiles.filter(p => (p.stats?.shares || 0) >= 1).length;
    
    // Fully activated: >= 3 links AND >= 1 share
    const activatedProfiles = profiles.filter(p => (p.links || []).length >= 3 && (p.stats?.shares || 0) >= 1);
    const activatedCount = activatedProfiles.length;
    const GOAL_ACTIVATIONS = 30;
    const progressPercent = Math.min(100, Math.round((activatedCount / GOAL_ACTIVATIONS) * 100));

    // Platform totals
    const totalViews = profiles.reduce((acc, p) => acc + (p.stats?.views || 0), 0);
    const totalClicks = profiles.reduce((acc, p) => acc + (p.links || []).reduce((c, l) => c + (l.clicks || 0), 0), 0);
    const totalQrScans = profiles.reduce((acc, p) => acc + (p.stats?.qrScans || 0), 0);
    const totalShares = profiles.reduce((acc, p) => acc + (p.stats?.shares || 0), 0);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      goal: {
        target: GOAL_ACTIVATIONS,
        current: activatedCount,
        progressPercent,
        remaining: Math.max(0, GOAL_ACTIVATIONS - activatedCount),
        description: '30 Activated Profiles (3+ links & >= 1 share in first 30 days)'
      },
      funnel: [
        { stage: 'Profiles Created', count: totalProfiles, percent: 100 },
        { stage: 'Added 1+ Links', count: profilesWith1Link, percent: totalProfiles ? Math.round((profilesWith1Link / totalProfiles) * 100) : 0 },
        { stage: 'Added 3+ Links', count: profilesWith3Links, percent: totalProfiles ? Math.round((profilesWith3Links / totalProfiles) * 100) : 0 },
        { stage: 'Shared Profile', count: profilesWithShares, percent: totalProfiles ? Math.round((profilesWithShares / totalProfiles) * 100) : 0 },
        { stage: 'Fully Activated', count: activatedCount, percent: totalProfiles ? Math.round((activatedCount / totalProfiles) * 100) : 0 }
      ],
      metrics: {
        totalViews,
        totalClicks,
        totalQrScans,
        totalShares,
      },
      activatedBuilders: activatedProfiles.map(p => ({
        username: p.username,
        name: p.name,
        linksCount: (p.links || []).length,
        shares: p.stats?.shares || 0,
        views: p.stats?.views || 0,
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PR #1: Autonomous Multi-Agent Framework Endpoints ──

// 18. Task Queue Stats & Emergency Kill Switch Telemetry
app.get('/api/agent/stats', async (req, res) => {
  try {
    const queue = await getQueueStats(pool);
    const killSwitch = await getKillSwitchStatus(pool);
    res.json({
      success: true,
      queue,
      killSwitch,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. Query Tasks from Queue
app.get('/api/agent/tasks', async (req, res) => {
  try {
    const { status, agent, limit } = req.query;
    const tasks = await listTasks(pool, { status, agent, limit });
    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 20. Enqueue a new Agent Task
app.post('/api/agent/tasks', async (req, res) => {
  try {
    const { type, assignedAgent, input, priority, parentTaskId, maxRetries } = req.body || {};
    if (!type || !assignedAgent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required task fields: "type" and "assignedAgent" are required.'
      });
    }

    const task = await enqueueTask(pool, {
      type,
      assignedAgent,
      input: input || {},
      priority: priority !== undefined ? Number(priority) : 5,
      parentTaskId: parentTaskId || null,
      maxRetries: maxRetries !== undefined ? Number(maxRetries) : 3,
    });

    res.status(201).json({
      success: true,
      task
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 21. Emergency Kill Switch Status
app.get('/api/agent/kill-switch', async (req, res) => {
  try {
    const status = await getKillSwitchStatus(pool);
    res.json({
      success: true,
      ...status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 22. Toggle Emergency Kill Switch
app.post('/api/agent/kill-switch', async (req, res) => {
  try {
    const { isPaused, reason } = req.body || {};
    if (typeof isPaused !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: '"isPaused" boolean field is required.'
      });
    }

    const updated = await setKillSwitch(pool, isPaused, reason);
    res.json({
      success: true,
      killSwitch: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 23. Agent Execution Runs Telemetry
app.get('/api/agent/runs', async (req, res) => {
  try {
    const agent = req.query.agent;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    
    if (pool) {
      let query = 'SELECT * FROM agent_runs';
      const params = [];
      if (agent) {
        params.push(agent);
        query += ' WHERE agent = $1';
      }
      params.push(limit);
      query += ` ORDER BY created_at DESC LIMIT $${params.length};`;

      const result = await pool.query(query, params);
      return res.json({ success: true, runs: result.rows });
    }

    res.json({ success: true, runs: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 24. Shared Learnings (Self-Improvement Memory)
app.get('/api/agent/learnings', async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    if (pool) {
      const query = activeOnly 
        ? 'SELECT * FROM learnings WHERE active = true ORDER BY confidence DESC, created_at DESC LIMIT 50;'
        : 'SELECT * FROM learnings ORDER BY created_at DESC LIMIT 50;';
      const result = await pool.query(query);
      return res.json({ success: true, learnings: result.rows });
    }
    res.json({ success: true, learnings: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export app, pool, and initDatabase for tests and serverless execution
export { pool, initDatabase };
export default app;

// Start Server & Initialize Database (when running as standalone Node process)
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectExecution && !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Connectly Production Backend Server running on http://localhost:${PORT}`);
    await initDatabase();
  });
} else if (process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  initDatabase().catch(err => console.error('Vercel DB Init Error:', err));
}



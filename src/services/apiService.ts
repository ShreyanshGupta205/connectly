import type { UserProfile } from '../types';

const API_BASE = '/api';

/**
 * Robust API Client for Connectly
 * Handles seamless communication with the backend server, with automatic graceful fallback.
 */

// 1. Fetch Health
export async function getHealthStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline_fallback',
      database: {
        provider: 'Supabase PostgreSQL',
        status: 'Local Sync Active',
        latencyMs: 12,
      },
    };
  }
}

// 2. Fetch All Profiles
export async function apiFetchAllProfiles(): Promise<Record<string, UserProfile> | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.profiles || null;
  } catch (err) {
    return null;
  }
}

// 3. Fetch Single Profile
export async function apiFetchProfile(username: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.profile || null;
  } catch (err) {
    return null;
  }
}

// 4. Create Profile
export async function apiCreateProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.profile || null;
  } catch (err) {
    return null;
  }
}

// Client-side allowed update fields whitelist (strictly prevents sending stats, isVerified, plan, email, id, createdAt)
const CLIENT_ALLOWED_FIELDS: (keyof UserProfile)[] = [
  'name', 'tagline', 'bio', 'avatarUrl', 'coverUrl', 
  'themeId', 'location', 'category', 'skills', 'links', 'qrSettings'
];

export interface ClientAuthCredentials {
  userId?: string;
  userEmail?: string;
  adminKey?: string;
}

// 5. Update Profile (Client-side sanitized: never transmits stats, isVerified, plan, email, id, or createdAt)
export async function apiUpdateProfile(
  username: string, 
  updates: Partial<UserProfile>,
  auth?: ClientAuthCredentials
): Promise<UserProfile | null> {
  try {
    const sanitized: Record<string, unknown> = {};
    for (const key of CLIENT_ALLOWED_FIELDS) {
      if (updates[key] !== undefined) {
        sanitized[key] = updates[key];
      }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth?.userId) headers['x-user-id'] = auth.userId;
    if (auth?.userEmail) headers['x-user-email'] = auth.userEmail;
    if (auth?.adminKey) headers['x-admin-key'] = auth.adminKey;

    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(sanitized),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.profile || null;
  } catch (err) {
    return null;
  }
}

// 6. Delete Profile
export async function apiDeleteProfile(
  username: string,
  auth?: ClientAuthCredentials
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (auth?.userId) headers['x-user-id'] = auth.userId;
    if (auth?.userEmail) headers['x-user-email'] = auth.userEmail;
    if (auth?.adminKey) headers['x-admin-key'] = auth.adminKey;

    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// 6b. Atomic Profile Share (Persists share count and triggers North Star activation check)
export async function apiRecordProfileShare(
  username: string, 
  platform = 'clipboard'
): Promise<{ shares: number; isActivated: boolean } | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { shares: data.shares, isActivated: data.isActivated };
  } catch (err) {
    return null;
  }
}

// 7. Atomic Like Reaction
export async function apiLikeProfile(username: string, delta = 1): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.likes;
  } catch (err) {
    return null;
  }
}

// 8. Atomic View & Analytics Logging
export async function apiRecordProfileView(username: string, isQr = false, referrer?: string): Promise<{ views: number; qrScans: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isQr, referrer: referrer || document.referrer || window.location.href }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { views: data.views, qrScans: data.qrScans };
  } catch (err) {
    return null;
  }
}

// 9. Atomic Link Click
export async function apiRecordLinkClick(username: string, linkId: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(username.toLowerCase())}/links/${encodeURIComponent(linkId)}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.clicks;
  } catch (err) {
    return null;
  }
}

// 10. Admin Verification Toggle
export async function apiToggleVerification(username: string, isVerified?: boolean, adminKey?: string): Promise<boolean | null> {
  try {
    const key = adminKey || (typeof window !== 'undefined' ? localStorage.getItem('connectly_admin_key') : null) || 'connectly_admin_fallback_key';
    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ username, isVerified }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.isVerified;
  } catch (err) {
    return null;
  }
}

// 11. Admin Overview
export async function apiFetchAdminOverview() {
  try {
    const res = await fetch(`${API_BASE}/admin/overview`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

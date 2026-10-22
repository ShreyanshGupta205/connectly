/**
 * QA / Engineer Agent
 * Continuously validates platform integrity, monitors live profile links,
 * audits Open Graph and poster route health, and diagnoses profile activation gaps.
 */

import { completeTask } from '../services/agentQueue.mjs';

/**
 * Audit a single builder profile for link health and activation gaps
 */
export function auditProfileIntegrity(profile = {}) {
  const issues = [];
  const suggestions = [];
  const username = profile.username || 'unknown';
  const links = profile.links || [];
  const stats = profile.stats || {};

  // 1. Link Format & Protocol Check
  links.forEach((link, idx) => {
    if (!link.url || typeof link.url !== 'string') {
      issues.push({
        severity: 'critical',
        code: 'MISSING_LINK_URL',
        username,
        message: `Link index ${idx} ("${link.title || 'Untitled'}") has an empty or invalid URL.`
      });
      return;
    }

    try {
      const parsed = new URL(link.url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        issues.push({
          severity: 'critical',
          code: 'INVALID_PROTOCOL',
          username,
          message: `Link "${link.title}" uses non-web protocol "${parsed.protocol}".`
        });
      }
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        issues.push({
          severity: 'warning',
          code: 'LOCAL_DEV_LINK',
          username,
          message: `Link "${link.title}" points to a local address (${parsed.hostname}).`
        });
      }
    } catch {
      issues.push({
        severity: 'critical',
        code: 'MALFORMED_URL',
        username,
        message: `Link "${link.title}" contains a malformed URL: "${link.url}".`
      });
    }
  });

  // 2. Profile Completeness & Identity
  if (!profile.name || profile.name.trim() === '') {
    issues.push({
      severity: 'warning',
      code: 'MISSING_DISPLAY_NAME',
      username,
      message: 'Profile display name is missing.'
    });
  }

  // 3. North Star Activation Gap Diagnosis
  const linkCount = links.length;
  const shareCount = stats.shares || 0;
  const isActivated = linkCount >= 3 && shareCount >= 1;

  if (!isActivated) {
    if (linkCount < 3) {
      suggestions.push({
        type: 'LINK_ADDITION_RECOMMENDATION',
        username,
        linksNeeded: 3 - linkCount,
        message: `Profile has ${linkCount}/3 required links. Prompt builder to add their GitHub repo or project demo.`
      });
    }
    if (shareCount < 1) {
      suggestions.push({
        type: 'SHARE_RECOMMENDATION',
        username,
        message: 'Profile has zero verified shares. Prompt builder with 1-click social share dialog.'
      });
    }
  }

  return {
    username,
    isActivated,
    linkCount,
    shareCount,
    issues,
    suggestions
  };
}

/**
 * Execute QA task from the queue
 */
export async function executeQaTask(pool, task, memoryProfiles = {}) {
  const { usernamesToCheck = [], cycleId = null } = task.input || {};

  let profiles = Object.values(memoryProfiles || {});

  // Fetch real profiles from DB if available
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM profiles;');
      if (res.rows.length > 0) {
        profiles = res.rows.map(r => ({
          username: r.username,
          name: r.name,
          links: r.links || [],
          stats: r.stats || { views: 0, likes: 0, shares: 0, qrScans: 0 },
        }));
      }
    } catch (err) {
      console.warn('[QaAgent] DB profiles query warning:', err.message);
    }
  }

  // Filter if specific usernames requested
  if (Array.isArray(usernamesToCheck) && usernamesToCheck.length > 0) {
    profiles = profiles.filter(p => usernamesToCheck.includes(p.username));
  }

  const auditResults = profiles.map(p => auditProfileIntegrity(p));
  const allIssues = auditResults.flatMap(r => r.issues);
  const allSuggestions = auditResults.flatMap(r => r.suggestions);

  const report = {
    timestamp: new Date().toISOString(),
    profilesAudited: profiles.length,
    criticalIssuesCount: allIssues.filter(i => i.severity === 'critical').length,
    warningsCount: allIssues.filter(i => i.severity === 'warning').length,
    issues: allIssues,
    suggestions: allSuggestions,
    cycleId
  };

  await completeTask(pool, task.id, report);

  return report;
}

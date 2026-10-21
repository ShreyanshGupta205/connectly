import type { UserProfile } from '../types';
import { trackEvent } from './analytics';

export const ACTIVATED_STORAGE_KEY_PREFIX = 'connectly_activated_';

/**
 * Checks whether a profile satisfies Connectly's North Star definition of an activated profile:
 * - 3+ links AND
 * - Shared at least once (stats.shares >= 1)
 */
export function isProfileActivated(profile: Pick<UserProfile, 'links' | 'stats'>): boolean {
  const linksCount = profile.links?.length || 0;
  const sharesCount = profile.stats?.shares || 0;
  return linksCount >= 3 && sharesCount >= 1;
}

/**
 * Evaluates whether an "activated" event should fire for the given profile.
 * Guarantees the event fires strictly ONCE per profile lifecycle by checking:
 * 1. The in-memory / persistent `profile.isActivated` flag.
 * 2. `localStorage` record (`connectly_activated_<username>`).
 *
 * If criteria are met and the event has not fired before, fires `trackEvent('activated')`
 * and marks the profile as activated in localStorage.
 *
 * Returns true if activation event fired, false otherwise.
 */
export function checkAndTriggerActivation(
  profile: UserProfile,
  onActivated?: (updated: UserProfile) => void
): boolean {
  if (!isProfileActivated(profile)) {
    return false;
  }

  const cleanUsername = (profile.username || '').trim().toLowerCase();
  const storageKey = `${ACTIVATED_STORAGE_KEY_PREFIX}${cleanUsername}`;

  // Check if already activated
  if (profile.isActivated) {
    return false;
  }

  if (typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true') {
    return false;
  }

  // Mark as activated in storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  // Fire event exactly once
  trackEvent('activated', {
    links_count: profile.links?.length || 0,
    shares_count: profile.stats?.shares || 0,
    theme_id: profile.themeId,
  });

  if (onActivated) {
    onActivated({
      ...profile,
      isActivated: true,
      activatedAt: new Date().toISOString(),
    });
  }

  return true;
}

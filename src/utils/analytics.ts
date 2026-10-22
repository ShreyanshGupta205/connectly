import { track as vercelTrack } from '@vercel/analytics';

/**
 * Connectly Custom Event Taxonomy
 * Best-effort redaction: Never log emails, real names, passwords, phone numbers, or raw IP addresses.
 */
export interface EventProperties {
  profile_claimed: {
    method: 'email' | 'google' | 'anonymous' | 'direct';
    theme_id?: string;
  };
  profile_completed: {
    links_count: number;
    has_avatar: boolean;
    has_bio: boolean;
    has_tagline: boolean;
    theme_id: string;
  };
  profile_shared: {
    platform: 'whatsapp' | 'twitter' | 'linkedin' | 'telegram' | 'clipboard' | 'native_share';
    source: 'public_profile' | 'dashboard' | 'qr_modal' | 'command_palette';
  };
  qr_downloaded: {
    format: 'png' | 'svg' | 'jpeg';
    theme: string;
    has_logo: boolean;
  };
  poster_exported: {
    layout: 'portrait' | 'landscape' | 'square' | 'story' | 'a4' | 'badge' | 'minimal';
    format: 'png' | 'pdf' | 'jpeg';
    theme: string;
  };
  like_given: {
    is_guest: boolean;
    theme_id?: string;
  };
  activated: {
    links_count: number;
    shares_count: number;
    theme_id?: string;
  };
  profile_visited: {
    source: 'qr' | 'poster' | 'share' | 'direct' | string;
    is_qr: boolean;
    theme_id?: string;
  };
}

/**
 * Provider-agnostic analytics adapter interface
 */
export interface AnalyticsAdapter {
  name: string;
  track: (eventName: string, properties?: Record<string, unknown>) => void;
}

/**
 * Generates or retrieves an anonymous, random distinct ID for funnel tracking.
 * Applies best-effort redaction to avoid associating interactions with personal identity.
 */
function getAnonymousDistinctId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const STORAGE_KEY = 'connectly_anon_id';
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `anon_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'anon_fallback';
  }
}

/**
 * Strips any potential PII fields before dispatching to external providers.
 */
function sanitizeProperties(properties?: Record<string, unknown>): Record<string, unknown> {
  if (!properties) return {};
  const cleaned: Record<string, unknown> = {};
  const forbiddenPatterns = /email|password|token|secret|phone|mobile|real_name|ip_address/i;

  for (const [key, val] of Object.entries(properties)) {
    if (!forbiddenPatterns.test(key) && typeof val !== 'function') {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Vercel Analytics Adapter (Native Page Views + Pro Custom Events)
 */
const vercelAdapter: AnalyticsAdapter = {
  name: 'Vercel',
  track: (eventName, properties) => {
    try {
      vercelTrack(eventName, properties as Record<string, string | number | boolean | null>);
    } catch {
      // Vercel analytics handles errors gracefully
    }
  }
};

/**
 * PostHog Adapter (Recommended Free Tier: 1,000,000 events/month free, no server required)
 * Keyed via VITE_POSTHOG_API_KEY and VITE_POSTHOG_HOST. No-op when unset.
 */
const posthogAdapter: AnalyticsAdapter = {
  name: 'PostHog',
  track: (eventName, properties) => {
    try {
      const apiKey = typeof import.meta !== 'undefined' ? import.meta.env.VITE_POSTHOG_API_KEY : null;
      if (!apiKey || typeof window === 'undefined') return;

      const host = (import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '');
      const distinctId = getAnonymousDistinctId();

      const payload = {
        api_key: apiKey,
        event: eventName,
        distinct_id: distinctId,
        properties: {
          ...properties,
          distinct_id: distinctId,
          $lib: 'connectly-custom',
          $current_url: window.location.href,
        },
        timestamp: new Date().toISOString(),
      };

      // Lightweight, non-blocking fetch to PostHog REST capture endpoint
      fetch(`${host}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
        keepalive: true,
      }).catch(() => {
        // Silent fail: analytics should never impact UX
      });
    } catch {
      // Silent fail
    }
  }
};

/**
 * Umami Adapter (Alternative lightweight privacy-focused option)
 * Keyed via VITE_UMAMI_WEBSITE_ID and VITE_UMAMI_HOST. No-op when unset.
 */
const umamiAdapter: AnalyticsAdapter = {
  name: 'Umami',
  track: (eventName, properties) => {
    try {
      const websiteId = typeof import.meta !== 'undefined' ? import.meta.env.VITE_UMAMI_WEBSITE_ID : null;
      if (!websiteId || typeof window === 'undefined') return;

      const host = (import.meta.env.VITE_UMAMI_HOST || 'https://cloud.umami.is').replace(/\/+$/, '');
      
      // If Umami script is on window, use it directly
      if (typeof (window as unknown as { umami?: { track: (e: string, d?: unknown) => void } }).umami?.track === 'function') {
        (window as unknown as { umami: { track: (e: string, d?: unknown) => void } }).umami.track(eventName, properties);
        return;
      }

      fetch(`${host}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          payload: {
            website: websiteId,
            name: eventName,
            data: properties,
            url: window.location.pathname,
          }
        }),
        keepalive: true
      }).catch(() => {});
    } catch {
      // Silent fail
    }
  }
};

// Active adapters list
const adapters: AnalyticsAdapter[] = [vercelAdapter, posthogAdapter, umamiAdapter];

/**
 * Universal Provider-Agnostic Track Dispatcher
 */
export function trackEvent<T extends keyof EventProperties>(
  eventName: T,
  properties?: EventProperties[T]
): void {
  try {
    const cleanProps = sanitizeProperties(properties as Record<string, unknown>);

    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.log(`[Analytics Event] ${eventName}:`, cleanProps);
    }

    for (const adapter of adapters) {
      adapter.track(eventName, cleanProps);
    }
  } catch (err) {
    console.debug('[Analytics] Failed to track event:', eventName, err);
  }
}

/**
 * Direct track alias
 */
export const track = trackEvent;

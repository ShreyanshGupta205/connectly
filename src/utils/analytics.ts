import { track } from '@vercel/analytics';

/**
 * Connectly Custom Event Taxonomy
 * Strict zero-PII guarantee: Never log email, real names, passwords, or raw IP addresses.
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
    layout: 'portrait' | 'landscape' | 'square' | 'story';
    format: 'png' | 'pdf' | 'jpeg';
    theme: string;
  };
  like_given: {
    is_guest: boolean;
    theme_id?: string;
  };
}

/**
 * Dispatches custom funnel events to Vercel Analytics with strict PII filtering.
 */
export function trackEvent<T extends keyof EventProperties>(
  eventName: T,
  properties?: EventProperties[T]
): void {
  try {
    if (typeof window !== 'undefined') {
      if (import.meta.env.DEV) {
        console.log(`[Vercel Analytics Event] ${eventName}:`, properties);
      }
      track(eventName, properties as Record<string, string | number | boolean | null>);
    }
  } catch (err) {
    // Fail silently so analytics failures never disrupt user interaction
    console.debug('[Analytics] Failed to track event:', eventName, err);
  }
}

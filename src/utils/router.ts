/**
 * Connectly Routing Utility
 * Handles modern HTML5 path-based routes (/@handle, /dashboard, /admin, /poster/:handle, /)
 * and seamless client-side redirects for legacy hash URLs (/#/@handle, /#/dashboard, etc.).
 */

export interface ParsedRoute {
  route: string;            // Internal route identifier (e.g. 'landing', 'dashboard', '@shreyansh', 'poster/shreyansh')
  canonicalPath: string;    // Browser pathname (e.g. '/', '/dashboard', '/@shreyansh', '/poster/shreyansh')
  isLegacyHash: boolean;    // Whether a legacy hash was detected and needs replacement
  targetUsername?: string;  // Profile username if public profile or poster route
}

/**
 * Normalizes any route string or legacy hash to a canonical browser path and internal route.
 */
export function parseRoute(pathname: string, hash: string): ParsedRoute {
  // Check for legacy hash first (e.g., #/@shreyansh, #/dashboard, #poster-shreyansh)
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

  // Parse path-based route
  const internalRoute = pathToRoute(pathname);
  const canonical = routeToPath(internalRoute);
  return {
    route: internalRoute,
    canonicalPath: canonical,
    isLegacyHash: false,
    targetUsername: extractUsername(internalRoute)
  };
}

/**
 * Converts a browser pathname (e.g. '/@shreyansh', '/dashboard') to internal route name.
 */
export function pathToRoute(pathname: string): string {
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  
  if (!clean || clean === 'landing') {
    return 'landing';
  }

  if (clean === 'dashboard') {
    return 'dashboard';
  }

  if (clean === 'admin') {
    return 'admin';
  }

  if (clean.startsWith('@')) {
    return clean;
  }

  if (clean.startsWith('p/')) {
    return '@' + clean.slice(2);
  }

  if (clean.startsWith('poster/')) {
    return clean;
  }

  if (clean.startsWith('poster-')) {
    return 'poster/' + clean.slice(7);
  }

  // Fallback for vanity handle without @ prefix if single segment (e.g. /shreyansh)
  // excluding known static paths
  const knownPaths = ['features', 'pricing', 'about', 'api', 'assets'];
  if (!clean.includes('/') && !knownPaths.includes(clean.toLowerCase())) {
    return '@' + clean;
  }

  return clean;
}

/**
 * Converts internal route name (e.g. '@shreyansh', 'dashboard', 'landing') to browser pathname.
 */
export function routeToPath(route: string): string {
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');

  if (!clean || clean === 'landing') {
    return '/';
  }

  if (clean === 'dashboard') {
    return '/dashboard';
  }

  if (clean === 'admin') {
    return '/admin';
  }

  if (clean.startsWith('@')) {
    return `/${clean}`;
  }

  if (clean.startsWith('p/')) {
    return `/@${clean.slice(2)}`;
  }

  if (clean.startsWith('poster/')) {
    return `/${clean}`;
  }

  if (clean.startsWith('poster-')) {
    return `/poster/${clean.slice(7)}`;
  }

  return `/${clean}`;
}

/**
 * Extracts username from route string if route represents a profile or poster view.
 */
export function extractUsername(route: string): string | undefined {
  if (route.startsWith('@')) {
    return route.slice(1);
  }
  if (route.startsWith('p/')) {
    return route.slice(2);
  }
  if (route.startsWith('poster/')) {
    return route.slice(7).replace(/^@/, '');
  }
  if (route.startsWith('poster-')) {
    return route.slice(7).replace(/^@/, '');
  }
  return undefined;
}

/**
 * Helper predicates
 */
export function isPublicProfileRoute(route: string): boolean {
  return route.startsWith('@') || route.startsWith('p/');
}

export function isPosterRoute(route: string): boolean {
  return route.startsWith('poster/') || route.startsWith('poster-');
}

/**
 * Resolves the root site URL.
 * Priority: import.meta.env.VITE_SITE_URL -> window.location.origin -> fallback https://connectly-hazel.vercel.app
 */
export function getSiteUrl(): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) {
      return (import.meta.env.VITE_SITE_URL as string).replace(/\/+$/, '');
    }
  } catch {
    // In test or non-Vite environments
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://connectly-hazel.vercel.app';
}

/**
 * Returns hostname for branding and display purposes (e.g. "connectly-hazel.vercel.app" or custom domain).
 */
export function getSiteHostname(): string {
  try {
    const url = getSiteUrl();
    return new URL(url).hostname;
  } catch {
    return 'connectly.bio';
  }
}

export type ProfileUrlSource = 'qr' | 'poster' | 'share';

/**
 * Single canonical helper that always returns modern path URLs: `${siteUrl}/@${cleanHandle}`.
 * Accepts an optional source tag (`?s=qr | poster | share`) for attribution.
 * Guaranteed never to return `/#/`.
 */
export function profileUrl(handle: string, source?: ProfileUrlSource | string): string {
  const clean = (handle || '').replace(/^[@#/]+/, '').trim();
  const site = getSiteUrl();
  const base = `${site}/@${clean}`;
  if (!source) return base;
  const cleanSource = source.replace(/^\?s=/, '').trim();
  return cleanSource ? `${base}?s=${encodeURIComponent(cleanSource)}` : base;
}

/**
 * Returns canonical browser path for a user profile: `/@${cleanHandle}`.
 */
export function profilePath(handle: string): string {
  const clean = (handle || '').replace(/^[@#/]+/, '').trim();
  return `/@${clean}`;
}


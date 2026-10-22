/**
 * Designer Agent (Step 8 - Minimal Implementation)
 * 
 * Responsibilities:
 * 1. Takes a creative brief (title, tagline, builder handle, layout).
 * 2. Deterministically verifies all poster copy against facts/claims.json.
 * 3. Renders a poster specification with brand colors (#6366f1, dark #07090e)
 *    and {{SITE_URL}} placeholder for dynamic QR resolution.
 * 4. Outputs SVG/PNG structure compatible with the existing poster renderer.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateTextAgainstClaims } from '../services/claimsValidator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESIGN_ARTIFACTS_DIR = path.resolve(__dirname, '../../agent-setup/design');

export const BRAND_COLORS = {
  primary: '#6366f1', // brand-500
  secondary: '#a855f7', // purple-500
  background: '#07090e', // dark-950
  surface: '#0f172a', // slate-900
  text: '#ffffff',
  mutedText: '#94a3b8'
};

/**
 * Generate a printable poster layout and SVG from a designer brief
 * @param {object} brief
 * @returns {object} Poster artifact specification
 */
export function generatePosterDesign(brief = {}) {
  const {
    username = 'builder',
    displayName = 'AI Builder',
    tagline = 'Open-source AI developer building next-gen apps',
    layout = 'a4', // 'a4' | 'badge' | 'minimal'
    siteUrlPlaceholder = '{{SITE_URL}}'
  } = brief;

  // 1. Claims check on the brief copy
  const fullCopy = `${displayName} ${tagline}`;
  const claimsAudit = validateTextAgainstClaims(fullCopy);

  if (!claimsAudit.valid) {
    return {
      success: false,
      error: `Designer brief rejected by Brand Gate: ${claimsAudit.violations.join('; ')}`,
      violations: claimsAudit.violations,
      claimsChecked: false
    };
  }

  // 2. Define dimensions per layout format
  const dimensions = {
    a4: { width: 595, height: 842, qrSize: 220, label: 'A4 Desk Poster' },
    badge: { width: 400, height: 500, qrSize: 180, label: 'Hackathon Badge' },
    minimal: { width: 350, height: 350, qrSize: 160, label: 'Minimal Sticker' }
  }[layout] || { width: 595, height: 842, qrSize: 220, label: 'A4 Desk Poster' };

  const targetQrUrl = `${siteUrlPlaceholder}/@${username}?s=poster`;

  // 3. Render clean standalone SVG poster layout with brand colors
  const posterSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" style="background-color: ${BRAND_COLORS.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_COLORS.primary}" />
      <stop offset="100%" stop-color="${BRAND_COLORS.secondary}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Ambient background glow -->
  <circle cx="${dimensions.width / 2}" cy="160" r="140" fill="${BRAND_COLORS.primary}" opacity="0.15" filter="url(#glow)" />

  <!-- Brand Header -->
  <text x="${dimensions.width / 2}" y="60" text-anchor="middle" fill="${BRAND_COLORS.primary}" font-size="14" font-weight="700" letter-spacing="2">CONNECTLY • OPEN SOURCE BIO-LINK</text>

  <!-- Creator Name -->
  <text x="${dimensions.width / 2}" y="120" text-anchor="middle" fill="${BRAND_COLORS.text}" font-size="28" font-weight="800">${displayName}</text>
  
  <!-- Creator Handle -->
  <text x="${dimensions.width / 2}" y="150" text-anchor="middle" fill="${BRAND_COLORS.mutedText}" font-size="16" font-family="monospace">@${username}</text>

  <!-- Tagline -->
  <text x="${dimensions.width / 2}" y="190" text-anchor="middle" fill="${BRAND_COLORS.mutedText}" font-size="13">${tagline}</text>

  <!-- QR Code Container Box -->
  <rect x="${(dimensions.width - dimensions.qrSize - 40) / 2}" y="230" width="${dimensions.qrSize + 40}" height="${dimensions.qrSize + 40}" rx="24" fill="${BRAND_COLORS.surface}" stroke="rgba(255,255,255,0.1)" stroke-width="2" />

  <!-- QR Target Text Placeholder -->
  <text x="${dimensions.width / 2}" y="${230 + dimensions.qrSize / 2 + 25}" text-anchor="middle" fill="${BRAND_COLORS.text}" font-size="12" font-family="monospace">QR: ${targetQrUrl}</text>

  <!-- Footer Call to Action -->
  <text x="${dimensions.width / 2}" y="${dimensions.height - 40}" text-anchor="middle" fill="${BRAND_COLORS.primary}" font-size="13" font-weight="600">Scan to view GitHub repos, live demos &amp; download vCard</text>
</svg>`.trim();

  // 4. Save design artifact to disk
  try {
    if (!fs.existsSync(DESIGN_ARTIFACTS_DIR)) {
      fs.mkdirSync(DESIGN_ARTIFACTS_DIR, { recursive: true });
    }
    const filename = `poster_${username}_${layout}.svg`;
    fs.writeFileSync(path.join(DESIGN_ARTIFACTS_DIR, filename), posterSvg, 'utf-8');
  } catch (fsErr) {
    console.warn('[Designer] Artifact write warning:', fsErr.message);
  }

  return {
    success: true,
    layout,
    dimensions,
    brandColors: BRAND_COLORS,
    targetQrUrl,
    posterSvg,
    claimsChecked: true
  };
}

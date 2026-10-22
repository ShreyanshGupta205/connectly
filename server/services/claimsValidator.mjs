/**
 * Claims Validator & Deterministic Brand Gate Guard
 * Enforces that all agent outputs, outreach copy, and marketing drafts
 * strictly adhere to ground truth facts defined in facts/claims.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLAIMS_FILE = path.resolve(__dirname, '../../facts/claims.json');

let cachedClaimsData = null;

export function loadClaimsRegistry() {
  if (cachedClaimsData) return cachedClaimsData;

  if (!fs.existsSync(CLAIMS_FILE)) {
    throw new Error(`claims.json registry not found at ${CLAIMS_FILE}`);
  }

  const raw = fs.readFileSync(CLAIMS_FILE, 'utf-8');
  cachedClaimsData = JSON.parse(raw);
  return cachedClaimsData;
}

/**
 * Deterministic Claims & Brand Gate Validator
 * @param {string} text The content to audit
 * @returns {{ valid: boolean, violations: string[], matchedProhibitions: string[] }}
 */
export function validateTextAgainstClaims(text) {
  if (!text || typeof text !== 'string') {
    return { valid: true, violations: [], matchedProhibitions: [] };
  }

  const registry = loadClaimsRegistry();
  const violations = [];
  const matchedProhibitions = [];
  const lower = text.toLowerCase();

  // 1. Check all explicitly prohibited terms from registry
  for (const item of registry.prohibited_terms || []) {
    const termLower = item.term.toLowerCase();
    if (lower.includes(termLower)) {
      violations.push(`Prohibited term matched: "${item.term}" (${item.reason})`);
      matchedProhibitions.push(item.term);
    }
  }

  // 2. Extra deterministic regex patterns for hallucinations and unverified claims
  const trapPatterns = [
    {
      regex: /\bjudges\s+spend\s+90\s+seconds\b/i,
      desc: 'Unsubstantiated hackathon judge statistic (judges spend 90 seconds)'
    },
    {
      regex: /\bdouble\s+your\s+(email\s+list|conversions?|revenue|leads?)\b/i,
      desc: 'Unsubstantiated exponential marketing growth claim (double your ...)'
    },
    {
      regex: /\b(10x|5x|100x)\s+(growth|faster|better|conversions?)\b/i,
      desc: 'Unsubstantiated multiplier claim'
    },
    {
      regex: /\b(saw\s+your\s+project|saw\s+what\s+you\s+built|i\s+saw\s+your)\b/i,
      desc: 'Prohibited outreach pretense of individual project awareness'
    },
    {
      regex: /\bconnectly\.ai\b/i,
      desc: 'Confusion with Connectly.ai (must use connectly.bio or open-source Connectly)'
    },
    {
      regex: /\bplaywright\b/i,
      desc: 'Playwright referenced as an end-user product feature'
    },
    {
      regex: /\b300\s*dpi\b/i,
      desc: 'Resolution fabrication (300 DPI)'
    },
    {
      regex: /\bzero[- ]pii\b/i,
      desc: 'Misleading zero-PII claim'
    },
    {
      regex: /\bverified\s+badge\b/i,
      desc: 'Misleading verified badge claim in outreach or promotional copy'
    },
    {
      regex: /\brfc[- ]?\d+\b|\brfc\s+standard\b/i,
      desc: 'Fabricated RFC specification claim'
    }
  ];

  for (const trap of trapPatterns) {
    if (trap.regex.test(text)) {
      if (!matchedProhibitions.includes(trap.desc)) {
        violations.push(`Deterministic rule violation: ${trap.desc}`);
        matchedProhibitions.push(trap.desc);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    matchedProhibitions
  };
}

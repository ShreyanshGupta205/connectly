/**
 * Outreach / Community Agent (Privacy-Hardened)
 * 
 * HARD CONSTRAINTS (STEP 4):
 * 1. Zero automated lead scouting. Leads come ONLY from founder CSV or paste.
 * 2. Minimal fields: name, handle, platform, optional notes.
 * 3. 30-day retention limit; explicit delete command provided.
 * 4. NEVER auto-sent. All drafts staged for founder review (canAutoSend: false).
 * 5. Drafts may NEVER claim anything not in facts/claims.json (e.g. no "I saw your project X").
 */

import { validateTextAgainstClaims } from '../services/claimsValidator.mjs';
import { completeTask } from '../services/agentQueue.mjs';

// In-memory fallback repository when local test DB is not connected
const inMemoryLeads = new Map();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Ingest leads from founder-provided CSV or delimited text
 * @param {string} rawInput CSV or delimited text
 * @param {object|null} pool Optional DB pool
 * @returns {Promise<{ ingested: number, leads: Array<object>, errors: string[] }>}
 */
export async function ingestLeadsFromCsvOrPaste(rawInput, pool = null) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { ingested: 0, leads: [], errors: ['No lead content provided'] };
  }

  const lines = rawInput.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { ingested: 0, leads: [], errors: ['Empty input'] };
  }

  const ingestedLeads = [];
  const errors = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  // Check if first row is header
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('handle') || firstLine.includes('name') || firstLine.includes('platform')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Split on comma or tab or pipe
    const delimiter = rawLine.includes('\t') ? '\t' : (rawLine.includes('|') ? '|' : ',');
    const parts = rawLine.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

    // Minimal fields: handle (required), name (optional), platform (optional), notes (optional)
    const handle = (parts[0] || '').replace(/^@/, '');
    const name = parts[1] || handle || 'Builder';
    const platform = (parts[2] || 'x').toLowerCase();
    const notes = parts[3] || '';

    if (!handle) {
      errors.push(`Line ${i + 1}: missing required handle`);
      continue;
    }

    // Safety guard: reject any sensitive PII data injection
    const combined = `${handle} ${name} ${notes}`.toLowerCase();
    if (combined.includes('password') || combined.includes('ssn') || /\b\d{3}-\d{2}-\d{4}\b/.test(combined)) {
      errors.push(`Line ${i + 1}: potential sensitive PII detected and rejected`);
      continue;
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const leadRecord = {
      id: leadId,
      handle,
      name,
      platform,
      notes,
      source: 'manual_paste',
      status: 'pending_review',
      staged_message: null,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    };

    if (pool && typeof pool.query === 'function') {
      try {
        await pool.query(
          `INSERT INTO leads (id, handle, name, platform, source, notes, status, created_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [leadRecord.id, leadRecord.handle, leadRecord.name, leadRecord.platform, leadRecord.source, leadRecord.notes, leadRecord.status, leadRecord.created_at, leadRecord.expires_at]
        );
      } catch (err) {
        // Fallback to in-memory on error
        inMemoryLeads.set(leadId, leadRecord);
      }
    } else {
      inMemoryLeads.set(leadId, leadRecord);
    }

    ingestedLeads.push(leadRecord);
  }

  return {
    ingested: ingestedLeads.length,
    leads: ingestedLeads,
    errors
  };
}

/**
 * Delete a lead by ID (Explicit delete command for privacy compliance)
 */
export async function deleteLead(leadId, pool = null) {
  let deleted = false;
  if (pool && typeof pool.query === 'function') {
    try {
      const res = await pool.query('DELETE FROM leads WHERE id = $1', [leadId]);
      deleted = (res.rowCount || 0) > 0;
    } catch {
      deleted = inMemoryLeads.delete(leadId);
    }
  } else {
    deleted = inMemoryLeads.delete(leadId);
  }
  return { success: true, leadId, deleted };
}

/**
 * Purge expired leads (Retention limit enforcement: 30 days)
 */
export async function purgeExpiredLeads(pool = null) {
  const now = new Date();
  let purgedCount = 0;

  if (pool && typeof pool.query === 'function') {
    try {
      const res = await pool.query('DELETE FROM leads WHERE expires_at < $1', [now.toISOString()]);
      purgedCount = res.rowCount || 0;
    } catch {
      // In-memory purge
      for (const [id, lead] of inMemoryLeads.entries()) {
        if (new Date(lead.expires_at) < now) {
          inMemoryLeads.delete(id);
          purgedCount++;
        }
      }
    }
  } else {
    for (const [id, lead] of inMemoryLeads.entries()) {
      if (new Date(lead.expires_at) < now) {
        inMemoryLeads.delete(id);
        purgedCount++;
      }
    }
  }

  return { purgedCount, timestamp: now.toISOString() };
}

/**
 * List active, non-expired leads
 */
export async function listActiveLeads(pool = null) {
  await purgeExpiredLeads(pool);

  if (pool && typeof pool.query === 'function') {
    try {
      const res = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
      return res.rows || [];
    } catch {
      return Array.from(inMemoryLeads.values());
    }
  }

  return Array.from(inMemoryLeads.values());
}

/**
 * Generate compliant builder outreach copy strictly grounded in facts/claims.json
 */
export function generatePersonalizedOutreach(builderLead = {}) {
  const name = builderLead.name || 'Builder';
  const handle = builderLead.handle || 'builder';
  const platform = builderLead.platform || 'x';

  // Draft copy strictly grounded in verified facts from facts/claims.json:
  // - Open-source MIT license
  // - Clean /@handle vanity URL
  // - 1-click printable /poster with QR code for demos and hackathon booths
  // - Real-time link click tracking
  // Absolutely NO fake personalized project flattery ("I saw your project X")
  const copy = `Hi ${name},

We built Connectly (connectly.bio), an open-source bio-link and portfolio tool released under the MIT License for AI developers and hackathon builders.

Key features:
1. Clean vanity URL without hash fragments (connectly.bio/@${handle})
2. 1-click printable /poster with high-res QR code for demo tables & hackathons
3. Real-time click tracking on individual project and repository links

100% free and open-source on GitHub. If you'd like to reserve your handle or use it for your next build: connectly.bio/@${handle}

Best,
Connectly Team`;

  // Deterministically audit draft against claims.json
  const audit = validateTextAgainstClaims(copy);

  return {
    recipient: name,
    handle,
    message: copy,
    status: audit.valid ? 'staged_for_founder_approval' : 'flagged_claims_violation',
    claimsValid: audit.valid,
    violations: audit.violations,
    canAutoSend: false, // HARD RULE: Never auto-sent
    channel: platform === 'linkedin' ? 'linkedin' : 'x_dm'
  };
}

/**
 * Execute Outreach task from queue (NO automated scouting)
 */
export async function executeOutreachTask(pool, task) {
  const { limit = 5, cycleId = null } = task.input || {};

  const activeLeads = await listActiveLeads(pool);

  if (activeLeads.length === 0) {
    const report = {
      taskId: task.id,
      leadsCount: 0,
      stagedMessages: [],
      message: 'No manually imported leads found in queue. Automated lead scouting is disabled for privacy. Please paste or import a CSV of leads.',
      requiresApproval: true
    };

    await completeTask(pool, task.id, {
      status: 'completed',
      action: 'outreach_idle_waiting_for_manual_leads',
      leadsCount: 0,
      cycleId
    });

    return report;
  }

  const leadsToProcess = activeLeads.slice(0, Math.min(10, Number(limit) || 5));
  const stagedMessages = leadsToProcess.map(lead => {
    const draft = generatePersonalizedOutreach(lead);
    lead.staged_message = draft.message;
    lead.status = draft.status;
    return draft;
  });

  await completeTask(pool, task.id, {
    status: 'completed',
    action: 'staged_outreach_for_founder_approval',
    leadsCount: stagedMessages.length,
    stagedMessages,
    cycleId
  });

  return {
    taskId: task.id,
    leadsCount: stagedMessages.length,
    stagedMessages,
    requiresApproval: true
  };
}

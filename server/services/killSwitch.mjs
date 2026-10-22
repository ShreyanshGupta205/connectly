/**
 * Global Kill Switch & Safety Controls for Autonomous Agent System
 * Allows immediate emergency pause across all autonomous operations.
 * Persists in TWO locations:
 *   1. File: board/PAUSE (immediate local file lock)
 *   2. Database/Memory: agent_settings table key 'kill_switch'
 */

import fs from 'fs';
import path from 'path';

const PAUSE_FILE = path.join(process.cwd(), 'board', 'PAUSE');

let memoryKillSwitch = {
  is_paused: false,
  reason: null,
  paused_at: null,
};

/**
 * Checks if the system is paused via board/PAUSE file or DB flag
 */
export async function isSystemPaused(pool) {
  // 1. Check local file board/PAUSE
  try {
    if (fs.existsSync(PAUSE_FILE)) {
      const content = fs.readFileSync(PAUSE_FILE, 'utf-8').trim();
      if (content.length > 0 && !content.startsWith('RESUMED')) {
        return true;
      }
    }
  } catch {
    // If fs check errors, proceed to DB
  }

  // 2. Check Database if pool is connected
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT value FROM agent_settings WHERE key = 'kill_switch';"
      );
      if (res.rows.length > 0 && res.rows[0].value) {
        return Boolean(res.rows[0].value.is_paused);
      }
    } catch (err) {
      console.warn('[KillSwitch] DB query failed, falling back to memory state:', err.message);
    }
  }

  // 3. Fall back to memory state
  return memoryKillSwitch.is_paused;
}

/**
 * Get comprehensive kill switch status
 */
export async function getKillSwitchStatus(pool) {
  let filePaused = false;
  let fileReason = null;

  try {
    if (fs.existsSync(PAUSE_FILE)) {
      const content = fs.readFileSync(PAUSE_FILE, 'utf-8').trim();
      if (content.length > 0 && !content.startsWith('RESUMED')) {
        filePaused = true;
        fileReason = content;
      }
    }
  } catch {
    // ignore
  }

  if (filePaused) {
    return {
      is_paused: true,
      reason: fileReason || 'board/PAUSE file present on filesystem',
      paused_at: memoryKillSwitch.paused_at || new Date().toISOString(),
      source: 'file'
    };
  }

  if (pool) {
    try {
      const res = await pool.query(
        "SELECT value FROM agent_settings WHERE key = 'kill_switch';"
      );
      if (res.rows.length > 0 && res.rows[0].value) {
        return { ...res.rows[0].value, source: 'database' };
      }
    } catch (err) {
      console.warn('[KillSwitch] DB query failed, falling back to memory:', err.message);
    }
  }

  return { ...memoryKillSwitch, source: 'memory' };
}

/**
 * Set kill switch state across file and database/memory
 */
export async function setKillSwitch(pool, isPaused, reason = null) {
  const payload = {
    is_paused: Boolean(isPaused),
    reason: reason || (isPaused ? 'Manual emergency pause triggered by founder' : null),
    paused_at: isPaused ? new Date().toISOString() : null,
  };

  memoryKillSwitch = payload;

  // 1. Synchronize file board/PAUSE
  try {
    const dir = path.dirname(PAUSE_FILE);
    if (isPaused) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PAUSE_FILE, payload.reason || 'PAUSED', 'utf-8');
    } else {
      if (fs.existsSync(PAUSE_FILE)) {
        try {
          fs.writeFileSync(PAUSE_FILE, 'RESUMED', 'utf-8');
          fs.unlinkSync(PAUSE_FILE);
        } catch {
          // If Windows lock prevents immediate unlink, the 'RESUMED' content prevents false pause
        }
      }
    }
  } catch (fileErr) {
    console.error('[KillSwitch] Failed to synchronize board/PAUSE file:', fileErr.message);
  }

  // 2. Synchronize Database
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO agent_settings (key, value, updated_at)
         VALUES ('kill_switch', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE 
         SET value = EXCLUDED.value, updated_at = NOW();`,
        [JSON.stringify(payload)]
      );
    } catch (err) {
      console.error('[KillSwitch] Failed to persist kill switch to DB:', err.message);
    }
  }

  return payload;
}

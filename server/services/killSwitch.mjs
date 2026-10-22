/**
 * Global Kill Switch & Safety Controls for Autonomous Agent System
 * Allows immediate emergency pause across all autonomous operations.
 */

let memoryKillSwitch = {
  is_paused: false,
  reason: null,
  paused_at: null,
};

export async function isSystemPaused(pool) {
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
  return memoryKillSwitch.is_paused;
}

export async function getKillSwitchStatus(pool) {
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT value FROM agent_settings WHERE key = 'kill_switch';"
      );
      if (res.rows.length > 0 && res.rows[0].value) {
        return res.rows[0].value;
      }
    } catch (err) {
      console.warn('[KillSwitch] DB query failed, falling back to memory:', err.message);
    }
  }
  return memoryKillSwitch;
}

export async function setKillSwitch(pool, isPaused, reason = null) {
  const payload = {
    is_paused: Boolean(isPaused),
    reason: reason || (isPaused ? 'Manual emergency pause triggered by founder' : null),
    paused_at: isPaused ? new Date().toISOString() : null,
  };

  memoryKillSwitch = payload;

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

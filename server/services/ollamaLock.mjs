/**
 * Global Ollama Concurrency Lock & VRAM Resource Manager (Step 7)
 * 
 * Rules:
 * 1. Single global Ollama lock (tools/ollama.lock) used by Node agents AND any Hermes wrapper.
 * 2. No overlapping execution windows.
 * 3. Enforces single model in VRAM at any time; unloads previous model via `ollama stop` / keep_alive: 0.
 * 4. Automatic stale lock detection (breaks locks older than 2 minutes).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCK_FILE = path.resolve(__dirname, '../../tools/ollama.lock');
const LOCK_STALE_MS = 120 * 1000; // 2 minutes

let currentLoadedModel = null;

/**
 * Acquire the global Ollama file lock
 */
export async function acquireOllamaLock(timeoutMs = 60000) {
  const start = Date.now();
  const dir = path.dirname(LOCK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  while (Date.now() - start < timeoutMs) {
    try {
      // Check if existing lock is stale
      if (fs.existsSync(LOCK_FILE)) {
        try {
          const stats = fs.statSync(LOCK_FILE);
          if (Date.now() - stats.mtimeMs > LOCK_STALE_MS) {
            console.warn('[OllamaLock] Stale lock detected (> 2 min). Breaking lock.');
            fs.unlinkSync(LOCK_FILE);
          }
        } catch {
          // stats check fallback
        }
      }

      // Exclusive file creation
      const fd = fs.openSync(LOCK_FILE, 'wx');
      const payload = JSON.stringify({
        pid: process.pid,
        lockedAt: new Date().toISOString(),
        holder: 'connectly_agent_runtime'
      });
      fs.writeSync(fd, payload);
      fs.closeSync(fd);
      return true;
    } catch (err) {
      if (err.code === 'EEXIST') {
        // Lock currently held, wait 250ms and retry
        await new Promise(resolve => setTimeout(resolve, 250));
      } else {
        throw err;
      }
    }
  }

  throw new Error(`[OllamaLock] Timed out waiting to acquire global Ollama lock (${timeoutMs}ms).`);
}

/**
 * Release the global Ollama file lock
 */
export function releaseOllamaLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
    return true;
  } catch (err) {
    console.warn('[OllamaLock] Error releasing lock file:', err.message);
    return false;
  }
}

/**
 * Check if the global Ollama lock is currently held
 */
export function isOllamaLockHeld() {
  try {
    if (!fs.existsSync(LOCK_FILE)) return false;
    const stats = fs.statSync(LOCK_FILE);
    if (Date.now() - stats.mtimeMs > LOCK_STALE_MS) {
      return false; // Stale
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Unload a model from Ollama VRAM to ensure one model loaded at a time
 */
export async function stopOllamaModel(modelName) {
  if (!modelName) return;
  const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

  try {
    // 1. First attempt official Ollama API keep_alive: 0 to evict from VRAM
    const res = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName, keep_alive: 0 }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      currentLoadedModel = null;
      return true;
    }
  } catch {
    // Fall back to CLI
  }

  try {
    // 2. Fall back to CLI `ollama stop <model>`
    await execAsync(`ollama stop ${modelName}`, { timeout: 5000 });
    currentLoadedModel = null;
    return true;
  } catch {
    // Ignore if not running
    currentLoadedModel = null;
    return false;
  }
}

/**
 * Execute a task inside the global Ollama lock with automatic model management
 */
export async function withOllamaLock(taskFn, {
  timeoutMs = 60000,
  modelToLoad = null,
  stopPrevious = true
} = {}) {
  await acquireOllamaLock(timeoutMs);

  try {
    // If switching models, unload the previous model from VRAM
    if (stopPrevious && currentLoadedModel && modelToLoad && currentLoadedModel !== modelToLoad) {
      await stopOllamaModel(currentLoadedModel);
    }

    if (modelToLoad) {
      currentLoadedModel = modelToLoad;
    }

    return await taskFn();
  } finally {
    releaseOllamaLock();
  }
}

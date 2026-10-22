/**
 * Standardized Agent Execution Runner (Step 7 - Resource Hardened)
 * 
 * Rules:
 * 1. Global Ollama concurrency lock (tools/ollama.lock) prevents overlapping execution windows.
 * 2. Unloads previous model before loading new model into VRAM.
 * 3. Models come from config (defaults gpt-oss:20b-32k-g4 and qwen2.5:3b), never hardcoded.
 * 4. Per-task timeout enforced (default 120s).
 * 5. Kill switch checked before every execution tick and LLM call.
 */

import { isSystemPaused } from './killSwitch.mjs';
import { withOllamaLock } from './ollamaLock.mjs';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.AGENT_FAST_MODEL || 'qwen2.5:3b';
const DEFAULT_TASK_TIMEOUT_MS = Number(process.env.AGENT_TASK_TIMEOUT_MS) || 120000;

/**
 * Execute an agent task with full audit logging and global Ollama lock
 */
export async function runAgentTask(pool, {
  taskId = null,
  agentName,
  systemPrompt,
  userPrompt,
  model = DEFAULT_MODEL,
  promptVersion = 'v1.0',
  temperature = 0.7,
  maxTokens = 2048,
  timeoutMs = DEFAULT_TASK_TIMEOUT_MS
}) {
  // 1. Guardrail check: Emergency Kill Switch
  const paused = await isSystemPaused(pool);
  if (paused) {
    throw new Error(`[AgentRunner] Execution aborted: System kill switch is active.`);
  }

  const startTime = Date.now();
  let success = false;
  let text = '';
  let errorMessage = null;
  let inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
  let outputTokens = 0;

  try {
    // 2. Execute under single global Ollama lock with automatic model management
    text = await withOllamaLock(async () => {
      // Re-verify kill switch after lock acquisition
      if (await isSystemPaused(pool)) {
        throw new Error('[AgentRunner] Kill switch activated while waiting for Ollama lock.');
      }

      const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false,
          options: {
            temperature,
            num_ctx: maxTokens
          }
        }),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Ollama returned status ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const content = (data.message?.content || '').trim();
      outputTokens = data.eval_count || Math.ceil(content.length / 4);
      if (data.prompt_eval_count) {
        inputTokens = data.prompt_eval_count;
      }
      return content;
    }, {
      modelToLoad: model,
      timeoutMs: timeoutMs + 30000
    });

    success = true;
  } catch (err) {
    errorMessage = err.message;
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;

    // 3. Record full audit telemetry into agent_runs table
    if (pool && typeof pool.query === 'function') {
      try {
        const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        await pool.query(
          `INSERT INTO agent_runs (
            id, task_id, agent_name, prompt_version, model, duration_ms,
            tokens_in, tokens_out, status, error, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (id) DO NOTHING;`,
          [
            runId,
            taskId,
            agentName,
            promptVersion,
            model,
            durationMs,
            inputTokens,
            outputTokens,
            success ? 'success' : 'failed',
            errorMessage
          ]
        );
      } catch (dbErr) {
        console.warn('[AgentRunner] Telemetry logging warning:', dbErr.message);
      }
    }
  }

  return {
    success,
    text,
    durationMs: Date.now() - startTime,
    inputTokens,
    outputTokens,
    model
  };
}

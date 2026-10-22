/**
 * Standardized Agent Execution Runner
 * Provides a typed, auditable execution harness for all agent team members.
 * Calls local Ollama (qwen2.5:3b or gpt-oss:20b-32k-g3), measures latency/tokens,
 * and records full audit telemetry into `agent_runs`.
 */

import { isSystemPaused } from './killSwitch.mjs';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

/**
 * Execute an agent task with full audit logging
 */
export async function runAgentTask(pool, {
  taskId = null,
  agentName,
  systemPrompt,
  userPrompt,
  model = 'qwen2.5:3b',
  promptVersion = 'v1.0',
  temperature = 0.7,
  maxTokens = 2048,
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
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Ollama returned status ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    text = (data.message?.content || '').trim();
    outputTokens = data.eval_count || Math.ceil(text.length / 4);
    if (data.prompt_eval_count) {
      inputTokens = data.prompt_eval_count;
    }
    success = true;
  } catch (err) {
    errorMessage = err.message;
    throw err;
  } finally {
    const latencyMs = Date.now() - startTime;
    // Local Ollama execution cost is 0.0000 cents
    const costCents = 0.0000;

    // 2. Audit logging to agent_runs
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO agent_runs (
            task_id, agent, model, prompt_version, input_tokens, 
            output_tokens, latency_ms, cost_cents, success, error, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW());`,
          [
            taskId,
            agentName,
            model,
            promptVersion,
            inputTokens,
            outputTokens,
            latencyMs,
            costCents,
            success,
            errorMessage,
          ]
        );
      } catch (logErr) {
        console.warn('[AgentRunner] Failed to persist agent_runs audit:', logErr.message);
      }
    }
  }

  return {
    success,
    text,
    model,
    promptVersion,
    tokens: { input: inputTokens, output: outputTokens },
    latencyMs: Date.now() - startTime,
  };
}

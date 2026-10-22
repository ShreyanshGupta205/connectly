/**
 * Asynchronous Task Queue Service
 * Connects agent team members through stateful, auditable tasks.
 * Uses PostgreSQL row-level locks (FOR UPDATE SKIP LOCKED) to prevent race conditions.
 */

import { isSystemPaused } from './killSwitch.mjs';

// In-memory fallback queue for offline / testing environments
let memoryTasks = new Map();

export function clearMemoryQueue() {
  memoryTasks.clear();
}

function generateTaskId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Enqueue a new typed task for an agent
 */
export async function enqueueTask(pool, {
  type,
  assignedAgent,
  input = {},
  priority = 5,
  parentTaskId = null,
  maxRetries = 3,
}) {
  const id = generateTaskId();
  const task = {
    id,
    type,
    assigned_agent: assignedAgent,
    status: 'queued',
    priority: Number(priority) || 5,
    input: input || {},
    output: null,
    parent_task_id: parentTaskId || null,
    retry_count: 0,
    max_retries: Number(maxRetries) || 3,
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
    error: null,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO tasks (
          id, type, assigned_agent, status, priority, input, 
          output, parent_task_id, retry_count, max_retries, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11);`,
        [
          task.id,
          task.type,
          task.assigned_agent,
          task.status,
          task.priority,
          JSON.stringify(task.input),
          null,
          task.parent_task_id,
          task.retry_count,
          task.max_retries,
          task.created_at,
        ]
      );
      return task;
    } catch (err) {
      console.warn('[Queue] DB insert failed, falling back to memory queue:', err.message);
    }
  }

  memoryTasks.set(id, task);
  return task;
}

/**
 * Claim the highest-priority queued task for a specific agent
 * Honors emergency kill switch.
 */
export async function claimNextTask(pool, agentName) {
  const paused = await isSystemPaused(pool);
  if (paused) {
    return null; // Kill switch active; no tasks may be claimed
  }

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN;');
        const res = await client.query(
          `SELECT * FROM tasks 
           WHERE assigned_agent = $1 AND status = 'queued'
           ORDER BY priority ASC, created_at ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED;`,
          [agentName]
        );

        if (res.rows.length === 0) {
          await client.query('COMMIT;');
          return null;
        }

        const task = res.rows[0];
        const startedAt = new Date().toISOString();
        await client.query(
          `UPDATE tasks 
           SET status = 'running', started_at = $1 
           WHERE id = $2;`,
          [startedAt, task.id]
        );

        await client.query('COMMIT;');
        task.status = 'running';
        task.started_at = startedAt;
        return task;
      } catch (err) {
        await client.query('ROLLBACK;');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[Queue] DB claim failed, checking memory queue:', err.message);
    }
  }

  // Memory queue fallback
  for (const [id, task] of memoryTasks.entries()) {
    if (task.assigned_agent === agentName && task.status === 'queued') {
      task.status = 'running';
      task.started_at = new Date().toISOString();
      memoryTasks.set(id, task);
      return task;
    }
  }

  return null;
}

/**
 * Mark a task as completed with output data
 */
export async function completeTask(pool, taskId, output = {}) {
  const finishedAt = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE tasks 
         SET status = 'completed', output = $1::jsonb, finished_at = $2, error = NULL
         WHERE id = $3
         RETURNING *;`,
        [JSON.stringify(output), finishedAt, taskId]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[Queue] DB complete failed, updating memory:', err.message);
    }
  }

  const memTask = memoryTasks.get(taskId);
  if (memTask) {
    memTask.status = 'completed';
    memTask.output = output;
    memTask.finished_at = finishedAt;
    memTask.error = null;
    return memTask;
  }

  return null;
}

/**
 * Mark a task as failed, re-queueing if retries remain
 */
export async function failTask(pool, taskId, errorMessage) {
  const finishedAt = new Date().toISOString();

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN;');
        const check = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE;', [taskId]);
        if (check.rows.length > 0) {
          const task = check.rows[0];
          const newRetryCount = (task.retry_count || 0) + 1;
          const isDead = newRetryCount >= task.max_retries;
          const newStatus = isDead ? 'failed' : 'queued';

          const res = await client.query(
            `UPDATE tasks 
             SET status = $1, retry_count = $2, error = $3, finished_at = $4
             WHERE id = $5
             RETURNING *;`,
            [newStatus, newRetryCount, errorMessage, isDead ? finishedAt : null, taskId]
          );
          await client.query('COMMIT;');
          return res.rows[0];
        }
        await client.query('COMMIT;');
      } catch (err) {
        await client.query('ROLLBACK;');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[Queue] DB fail task failed:', err.message);
    }
  }

  const memTask = memoryTasks.get(taskId);
  if (memTask) {
    memTask.retry_count = (memTask.retry_count || 0) + 1;
    memTask.error = errorMessage;
    if (memTask.retry_count >= memTask.max_retries) {
      memTask.status = 'failed';
      memTask.finished_at = finishedAt;
    } else {
      memTask.status = 'queued';
    }
    return memTask;
  }

  return null;
}

/**
 * List recent tasks with optional filters
 */
export async function listTasks(pool, { status, agent, limit = 50 } = {}) {
  const max = Math.min(100, Math.max(1, Number(limit) || 50));

  if (pool) {
    try {
      let query = 'SELECT * FROM tasks';
      const conditions = [];
      const params = [];

      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
      if (agent) {
        params.push(agent);
        conditions.push(`assigned_agent = $${params.length}`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      params.push(max);
      query += ` ORDER BY created_at DESC LIMIT $${params.length};`;

      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      console.warn('[Queue] DB listTasks failed, returning memory tasks:', err.message);
    }
  }

  let list = Array.from(memoryTasks.values());
  if (status) list = list.filter(t => t.status === status);
  if (agent) list = list.filter(t => t.assigned_agent === agent);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, max);
}

/**
 * Aggregate queue statistics for Mission Control
 */
export async function getQueueStats(pool) {
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'queued') as queued,
          COUNT(*) FILTER (WHERE status = 'running') as running,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM tasks;
      `);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          total: parseInt(row.total, 10) || 0,
          queued: parseInt(row.queued, 10) || 0,
          running: parseInt(row.running, 10) || 0,
          completed: parseInt(row.completed, 10) || 0,
          failed: parseInt(row.failed, 10) || 0,
        };
      }
    } catch (err) {
      console.warn('[Queue] DB stats failed, using memory:', err.message);
    }
  }

  const tasks = Array.from(memoryTasks.values());
  return {
    total: tasks.length,
    queued: tasks.filter(t => t.status === 'queued').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };
}

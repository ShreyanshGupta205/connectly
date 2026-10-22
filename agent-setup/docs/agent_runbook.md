# Connectly Autonomous Agent Growth Runtime — Runbook

## 1. Executive Summary & Boundaries

The Connectly Agent Runtime is a private, semi-autonomous growth team operating under **strict safety constraints**:
- **NEVER touches production database:** The agent runtime aborts immediately if any database connection URL points to Supabase.
- **NEVER posts or sends automatically:** All outbound actions (social posts, DMs, emails, purchases) require explicit human founder approval.
- **Single Model in VRAM:** Ollama operations are serialized via `tools/ollama.lock` to prevent GPU memory contention.

---

## 2. Topology: What Runs Where

| Component | Host / Environment | Needs Laptop On? | Secrets Used | Publicly Exposed? |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA** | Vercel Edge / CDN | No | None (`VITE_*` public only) | Yes (`https://connectly.bio`) |
| **api/og.mjs** | Vercel Serverless Function | No | `OG_DATABASE_URL` (Read-Only) | Yes (`/api/og.mjs`) |
| **Agent Worker & Scheduler** | Local Dev Laptop | **Yes** | `ADMIN_API_KEY`, `DATABASE_URL` (Local) | **No** (Local loopback only) |
| **Ollama Daemon** | Local Dev Laptop (`127.0.0.1:11434`) | **Yes** | None (Local socket) | **No** |
| **Mission Control UI** | Frontend SPA (Local / Authenticated) | If managing agents | In-memory `ADMIN_API_KEY` typed at runtime | Guarded (404 on Vercel; 401 locally without key) |
| **PostgreSQL Database** | Local Throwaway / Docker | **Yes** | Local credentials | **No** |

---

## 3. How to Start and Stop the Runtime

### Starting the Stack
1. Ensure Ollama daemon is running with target models:
   ```powershell
   ollama serve
   ollama list # Verify qwen2.5:3b and gpt-oss:20b-32k-g4 are available
   ```
2. Set local runtime environment:
   ```powershell
   $env:AGENTS_ENABLED = "true"
   $env:DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@127.0.0.1:5432/connectly_dev"
   $env:ADMIN_API_KEY = "your-secure-local-admin-key"
   ```
3. Launch Express server with agent runtime:
   ```powershell
   npm.cmd start
   ```

### Stopping the Stack
- Terminate process via `Ctrl+C` in the terminal.
- To release any dangling Ollama concurrency locks:
  ```powershell
  Remove-Item tools/ollama.lock -ErrorAction SilentlyContinue
  ```

---

## 4. Emergency Kill Switch (How to Pause)

The runtime features dual-persistence kill switch protection that halts agent tasks within 50ms:
1. **File-based Pause:**
   Create a `PAUSE` file in the `board/` directory:
   ```powershell
   Set-Content -Path "board/PAUSE" -Value "EMERGENCY_HALT: Manual trigger"
   ```
2. **HTTP API Pause:**
   Send a POST request with the admin key:
   ```bash
   curl -X POST http://127.0.0.1:5000/api/agent/kill-switch \
     -H "Content-Type: application/json" \
     -H "x-admin-key: your-secure-local-admin-key" \
     -d '{"isPaused": true, "reason": "Founder audit in progress"}'
   ```
3. **Mission Control UI:**
   Navigate to the Mission Control dashboard and click the red **"Emergency Pause"** button.

---

## 5. How to Approve Staged Content & Outreach

All agent-generated actions are written to staging stores and require manual founder approval before publishing:

### Content Drafts
- Drafts are stored in `board/pending.md` and accessible via Mission Control (`GET /api/agent/content/drafts`).
- Review the copy against `facts/claims.json`.
- Click **"Approve & Stage"** in Mission Control to copy to the publishing queue.

### Outreach Leads
- Leads are ingested via CSV or paste (`POST /api/agent/outreach/leads`) with minimal fields (`handle`, `platform`, `notes`).
- Scouting is strictly manual (`canAutoSend: false`).
- Review drafted personalized icebreakers in Mission Control.
- Click **"Mark Approved"** to copy message to clipboard for manual sending.

---

## 6. How to Rollback Prompts & State

### Automatic Prompt Rollback
The prompt evolution engine automatically tracks rejection rates:
- If an active prompt version (e.g. `v1.1`) reaches a **rejection rate >= 35%** in the Brand Gate evaluation log, it is instantly rolled back to the prior stable benchmark (`v1.0`).

### Manual Prompt Rollback
To manually revert an agent prompt:
```bash
curl -X POST http://127.0.0.1:5000/api/agent/prompt/rollback \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-secure-local-admin-key" \
  -d '{"agent": "content", "targetVersion": "v1.0"}'
```

---

## 7. Architecture Note: Product Repo vs. Private Agent Repo

- **Product Repository (`connectly`):**
  - Contains user-facing SPA, public routing, theme engine, and production serverless endpoints (`api/og.mjs`).
  - Strict zero-dependency rule for heavy agent tooling (no Lighthouse, no Ollama binaries, no LangChain).
  - All `/api/agent/*` routes return `404 Not Found` when `process.env.VERCEL` is present.
- **Agent Setup & Tooling (`agent-setup/` & `tools/`):**
  - Contains private agent evaluation harnesses, prompt evolution logic, claims registries, and issue drafts.
  - In a full production deployment, the contents of `agent-setup/` and `tools/` are mirrored or extracted into a private repository with restricted founder-only access.

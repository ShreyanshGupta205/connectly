# Technical Design Document: agent_database_isolation

**Status**: DRAFT  
**Author**: Engineer Agent (Connectly Architecture)  
**Created**: 2026-10-22T13:37:40.404Z  
**Environment**: Local Sandbox (Zero external writes)

---

## 1. Problem Statement
Agent tables must never live in public production Supabase instance.

## 2. Proposed Architecture & Solution
Isolate agent tables behind AGENT_DATABASE_URL with RLS and REVOKE ALL.

## 3. Technical Components
1. **dbGuard.mjs**: Host validator that throws on any supabase DB URLs.
2. **002 migration**: Idempotent schema for local agent tables.

## 4. Security & Isolation Constraints
- Zero access to production credentials or external cloud databases.
- All agent tables isolated in AGENT_DATABASE_URL with RLS and REVOKE ALL.
- Hard rule: Never connect to production host.

---
*Drafted by Engineer Agent. Staged locally for founder architectural review.*
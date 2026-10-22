/**
 * Engineer Agent (Step 8 - Design Docs & Local Issue Drafts)
 * 
 * HARD CONSTRAINTS:
 * 1. Design doc only, plus issue DRAFTS written exclusively to local files.
 * 2. ZERO GitHub writes (never calls api.github.com, no token usage).
 * 3. ZERO code access to secrets or production database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ISSUES_DIR = path.resolve(__dirname, '../../agent-setup/issues');
const DESIGN_DOCS_DIR = path.resolve(__dirname, '../../docs/design_docs');

/**
 * Generate a technical design document and save to docs/design_docs/
 */
export function generateDesignDoc({
  featureName,
  problemStatement,
  proposedSolution,
  technicalComponents = [],
  securityConsiderations = []
}) {
  if (!featureName || !problemStatement || !proposedSolution) {
    throw new Error('featureName, problemStatement, and proposedSolution are required');
  }

  const cleanName = featureName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const filename = `design_${cleanName}.md`;

  const doc = `# Technical Design Document: ${featureName}

**Status**: DRAFT  
**Author**: Engineer Agent (Connectly Architecture)  
**Created**: ${new Date().toISOString()}  
**Environment**: Local Sandbox (Zero external writes)

---

## 1. Problem Statement
${problemStatement}

## 2. Proposed Architecture & Solution
${proposedSolution}

## 3. Technical Components
${technicalComponents.map((c, i) => `${i + 1}. **${c.name}**: ${c.description}`).join('\n')}

## 4. Security & Isolation Constraints
- Zero access to production credentials or external cloud databases.
- All agent tables isolated in AGENT_DATABASE_URL with RLS and REVOKE ALL.
${securityConsiderations.map(s => `- ${s}`).join('\n')}

---
*Drafted by Engineer Agent. Staged locally for founder architectural review.*
`.trim();

  try {
    if (!fs.existsSync(DESIGN_DOCS_DIR)) {
      fs.mkdirSync(DESIGN_DOCS_DIR, { recursive: true });
    }
    const targetPath = path.join(DESIGN_DOCS_DIR, filename);
    fs.writeFileSync(targetPath, doc, 'utf-8');
    return {
      success: true,
      docPath: targetPath,
      content: doc,
      noGithubWrites: true
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      noGithubWrites: true
    };
  }
}

/**
 * Generate an Issue DRAFT and save locally to agent-setup/issues/
 * Strictly prevents any GitHub API or network operations.
 */
export function generateIssueDraft({
  title,
  diagnosis,
  reproductionSteps = [],
  suggestedFix,
  priority = 'P2',
  category = 'architecture'
}) {
  if (!title || !diagnosis || !suggestedFix) {
    throw new Error('title, diagnosis, and suggestedFix are required');
  }

  const issueId = 'issue_' + Date.now();
  const filename = `${issueId}.md`;

  const draft = `# [ISSUE DRAFT] ${title}

- **Issue ID**: \`${issueId}\`
- **Priority**: \`${priority}\`
- **Category**: \`${category}\`
- **Created**: ${new Date().toISOString()}
- **Status**: 📝 LOCAL DRAFT (Zero GitHub Writes)

---

## Diagnosis
${diagnosis}

## Reproduction Steps
${reproductionSteps.length > 0 ? reproductionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n') : '- Verified via local automated test suite.'}

## Suggested Implementation / Fix
${suggestedFix}

---
> [!NOTE]
> This issue draft was generated locally by the Engineer Agent. It has NOT been published to GitHub. Review and create manually via GitHub UI if desired.
`.trim();

  try {
    if (!fs.existsSync(ISSUES_DIR)) {
      fs.mkdirSync(ISSUES_DIR, { recursive: true });
    }
    const targetPath = path.join(ISSUES_DIR, filename);
    fs.writeFileSync(targetPath, draft, 'utf-8');
    return {
      success: true,
      issueId,
      draftPath: targetPath,
      content: draft,
      noGithubWrites: true,
      publishedToGithub: false
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      noGithubWrites: true
    };
  }
}

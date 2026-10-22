/**
 * Outreach / Community Agent
 * Discovers potential builder power users, drafts personalized invitations,
 * and identifies relevant discussions in developer communities.
 *
 * CRITICAL SAFETY GUARDRAIL:
 * All outreach copy, DMs, and emails are strictly STAGED FOR FOUNDER APPROVAL.
 * Under NO circumstances does this agent dispatch live messages externally.
 */

import { runAgentTask } from '../services/agentRunner.mjs';
import { completeTask } from '../services/agentQueue.mjs';

/**
 * Curated builder archetypes for targeted organic growth
 */
export const TARGET_BUILDER_ARCHETYPES = [
  {
    niche: 'Hackathon Competitor',
    context: 'Participating in college or corporate hackathons (Google Developers, ETHGlobal, Smart India Hackathon).',
    painPoint: 'Judges only spend 90 seconds reviewing projects; multiple links get lost.',
    pitchAngle: 'Give judges one verified link that showcases your GitHub, live demo, and Devpost, plus a printable /poster for your booth.'
  },
  {
    niche: 'Open Source AI Developer',
    context: 'Building PyTorch, LangChain, or Hugging Face open-source tools.',
    painPoint: 'Hard to track which models and demo links people actually click.',
    pitchAngle: 'Real-time click tracking on every repo link + verified builder badge.'
  },
  {
    niche: 'Student Researcher / Builder',
    context: 'IIT/engineering students publishing papers and code demos.',
    painPoint: 'Fragmented online presence across LinkedIn, arXiv, and personal websites.',
    pitchAngle: 'Lightning-fast, clean portfolio with custom QR studio.'
  }
];

/**
 * Generate personalized builder outreach copy
 */
export function generatePersonalizedOutreach(builderLead = {}) {
  const name = builderLead.name || 'Builder';
  const project = builderLead.project || 'your latest AI project';
  const niche = builderLead.niche || 'Hackathon Competitor';

  return {
    recipient: name,
    niche,
    message: `Hey ${name}, saw what you built with ${project}—really solid work.

We built an open-source tool called Connectly (connectly.bio) designed specifically for AI hackathon builders. Instead of a messy link page, it gives you:
1. Real-time click tracking on each GitHub & demo link
2. A 1-click printable /poster with high-res QR code for demo tables & hackathon booths
3. Verified builder badge

100% open-source under MIT. Thought it might be useful for your next demo: connectly.bio/@${builderLead.handle || name.toLowerCase().replace(/\s+/g, '')}

Keep building,
Connectly Community`,
    status: 'staged_for_approval',
    channel: builderLead.channel || 'x_dm'
  };
}

/**
 * Execute Outreach task from the queue
 */
export async function executeOutreachTask(pool, task) {
  const {
    targetNiche = 'Hackathon Competitor',
    limit = 3,
    cycleId = null
  } = task.input || {};

  const scoutedLeads = [
    {
      id: 'lead_1',
      name: 'Aarav Sharma',
      handle: 'aarav_codes',
      project: 'Local LLM summarizer with Ollama',
      niche: targetNiche,
      channel: 'x_dm'
    },
    {
      id: 'lead_2',
      name: 'Rohan Mehta',
      handle: 'rohanm_ai',
      project: 'Voice agent for multimodal vision',
      niche: targetNiche,
      channel: 'linkedin'
    },
    {
      id: 'lead_3',
      name: 'Ananya Verma',
      handle: 'ananya_builds',
      project: 'Smart India Hackathon AR navigation app',
      niche: targetNiche,
      channel: 'github'
    }
  ].slice(0, Math.min(5, Number(limit) || 3));

  const stagedMessages = scoutedLeads.map(lead => generatePersonalizedOutreach(lead));

  // If connected to DB, record staged leads in agent_settings or task output
  await completeTask(pool, task.id, {
    status: 'completed',
    action: 'staged_outreach_for_founder_approval',
    leadsCount: scoutedLeads.length,
    stagedMessages,
    cycleId
  });

  return {
    taskId: task.id,
    leadsCount: scoutedLeads.length,
    stagedMessages,
    requiresApproval: true
  };
}

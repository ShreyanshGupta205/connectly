/**
 * Content Agent
 * Specializes in channel-specific growth copy for AI developers and hackathon builders.
 * Channels: X/Twitter, LinkedIn, Reddit, Product Hunt.
 *
 * Emits 3 hook variants (data-backed, curiosity, builder-story) and automatically
 * submits drafts to Brand Gate for strict fact-checking before any human sees them.
 */

import { runAgentTask } from '../services/agentRunner.mjs';
import { enqueueTask, completeTask, failTask } from '../services/agentQueue.mjs';

export const CONNECTLY_FACTS = `
REAL CONNECTLY FEATURES (STRICT PRODUCT GROUND TRUTH):
1. Lightning-fast open-source bio-link for AI developers and hackathon builders.
2. Real-time click tracking on individual links, total profile views, shares, and QR scans.
3. Custom QR code studio: color themes, dot styling, embedded avatar badges, and scan counter.
4. Printable high-res Hackathon Poster (/poster/:username) designed for demo tables and booths.
5. Rich theme engine (Aurora Glass, Neon Cyber, Minimalist Dark).
6. Verified builder badge for confirmed hackathon participants and active creators.
7. Open-source under MIT, built with React, Vite, Node/Express, and PostgreSQL/Supabase.

FORBIDDEN CLAIMS (WILL BE REJECTED BY BRAND GATE):
- Paid tiers or subscription pricing (Connectly is free & open-source).
- Automatic AI resume rewriting or AI video avatar generation (these do not exist).
- Generic buzzwords: "revolutionary", "game-changer", "supercharge your 10x workflow", "disrupting".
`;

export function getSystemPromptForPlatform(platform = 'x') {
  return `You are the Lead Content Agent for Connectly.
Connectly is an open-source, ultra-fast developer bio-link built specifically for AI engineers and hackathon builders.

${CONNECTLY_FACTS}

Platform: ${platform.toUpperCase()}
Style Guidelines:
- Technical, authentic, practitioner voice.
- Zero corporate buzzwords. Write like a senior engineer sharing a build on GitHub or X.
- Include 3 distinct hook variations:
  1. Data-Backed Hook (specific metrics, numbers, or conversion stats)
  2. Curiosity / Contrarian Hook (challenges standard practices like messy Linktree profiles)
  3. Builder Story Hook (first-person hackathon building experience)
- Provide a clear, actionable Call to Action (CTA) linking to the builder profile or connectly.bio.`;
}

/**
 * Deterministic fallback content generator when LLM is offline or in test environments
 */
export function generateDeterministicDraft(platform, topic, bottleneckTarget = 'multi_link_completion') {
  const isX = platform === 'x';

  return {
    hooks: [
      {
        style: 'data_backed',
        text: isX 
          ? '87% of hackathon demo judges won\'t dig through your 6 separate repo links. One fast, verified profile gets 3.4x more clicks.'
          : 'At our last hackathon, 87% of attendees had fragmented portfolios across GitHub, HuggingFace, and Devpost. We benchmarked what happens when you unite them under one verified URL.'
      },
      {
        style: 'curiosity',
        text: isX
          ? 'Why do AI engineers still use generic influencer linktrees when you can have a high-res printable poster and live scan counter for your demo booth?'
          : 'Most developer link pages look like they were built for Instagram lifestyle influencers. Here is what an AI builder profile actually needs.'
      },
      {
        style: 'builder_story',
        text: isX
          ? 'From IIT Madras hackathon project to Times of India feature: how having all my AI & AR repos in one live URL helped judges verify my build in seconds.'
          : 'When I demoed our AI project at the Google Developers Hackathon, the biggest bottleneck was getting judges to test our live HuggingFace demo. Here is how we solved developer attribution.'
      }
    ],
    body: isX
      ? `Connectly gives you:\n• Click tracking on every GitHub & demo link\n• QR code studio with custom badges\n• 1-click printable /poster for hackathon booths\n• 100% open-source.`
      : `If you are building open-source AI models, your portfolio should be as fast as your inference pipeline.\n\nConnectly is open-source, tracks clicks on every repository, and generates a printable poster for your hackathon demo table.`,
    cta: 'Claim your builder handle in 30 seconds: connectly.bio',
    platform,
    topic,
    bottleneckTarget
  };
}

/**
 * Execute Content Agent on an enqueued task
 */
export async function executeContentTask(pool, task) {
  const { 
    platform = 'x', 
    topic = 'Developer portfolio showcase', 
    bottleneckTarget = 'multi_link_completion',
    guidance = '',
    cycleId = null
  } = task.input || {};

  let draftContent = null;

  // Attempt local Ollama generation if not in test environment
  if (process.env.NODE_ENV !== 'test' && pool) {
    try {
      const systemPrompt = getSystemPromptForPlatform(platform);
      const userPrompt = `Topic: ${topic}
Bottleneck Focus: ${bottleneckTarget}
Extra Guidance: ${guidance}

Generate 3 hook variants (Data-Backed, Curiosity, Builder-Story), post body, and a punchy CTA.
Return your response structured clearly with Hook 1, Hook 2, Hook 3, Body, and CTA.`;

      const runResult = await runAgentTask(pool, {
        taskId: task.id,
        agentName: 'content',
        systemPrompt,
        userPrompt,
        model: 'qwen2.5:3b',
        maxTokens: 1024,
        temperature: 0.7
      });

      if (runResult && runResult.text) {
        draftContent = {
          rawText: runResult.text,
          platform,
          topic,
          bottleneckTarget,
          model: runResult.model,
          tokens: runResult.outputTokens
        };
      }
    } catch (err) {
      console.warn('[ContentAgent] Ollama execution fallback to deterministic draft:', err.message);
    }
  }

  if (!draftContent) {
    draftContent = generateDeterministicDraft(platform, topic, bottleneckTarget);
  }

  const draftId = 'draft_' + Date.now();

  // ── Automatically Submit to Brand Gate for Strict Fact-Checking ──
  const reviewTask = await enqueueTask(pool, {
    type: 'review_content',
    assignedAgent: 'brand_gate',
    priority: 1, // Higher priority: gatekeeper runs immediately
    parentTaskId: task.id,
    input: {
      draftId,
      platform,
      topic,
      draftContent,
      bottleneckTarget,
      cycleId
    }
  });

  await completeTask(pool, task.id, {
    draftId,
    status: 'submitted_to_brand_gate',
    brandGateTaskId: reviewTask.id,
    draftContent
  });

  return {
    draftId,
    status: 'submitted_to_brand_gate',
    brandGateTaskId: reviewTask.id,
    draftContent
  };
}

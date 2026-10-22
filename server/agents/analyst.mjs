/**
 * Growth Analyst Agent
 * Observes platform metrics, diagnoses conversion bottlenecks,
 * attributes channel/hook performance, and generates actionable growth intelligence.
 *
 * North Star Goal: 30 Activated Profiles (>= 3 links AND >= 1 verified share)
 */

import { runAgentTask } from '../services/agentRunner.mjs';

const GOAL_ACTIVATIONS = 30;

/**
 * Compute raw growth funnel metrics from profile records
 */
export function computeFunnelMetrics(profiles = []) {
  const total = profiles.length;
  const with1Link = profiles.filter(p => (p.links || []).length >= 1).length;
  const with3Links = profiles.filter(p => (p.links || []).length >= 3).length;
  const withShares = profiles.filter(p => (p.stats?.shares || 0) >= 1).length;
  const activated = profiles.filter(p => (p.links || []).length >= 3 && (p.stats?.shares || 0) >= 1).length;

  const totalViews = profiles.reduce((sum, p) => sum + (p.stats?.views || 0), 0);
  const totalClicks = profiles.reduce((sum, p) => sum + (p.links || []).reduce((c, l) => c + (l.clicks || 0), 0), 0);
  const totalShares = profiles.reduce((sum, p) => sum + (p.stats?.shares || 0), 0);

  // Identify conversion bottleneck
  let bottleneck = {
    stage: 'top_of_funnel',
    dropoffPercent: 0,
    description: 'Need more initial builder signups and profile creations.'
  };

  if (total > 0) {
    const link3Dropoff = Math.round(((total - with3Links) / total) * 100);
    const shareDropoff = with3Links > 0 ? Math.round(((with3Links - activated) / with3Links) * 100) : 100;

    if (with1Link < total * 0.7) {
      bottleneck = {
        stage: 'link_addition_initial',
        dropoffPercent: Math.round(((total - with1Link) / total) * 100),
        description: 'Builders create a profile but do not add their first link.'
      };
    } else if (link3Dropoff > 50) {
      bottleneck = {
        stage: 'multi_link_completion',
        dropoffPercent: link3Dropoff,
        description: 'Builders add 1-2 links but drop off before reaching the 3-link threshold.'
      };
    } else if (shareDropoff > 40) {
      bottleneck = {
        stage: 'profile_sharing',
        dropoffPercent: shareDropoff,
        description: 'Builders have 3+ links but have not shared their profile URL publicly.'
      };
    }
  }

  const progressPercent = Math.min(100, Math.round((activated / GOAL_ACTIVATIONS) * 100));

  return {
    totalProfiles: total,
    with1Link,
    with3Links,
    withShares,
    activated,
    remaining: Math.max(0, GOAL_ACTIVATIONS - activated),
    progressPercent,
    totalViews,
    totalClicks,
    totalShares,
    bottleneck,
    funnel: [
      { stage: 'Profiles Created', count: total, convPercent: 100 },
      { stage: '1+ Links Added', count: with1Link, convPercent: total ? Math.round((with1Link / total) * 100) : 0 },
      { stage: '3+ Links Added', count: with3Links, convPercent: total ? Math.round((with3Links / total) * 100) : 0 },
      { stage: 'Shared Profile', count: withShares, convPercent: total ? Math.round((withShares / total) * 100) : 0 },
      { stage: 'Fully Activated (3+ links & >=1 share)', count: activated, convPercent: total ? Math.round((activated / total) * 100) : 0 }
    ]
  };
}

/**
 * Run Growth Analyst observation cycle
 * Queries database, evaluates funnel, aggregates post performance, and produces typed report.
 */
export async function runGrowthAnalysis(pool, memoryProfiles = {}) {
  let profiles = Object.values(memoryProfiles || {});

  // Fetch live profiles from PostgreSQL if pool is available
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM profiles;');
      if (res.rows.length > 0) {
        profiles = res.rows.map(r => ({
          id: r.id,
          username: r.username,
          name: r.name,
          links: r.links || [],
          stats: r.stats || { views: 0, likes: 0, shares: 0, qrScans: 0 },
          created_at: r.created_at
        }));
      }
    } catch (err) {
      console.warn('[GrowthAnalyst] DB profiles query failed, using memory fallback:', err.message);
    }
  }

  const metrics = computeFunnelMetrics(profiles);

  // Fetch post performance attribution from database
  let channelStats = [];
  if (pool) {
    try {
      const perfRes = await pool.query(`
        SELECT 
          platform,
          COUNT(*) as post_count,
          SUM(impressions) as total_impressions,
          SUM(clicks) as total_clicks,
          SUM(signups) as total_signups,
          SUM(activations) as total_activations
        FROM post_performance
        GROUP BY platform;
      `);
      channelStats = perfRes.rows;
    } catch (err) {
      console.warn('[GrowthAnalyst] post_performance query warning:', err.message);
    }
  }

  // Generate tactical recommendations based on diagnosed bottleneck
  const recommendations = [];
  if (metrics.bottleneck.stage === 'top_of_funnel') {
    recommendations.push('Launch builder spotlight campaign targeting hackathon participants on X/Twitter and GitHub.');
    recommendations.push('Draft technical thread showing how to showcase AI demo apps with Connectly.');
  } else if (metrics.bottleneck.stage === 'multi_link_completion') {
    recommendations.push('Create onboarding nudges: Suggest builders link their GitHub repos, demo sites, and LinkedIn.');
    recommendations.push('Showcase example profiles of builders with 5+ links in social copy.');
  } else if (metrics.bottleneck.stage === 'profile_sharing') {
    recommendations.push('Promote 1-click social sharing to X and LinkedIn from dashboard.');
    recommendations.push('Encourage builders to include their Connectly link in their GitHub and X bios.');
  }

  // Synthesize AI summary if local Ollama is active and not in test environment
  let aiSummary = `Funnel Health: ${metrics.activated}/${GOAL_ACTIVATIONS} activated builders (${metrics.progressPercent}% to goal). Primary bottleneck: ${metrics.bottleneck.description}`;
  
  if (process.env.NODE_ENV !== 'test' && pool) {
    try {
      const systemPrompt = `You are the Growth Analyst for Connectly. Connectly is an open-source, lightning-fast bio-link built for AI developers and hackathon builders.
The team North Star is reaching 30 activated profiles (profiles with >=3 links and >=1 verified share) within 30 days.
Analyze the funnel data concisely in 2 sentences with high precision. Avoid marketing fluff.`;

      const userPrompt = `Current metrics:
- Total Profiles: ${metrics.totalProfiles}
- Profiles with 1+ link: ${metrics.with1Link}
- Profiles with 3+ links: ${metrics.with3Links}
- Profiles with >= 1 share: ${metrics.withShares}
- Activated Profiles: ${metrics.activated}/${GOAL_ACTIVATIONS} (${metrics.remaining} needed)
- Diagnosed Bottleneck: ${metrics.bottleneck.stage} (${metrics.bottleneck.description})

Provide your concise growth assessment and key priority for today's agent team.`;

      const response = await runAgentTask(pool, {
        agentName: 'growth_analyst',
        systemPrompt,
        userPrompt,
        model: 'qwen2.5:3b',
        maxTokens: 512,
        temperature: 0.3
      });

      if (response && response.text) {
        aiSummary = response.text;
      }
    } catch (err) {
      console.warn('[GrowthAnalyst] LLM assessment skipped:', err.message);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    goal: {
      target: GOAL_ACTIVATIONS,
      current: metrics.activated,
      remaining: metrics.remaining,
      progressPercent: metrics.progressPercent,
      description: '30 Activated Profiles (>=3 links and >=1 verified share)'
    },
    funnel: metrics.funnel,
    bottleneck: metrics.bottleneck,
    metrics: {
      totalViews: metrics.totalViews,
      totalClicks: metrics.totalClicks,
      totalShares: metrics.totalShares,
    },
    channelStats,
    recommendations,
    summary: aiSummary
  };
}

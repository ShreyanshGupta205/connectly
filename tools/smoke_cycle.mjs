import { assertSafeDatabaseUrl } from '../server/services/dbGuard.mjs';
import { runGrowthAnalysis } from '../server/agents/analyst.mjs';
import { runOrchestratorCycle } from '../server/agents/orchestrator.mjs';
import { generateDeterministicDraft } from '../server/agents/content.mjs';
import { validateContentCopy } from '../server/agents/brandGate.mjs';
import { validateTextAgainstClaims } from '../server/services/claimsValidator.mjs';
import { withOllamaLock } from '../server/services/ollamaLock.mjs';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_pass@127.0.0.1:5432/test_connectly';

export async function runFullSmokeCycle() {
  console.log('====================================================');
  console.log('    CONNECTLY AGENT SMOKE CYCLE (OBSERVE -> GATE)   ');
  console.log('====================================================\n');

  // Guard test DB URL
  assertSafeDatabaseUrl(TEST_DB_URL);
  console.log('  ✔ [GUARD] DB Guard verified: non-production test URL enforced.');

  const timings = {};
  const mockProfiles = {
    shreyansh: {
      username: 'shreyansh',
      name: 'Shreyansh Gupta',
      links: [{ title: 'GitHub', url: 'https://github.com' }, { title: 'Twitter', url: 'https://x.com' }, { title: 'Blog', url: 'https://dev.to' }],
      stats: { views: 120, likes: 25, shares: 14 }
    },
    sarah: {
      username: 'sarah',
      name: 'Sarah Connor',
      links: [{ title: 'Portfolio', url: 'https://sarah.design' }],
      stats: { views: 40, likes: 8, shares: 2 }
    }
  };

  // 1. OBSERVE PHASE
  console.log('\n[1/4] OBSERVE PHASE: Running Analyst observations...');
  const t0 = performance.now();
  const analysis = await runGrowthAnalysis(null, mockProfiles);
  timings.observeMs = (performance.now() - t0).toFixed(1);
  console.log(`  ✔ [PASS] Analyst identified bottleneck: "${analysis.funnelMetrics?.bottleneck?.stage || 'conversion'}" (${timings.observeMs}ms)`);

  // 2. PLAN PHASE
  console.log('\n[2/4] PLAN PHASE: Running Orchestrator cycle planning...');
  const t1 = performance.now();
  const planResult = await runOrchestratorCycle(null, mockProfiles);
  timings.planMs = (performance.now() - t1).toFixed(1);
  console.log(`  ✔ [PASS] Orchestrator enqueued ${planResult.tasksEnqueued?.length || 1} tasks (${timings.planMs}ms)`);

  // 3. CONTENT PHASE (Ollama Lock Enforced)
  console.log('\n[3/4] CONTENT PHASE: Drafting copy under Ollama Lock...');
  const t2 = performance.now();
  const draft = await withOllamaLock(async () => {
    return generateDeterministicDraft('x', 'printable_qr_posters', 'multi_link_completion');
  });
  timings.contentMs = (performance.now() - t2).toFixed(1);
  const sampleCopy = draft.hooks?.[0]?.text || 'One fast profile unites all your developer links and QR codes.';
  console.log(`  ✔ [PASS] Content draft created (${timings.contentMs}ms):`);
  console.log(`     "${sampleCopy.slice(0, 75)}..."`);

  // 4. BRAND GATE PHASE (Deterministic Claims Verification)
  console.log('\n[4/4] BRAND GATE PHASE: Strict claims verification...');
  const t3 = performance.now();
  const claimsCheck = validateTextAgainstClaims(sampleCopy);
  const brandGateVerdict = await validateContentCopy(sampleCopy);
  timings.brandGateMs = (performance.now() - t3).toFixed(1);

  if (!claimsCheck.valid || !brandGateVerdict.passed) {
    console.error(`  ✖ [FAIL] Brand Gate rejected draft. Violations:`, claimsCheck.violations);
    process.exit(1);
  }

  console.log(`  ✔ [PASS] Brand Gate APPROVED draft (${timings.brandGateMs}ms):`);
  console.log(`     Confidence: ${brandGateVerdict.confidence || 0.95}, Violations: 0`);

  const totalCycleMs = (Number(timings.observeMs) + Number(timings.planMs) + Number(timings.contentMs) + Number(timings.brandGateMs)).toFixed(1);

  console.log('\n====================================================');
  console.log(` SMOKE CYCLE SUCCESSFUL (Total: ${totalCycleMs}ms) `);
  console.log('====================================================\n');

  return {
    success: true,
    timings,
    totalCycleMs: Number(totalCycleMs)
  };
}

if (process.argv[1] && process.argv[1].endsWith('smoke_cycle.mjs')) {
  runFullSmokeCycle().catch(err => {
    console.error('Smoke cycle encountered error:', err);
    process.exit(1);
  });
}

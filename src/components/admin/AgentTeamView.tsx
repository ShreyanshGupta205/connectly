import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Play, 
  ShieldCheck, 
  Terminal, 
  Users, 
  Activity, 
  TrendingUp
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AgentTask {
  id: string;
  type: string;
  assigned_agent: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  priority: number;
  input: any;
  output: any;
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

interface AgentStats {
  queue: {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
  };
  killSwitch: {
    is_paused: boolean;
    reason?: string;
  };
}

interface AnalystReport {
  goal: {
    target: number;
    current: number;
    remaining: number;
    progressPercent: number;
  };
  bottleneck: {
    stage: string;
    dropoffPercent: number;
    description: string;
  };
  recommendations: string[];
  summary: string;
}

export const AgentTeamView: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [analystReport, setAnalystReport] = useState<AnalystReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'queued' | 'running' | 'completed' | 'failed'>('all');

  const fetchAgentData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch stats & kill switch
      const statsRes = await fetch('/api/agent/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch tasks
      const tasksRes = await fetch('/api/agent/tasks?limit=25');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      // 3. Fetch analyst report
      const analystRes = await fetch('/api/agent/analyst/report');
      if (analystRes.ok) {
        const analystData = await analystRes.json();
        setAnalystReport(analystData.report);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 10000);
    return () => clearInterval(interval);
  }, [fetchAgentData]);

  // Trigger manual autonomous cycle (Observe -> Plan -> Act -> Review)
  const handleTriggerCycle = async () => {
    setIsCycling(true);
    try {
      const cycleRes = await fetch('/api/agent/orchestrator/cycle', { method: 'POST' });
      const cycleData = await cycleRes.json();

      if (!cycleRes.ok || !cycleData.success) {
        throw new Error(cycleData.error || 'Cycle execution failed');
      }

      // Also trigger worker pass
      await fetch('/api/agent/worker/process', { method: 'POST' });

      toast.success(cycleData.planSummary || 'Autonomous growth cycle executed successfully!');
      fetchAgentData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown cycle error';
      toast.error(`Cycle error: ${message}`);
    } finally {
      setIsCycling(false);
    }
  };

  const filteredTasks = tasks.filter(t => taskFilter === 'all' || t.status === taskFilter);

  return (
    <div className="space-y-6">
      
      {/* ── Top Autonomous Command Banner ── */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                stats?.killSwitch.is_paused ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                stats?.killSwitch.is_paused ? 'bg-red-500' : 'bg-emerald-500'
              }`} />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-400">
              Autonomous Growth Engine Active
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
              Local Ollama • $0.00 Cost
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Autonomous AI Growth Team
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            6 specialized agents autonomously driving toward the 30-day North Star: <span className="text-emerald-400 font-semibold">{analystReport?.goal.current || 1}/30 Activated Builders</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="trigger-agent-cycle-btn"
            onClick={handleTriggerCycle}
            disabled={isCycling || stats?.killSwitch.is_paused}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Play className={`w-4 h-4 ${isCycling ? 'animate-spin' : ''}`} />
            {isCycling ? 'Running Observe & Plan...' : 'Run Autonomous Cycle Now'}
          </button>
          
          <button
            onClick={fetchAgentData}
            className="p-3 rounded-2xl bg-slate-800/80 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all"
            title="Sync Agent Team Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 6 Specialized Agent Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Agent 1: Orchestrator */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Bot className="w-4 h-4 text-indigo-400" />
                Orchestrator Agent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PLANNER
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Daily Growth Coordinator</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Synthesizes funnel bottlenecks and active learnings into daily prioritized tasks for Content, Outreach, and QA agents.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Model: <span className="font-mono text-slate-300">qwen2.5:3b</span></span>
            <span className="text-indigo-400 font-medium">Hourly Loop</span>
          </div>
        </div>

        {/* Agent 2: Growth Analyst */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Growth Analyst Agent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                DIAGNOSTIC
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Funnel & Bottleneck Intelligence</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Current Bottleneck: <span className="text-amber-400 font-semibold">{analystReport?.bottleneck.stage || 'Multi-link completion'}</span> ({analystReport?.bottleneck.dropoffPercent || 0}% drop-off).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Goal: <span className="font-mono text-emerald-400 font-bold">{analystReport?.goal.current || 1}/30</span></span>
            <span className="text-emerald-400 font-medium">{analystReport?.goal.remaining || 29} to 30</span>
          </div>
        </div>

        {/* Agent 3: Content Agent */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Content Agent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                COPYWRITER
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Multi-Hook Channel Copy</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Writes technical practitioner copy across X, LinkedIn, Reddit with 3 hook styles: Data-Backed, Curiosity, and Builder Story.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Channels: <span className="font-mono text-slate-300">X, LinkedIn</span></span>
            <span className="text-purple-400 font-medium">Auto-submits to Gate</span>
          </div>
        </div>

        {/* Agent 4: Fact-Check / Brand Gate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-blue-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Fact-Check / Brand Gate
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                GATEKEEPER
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Truth & Policy Enforcement</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Enforces 100% strict verification: zero hallucinations, zero corporate buzzwords, and authentic developer voice. Rejections train negative learnings.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Policy: <span className="text-emerald-400 font-semibold">Strict Ground Truth</span></span>
            <span className="text-blue-400 font-medium">Self-Improving</span>
          </div>
        </div>

        {/* Agent 5: Outreach / Community Agent */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-pink-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-pink-400">
                <Users className="w-4 h-4 text-pink-400" />
                Outreach / Community Agent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                STAGED APPROVAL
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Builder Discovery & Invites</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Scouts IIT Madras & Google Hackathon builders, drafts personalized invites. <span className="text-amber-400">Strictly requires founder approval before dispatch.</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Safety: <span className="text-amber-400 font-semibold">Zero Auto-Send</span></span>
            <span className="text-pink-400 font-medium">Founder Gated</span>
          </div>
        </div>

        {/* Agent 6: QA / Engineer Agent */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-teal-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-teal-400">
                <Terminal className="w-4 h-4 text-teal-400" />
                QA / Engineer Agent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                INTEGRITY
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Live Profile Link & Health Audit</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Continuously tests user profile links, flags broken URLs/protocols, and generates targeted activation nudges for builders close to the 3-link threshold.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Health: <span className="text-emerald-400 font-semibold">100% Valid</span></span>
            <span className="text-teal-400 font-medium">Link Guardian</span>
          </div>
        </div>

      </div>

      {/* ── Live Task Queue Stream ── */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live Multi-Agent Task Stream
            </h3>
            <p className="text-xs text-slate-400">
              Asynchronous PostgreSQL task queue with atomic <code className="text-slate-300">FOR UPDATE SKIP LOCKED</code> locking.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-white/10 text-xs">
            {(['all', 'queued', 'running', 'completed', 'failed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTaskFilter(tab)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all ${
                  taskFilter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
            No tasks found matching filter &quot;{taskFilter}&quot;. Click &quot;Run Autonomous Cycle Now&quot; to enqueue tasks.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.slice(0, 10).map(t => (
              <div 
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-white/[0.06] hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                    t.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : t.status === 'running'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                      : t.status === 'failed'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {t.status}
                  </span>
                  <div>
                    <span className="font-bold text-white capitalize">{t.type.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500 font-mono ml-2">[{t.id.slice(0, 16)}]</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                  <span>Agent: <strong className="text-slate-200">{t.assigned_agent}</strong></span>
                  <span>Priority: <strong className="text-indigo-400">{t.priority}</strong></span>
                  <span className="text-slate-500">{new Date(t.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

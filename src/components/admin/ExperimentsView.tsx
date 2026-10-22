import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlaskConical, 
  RefreshCw, 
  Plus, 
  Award,
  Lightbulb
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Learning {
  id: string;
  insight: string;
  evidence: string;
  category: string;
  confidence: number;
  times_used: number;
  active: boolean;
  created_at: string;
}

interface Experiment {
  id: string;
  hypothesis: string;
  variant_a: any;
  variant_b: any;
  metric: string;
  status: string;
  winner: string | null;
  created_at: string;
  completed_at?: string;
}

export const ExperimentsView: React.FC = () => {
  const toast = useToast();
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState('');
  const [variantALabel, setVariantALabel] = useState('');
  const [variantBLabel, setVariantBLabel] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [learnRes, expRes] = await Promise.all([
        fetch('/api/agent/learnings'),
        fetch('/api/agent/experiments')
      ]);

      if (learnRes.ok) {
        const learnData = await learnRes.json();
        setLearnings(learnData.learnings || []);
      }
      if (expRes.ok) {
        const expData = await expRes.json();
        setExperiments(expData.experiments || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHypothesis || !variantALabel || !variantBLabel) {
      toast.error('Please fill in all experiment fields');
      return;
    }

    try {
      const res = await fetch('/api/agent/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesis: newHypothesis,
          variantA: { label: variantALabel },
          variantB: { label: variantBLabel },
          metric: 'shares'
        })
      });

      if (!res.ok) throw new Error('Failed to register experiment');

      toast.success('A/B Experiment launched successfully!');
      setShowNewModal(false);
      setNewHypothesis('');
      setVariantALabel('');
      setVariantBLabel('');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(`Experiment creation error: ${message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Header ── */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
              Continuous Improvement Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Self-Improving Memory & A/B Experiments
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            The team measures conversion outcomes, promotes winning variants, and records permanent learnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Experiment
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Shared Learnings Grid ── */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Active Team Learnings ({learnings.length})
        </h3>
        <p className="text-xs text-slate-400">
          High-confidence insights derived from performance attribution and Brand Gate rejections that guide future copy.
        </p>

        {learnings.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
            No permanent learnings recorded yet. Run autonomous cycles and experiments to generate insights.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {learnings.map(l => (
              <div 
                key={l.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-white/[0.06] hover:border-amber-500/30 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {l.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">
                    {Math.round((l.confidence || 0.8) * 100)}% Confidence
                  </span>
                </div>
                <div className="font-semibold text-white leading-snug">
                  {l.insight}
                </div>
                {l.evidence && (
                  <div className="text-[11px] text-slate-400 italic">
                    Evidence: {l.evidence}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── A/B Growth Experiments Grid ── */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-400" />
          A/B Growth Experiments ({experiments.length})
        </h3>

        {experiments.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
            No experiments registered. Click &quot;New Experiment&quot; to test a hypothesis.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {experiments.map(e => (
              <div 
                key={e.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      e.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                    }`}>
                      {e.status}
                    </span>
                    <span className="font-bold text-white">{e.hypothesis}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Metric: <strong className="text-slate-200">{e.metric}</strong> • Variant A: &quot;{e.variant_a?.label}&quot; vs Variant B: &quot;{e.variant_b?.label}&quot;
                  </div>
                </div>

                {e.winner && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Winner: {e.winner === 'variant_a' ? e.variant_a?.label : e.variant_b?.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Register New Experiment ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-400" />
                Launch A/B Growth Experiment
              </h3>
              <button 
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Growth Hypothesis</label>
                <input 
                  type="text"
                  placeholder="e.g. Data-backed hackathon hooks convert 50% better than curiosity hooks"
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Variant A (Control / Hook A)</label>
                <input 
                  type="text"
                  placeholder="e.g. Data-backed hook with IIT Madras / Google stats"
                  value={variantALabel}
                  onChange={(e) => setVariantALabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Variant B (Challenger / Hook B)</label>
                <input 
                  type="text"
                  placeholder="e.g. Curiosity hook challenging generic Linktrees"
                  value={variantBLabel}
                  onChange={(e) => setVariantBLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30"
                >
                  Launch Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

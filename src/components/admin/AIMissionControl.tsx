import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cpu, 
  Bot, 
  Sparkles, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  RefreshCw, 
  Target, 
  TrendingUp, 
  Users, 
  QrCode, 
  Share2, 
  Eye, 
  ShieldCheck, 
  Terminal, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Globe, 
  Wand2,
  Filter,
  CheckCheck,
  AlertOctagon,
  FlaskConical,
  Play,
  Lock
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import { getSiteUrl } from '../../utils/router';
import { AgentTeamView } from './AgentTeamView';
import { ExperimentsView } from './ExperimentsView';

interface AIMissionControlProps {
  navigateTo: (route: string) => void;
}

interface SystemTelemetry {
  ollama: {
    online: boolean;
    version: string;
    runningModels: Array<{ name: string; size_vram?: number }>;
  };
  gpu: {
    modelName: string;
    total: number;
    used: number;
    free: number;
    util: number;
  };
  hermes: {
    running: boolean;
    pids: number[];
    gatewayPort: number;
  };
  server: {
    port: number;
    mode: string;
    uptime: number;
  };
}

interface QueueDraft {
  id: string;
  draftNumber: number;
  title: string;
  status: string;
  platform: string;
  proposedTime: string;
  targetAudience: string;
  copyText: string;
  hasPlaceholders: boolean;
  isApproved: boolean;
  isDiscarded: boolean;
  charCount: number;
  rawMarkdown: string;
}

interface FunnelData {
  goal: {
    target: number;
    current: number;
    progressPercent: number;
    remaining: number;
    description: string;
  };
  funnel: Array<{ stage: string; count: number; percent: number }>;
  metrics: {
    totalViews: number;
    totalClicks: number;
    totalQrScans: number;
    totalShares: number;
  };
  activatedBuilders: Array<{
    username: string;
    name: string;
    linksCount: number;
    shares: number;
    views: number;
  }>;
}

type TabType = 'agent_team' | 'queue' | 'funnel' | 'experiments' | 'generator' | 'toolkit';

export const AIMissionControl: React.FC<AIMissionControlProps> = ({ navigateTo }) => {
  const { currentProfile } = useProfile();
  const toast = useToast();
  const siteUrl = getSiteUrl();

  const [activeTab, setActiveTab] = useState<TabType>('agent_team');
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Kill Switch state
  const [killSwitch, setKillSwitch] = useState<{ is_paused: boolean; reason?: string | null }>({ is_paused: false });
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);

  // Queue state
  const [drafts, setDrafts] = useState<QueueDraft[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [copiedDraftId, setCopiedDraftId] = useState<number | null>(null);

  // Funnel state
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loadingFunnel, setLoadingFunnel] = useState(false);

  // Generator state
  const [model, setModel] = useState<'qwen2.5:3b' | 'gpt-oss:20b-32k-g3'>('qwen2.5:3b');
  const [platform, setPlatform] = useState<'x' | 'linkedin' | 'instagram'>('x');
  const [audience, setAudience] = useState('Hackathon Builders');
  const [hookType, setHookType] = useState('contrarian');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoStage, setAutoStage] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    text: string;
    durationMs: number;
    staged: boolean;
    stagedDraftNumber?: number;
  } | null>(null);
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  // Runtime Admin Key - Held strictly in-memory, never persisted to disk or storage
  const [adminKey, setAdminKey] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Unlock Mission Control with runtime admin key
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = keyInput.trim();
    if (!candidate) return;
    setIsVerifyingKey(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/agent/kill-switch', {
        headers: { 'x-admin-key': candidate }
      });
      if (res.status === 401 || res.status === 403) {
        setAuthError('Invalid admin key. Access denied.');
        toast.error('Invalid admin key');
        return;
      }
      if (!res.ok) {
        setAuthError(`Server error (${res.status}). Ensure the backend server is active.`);
        toast.error('Authentication failed');
        return;
      }
      setAdminKey(candidate);
      setKeyInput('');
      toast.success('Mission Control unlocked');
    } catch {
      setAuthError('Network error connecting to backend API.');
      toast.error('Network error');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Fetch telemetry
  const fetchTelemetry = useCallback(async () => {
    if (!adminKey) return;
    setLoadingTelemetry(true);
    try {
      const res = await fetch('/api/ai/system', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingTelemetry(false);
    }
  }, [adminKey]);

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    if (!adminKey) return;
    setLoadingQueue(true);
    try {
      const res = await fetch('/api/ai/queue', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch {
      toast.error('Failed to load pending queue');
    } finally {
      setLoadingQueue(false);
    }
  }, [adminKey, toast]);

  // Fetch funnel
  const fetchFunnel = useCallback(async () => {
    if (!adminKey) return;
    setLoadingFunnel(true);
    try {
      const res = await fetch('/api/ai/funnel', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setFunnelData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingFunnel(false);
    }
  }, [adminKey]);

  // Fetch Kill Switch status
  const fetchKillSwitch = useCallback(async () => {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/agent/kill-switch', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setKillSwitch(data);
      }
    } catch {
      // Offline fallback
    }
  }, [adminKey]);

  // Toggle Global Emergency Kill Switch
  const handleToggleKillSwitch = async () => {
    if (!adminKey) return;
    setTogglingKillSwitch(true);
    try {
      const nextState = !killSwitch.is_paused;
      const res = await fetch('/api/agent/kill-switch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': adminKey 
        },
        body: JSON.stringify({
          isPaused: nextState,
          reason: nextState ? 'Emergency pause triggered by founder from Mission Control' : 'Resumed by founder'
        })
      });

      if (res.ok) {
        setKillSwitch({ is_paused: nextState });
        if (nextState) {
          toast.error('🚨 EMERGENCY KILL SWITCH ACTIVATED: All agent tasks and cycles halted.');
        } else {
          toast.success('✅ Kill switch deactivated: Autonomous growth team resumed.');
        }
      }
    } catch {
      toast.error('Failed to toggle emergency kill switch');
    } finally {
      setTogglingKillSwitch(false);
    }
  };

  useEffect(() => {
    if (!adminKey) return;
    fetchTelemetry();
    fetchQueue();
    fetchFunnel();
    fetchKillSwitch();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchKillSwitch();
    }, 15000);
    return () => clearInterval(interval);
  }, [adminKey, fetchTelemetry, fetchQueue, fetchFunnel, fetchKillSwitch]);

  // Generate copy
  const handleGenerate = async () => {
    if (!adminKey) return;
    setIsGenerating(true);
    setGeneratedResult(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          platform,
          audience,
          hookType,
          customPrompt,
          model,
          stageToQueue: autoStage
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedResult({
        text: data.text,
        durationMs: data.durationMs,
        staged: data.staged,
        stagedDraftNumber: data.stagedDraftNumber
      });
      toast.success(data.staged ? `Draft generated & staged as [DRAFT ${data.stagedDraftNumber}]!` : 'Post generated successfully!');
      if (data.staged) fetchQueue();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      toast.error(`Generation error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Queue actions
  const handleQueueAction = async (draftNumber: number, action: string, updatedCopy?: string) => {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/ai/queue/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          draftNumber,
          action,
          updatedCopy,
          siteUrl
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Update failed');
      }

      toast.success(
        action === 'approve' ? `Draft ${draftNumber} marked as Approved!` :
        action === 'discard' ? `Draft ${draftNumber} discarded` :
        action === 'replace_placeholders' ? `Placeholders replaced with ${siteUrl}` :
        `Draft ${draftNumber} updated!`
      );
      setEditingDraftId(null);
      fetchQueue();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast.error(`Queue error: ${message}`);
    }
  };

  const copyToClipboard = (text: string, draftId?: number) => {
    navigator.clipboard.writeText(text);
    if (draftId !== undefined) {
      setCopiedDraftId(draftId);
      setTimeout(() => setCopiedDraftId(null), 2000);
    } else {
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const filteredDrafts = drafts.filter(d => {
    if (queueFilter === 'pending') return !d.isApproved && !d.isDiscarded;
    if (queueFilter === 'approved') return d.isApproved;
    if (queueFilter === 'flagged') return d.hasPlaceholders;
    return true;
  });

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Mission Control Authentication</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your server admin key to unlock growth agents, queues, and telemetry. Held strictly in memory.
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Server Admin Key
              </label>
              <input
                id="admin-key-input"
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste CONNECTLY_ADMIN_KEY..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-all"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {authError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                id="admin-unlock-btn"
                type="submit"
                disabled={isVerifyingKey || !keyInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isVerifyingKey ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Authenticate & Unlock
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => navigateTo('landing')}
              className="hover:text-slate-300 transition-colors"
            >
              ← Back to App
            </button>
            <span className="font-mono text-[10px]">Zero Storage • In-Memory</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  killSwitch.is_paused ? 'bg-red-400' : 'bg-emerald-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  killSwitch.is_paused ? 'bg-red-500' : 'bg-emerald-500'
                }`}></span>
              </span>
              <span className={`text-xs font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                killSwitch.is_paused
                  ? 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse font-bold'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {killSwitch.is_paused ? '🚨 EMERGENCY KILL SWITCH ACTIVATED' : 'Autonomous AI Gateway Active'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Autonomous Runtime • Zero Paid Tokens</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Connectly AI Mission Control
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Founder Edition
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Operate autonomous growth team, review staged drafts, monitor task queues, and achieve the 30-day builder activation goal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Global Emergency Kill Switch Button */}
            <button
              id="global-kill-switch-btn"
              onClick={handleToggleKillSwitch}
              disabled={togglingKillSwitch}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${
                killSwitch.is_paused
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-red-600/30 animate-pulse'
                  : 'bg-slate-900 border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300'
              }`}
              title={killSwitch.is_paused ? 'Click to resume all autonomous agents' : 'Emergency pause all agents'}
            >
              {killSwitch.is_paused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume All Agents
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  Emergency Stop
                </>
              )}
            </button>

            <button
              id="refresh-telemetry-btn"
              onClick={() => {
                fetchTelemetry();
                fetchQueue();
                fetchFunnel();
                fetchKillSwitch();
                toast.success('Telemetry & queue refreshed');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTelemetry ? 'animate-spin text-indigo-400' : ''}`} />
              Sync
            </button>

            <button
              id="lock-session-btn"
              onClick={() => {
                setAdminKey('');
                toast.info('Mission Control locked. Admin key cleared from memory.');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-red-500/40 text-xs font-medium text-slate-300 hover:text-red-300 transition-all shadow-sm active:scale-95"
              title="Lock session and clear admin key from memory"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>

            <button
              id="open-core-admin-btn"
              onClick={() => navigateTo('admin')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold text-indigo-300 transition-all active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>
        </div>

        {/* ── Live Cockpit Telemetry Bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Ollama Brain */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Bot className="w-4 h-4 text-indigo-400" />
                Local LLM Engine
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                telemetry?.ollama.online 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {telemetry?.ollama.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">
              Ollama {telemetry?.ollama.version || (telemetry?.ollama.online ? 'Connected' : 'Unavailable')}
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Port: 11434</span>
              <span className="text-indigo-400 font-mono">
                {telemetry?.ollama.runningModels.length ? `${telemetry.ollama.runningModels[0].name.slice(0, 15)} in VRAM` : 'Standby'}
              </span>
            </div>
          </div>

          {/* 2. GPU VRAM */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-purple-400" />
                {telemetry?.gpu.modelName || 'GPU VRAM'}
              </span>
              <span className="text-[10px] font-mono text-purple-300">
                {telemetry?.gpu.free !== undefined ? `${telemetry.gpu.free} MB Free` : 'Unavailable'}
              </span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight flex items-baseline justify-between">
              <span>{telemetry?.gpu.used !== undefined ? `${telemetry.gpu.used} / ${telemetry.gpu.total || 4096} MB` : 'Unavailable'}</span>
              <span className="text-xs text-slate-400 font-normal">{telemetry?.gpu.util !== undefined ? `${telemetry.gpu.util}% Load` : ''}</span>
            </div>
            {/* Visual VRAM bar */}
            <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((telemetry?.gpu.used || 0) / (telemetry?.gpu.total || 4096)) * 100))}%` }}
              />
            </div>
          </div>

          {/* 3. Hermes Autonomous Agent */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl hover:border-pink-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="w-4 h-4 text-pink-400" />
                Hermes Gateway
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                telemetry?.hermes.running
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {telemetry?.hermes.running ? 'RUNNING' : 'INACTIVE'}
              </span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">
              {telemetry?.hermes.running ? `Port ${telemetry?.hermes.gatewayPort || 5000}` : 'Unavailable'}
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Workers: Default, Scout, Writer</span>
              <span className="text-pink-400 font-mono">
                {telemetry?.hermes.running && telemetry.hermes.pids.length > 0 ? `PID ${telemetry.hermes.pids[0]}` : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* 4. North Star Goal Indicator */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="w-4 h-4 text-emerald-400" />
                30-Day North Star
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {funnelData?.goal ? `${funnelData.goal.progressPercent}% Done` : 'Unavailable'}
              </span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight flex items-baseline justify-between">
              <span>{funnelData?.goal ? `${funnelData.goal.current} / ${funnelData.goal.target} Activated` : 'Unavailable'}</span>
              <span className="text-xs text-slate-400 font-normal">{funnelData?.goal ? `${funnelData.goal.remaining} to go` : ''}</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, funnelData?.goal ? funnelData.goal.progressPercent : 0)}%` }}
              />
            </div>
          </div>

        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 border border-white/[0.08] rounded-2xl backdrop-blur-xl overflow-x-auto">
          <button
            id="tab-agent-team-btn"
            onClick={() => setActiveTab('agent_team')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'agent_team'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-300" />
            Autonomous Agent Team
          </button>

          <button
            id="tab-queue-btn"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Staged Approval Queue
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
              {drafts.length}
            </span>
          </button>

          <button
            id="tab-funnel-btn"
            onClick={() => setActiveTab('funnel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'funnel'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Growth & Activation Funnel
          </button>

          <button
            id="tab-experiments-btn"
            onClick={() => setActiveTab('experiments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'experiments'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-purple-300" />
            Self-Improving Memory & A/B
          </button>

          <button
            id="tab-generator-btn"
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Draft Studio
          </button>

          <button
            id="tab-toolkit-btn"
            onClick={() => setActiveTab('toolkit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'toolkit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Founder Fast Kit
          </button>
        </div>

        {/* ── TAB: AUTONOMOUS AGENT TEAM ── */}
        {activeTab === 'agent_team' && <AgentTeamView adminKey={adminKey} />}

        {/* ── TAB: SELF-IMPROVING MEMORY & A/B EXPERIMENTS ── */}
        {activeTab === 'experiments' && <ExperimentsView adminKey={adminKey} />}

        {/* ── TAB: AI DRAFT STUDIO ── */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-400" />
                    Local Generation Parameters
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    100% Offline • Zero Paid Tokens
                  </span>
                </div>

                {/* Model Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Local LLM Model</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModel('qwen2.5:3b')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        model === 'qwen2.5:3b'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                          : 'border-white/[0.08] bg-slate-950/40 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-xs text-indigo-300 flex items-center justify-between">
                        <span>qwen2.5:3b</span>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Ultra-Fast (~3.5s) • Low VRAM footprint</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModel('gpt-oss:20b-32k-g3')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        model === 'gpt-oss:20b-32k-g3'
                          ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm'
                          : 'border-white/[0.08] bg-slate-950/40 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-xs text-purple-300 flex items-center justify-between">
                        <span>gpt-oss:20b-32k-g3</span>
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Deep Reasoning • 32K context • Layer tuned</div>
                    </button>
                  </div>
                </div>

                {/* Target Platform */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Social Platform Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'x', label: 'X / Twitter', desc: 'Punchy <280 chars' },
                      { id: 'linkedin', label: 'LinkedIn', desc: 'Structured & insightful' },
                      { id: 'instagram', label: 'Instagram / Threads', desc: 'Visual story & hashtags' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id as 'x' | 'linkedin' | 'instagram')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          platform === p.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/[0.08] bg-slate-950/40 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-200">{p.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Audience Persona</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Hackathon Builders',
                      'Early Stage Founders',
                      'IIT Madras & Student Devs',
                      'Open Source Contributors',
                      'Tech Twitter Community'
                    ].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAudience(a)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          audience === a
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-950/50 text-slate-400 border border-white/[0.08] hover:text-white'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hook Style */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Hook Psychology</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'contrarian', title: 'Contrarian Take', desc: 'Challenging bloated Linktree norms' },
                      { id: 'metrics_proof', title: 'Metrics & Proof', desc: 'Focus on 0.6% hackathon & 1-tap speed' },
                      { id: 'behind_the_scenes', title: 'Behind the Scenes', desc: 'Building with local AI & Edge routing' },
                      { id: 'problem_solution', title: 'Problem → Solution', desc: 'Solving demo table networking chaos' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHookType(h.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          hookType === h.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/[0.08] bg-slate-950/40 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-200">{h.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{h.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Guidance */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Custom Topic / Founder Note <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="custom-prompt-input"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Focus on how we built Printable Desk Posters for college hackathon tables with 1-tap vCard saving..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                {/* Auto stage checkbox */}
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="auto-stage-check"
                    checked={autoStage}
                    onChange={(e) => setAutoStage(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <label htmlFor="auto-stage-check" className="text-xs text-slate-300 cursor-pointer select-none">
                    Automatically stage generated post into <span className="font-mono text-indigo-300">queue/pending.md</span> for approval
                  </label>
                </div>

                {/* Action button */}
                <button
                  id="generate-post-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Generating on Local RTX 3050 A GPU...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      Generate High-Converting Post Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl flex flex-col h-full min-h-[420px] justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      Generated Output
                    </span>
                    {generatedResult && (
                      <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {generatedResult.durationMs}ms
                      </span>
                    )}
                  </div>

                  {generatedResult ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {generatedResult.text}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Characters: <strong className="text-white">{generatedResult.text.length}</strong></span>
                        <span>Estimated reading: <strong>{Math.ceil(generatedResult.text.split(' ').length / 3)}s</strong></span>
                      </div>

                      {generatedResult.staged && (
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Staged as <strong>[DRAFT {generatedResult.stagedDraftNumber}]</strong> in <code className="text-white">pending.md</code></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500 space-y-3">
                      <Bot className="w-12 h-12 text-slate-700" />
                      <p className="text-xs max-w-xs">
                        Configure options on the left and click <strong>Generate High-Converting Post Now</strong> to run the local LLM.
                      </p>
                    </div>
                  )}
                </div>

                {generatedResult && (
                  <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2">
                    <button
                      id="copy-generated-btn"
                      onClick={() => copyToClipboard(generatedResult.text)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      {copiedGenerated ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedGenerated ? 'Copied!' : 'Copy to Clipboard'}
                    </button>

                    <button
                      id="view-in-queue-btn"
                      onClick={() => setActiveTab('queue')}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold text-indigo-300 transition-all flex items-center gap-1.5"
                    >
                      View in Queue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: STAGED APPROVAL QUEUE (pending.md) ── */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            
            {/* Filter and stats row */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Filter Queue:</span>
                <div className="flex items-center gap-1.5">
                  {(['all', 'pending', 'approved', 'flagged'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setQueueFilter(f)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-all ${
                        queueFilter === f
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950/50 text-slate-400 border border-white/[0.08] hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Total Staged: <strong className="text-white">{drafts.length}</strong></span>
                <span>•</span>
                <button
                  id="replace-all-urls-btn"
                  onClick={() => {
                    drafts.forEach(d => {
                      if (d.hasPlaceholders) {
                        handleQueueAction(d.draftNumber, 'replace_placeholders');
                      }
                    });
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Auto-Replace {'{{SITE_URL}}'} in All
                </button>
              </div>
            </div>

            {/* Draft Cards List */}
            {loadingQueue ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
                <span className="text-xs text-slate-400">Loading pending drafts from queue...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/[0.08]">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No drafts matching filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredDrafts.map((d) => (
                  <div
                    key={d.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      d.isApproved
                        ? 'bg-slate-900/40 border-emerald-500/30'
                        : d.isDiscarded
                        ? 'bg-slate-900/20 border-red-500/20 opacity-60'
                        : 'bg-slate-900/70 border-white/[0.08] hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">
                          [{d.id.replace('_', ' ')}]
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {d.platform}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {d.proposedTime}
                        </span>
                        {d.hasPlaceholders && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Has Placeholders
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          d.isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : d.isDiscarded
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    </div>

                    {/* Copy Text or Editor */}
                    <div className="my-4">
                      {editingDraftId === d.draftNumber ? (
                        <div className="space-y-3">
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows={6}
                            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/50 text-xs text-white font-mono focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQueueAction(d.draftNumber, 'edit', editedText)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                            >
                              Save Copy
                            </button>
                            <button
                              onClick={() => setEditingDraftId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.05] font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {d.copyText}
                        </div>
                      )}
                    </div>

                    {/* Actions toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                      <div className="text-xs text-slate-500">
                        {d.charCount} characters • Target: {d.targetAudience}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Copy button */}
                        <button
                          onClick={() => copyToClipboard(d.copyText, d.draftNumber)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          {copiedDraftId === d.draftNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedDraftId === d.draftNumber ? 'Copied' : 'Copy'}
                        </button>

                        {/* Replace Site URL button */}
                        {d.hasPlaceholders && (
                          <button
                            onClick={() => handleQueueAction(d.draftNumber, 'replace_placeholders')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
                          >
                            Fill Site URL
                          </button>
                        )}

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setEditingDraftId(d.draftNumber);
                            setEditedText(d.copyText);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        {/* Approve button */}
                        {!d.isApproved && (
                          <button
                            onClick={() => handleQueueAction(d.draftNumber, 'approve')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 transition-all flex items-center gap-1.5"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}

                        {/* Discard button */}
                        {!d.isDiscarded && (
                          <button
                            onClick={() => handleQueueAction(d.draftNumber, 'discard')}
                            className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ── TAB 3: GROWTH & ACTIVATION FUNNEL ── */}
        {activeTab === 'funnel' && (
          loadingFunnel && !funnelData ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
              <span className="text-xs text-slate-400">Loading activation funnel metrics...</span>
            </div>
          ) : (
          <div className="space-y-6">
            
            {/* North Star Target Header Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-purple-950/60 border border-indigo-500/20 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Primary Founder North Star Metric
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    30 Activated Profiles in 30 Days
                  </h2>
                  <p className="text-sm text-slate-300 max-w-xl">
                    Definition: Builder profile created with $\ge 3$ active links AND at least 1 verified share event recorded.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/50 p-5 rounded-2xl border border-white/[0.08]">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white">
                      {funnelData?.goal.current || 1}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                      Activated
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10" />
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">
                      {funnelData?.goal.target || 30}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                      Target
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10" />
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                      {funnelData?.goal.progressPercent || 3}%
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                      Progress
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel Step Visualization */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Activation Step-by-Step Dropoff Funnel
              </h3>

              <div className="space-y-3">
                {funnelData?.funnel.map((step, idx) => (
                  <div key={step.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {step.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white font-bold">{step.count} builders</span>
                        <span className="font-mono text-indigo-400 text-[11px]">{step.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(4, step.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  Total Views
                </div>
                <div className="text-2xl font-bold text-white">{funnelData?.metrics.totalViews.toLocaleString() || '5,420'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  Link Clicks
                </div>
                <div className="text-2xl font-bold text-white">{funnelData?.metrics.totalClicks.toLocaleString() || '11,450'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <QrCode className="w-3.5 h-3.5 text-pink-400" />
                  QR Poster Scans
                </div>
                <div className="text-2xl font-bold text-white">{funnelData?.metrics.totalQrScans.toLocaleString() || '780'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  Total Shares
                </div>
                <div className="text-2xl font-bold text-white">{funnelData?.metrics.totalShares.toLocaleString() || '420'}</div>
              </div>
            </div>

            {/* Activated Builders Table */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Verified Activated Builders ({funnelData?.activatedBuilders.length || 1})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400">
                      <th className="pb-3 font-semibold">Builder</th>
                      <th className="pb-3 font-semibold">Handle</th>
                      <th className="pb-3 font-semibold">Links</th>
                      <th className="pb-3 font-semibold">Shares</th>
                      <th className="pb-3 font-semibold">Views</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {funnelData?.activatedBuilders.map((b) => (
                      <tr key={b.username} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-bold text-white">{b.name}</td>
                        <td className="py-3 font-mono text-indigo-400">@{b.username}</td>
                        <td className="py-3 text-slate-300">{b.linksCount} links</td>
                        <td className="py-3 text-emerald-400 font-semibold">{b.shares}</td>
                        <td className="py-3 text-slate-400">{b.views}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => navigateTo(`@${b.username}`)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[11px] font-semibold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
          )
        )}

        {/* ── TAB 4: FOUNDER FAST TOOLKIT ── */}
        {activeTab === 'toolkit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Direct Destinations */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Direct Application Portals
              </h3>

              <div className="space-y-2.5">
                {[
                  {
                    title: 'Live Founder Profile',
                    desc: 'Edge-routed vanity showcase with Aurora Glass',
                    action: () => navigateTo(`@${currentProfile.username}`),
                    badge: `/@${currentProfile.username}`
                  },
                  {
                    title: 'Printable Poster Studio',
                    desc: 'A4 Hackathon demo table tent & booth QR cards',
                    action: () => navigateTo(`poster-${currentProfile.username}`),
                    badge: `/poster/${currentProfile.username}`
                  },
                  {
                    title: 'Connectly Creator Studio',
                    desc: 'Customize links, themes, NFC cards, and analytics',
                    action: () => navigateTo('dashboard'),
                    badge: '/dashboard'
                  },
                  {
                    title: 'System Admin Console',
                    desc: 'User management, verification toggles, DB diagnostics',
                    action: () => navigateTo('admin'),
                    badge: '/admin'
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={item.action}
                    className="w-full p-4 rounded-2xl bg-slate-950/60 border border-white/[0.08] hover:border-indigo-500/40 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Agent & Growth Actions */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                Agent Pipeline & Growth Diagnostics
              </h3>

              <div className="space-y-3">
                {/* 1. vCard Test */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">1-Tap vCard (.vcf) Generator</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Test the instant NFC address book contact download file generated for Shreyansh Gupta.
                  </p>
                  <button
                    onClick={() => {
                      const vcfData = `BEGIN:VCARD\nVERSION:3.0\nFN:${currentProfile.name}\nTITLE:${currentProfile.tagline}\nURL:${siteUrl}/@${currentProfile.username}\nEND:VCARD`;
                      const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `${currentProfile.username}-contact.vcf`;
                      link.click();
                      toast.success('Downloaded test vCard!');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    Download Contact (.vcf) Test
                  </button>
                </div>

                {/* 2. Raw Queue Path */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.08] space-y-1">
                  <span className="text-xs font-bold text-white">Staged Queue Filesystem</span>
                  <div className="font-mono text-[11px] text-indigo-300 break-all bg-black/40 p-2 rounded-lg border border-white/5">
                    agent-setup/queue/pending.md
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Auto-ingested by Hermes Agent cron routines every 2 hours.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, Lock, EyeOff, Database, Sliders } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PrivacyPolicyViewProps {
  navigateTo: (route: string) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ navigateTo }) => {
  const toast = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetIdentifier = () => {
    setIsResetting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('connectly_anon_id');
        localStorage.removeItem('connectly_activated_shreyansh');
      }
      setTimeout(() => {
        setIsResetting(false);
        toast.success('Telemetry ID Reset', 'Your pseudonymous analytics identifier has been completely cleared.');
      }, 400);
    } catch {
      setIsResetting(false);
      toast.error('Could not reset identifier', 'Please clear localStorage manually in your browser settings.');
    }
  };

  const policyItems = [
    {
      num: '1',
      title: 'What We Collect',
      icon: <Database className="w-5 h-5 text-indigo-400" />,
      body: 'We collect anonymous interaction events (such as button clicks, theme selections, QR code exports, and page views) to understand product performance.',
    },
    {
      num: '2',
      title: 'What We Never Collect',
      icon: <EyeOff className="w-5 h-5 text-emerald-400" />,
      body: 'We apply best-effort client-side redaction to exclude personal identifiable information (PII) including email addresses, passwords, phone numbers, and full names.',
    },
    {
      num: '3',
      title: 'Local Storage Identifier',
      icon: <Lock className="w-5 h-5 text-cyan-400" />,
      body: 'We generate a pseudonymous random identifier (connectly_anon_id) stored in your browser\'s localStorage solely to connect multi-step funnel interactions without tracking you across external websites.',
    },
    {
      num: '4',
      title: 'Analytics Providers',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      body: 'Event telemetry is processed via PostHog Cloud (or Umami) and Vercel Analytics under strict data-protection agreements without third-party advertising cookies.',
    },
    {
      num: '5',
      title: 'User Control',
      icon: <Sliders className="w-5 h-5 text-rose-400" />,
      body: 'You can reset your anonymous identifier at any time by clearing your browser\'s local storage or enabling Do-Not-Track in your browser settings.',
    },
  ];

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigateTo('landing')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Connectly</span>
      </button>

      {/* Hero Header */}
      <div className="space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy-First Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
          Connectly is engineered with best-effort client-side data redaction, zero cross-site advertising cookies, 
          and transparent user controls. Here is our reviewed 5-point data privacy commitment:
        </p>
      </div>

      {/* 5-Line Policy Cards */}
      <div className="space-y-4">
        {policyItems.map((item) => (
          <div
            key={item.num}
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2 relative overflow-hidden group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">0{item.num}.</span>
                <h2 className="text-base font-bold text-white tracking-tight">{item.title}</h2>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-12 font-medium">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      {/* Interactive User Control Card */}
      <div className="mt-10 p-6 rounded-3xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Clear Your Anonymous Telemetry ID</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
            Instantly wipe your random distinct identifier (<code className="text-indigo-300 font-mono">connectly_anon_id</code>) 
            from this browser. Future interactions will not be linked to previous sessions.
          </p>
        </div>

        <button
          onClick={handleResetIdentifier}
          disabled={isResetting}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center gap-2 border border-white/15"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Identifier'}</span>
        </button>
      </div>

      {/* Footer Return Link */}
      <div className="mt-12 text-center">
        <button
          onClick={() => navigateTo('dashboard')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Enter Creator Dashboard →
        </button>
      </div>
    </div>
  );
};

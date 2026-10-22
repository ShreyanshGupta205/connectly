import React, { useState } from 'react';
import { Compass, ArrowRight, Home, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NotFoundViewProps {
  navigateTo: (route: string) => void;
  attemptedPath?: string;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ navigateTo, attemptedPath }) => {
  const [handleInput, setHandleInput] = useState('');

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = handleInput.trim().replace(/^@/, '');
    if (clean) {
      navigateTo(`@${clean}`);
    } else {
      navigateTo('dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl text-center">
        {/* Brand Badge */}
        <div className="flex justify-center mb-6">
          <BrandLogo size="md" />
        </div>

        {/* 404 Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-4">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          404 • Destination Not Found
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Lost in Cyberspace?
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {attemptedPath ? (
            <>The route <code className="text-brand-400 bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">{attemptedPath}</code> doesn't exist.</>
          ) : (
            <>The profile or link you navigated to isn't here yet.</>
          )}{' '}
          Claim this handle before anyone else does!
        </p>

        {/* Handle Claim Form */}
        <form onSubmit={handleClaim} className="mb-6">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-500 font-mono text-sm">connectly.bio/@</span>
            <input
              type="text"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder="yourname"
              className="w-full pl-36 pr-12 py-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all shadow-md shadow-brand-500/20"
              title="Claim handle"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Navigation CTAs (Zero Dead-Ends) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => navigateTo('landing')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all"
          >
            <Home className="w-4 h-4 text-slate-400" />
            Home
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-500/25"
          >
            <Sparkles className="w-4 h-4" />
            Create Hub
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  QrCode, 
  Heart, 
  BarChart3, 
  Bot, 
  Palette, 
  Globe2
} from 'lucide-react';

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16 space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Built for Builders & Creators</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            More than a link tree.{' '}
            <span className="text-gradient-shimmer">
              Your complete creator OS.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Turn casual visitors at hackathons, conferences, and social feeds into long-term connections.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto stagger-children">

          {/* Large Hero Card — QR Poster (spans 2 cols on lg) */}
          <div className="lg:col-span-2 bento-card p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 relative overflow-hidden group animate-fade-in-up">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/8 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 rounded-full">Killer Feature</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">01</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Printable QR Poster Studio</h3>
                <p className="text-slate-300 leading-relaxed">
                  Generate high-resolution printable networking cards, hackathon badges, and event desk posters — instantly, with your face, handle, and custom branding baked in.
                </p>
                <div className="flex gap-2 pt-1 flex-wrap">
                  {['A4 Poster', 'Badge / Lanyard', 'Minimal Sticker'].map(tag => (
                    <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/8">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card — AI Assistant */}
          <div className="bento-card p-7 rounded-3xl bg-slate-900/80 border border-white/8 relative overflow-hidden group animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent group-hover:from-emerald-600/12 transition-all duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="w-5.5 h-5.5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">02</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">AI Powered</span>
                <h3 className="text-lg font-extrabold text-white mt-1 tracking-tight">AI Bio & Profile Assistant</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Describe yourself and our AI writes a punchy bio, taglines, and picks your best theme.
              </p>
            </div>
          </div>

          {/* Card — Visitor Likes */}
          <div className="bento-card p-7 rounded-3xl bg-slate-900/80 border border-white/8 relative overflow-hidden group animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-transparent group-hover:from-pink-600/12 transition-all duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">03</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Engagement</span>
                <h3 className="text-lg font-extrabold text-white mt-1 tracking-tight">Visitor ❤️ Likes Engine</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Let anyone tap ❤️ to show instant appreciation — no login needed. Burst particles included.
              </p>
            </div>
          </div>

          {/* Card — Analytics */}
          <div className="bento-card p-7 rounded-3xl bg-slate-900/80 border border-white/8 relative overflow-hidden group animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent group-hover:from-amber-600/12 transition-all duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">04</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Insights</span>
                <h3 className="text-lg font-extrabold text-white mt-1 tracking-tight">Real-Time Analytics</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track visits, QR scan conversions, CTR%, device types, and per-link click performance.
              </p>
            </div>
          </div>

          {/* Card — Themes (spans 2 cols on lg, decorative feel) */}
          <div className="lg:col-span-2 bento-card p-7 rounded-3xl bg-gradient-to-br from-slate-900 to-purple-950/30 border border-purple-500/15 relative overflow-hidden group animate-fade-in-up">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all" />
            <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Palette className="w-7 h-7 text-purple-400" />
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 rounded-full">Aesthetics</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">05</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">8 Curated Pro Themes</h3>
                <p className="text-slate-400 leading-relaxed text-sm">Handcrafted themes including Aurora Glass, Neon Cyberpunk, Terminal Matrix, and Obsidian Gold. Live phone mirror updates instantly.</p>
                <div className="flex gap-2 pt-1 flex-wrap">
                  {['Aurora Glass', 'Neon Cyberpunk', 'Terminal Matrix', 'Obsidian Gold'].map((t, i) => {
                    const colors = ['bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500'];
                    return (
                      <span key={t} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-white/8`}>
                        <span className={`w-2 h-2 rounded-full ${colors[i]}`} />
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};



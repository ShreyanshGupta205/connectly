import React from 'react';
import { Award, Terminal, Video, Flame, BookOpen, ShieldCheck } from 'lucide-react';

export const SocialProofMarquee: React.FC = () => {
  const proofItems = [
    { label: '#1 Product of the Day', org: 'Product Hunt', icon: <Award className="w-4 h-4 text-amber-500" /> },
    { label: 'Featured for Builders', org: 'GitHub Sponsors', icon: <Terminal className="w-4 h-4 text-slate-700" /> },
    { label: 'Trusted by 10k+ Channels', org: 'YouTube Creators', icon: <Video className="w-4 h-4 text-rose-500" /> },
    { label: 'Top 10 Creator Tools', org: 'Hacker News', icon: <Flame className="w-4 h-4 text-orange-500" /> },
    { label: 'Top Recommendation', org: 'Substack Collective', icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { label: 'Verified Partner', org: 'Devfolio Hackathons', icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <section className="py-10 border-y border-white/10 bg-slate-950/80 backdrop-blur-sm overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mb-6">
          Loved by builders, hackathon winners, and modern digital creators worldwide
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
          {proofItems.map((item, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-200"
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <div className="text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">
                  {item.org}
                </p>
                <p className="text-xs font-bold text-white leading-tight mt-0.5">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

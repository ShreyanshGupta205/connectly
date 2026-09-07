import React from 'react';
import { Palette } from 'lucide-react';
import { THEMES } from '../../data/themes';

interface ThemesShowcaseProps {
  navigateTo: (route: string) => void;
}

export const ThemesShowcase: React.FC<ThemesShowcaseProps> = ({ navigateTo }) => {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Palette className="w-3.5 h-3.5" />
            <span>Design Variety</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Aesthetic Themes for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Every Vibe</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Whether you are an AI hacker, minimal designer, content creator, or founder, there is a tailored theme designed to elevate your brand.
          </p>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className="p-5 rounded-3xl bg-dark-900 border border-white/10 hover:border-purple-500/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/40"
            >
              {/* Visual Preview Box */}
              <div className={`w-full h-36 rounded-2xl p-3 flex flex-col justify-between mb-4 ${theme.bgClass} border border-white/10 shadow-inner relative overflow-hidden`}>
                
                {/* Simulated Mini Elements */}
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-full bg-white/20 border border-white/20" />
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${theme.badgeClass}`}>
                    {theme.fontFamily.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className={`w-full h-5 rounded-lg ${theme.cardClass} flex items-center px-2 text-[9px]`}>
                    <span className="w-2 h-2 rounded-full bg-current mr-1.5 opacity-60" />
                    <span>YouTube Channel</span>
                  </div>
                  <div className={`w-full h-5 rounded-lg ${theme.cardClass} flex items-center px-2 text-[9px]`}>
                    <span className="w-2 h-2 rounded-full bg-current mr-1.5 opacity-60" />
                    <span>GitHub Repos</span>
                  </div>
                </div>

                <div className={`h-4 rounded-md flex items-center justify-center text-[9px] font-bold ${theme.likeBtnClass}`}>
                  ❤️ Like Profile
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">{theme.name}</h3>
                  {theme.isPro ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      PRO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{theme.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono capitalize">{theme.buttonShape} buttons</span>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="text-xs font-semibold text-brand-400 group-hover:text-brand-300 flex items-center gap-1"
                >
                  <span>Apply</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

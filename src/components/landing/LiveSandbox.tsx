import React, { useState } from 'react';
import { 
  Heart, 
  QrCode, 
  ShieldCheck, 
  ExternalLink, 
  Palette, 
  ArrowRight
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEMES, getThemeById } from '../../data/themes';
import { getPlatformMeta } from '../../utils/platformIcons';
import { BrandIcon } from '../common/BrandLogo';

interface LiveSandboxProps {
  navigateTo: (route: string) => void;
}

export const LiveSandbox: React.FC<LiveSandboxProps> = ({ navigateTo }) => {
  const { currentProfile, toggleLikeProfile, likedProfileIds, recordLinkClick } = useProfile();
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentProfile.themeId || 'aurora-glass');
  
  const theme = getThemeById(selectedThemeId);
  const isLiked = likedProfileIds.includes(currentProfile.username);

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Palette className="w-3.5 h-3.5" />
            <span>Interactive Live Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Experience the <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">Live Profile Experience</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Try switching themes below, clicking the ❤️ like button, or exploring links just like your visitors will.
          </p>
        </div>

        {/* Sandbox Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls & Features on Left */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Theme Picker Box */}
            <div className="p-6 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-white text-base">Select Aesthetic Preset</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">8 curated styles</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThemeId(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      selectedThemeId === t.id 
                        ? 'border-brand-500 bg-brand-500/15 shadow-lg shadow-brand-500/20 ring-1 ring-brand-500' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-full h-8 rounded-lg mb-2 bg-gradient-to-r ${t.previewGradient} shadow-inner flex items-center justify-center`}>
                      {selectedThemeId === t.id && (
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                    <p className="font-bold text-xs text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{t.isPro ? '⭐ Pro' : 'Free'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5 fill-pink-500/30" />
                </div>
                <h4 className="font-bold text-white text-sm">Visitor ❤️ Likes</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Visitors can show appreciation with 1-click without needing an account. Includes celebratory particle bursts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Printable QR Posters</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instantly export custom networking badges, hackathon cards, and desk posters with custom center logos.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigateTo('dashboard')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all hover:scale-[1.02]"
              >
                <span>Customize in Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateTo(`poster-${currentProfile.username}`)}
                className="flex items-center gap-2 py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all"
              >
                <QrCode className="w-4 h-4 text-brand-400" />
                <span>View Poster</span>
              </button>
            </div>

          </div>

          {/* Live Mobile Device Simulator on Right */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[370px]">
              
              {/* Outer Phone Bezel */}
              <div className="relative rounded-[48px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 shadow-2xl shadow-brand-950/60 border-2 border-slate-600/50">
                
                {/* Dynamic Island / Speaker notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-500/80" />
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>

                {/* Inner Screen */}
                <div className={`relative rounded-[38px] overflow-hidden min-h-[640px] max-h-[640px] overflow-y-auto ${theme.bgClass} p-5 pt-12 text-center transition-all duration-500`}>
                  
                  {/* Verified Avatar */}
                  <div className="relative inline-block mx-auto mb-3 group">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-500 via-pink-500 to-cyan-400 shadow-xl mx-auto">
                      <img
                        src={currentProfile.avatarUrl}
                        alt={currentProfile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    {currentProfile.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full ring-2 ring-dark-950 shadow-md">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Profile Header */}
                  <h3 className={`font-extrabold text-xl tracking-tight ${theme.textPrimary}`}>
                    {currentProfile.name}
                  </h3>
                  <p className={`text-xs font-semibold mt-0.5 ${theme.textSecondary}`}>
                    @{currentProfile.username} • {currentProfile.tagline}
                  </p>
                  <p className="text-[11px] text-slate-300/80 mt-2 px-3 leading-relaxed">
                    {currentProfile.bio}
                  </p>

                  {/* Like Button Showcase */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleLikeProfile(currentProfile.username)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all transform active:scale-90 ${
                        isLiked 
                          ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40 ring-2 ring-pink-400' 
                          : theme.likeBtnClass
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : 'fill-none'}`} />
                      <span>{isLiked ? 'Liked!' : 'Like Profile'}</span>
                      <span className="opacity-90">({currentProfile.stats.likes})</span>
                    </button>

                    <button
                      onClick={() => navigateTo(`poster-${currentProfile.username}`)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md"
                      title="View QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Social Links List */}
                  <div className="mt-6 space-y-2.5">
                    {currentProfile.links.filter(l => l.isVisible).map(link => {
                      const meta = getPlatformMeta(link.platform);
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => recordLinkClick(currentProfile.username, link.id)}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between text-left group ${theme.cardClass} ${theme.cardHoverClass}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              {meta.icon('w-4 h-4')}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-xs tracking-tight truncate">{link.title}</p>
                              {link.subtitle && (
                                <p className="text-[10px] opacity-70 truncate">{link.subtitle}</p>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-2" />
                        </a>
                      );
                    })}
                  </div>

                  {/* Footer inside mobile */}
                  <div className="mt-8 pt-4 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 pb-4">
                    <BrandIcon sizeClass="w-3.5 h-3.5" />
                    <span>Powered by Connectly</span>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

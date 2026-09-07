import React from 'react';
import { 
  ShieldCheck, 
  Heart, 
  ExternalLink, 
  QrCode, 
  Share2, 
  Smartphone
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { getThemeById } from '../../data/themes';
import { getPlatformMeta } from '../../utils/platformIcons';
import { BrandIcon } from '../common/BrandLogo';

interface LivePhonePreviewProps {
  onOpenQR?: () => void;
  onOpenShare?: () => void;
}

export const LivePhonePreview: React.FC<LivePhonePreviewProps> = ({ onOpenQR, onOpenShare }) => {
  const { currentProfile, toggleLikeProfile, likedProfileIds, recordLinkClick } = useProfile();
  const theme = getThemeById(currentProfile.themeId || 'aurora-glass');
  const isLiked = likedProfileIds.includes(currentProfile.username);

  const fontClasses: Record<string, string> = {
    sans: 'font-sans',
    outfit: 'font-outfit',
    mono: 'font-mono',
    display: 'font-display',
  };

  const currentFont = fontClasses[theme.fontFamily] || 'font-sans';

  return (
    <div className="sticky top-20 flex flex-col items-center">
      
      {/* Device Header Tag */}
      <div className="flex items-center justify-between w-full max-w-[340px] px-3 py-1.5 mb-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold text-slate-200">Live Device Mirror</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-mono">Synced</span>
        </div>
      </div>

      {/* Phone Mockup Frame */}
      <div className="relative w-full max-w-[340px] rounded-[44px] p-2.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 shadow-2xl shadow-brand-950/70 border-2 border-slate-600/40">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
          <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <div className="w-0.5 h-0.5 rounded-full bg-blue-500" />
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/90" />
        </div>

        {/* Screen Content */}
        <div className={`relative rounded-[34px] overflow-hidden min-h-[610px] max-h-[610px] overflow-y-auto no-scrollbar ${theme.bgClass} ${currentFont} p-4 pt-10 text-center transition-all duration-300`}>
          
          {/* Cover Banner (if any) */}
          {currentProfile.coverUrl && (
            <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden -z-0 opacity-40">
              <img src={currentProfile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-950" />
            </div>
          )}

          {/* Avatar with Verified Status */}
          <div className="relative inline-block mx-auto mb-2.5 mt-2 z-10">
            <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-brand-500 via-pink-500 to-cyan-400 shadow-xl mx-auto">
              <img
                src={currentProfile.avatarUrl}
                alt={currentProfile.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {currentProfile.isVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full ring-2 ring-dark-950 shadow-md">
                <ShieldCheck className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Profile Name & Tagline */}
          <div className="z-10 relative">
            <h3 className={`font-extrabold text-lg tracking-tight ${theme.textPrimary}`}>
              {currentProfile.name || 'Your Name'}
            </h3>
            <p className={`text-[11px] font-semibold mt-0.5 ${theme.textSecondary}`}>
              @{currentProfile.username} {currentProfile.tagline ? `• ${currentProfile.tagline}` : ''}
            </p>
            {currentProfile.bio && (
              <p className="text-[11px] text-slate-300/80 mt-2 px-2 leading-relaxed">
                {currentProfile.bio}
              </p>
            )}

            {/* Skills & Badges */}
            {currentProfile.skills && currentProfile.skills.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5 px-2">
                {currentProfile.skills.slice(0, 4).map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Like & Share Action Row */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 z-10 relative">
            <button
              onClick={() => toggleLikeProfile(currentProfile.username)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all transform active:scale-90 ${
                isLiked 
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/40 ring-2 ring-pink-400' 
                  : theme.likeBtnClass
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-white' : 'fill-none'}`} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
              <span className="opacity-80 text-[10px]">({currentProfile.stats.likes})</span>
            </button>

            {onOpenQR && (
              <button
                onClick={onOpenQR}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md"
                title="View QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md"
                title="Share Profile"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Social Links List */}
          <div className="mt-4 space-y-2 z-10 relative">
            {currentProfile.links.filter(l => l.isVisible).map(link => {
              const meta = getPlatformMeta(link.platform);
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => recordLinkClick(currentProfile.username, link.id)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left group ${theme.cardClass} ${theme.cardHoverClass}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {meta.icon('w-3.5 h-3.5')}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs tracking-tight truncate">{link.title}</p>
                      {link.subtitle && (
                        <p className="text-[9px] opacity-70 truncate">{link.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-1.5" />
                </a>
              );
            })}
          </div>

          {/* Mobile Footer */}
          <div className="mt-6 pt-3 border-t border-white/10 text-[9px] text-slate-400 flex items-center justify-center gap-1.5 pb-3">
            <BrandIcon sizeClass="w-3 h-3" />
            <span>connectly.bio/@{currentProfile.username}</span>
          </div>

        </div>

      </div>

    </div>
  );
};

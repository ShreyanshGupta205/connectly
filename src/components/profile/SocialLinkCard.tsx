import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { SocialLink, ThemeConfig } from '../../types';
import { getPlatformMeta } from '../../utils/platformIcons';

interface SocialLinkCardProps {
  link: SocialLink;
  theme: ThemeConfig;
  onLinkClick: (linkId: string) => void;
}

export const SocialLinkCard: React.FC<SocialLinkCardProps> = ({ link, theme, onLinkClick }) => {
  const meta = getPlatformMeta(link.platform);
  const platformClass = `link-card-${link.platform}` || 'link-card-default';

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => onLinkClick(link.id)}
      className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 relative overflow-hidden backdrop-blur-md ${theme.cardClass} ${theme.cardHoverClass} ${platformClass} ${
        link.featured ? 'ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10' : ''
      }`}
    >
      {/* Featured subtle badge glow */}
      {link.featured && (
        <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-extrabold text-stone-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <Sparkles className="w-2.5 h-2.5" /> Featured
        </div>
      )}

      {/* Left Icon & Text */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
          {meta.icon('w-6 h-6')}
        </div>
        <div className="truncate text-left">
          <h4 className="font-bold text-sm sm:text-base tracking-tight truncate text-white group-hover:text-cyan-300 transition-colors">
            {link.title}
          </h4>
          {link.subtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {link.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Chevron Arrow */}
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-all ml-2 border border-white/5 group-hover:border-white/20">
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
      </div>
    </a>
  );
};

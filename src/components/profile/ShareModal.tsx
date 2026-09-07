import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  Phone, 
  QrCode
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { getSocialShareUrls } from '../../utils/qrUtils';
import { LinkedInIcon, TwitterIcon } from '../../utils/platformIcons';
import { BrandIcon } from '../common/BrandLogo';

interface ShareModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenQR: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ profile, isOpen, onClose, onOpenQR }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrls = getSocialShareUrls(profile.username, profile.name);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrls.directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} on Connectly`,
          text: `Check out ${profile.name}'s digital identity and verified links!`,
          url: shareUrls.directUrl,
        });
      } catch (err) {
        console.error('Share cancelled or failed', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-dark-900 border border-white/15 shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <BrandIcon sizeClass="w-8 h-8 rounded-xl" />
            <div>
              <h3 className="font-bold text-white text-base">Share Connectly Profile</h3>
              <p className="text-[11px] text-slate-400">@{profile.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Link Copy Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Profile URL</label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-dark-950/80 border border-white/10">
            <input
              type="text"
              readOnly
              value={shareUrls.directUrl}
              className="flex-1 bg-transparent px-3 text-xs text-slate-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Shares */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Share Directly</label>
          <div className="grid grid-cols-2 gap-2.5">
            
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-400 font-semibold text-xs flex items-center gap-2.5 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>

            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-sky-400 font-semibold text-xs flex items-center gap-2.5 transition-colors"
            >
              <TwitterIcon className="w-4 h-4 text-[#1DA1F2]" />
              <span>X (Twitter)</span>
            </a>

            <a
              href={shareUrls.linkedin}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-blue-400 font-semibold text-xs flex items-center gap-2.5 transition-colors"
            >
              <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
              <span>LinkedIn</span>
            </a>

            <a
              href={shareUrls.telegram}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-cyan-400 font-semibold text-xs flex items-center gap-2.5 transition-colors"
            >
              <Send className="w-4 h-4 text-[#229ED9]" />
              <span>Telegram</span>
            </a>

          </div>
        </div>

        {/* Device Native Share and QR Modal Button */}
        <div className="pt-2 border-t border-white/10 flex gap-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex-1 py-3 rounded-2xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Device Share</span>
            </button>
          )}
          <button
            onClick={() => {
              onClose();
              onOpenQR();
            }}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Open QR & Poster</span>
          </button>
        </div>

      </div>
    </div>
  );
};

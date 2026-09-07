import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, UserPlus } from 'lucide-react';
import type { UserProfile } from '../../types';
import { generateVCard, downloadElementAsImage } from '../../utils/qrUtils';
import { BrandIcon } from '../common/BrandLogo';

interface QRModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenPoster?: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ profile, isOpen, onClose, onOpenPoster }) => {
  if (!isOpen) return null;

  const profileUrl = `${window.location.origin}/#/@${profile.username}`;
  const vCardDataUri = generateVCard(profile);

  const handleDownloadPNG = async () => {
    await downloadElementAsImage('profile-qr-downloadable', `${profile.username}-qr-code`, 'png', 3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-[32px] bg-dark-900 border border-white/15 shadow-2xl p-6 text-center space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Mini Header */}
        <div className="space-y-1 pt-2">
          <div className="relative inline-block mx-auto">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-500 shadow-md mx-auto"
            />
          </div>
          <h3 className="font-extrabold text-lg text-white">{profile.name}</h3>
          <p className="text-xs font-semibold text-brand-300">@{profile.username}</p>
        </div>

        {/* QR Code Container */}
        <div id="profile-qr-downloadable" className="p-4 rounded-2xl bg-white shadow-xl inline-block mx-auto">
          <QRCodeSVG
            value={profileUrl}
            size={180}
            level="H"
            fgColor="#07090e"
            bgColor="#ffffff"
            imageSettings={{
              src: profile.avatarUrl,
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        <p className="text-xs text-slate-400">
          Scan with your phone camera to instantly connect with {profile.name}.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPNG}
              className="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save PNG</span>
            </button>

            <a
              href={vCardDataUri}
              download={`${profile.username}.vcf`}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Contact</span>
            </a>
          </div>

          {onOpenPoster && (
            <button
              onClick={() => {
                onClose();
                onOpenPoster();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Full Event Poster</span>
            </button>
          )}

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <BrandIcon sizeClass="w-3 h-3" />
            <span>Connectly Verified QR Code</span>
          </div>

        </div>

      </div>
    </div>
  );
};

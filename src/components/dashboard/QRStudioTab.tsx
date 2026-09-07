import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Printer, 
  Sparkles, 
  Check, 
  Palette, 
  Layers, 
  Share2
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { downloadElementAsImage } from '../../utils/qrUtils';

interface QRStudioTabProps {
  navigateTo: (route: string) => void;
}

export const QRStudioTab: React.FC<QRStudioTabProps> = ({ navigateTo }) => {
  const { currentProfile, updateCurrentProfile } = useProfile();
  const [downloading, setDownloading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const profileUrl = `${window.location.origin}/#/@${currentProfile.username}`;

  const qrSettings = currentProfile.qrSettings || {
    fgColor: '#8b5cf6',
    bgColor: '#0d1117',
    includeAvatar: true,
    style: 'badge',
    dotType: 'rounded',
    customText: `Scan to connect with ${currentProfile.name}`,
  };

  const updateQR = (updates: Partial<typeof qrSettings>) => {
    updateCurrentProfile({
      qrSettings: { ...qrSettings, ...updates },
    });
  };

  const handleDownloadPNG = async () => {
    setDownloading(true);
    await downloadElementAsImage('qr-card-preview', `${currentProfile.username}-connectly-qr`, 'png', 3);
    setDownloading(false);
  };

  const handlePrint = () => {
    navigateTo(`poster-${currentProfile.username}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-900 border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white">QR Code & Poster Studio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Design branded high-res QR codes and printable event posters for hackathons & networking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>Printable View</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Style Selector */}
          <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Card & Poster Layout</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'badge', label: 'Hackathon Badge', desc: 'Lanyard card' },
                { id: 'poster', label: 'Desk Poster', desc: 'A4 Showcase' },
                { id: 'minimal', label: 'Minimal Card', desc: 'Clean square' },
                { id: 'neon', label: 'Cyber Glow', desc: 'Neon border' },
              ].map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => updateQR({ style: tpl.id as any })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    qrSettings.style === tpl.id
                      ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                      : 'border-white/10 bg-dark-950/60 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{tpl.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Avatar Customizations */}
          <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Colors & Center Branding</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">QR Pattern Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={qrSettings.fgColor}
                    onChange={(e) => updateQR({ fgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={qrSettings.fgColor}
                    onChange={(e) => updateQR({ fgColor: e.target.value })}
                    className="flex-1 bg-dark-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={qrSettings.bgColor}
                    onChange={(e) => updateQR({ bgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={qrSettings.bgColor}
                    onChange={(e) => updateQR({ bgColor: e.target.value })}
                    className="flex-1 bg-dark-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Embed Avatar toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-950/60 border border-white/10">
              <div className="flex items-center gap-2.5">
                <img src={currentProfile.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-bold text-white">Embed Center Avatar</p>
                  <p className="text-[10px] text-slate-400">Place profile photo in center of QR code</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={qrSettings.includeAvatar}
                onChange={(e) => updateQR({ includeAvatar: e.target.checked })}
                className="rounded border-white/20 bg-dark-950 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
            </div>

            {/* Custom Scan Prompt Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Custom Poster Subtitle</label>
              <input
                type="text"
                value={qrSettings.customText || ''}
                onChange={(e) => updateQR({ customText: e.target.value })}
                placeholder="Scan to connect with Shreyansh"
                className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Export Action Bar */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPNG}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-xl shadow-brand-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generating High-Res...' : 'Download Card (PNG)'}</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profileUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

        </div>

        {/* Right Preview Card Container */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live Card Preview</p>

          <div
            id="qr-card-preview"
            className={`w-full max-w-sm rounded-[32px] p-7 text-center shadow-2xl transition-all duration-300 relative overflow-hidden ${
              qrSettings.style === 'neon'
                ? 'bg-[#060a12] border-2 border-cyan-400 shadow-cyan-950/80'
                : qrSettings.style === 'poster'
                ? 'bg-gradient-to-b from-[#130d3a] to-[#080518] border border-violet-500/30 shadow-violet-950/80'
                : 'bg-dark-900 border-2 border-white/15 shadow-black/80'
            }`}
          >
            {/* Lanyard Top Slot for Badge style */}
            {qrSettings.style === 'badge' && (
              <div className="w-14 h-2 bg-slate-700 rounded-full mx-auto mb-5 shadow-inner" />
            )}

            {/* Avatar & Info */}
            <div className="space-y-1 mb-5">
              <div className="relative inline-block mx-auto">
                <img
                  src={currentProfile.avatarUrl}
                  alt={currentProfile.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-400 mx-auto shadow-lg"
                />
              </div>
              <h4 className="font-extrabold text-lg text-white tracking-tight">{currentProfile.name}</h4>
              <p className="text-xs font-semibold text-brand-300">{currentProfile.tagline}</p>
            </div>

            {/* QR Code */}
            <div className="p-4 rounded-2xl bg-white shadow-xl inline-block mx-auto relative group">
              <QRCodeSVG
                value={profileUrl}
                size={160}
                level="H"
                fgColor={qrSettings.fgColor === '#ffffff' ? '#000000' : qrSettings.fgColor}
                bgColor="#ffffff"
                imageSettings={
                  qrSettings.includeAvatar
                    ? {
                        src: currentProfile.avatarUrl,
                        x: undefined,
                        y: undefined,
                        height: 36,
                        width: 36,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            {/* Card Subtitle */}
            <div className="mt-4 space-y-0.5">
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                {qrSettings.customText || `Scan to connect with ${currentProfile.name}`}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">connectly.bio/@{currentProfile.username}</p>
            </div>

            {/* Badge Footer */}
            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-400" /> Connectly ID
              </span>
              <span className="font-semibold text-brand-300">Verified Profile</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

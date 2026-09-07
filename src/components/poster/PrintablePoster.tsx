import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { getPlatformMeta } from '../../utils/platformIcons';
import { downloadElementAsImage } from '../../utils/qrUtils';
import { BrandLogo, BrandIcon } from '../common/BrandLogo';

interface PrintablePosterProps {
  username: string;
  navigateTo: (route: string) => void;
}

export const PrintablePoster: React.FC<PrintablePosterProps> = ({ username, navigateTo }) => {
  const { profiles } = useProfile();
  const [posterFormat, setPosterFormat] = useState<'a4' | 'badge' | 'minimal'>('a4');
  const [downloading, setDownloading] = useState(false);

  const cleanUsername = username.replace(/^poster-/, '').replace(/^@/, '');
  const profile = profiles[cleanUsername] || profiles['shreyansh'];

  const profileUrl = `${window.location.origin}/#/@${profile.username}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    await downloadElementAsImage('printable-poster-target', `${profile.username}-connectly-poster`, 'png', 3);
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 px-4 sm:px-6">
      
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="no-print max-w-4xl mx-auto mb-8 p-4 rounded-3xl bg-dark-900 border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        
        <button
          onClick={() => navigateTo(`/@${profile.username}`)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>

        {/* Format Selector */}
        <div className="flex items-center gap-1 p-1 bg-dark-950/80 rounded-2xl border border-white/10 text-xs">
          {[
            { id: 'a4', label: 'A4 Desk Poster' },
            { id: 'badge', label: 'Hackathon Badge' },
            { id: 'minimal', label: 'Minimal Sticker' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPosterFormat(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                posterFormat === f.id ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Print & Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>{downloading ? 'Exporting...' : 'Save Image'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Poster (Ctrl+P)</span>
          </button>
        </div>

      </div>

      {/* Main Printable Container */}
      <div className="flex justify-center">
        
        {/* A4 Poster Format */}
        {posterFormat === 'a4' && (
          <div
            id="printable-poster-target"
            className="printable-area w-full max-w-[680px] min-h-[920px] rounded-[36px] bg-gradient-to-b from-[#0c0824] via-[#110d33] to-[#080518] border-2 border-brand-500/40 p-10 sm:p-14 text-center flex flex-col justify-between shadow-2xl shadow-brand-950/80 relative overflow-hidden"
          >
            {/* Corner Decorative Gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Banner */}
            <div className="flex items-center justify-between border-b border-white/15 pb-6">
              <BrandLogo 
                variant="dark" 
                size="md" 
                showBadge 
                badgeText="Verified" 
              />

              <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase tracking-wider">
                Official Profile
              </div>
            </div>

            {/* Creator Presentation */}
            <div className="my-8 space-y-4">
              <div className="relative inline-block mx-auto">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-brand-400 mx-auto shadow-2xl"
                />
                {profile.isVerified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full ring-4 ring-dark-950">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {profile.name}
                </h1>
                <p className="text-base sm:text-xl font-bold text-brand-300">
                  {profile.tagline}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed pt-1">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* High-Resolution Center QR Code */}
            <div className="my-6">
              <div className="p-6 rounded-3xl bg-white shadow-2xl inline-block mx-auto border-4 border-brand-400/50">
                <QRCodeSVG
                  value={profileUrl}
                  size={240}
                  level="H"
                  fgColor="#07090e"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: profile.avatarUrl,
                    x: undefined,
                    y: undefined,
                    height: 52,
                    width: 52,
                    excavate: true,
                  }}
                />
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-lg font-extrabold text-white uppercase tracking-wider">
                  Scan with Camera to Connect
                </p>
                <p className="text-sm font-mono text-cyan-300 font-bold">
                  connectly.bio/@{profile.username}
                </p>
              </div>
            </div>

            {/* Social Handles Grid */}
            <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.links.slice(0, 4).map(link => {
                const meta = getPlatformMeta(link.platform);
                return (
                  <div key={link.id} className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center mx-auto">
                      {meta.icon('w-4 h-4')}
                    </div>
                    <p className="font-bold text-xs text-white truncate">{link.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{link.subtitle || meta.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-white/15 flex items-center justify-between text-xs text-slate-400">
              <span>Event / Hackathon Networking Poster</span>
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <BrandIcon sizeClass="w-3.5 h-3.5" />
                <span>connectly.bio</span>
              </div>
            </div>

          </div>
        )}

        {/* Hackathon Badge Card Format */}
        {posterFormat === 'badge' && (
          <div
            id="printable-poster-target"
            className="printable-area w-full max-w-[380px] min-h-[560px] rounded-[32px] bg-dark-900 border-2 border-cyan-500/50 p-8 text-center flex flex-col justify-between shadow-2xl shadow-cyan-950/80 relative"
          >
            {/* Lanyard Cutout */}
            <div className="w-16 h-2.5 bg-slate-700 rounded-full mx-auto shadow-inner mb-4" />

            <div className="space-y-2">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-400 mx-auto shadow-xl"
              />
              <h2 className="text-xl font-extrabold text-white">{profile.name}</h2>
              <p className="text-xs font-bold text-cyan-300">{profile.tagline}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white shadow-xl inline-block mx-auto my-4">
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

            <div className="space-y-1">
              <p className="text-xs font-extrabold text-white uppercase tracking-wider">Scan to Connect</p>
              <p className="text-[11px] font-mono text-slate-400">connectly.bio/@{profile.username}</p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Hackathon Badge</span>
              <span className="text-cyan-400 font-bold">Verified</span>
            </div>
          </div>
        )}

        {/* Minimal Sticker Card */}
        {posterFormat === 'minimal' && (
          <div
            id="printable-poster-target"
            className="printable-area w-full max-w-[340px] p-6 rounded-3xl bg-white text-slate-900 text-center shadow-2xl space-y-4"
          >
            <h3 className="font-extrabold text-lg text-slate-950">{profile.name}</h3>
            <div className="p-3 bg-slate-100 rounded-2xl inline-block mx-auto">
              <QRCodeSVG
                value={profileUrl}
                size={180}
                level="H"
                fgColor="#0f172a"
                bgColor="#f1f5f9"
              />
            </div>
            <p className="text-xs font-bold text-slate-600 font-mono">connectly.bio/@{profile.username}</p>
          </div>
        )}

      </div>

    </div>
  );
};

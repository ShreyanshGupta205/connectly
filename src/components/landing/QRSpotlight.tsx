import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Printer, CheckCircle2, ArrowRight } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface QRSpotlightProps {
  navigateTo: (route: string) => void;
}

export const QRSpotlight: React.FC<QRSpotlightProps> = ({ navigateTo }) => {
  const { currentProfile } = useProfile();
  const profileUrl = `${window.location.origin}/#/@${currentProfile.username}`;

  return (
    <section className="py-20 bg-dark-900/60 border-y border-white/5 relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5" />
              <span>Offline to Online Bridging</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              One QR Code. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Every Conference & Hackathon.
              </span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Never fuddle with typing your handle or searching social apps on the spot. Print your branded QR poster, place it on your demo table or sticker card, and watch attendees scan, like, and connect immediately.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-300">
                  <strong className="text-white">Print-Ready A4 Poster & Card Layouts:</strong> High-resolution vector exports calibrated for physical banners, posters, and badge lanyards.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-300">
                  <strong className="text-white">Built-in Scan Analytics:</strong> Automatically differentiates between direct browser link views and physical poster QR scans.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-300">
                  <strong className="text-white">Custom Brand Center Logo:</strong> Embed your profile avatar or brand icon directly into the QR center with auto error correction.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => navigateTo(`poster-${currentProfile.username}`)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 transition-all hover:scale-105"
              >
                <Printer className="w-4 h-4" />
                <span>Open Printable Poster Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Visual Card Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              
              {/* Event Badge Card */}
              <div className="p-8 rounded-[32px] bg-gradient-to-b from-dark-900 via-dark-950 to-black border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/80 text-center relative overflow-hidden">
                
                {/* Lanyard Top Slot */}
                <div className="w-16 h-2 bg-slate-700 rounded-full mx-auto mb-6 shadow-inner" />

                <div className="relative inline-block mb-4">
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentProfile.name}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-400 mx-auto shadow-lg"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-500 text-black font-extrabold text-[10px] uppercase">
                    CREATOR
                  </span>
                </div>

                <h3 className="font-extrabold text-xl text-white tracking-tight">{currentProfile.name}</h3>
                <p className="text-xs font-semibold text-cyan-300 mt-0.5">{currentProfile.tagline}</p>

                {/* QR Code Container */}
                <div className="my-6 p-4 rounded-2xl bg-white shadow-xl inline-block mx-auto">
                  <QRCodeSVG
                    value={profileUrl}
                    size={160}
                    level="H"
                    fgColor="#07090e"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Scan to Connect</p>
                  <p className="text-[11px] text-slate-400">connectly.bio/@{currentProfile.username}</p>
                </div>

                {/* Mini Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Hackathon 2025</span>
                  <span className="text-cyan-400 font-semibold">Verified Profile</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

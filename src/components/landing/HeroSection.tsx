import React, { useState } from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { GoogleAuthModal, GoogleIcon } from '../common/GoogleAuthModal';
import { BrandIcon } from '../common/BrandLogo';

interface HeroSectionProps {
  navigateTo: (route: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ navigateTo }) => {
  const { profiles } = useProfile();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const shreyanshProfile = profiles['shreyansh'];

  return (
    <section className="relative bg-slate-950 overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-white/5">

      {/* Subtle dark dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Deep ambient glow blooms */}
      <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-indigo-600/15 via-purple-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[8%] right-[10%] w-[420px] h-[420px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[22%] w-[320px] h-[320px] bg-purple-500/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* ── Left Column ── */}
          <div className="space-y-7 max-w-xl text-left">

            {/* Trusted badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-indigo-300 text-sm font-semibold shadow-inner backdrop-blur-md">
              <span className="text-amber-400">✨</span>
              <span>Trusted by 10,000+ Creators & Builders</span>
            </div>

            {/* Main headline */}
            <div>
              <h1 className="text-5xl sm:text-[58px] lg:text-[62px] font-black tracking-tight text-white leading-[1.07]">
                Build your
              </h1>
              <h1 className="text-5xl sm:text-[58px] lg:text-[62px] font-black tracking-tight leading-[1.07] bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                digital identity
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-slate-400 text-base sm:text-[17px] leading-relaxed max-w-[480px]">
              Connectly empowers creators, founders, and developers to centralize their entire online presence into one unified,
              custom-branded profile. Manage social links, track visitor engagement, and{' '}
              <strong className="text-slate-200 font-semibold">build your community</strong> from a single dynamic hub.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="google-signup-cta"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-sm shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Sign up with Google</span>
              </button>
              <button
                id="claim-username-cta"
                onClick={() => navigateTo('dashboard')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 font-bold text-sm shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md"
              >
                Open Studio
              </button>
              <button
                id="view-demo-cta"
                onClick={() => navigateTo('/@shreyansh')}
                className="flex items-center gap-2 px-4 py-3.5 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
              >
                View Live Demo →
              </button>
            </div>

            {/* Social proof row — avatars + text */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="flex -space-x-2.5">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
                  shreyanshProfile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-900 shadow-sm"
                    alt="Creator avatar"
                  />
                ))}
              </div>
              <p className="text-sm text-slate-400 font-medium">
                <span className="text-slate-200 font-bold">Connectly Creators</span> · 10k+ verified
              </p>
            </div>

            {/* Feature checkmarks */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Free Forever Plan</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> QR Poster Studio</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Real-Time Analytics</span>
            </div>
          </div>

          {/* ── Right Column — Floating Composition matching reference image ── */}
          <div className="relative flex items-center justify-center min-h-[580px] lg:min-h-[640px] select-none">

            {/* Deep ambient glow behind phone */}
            <div className="absolute w-[440px] h-[440px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-pink-500/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Floating Confetti and Heart Accents matching screenshot */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {/* Confetti near top-left of phone */}
              <span className="absolute top-12 left-[26%] text-xl transform -rotate-12 animate-bounce duration-1000">🎉</span>
              <div className="absolute top-20 left-[22%] w-3 h-1.5 bg-yellow-400 rounded-sm transform rotate-45" />
              <div className="absolute top-16 left-[34%] w-2 h-3.5 bg-cyan-400 rounded-sm transform -rotate-12" />
              <div className="absolute top-28 left-[27%] w-2.5 h-2.5 bg-rose-400 rounded-full" />
              <div className="absolute top-24 left-[38%] w-3 h-1 bg-purple-500 rounded-full transform rotate-30" />
              <div className="absolute top-36 left-[24%] text-sm transform rotate-6">❤️</div>

              {/* Confetti near top-right / right side */}
              <div className="absolute top-16 right-[24%] w-2.5 h-3 bg-amber-400 rounded-sm transform rotate-45" />
              <div className="absolute top-20 right-[18%] w-3 h-1.5 bg-indigo-500 rounded-sm transform -rotate-30" />
              
              {/* Floating Heart Bubble on right side of phone */}
              <div className="absolute top-[38%] right-[15%] w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md shadow-xl border border-white/20 flex items-center justify-center text-sm shadow-indigo-950/60 transform hover:scale-110 transition-transform">
                <span>❤️</span>
              </div>
            </div>

            {/* ── Floating Analytics Card (slanted left, overlapping phone) ── */}
            <div 
              className="absolute left-2 sm:left-6 lg:left-8 top-[32%] z-20 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)] border border-white/15 p-4 w-[184px] transform -rotate-[4deg] hover:rotate-0 hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300 text-[11px] font-bold tracking-tight">Profile Views</span>
                <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">7 Days ▾</span>
              </div>
              <div className="flex items-baseline gap-1 text-emerald-400 font-extrabold text-[15px] mb-2">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+18.3%</span>
              </div>
              {/* Sparkline curve */}
              <svg viewBox="0 0 130 38" className="w-full h-9" fill="none">
                <defs>
                  <linearGradient id="sparkGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,32 L22,25 L44,28 L66,16 L88,19 L110,8 L130,4" 
                  fill="none" 
                  stroke="#818cf8" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M0,32 L22,25 L44,28 L66,16 L88,19 L110,8 L130,4 L130,38 L0,38 Z" 
                  fill="url(#sparkGrad2)" 
                />
              </svg>
            </div>

            {/* ── iPhone Mockup with realistic 3D slant & lighting ── */}
            <div
              className="relative z-10 w-[240px] rounded-[44px] bg-[#0c1222] shadow-[0_30px_70px_-15px_rgba(79,70,229,0.35),0_15px_30px_-8px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                border: '7px solid #1e293b',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 25px 65px -12px rgba(79, 70, 229, 0.35)',
                transform: 'perspective(1200px) rotateZ(-7deg) rotateY(6deg)',
              }}
              onClick={() => navigateTo('/@shreyansh')}
            >
              {/* Dynamic Island Pill */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2">
                <div className="w-2 h-2 rounded-full bg-[#1c2438]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d1322]" />
              </div>

              {/* Phone Screen */}
              <div className="rounded-[36px] overflow-hidden bg-[#0c1222] min-h-[480px] flex flex-col p-3.5 pt-2">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between text-[10px] text-white/70 font-semibold px-2 pt-1 pb-2">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px]">●●●</span>
                    <div className="w-3.5 h-2 rounded-sm border border-white/60 p-[1px]">
                      <div className="h-full w-2 bg-white/90 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* In-app Navigation Bar */}
                <div className="flex items-center justify-between text-white/70 px-1 py-1 text-xs">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">&lt;</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">•••</span>
                  </div>
                </div>

                {/* Profile Header */}
                <div className="text-center space-y-1.5 mt-1">
                  <div className="w-14 h-14 rounded-full mx-auto p-[2.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-400 shadow-md">
                    <img
                      src={shreyanshProfile?.avatarUrl || '/shreyansh-avatar.jpg'}
                      alt="Shreyansh Gupta"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm tracking-tight">Shreyansh Gupta</p>
                    <p className="text-slate-400 text-[10px] font-medium">@shreyansh</p>
                    <p className="text-slate-400 text-[9px] leading-relaxed mt-1 px-1">
                      AI Developer • Hackathon Builder<br />Building open-source AI products.
                    </p>
                  </div>
                </div>

                {/* Real link buttons inside phone */}
                <div className="space-y-1.5 mt-3">
                  {[
                    { label: 'YouTube Channel', color: 'bg-red-500' },
                    { label: 'GitHub Repositories', color: 'bg-slate-400' },
                    { label: 'LinkedIn Network', color: 'bg-blue-500' },
                    { label: 'Instagram', color: 'bg-pink-500' },
                  ].map(({ label, color }) => (
                    <div
                      key={label}
                      className="px-3 py-2 rounded-xl bg-white/[0.07] border border-white/[0.08] hover:bg-white/[0.12] flex items-center gap-2.5 transition-colors"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                      <span className="text-white text-[11px] font-semibold flex-1 text-left">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Stats Bar */}
                <div className="flex justify-around border-t border-white/[0.08] pt-2.5 mt-auto pb-2">
                  <div className="text-center">
                    <p className="text-white text-xs font-bold">4.2k</p>
                    <p className="text-slate-400 text-[9px]">Views</p>
                  </div>
                  <div className="w-[1px] bg-white/[0.08]" />
                  <div className="text-center">
                    <p className="text-white text-xs font-bold">1.3k</p>
                    <p className="text-slate-400 text-[9px]">Likes</p>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Floating QR Card (tucked bottom-right, tilted) ── */}
            <div 
              className="absolute right-2 sm:right-6 lg:right-10 bottom-[14%] z-20 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)] border border-white/15 p-4 w-[164px] transform rotate-[9deg] hover:rotate-0 hover:scale-105 transition-all duration-300 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-300 mb-2">SCAN TO CONNECT</p>
              
              {/* High fidelity QR Code */}
              <div className="w-[104px] h-[104px] mx-auto bg-white rounded-xl flex items-center justify-center border border-white/20 p-1.5 shadow-md">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  {/* Top-left finder */}
                  <rect x="3" y="3" width="19" height="19" rx="2.5" fill="#0f172a" />
                  <rect x="6" y="6" width="13" height="13" rx="1.5" fill="white" />
                  <rect x="8.5" y="8.5" width="8" height="8" rx="0.8" fill="#0f172a" />
                  {/* Top-right finder */}
                  <rect x="42" y="3" width="19" height="19" rx="2.5" fill="#0f172a" />
                  <rect x="45" y="6" width="13" height="13" rx="1.5" fill="white" />
                  <rect x="47.5" y="8.5" width="8" height="8" rx="0.8" fill="#0f172a" />
                  {/* Bottom-left finder */}
                  <rect x="3" y="42" width="19" height="19" rx="2.5" fill="#0f172a" />
                  <rect x="6" y="45" width="13" height="13" rx="1.5" fill="white" />
                  <rect x="8.5" y="47.5" width="8" height="8" rx="0.8" fill="#0f172a" />
                  {/* Data modules */}
                  {[
                    [26,3],[30,3],[34,3],[38,3],
                    [26,7],[34,7],
                    [28,11],[30,11],[36,11],
                    [26,15],[32,15],[36,15],
                    [3,26],[7,26],[11,26],[15,26],[19,26],
                    [3,30],[11,30],[19,30],
                    [5,34],[9,34],[13,34],[17,34],
                    [26,26],[30,26],[34,26],[38,26],[42,26],[46,26],[50,26],[54,26],[58,26],
                    [26,30],[34,30],[42,30],[50,30],[58,30],
                    [28,34],[32,34],[36,34],[44,34],[48,34],[52,34],[56,34],
                    [26,38],[30,38],[38,38],[42,38],[50,38],[54,38],[58,38],
                    [28,42],[32,42],[36,42],[44,42],[48,42],[52,42],
                    [26,46],[30,46],[34,46],[38,46],[46,46],[50,46],[54,46],[58,46],
                    [28,50],[36,50],[40,50],[44,50],[52,50],[56,50],
                    [26,54],[30,54],[34,54],[42,54],[46,54],[50,54],[54,54],[58,54],
                    [28,58],[32,58],[40,58],[44,58],[48,58],[52,58],
                  ].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="3.5" height="3.5" rx="0.5" fill="#0f172a" />
                  ))}
                </svg>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-300 font-semibold mt-2.5">
                <BrandIcon sizeClass="w-3.5 h-3.5" />
                <span>Connectly • @creator</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      <GoogleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => navigateTo('dashboard')}
      />
    </section>
  );
};

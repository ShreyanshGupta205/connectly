import React, { useState } from 'react';
import { HeroSection } from './HeroSection';
import { SocialProofMarquee } from './SocialProofMarquee';
import { PersonaUseCases } from './PersonaUseCases';
import { LiveSandbox } from './LiveSandbox';
import { FeaturesGrid } from './FeaturesGrid';
import { ComparisonMatrix } from './ComparisonMatrix';
import { TestimonialsSection } from './TestimonialsSection';
import { PricingSection } from './PricingSection';
import { FAQSection } from './FAQSection';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import { GoogleAuthModal, GoogleIcon } from '../common/GoogleAuthModal';

interface LandingPageProps {
  navigateTo: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigateTo }) => {
  const [bottomHandle, setBottomHandle] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleBottomClaim = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Hero Section */}
      <HeroSection navigateTo={navigateTo} />

      {/* 2. Social Proof & As-Seen-On Marquee */}
      <SocialProofMarquee />

      {/* 3. Interactive Persona / Use-Case Switcher */}
      <PersonaUseCases navigateTo={navigateTo} />

      {/* 4. Live Interactive Sandbox Demo */}
      <div id="demo-section">
        <LiveSandbox navigateTo={navigateTo} />
      </div>

      {/* 5. Bento Features Grid */}
      <div id="features-section">
        <FeaturesGrid />
      </div>

      {/* 6. Competitor Comparison Table (Connectly vs Linktree vs Bio.link) */}
      <ComparisonMatrix navigateTo={navigateTo} />

      {/* 7. Wall of Love / Testimonials */}
      <TestimonialsSection />

      {/* 8. Pricing Section */}
      <div id="pricing-section">
        <PricingSection navigateTo={navigateTo} />
      </div>

      {/* 9. FAQ Accordion */}
      <FAQSection />

      {/* 10. High-Conversion Final CTA Banner */}
      <section className="py-24 relative overflow-hidden bg-slate-950 text-white text-center">
        {/* Luminous ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-600/30 via-purple-600/25 to-pink-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Claim Your Spot in the Creator Economy</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Build your verified digital identity in seconds.
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of developers, AI builders, and creators using Connectly to unify their links and turn casual views into real connections.
          </p>

          {/* Quick claim form & Google Sign-In in footer CTA */}
          <div className="pt-2 max-w-md mx-auto space-y-3">
            <form onSubmit={handleBottomClaim} className="flex items-center p-1.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl focus-within:border-indigo-400 transition-all">
              <span className="pl-3.5 text-xs text-slate-400 font-semibold select-none">
                connectly.bio/@
              </span>
              <input
                type="text"
                value={bottomHandle}
                onChange={e => setBottomHandle(e.target.value)}
                placeholder="yourname"
                className="w-full bg-transparent px-2 text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <span>Claim Handle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Direct Google Button in bottom banner */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Or Continue with Google</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Instant 60-Second Setup
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-400" />
              Free Forever Plan Included
            </span>
          </div>

        </div>
      </section>

      <GoogleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => navigateTo('dashboard')}
      />

    </div>
  );
};

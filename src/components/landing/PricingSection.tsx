import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  navigateTo: (route: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ navigateTo }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: 'Free Forever',
      tagline: 'Ideal for students and personal link sharing.',
      price: '₹0',
      period: 'forever',
      badge: 'Starter',
      isPopular: false,
      features: [
        'Custom connectly.bio/@username URL',
        'Up to 5 social links',
        '3 Classic themes (Aurora, Minimal, Stealth)',
        'Standard QR Code download',
        'Visitor ❤️ likes counter',
        'Basic 7-day view stats',
      ],
      buttonText: 'Get Started Free',
      btnStyle: 'bg-white/10 hover:bg-white/20 text-white border border-white/15',
    },
    {
      name: 'Pro Creator',
      tagline: 'For active builders, developers, and content creators.',
      price: billingPeriod === 'monthly' ? '₹249' : '₹199',
      period: 'per month',
      badge: 'Most Popular',
      isPopular: true,
      features: [
        'Unlimited social & portfolio links',
        'All 8 Pro Aesthetic Themes',
        'High-Resolution Printable QR Posters & Event Badges',
        'AI Bio & Tagline Assistant (Unlimited)',
        'Deep Analytics (CTR, Device stats, Scan tracking)',
        'Verified Profile Badge on public URL',
        'Custom button shapes & font styling',
        'Direct vCard (.vcf) phonebook export',
      ],
      buttonText: 'Upgrade to Pro (Free Trial)',
      btnStyle: 'bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-xl shadow-brand-600/30',
    },
    {
      name: 'Studio / Agency',
      tagline: 'For startups, teams, and multi-brand creators.',
      price: billingPeriod === 'monthly' ? '₹799' : '₹649',
      period: 'per month',
      badge: 'Teams',
      isPopular: false,
      features: [
        'Up to 10 distinct profile identities',
        'Custom domain support (links.yourdomain.com)',
        'Team collaboration & editor seats',
        'Campaign tracking & QR scan attribution',
        'Remove all Connectly branding',
        'Priority 24/7 Creator support',
      ],
      buttonText: 'Contact Studio Team',
      btnStyle: 'bg-white/10 hover:bg-white/20 text-white border border-white/15',
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
            <span>✦</span>
            <span>Fair & Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Start Free.{' '}
            <span className="text-gradient-shimmer">Upgrade as You Grow.</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-3">
            Simple plans for individual creators, builders at hackathons, and growing studios.
          </p>

          {/* Billing Switcher */}
          <div className="mt-6 inline-flex items-center p-1 rounded-full bg-slate-900 border border-white/10">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-extrabold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                tier.isPopular
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 pricing-popular -translate-y-2'
                  : 'bg-slate-900/60 border border-white/8 hover:border-white/15'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold text-[11px] uppercase tracking-widest shadow-lg">
                  Most Popular for Creators
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-xl text-white">{tier.name}</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                    {tier.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">{tier.tagline}</p>

                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/10">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{tier.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/{tier.period}</span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">What's Included:</p>
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98 ${tier.btnStyle}`}
                >
                  <span>{tier.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

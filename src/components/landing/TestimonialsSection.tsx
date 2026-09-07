import React from 'react';
import { Star, Heart, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Shreyansh Gupta',
      role: 'AI Developer & Hackathon Winner',
      handle: '@shreyansh',
      avatar: '/shreyansh-avatar.jpg',
      metric: '400+ Event Scans in 48h',
      content: 'The printable QR poster studio is unmatched for hackathons and conferences. I generated a desk badge for ETHIndia and got over 400 high-intent scans and GitHub follows in one weekend.',
      stars: 5,
    },
    {
      name: 'Riya Kapoor',
      role: 'UX Designer & Product Lead',
      handle: '@riyakapoor',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      metric: '34% Increase in CTR',
      content: 'Visitors genuinely love the ❤️ heart like bursts! It transforms a boring list of URLs into an interactive social hub. My newsletter signups doubled the first week I switched to Connectly.',
      stars: 5,
    },
    {
      name: 'Arjun Mehta',
      role: 'Founder & Angel Investor',
      handle: '@arjunmehta',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      metric: 'Saved 100+ Paper Cards',
      content: 'The 1-click vCard contact export is a game changer at pitch meetings and demo days. Investors scan my QR or tap my link and my contact card is immediately saved in their phone.',
      stars: 5,
    },
    {
      name: 'Sneha Iyer',
      role: 'Full Stack Engineer & Open Source Contributor',
      handle: '@snehacodes',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      metric: '99.9% Uptime on Links',
      content: 'No spam ads, no weird tracking, and blazing-fast load times. The Cyberpunk and Aurora themes make my developer portfolio stand out from generic link trees. Worth every penny of Pro.',
      stars: 5,
    },
  ];

  return (
    <section className="py-24 bg-slate-950 border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Wall Of Love</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Loved by creators who care about craft
          </h2>
          <p className="text-slate-400 text-base mt-3">
            See how developers, creators, and founders use Connectly to amplify their reach.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/30 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-indigo-950/40 transition-all duration-300 flex flex-col justify-between backdrop-blur-xl group"
            >
              <div className="space-y-4">
                {/* Rating & Metric badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 rounded-full">
                    {t.metric}
                  </span>
                </div>

                {/* Quote */}
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
                  "{t.content}"
                </p>
              </div>

              {/* Creator Info */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-white/10">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/40 shadow-sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-white truncate">{t.name}</h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {t.role} · <span className="font-semibold text-indigo-300">{t.handle}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

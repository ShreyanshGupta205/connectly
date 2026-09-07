import React, { useState } from 'react';
import { 
  Code2, 
  Video, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  CheckCircle2,
  QrCode,
  Heart
} from 'lucide-react';

interface PersonaUseCasesProps {
  navigateTo: (route: string) => void;
}

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  headline: string;
  description: string;
  benefits: string[];
  mockCard: {
    avatar: string;
    name: string;
    role: string;
    handle: string;
    badge: string;
    stats: { label: string; value: string }[];
    links: { title: string; category: string; color: string }[];
  };
}

export const PersonaUseCases: React.FC<PersonaUseCasesProps> = ({ navigateTo }) => {
  const personas: Persona[] = [
    {
      id: 'developers',
      name: 'Developers & Hackathon Builders',
      icon: <Code2 className="w-4 h-4" />,
      tagline: 'Code • Ship • Network',
      headline: 'The Ultimate Developer Identity & Hackathon Badge',
      description: 'Stop handing out paper cards or explaining where to find your GitHub. Generate a verified developer hub with live repo counts, hackathon badges, and vector QR desk stickers.',
      benefits: [
        'Printable Vector QR desk posters & lanyard badges',
        'Direct GitHub & Devfolio portfolio integration',
        'Visitor like reactions with real-time analytics',
        'Zero bloated tracking or third-party ads',
      ],
      mockCard: {
        avatar: '/shreyansh-avatar.jpg',
        name: 'Shreyansh Gupta',
        role: 'AI Developer & Hackathon Winner',
        handle: '@shreyansh',
        badge: 'Verified Builder',
        stats: [
          { label: 'GitHub Repos', value: '42' },
          { label: 'Hackathons', value: '18+' },
          { label: 'Visitor Likes', value: '1.4k' },
        ],
        links: [
          { title: 'YouTube: Building AI Agents', category: 'Latest Tutorial', color: 'bg-red-500' },
          { title: 'GitHub: Open Source Projects', category: 'Repositories', color: 'bg-slate-400' },
          { title: 'Devpost & Hackathon Portfolio', category: 'Winner Badges', color: 'bg-indigo-500' },
        ],
      },
    },
    {
      id: 'creators',
      name: 'YouTubers & Content Creators',
      icon: <Video className="w-4 h-4" />,
      tagline: 'Audience • Monetization • Community',
      headline: 'Centralize All Channels & Maximize Fan Conversion',
      description: 'Replace standard link trees with a high-converting channel ecosystem. Highlight your latest video, sponsor partnerships, newsletter, and subscriber counts in one place.',
      benefits: [
        'Curated YouTube, Twitch, Substack & Spotify embeds',
        'Dynamic link priority & click tracking CTR',
        'Custom verified badge for authentic creator proof',
        'Built-in vCard so brands can save your media contact',
      ],
      mockCard: {
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        name: 'Elena Vance',
        role: 'Tech Creator & Visual Artist',
        handle: '@elena',
        badge: 'Top Creator',
        stats: [
          { label: 'Subscribers', value: '124k' },
          { label: 'Sponsors', value: '12' },
          { label: 'Monthly Clicks', value: '38k' },
        ],
        links: [
          { title: 'New Video: AI Video Workflow', category: 'Watch on YouTube', color: 'bg-red-500' },
          { title: 'Creator Newsletter & Weekly Digest', category: 'Substack', color: 'bg-amber-500' },
          { title: 'Join Private Discord Community', category: '12,000+ Members', color: 'bg-indigo-500' },
        ],
      },
    },
    {
      id: 'founders',
      name: 'Founders & Executives',
      icon: <Briefcase className="w-4 h-4" />,
      tagline: 'Fundraising • Networking • Leads',
      headline: 'A Modern Digital Business Card for Leaders',
      description: 'Make an unforgettable first impression at pitch meetings, investor conferences, and demo days. Visitors can download your vCard into their address book with a single tap.',
      benefits: [
        '1-Click vCard export directly to phone contacts',
        'Book meetings directly via Calendly integration',
        'Direct link to Pitch Deck with view tracking',
        'Sleek executive themes (Luxe Gold, Glass Obsidian)',
      ],
      mockCard: {
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        name: 'Marcus Chen',
        role: 'Founder & CEO @ CloudPulse',
        handle: '@marcus',
        badge: 'YC W24 Founder',
        stats: [
          { label: 'ARR Run-rate', value: '$1.2M' },
          { label: 'Team Size', value: '14' },
          { label: 'Investor Scans', value: '640' },
        ],
        links: [
          { title: 'Book 15-Min Intro Call (Calendly)', category: 'Executive Office', color: 'bg-blue-500' },
          { title: 'CloudPulse Series A Deck (DocSend)', category: 'Investor Portal', color: 'bg-emerald-500' },
          { title: 'Connect on LinkedIn', category: 'Professional Network', color: 'bg-sky-500' },
        ],
      },
    },
  ];

  const [activeTab, setActiveTab] = useState(personas[0].id);
  const activePersona = personas.find(p => p.id === activeTab) || personas[0];

  return (
    <section className="py-24 bg-slate-950 border-b border-white/5 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built For Every Digital Journey</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Tailored for how you work, create, and network
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 leading-relaxed">
            Whether you're pitching to VCs, demoing at a hackathon, or building a creator media brand, Connectly adapts to your identity.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 gap-1.5 flex-wrap justify-center backdrop-blur-xl shadow-xl">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  activeTab === p.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.icon}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Persona Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Persona Details */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              {activePersona.tagline}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {activePersona.headline}
            </h3>
            <p className="text-slate-300 text-base leading-relaxed">
              {activePersona.description}
            </p>

            {/* Checklist */}
            <div className="space-y-3 pt-2">
              {activePersona.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-slate-200">{b}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div className="pt-4 flex items-center gap-4 flex-wrap">
              <button
                onClick={() => navigateTo('dashboard')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Try as a {activePersona.id === 'developers' ? 'Developer' : activePersona.id === 'creators' ? 'Creator' : 'Founder'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateTo(`/@${activePersona.mockCard.handle.replace('@', '')}`)}
                className="text-sm font-bold text-indigo-300 hover:text-white transition-colors flex items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-white/5"
              >
                <span>View {activePersona.mockCard.handle} live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Live Interactive Card Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 hover:shadow-indigo-500/10 transition-shadow">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src={activePersona.mockCard.avatar}
                    alt={activePersona.mockCard.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm">{activePersona.mockCard.name}</h4>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                        {activePersona.mockCard.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{activePersona.mockCard.handle}</p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-white/10 text-center">
                {activePersona.mockCard.stats.map((s, i) => (
                  <div key={i}>
                    <p className="text-sm font-extrabold text-white">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Mock Links */}
              <div className="space-y-2 pt-4">
                {activePersona.mockCard.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${link.color}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{link.title}</p>
                        <p className="text-[10px] text-slate-400">{link.category}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </div>
                ))}
              </div>

              {/* Footer inside card */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>Loved by Visitors</span>
                </span>
                <span className="text-indigo-400 font-semibold">connectly.bio</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

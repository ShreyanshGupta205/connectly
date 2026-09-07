import React from 'react';
import { Heart, ArrowUpRight, Command } from 'lucide-react';
import { YouTubeIcon, GitHubIcon, LinkedInIcon } from '../../utils/platformIcons';
import { BrandLogo } from '../common/BrandLogo';

interface FooterProps {
  navigateTo: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-14">
        
        {/* Brand & Slogan (Spans 2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <BrandLogo 
            variant="dark" 
            size="lg" 
            showBadge 
            badgeText="Identity OS" 
            onClick={() => navigateTo('landing')} 
          />

          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            The next-generation digital identity platform for creators, founders, and developers. 
            Centralize your online presence, generate printable QR event posters, and measure high-intent engagement.
          </p>

          {/* System Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational — 99.99% Uptime</span>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <Command className="w-3.5 h-3.5" />
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">⌘K</kbd> anywhere for instant quick actions</span>
          </div>
        </div>

        {/* Product Navigation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button onClick={() => navigateTo('dashboard')} className="hover:text-white transition-colors">
                Creator Studio
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('dashboard')} className="hover:text-white transition-colors">
                Printable QR Generator
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('dashboard')} className="hover:text-white transition-colors">
                AI Bio Copilot
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('dashboard')} className="hover:text-white transition-colors">
                Real-Time Analytics
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('dashboard')} className="hover:text-white transition-colors">
                Theme Customizer
              </button>
            </li>
          </ul>
        </div>

        {/* Live Demos */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Live Profiles</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button onClick={() => navigateTo('@shreyansh')} className="hover:text-white transition-colors flex items-center gap-1">
                @shreyansh (AI Developer)
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('dashboard')} className="hover:text-white transition-colors flex items-center gap-1">
                Create Your Profile
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('poster-shreyansh')} className="hover:text-white transition-colors flex items-center gap-1">
                Event Hackathon Poster
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </li>
          </ul>
        </div>

        {/* Connect & Creator */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Community</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a 
                href="https://youtube.com/@shreyanshbuild" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <YouTubeIcon className="w-4 h-4 text-red-500" />
                <span>@shreyanshbuild</span>
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/ShreyanshGupta205" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-slate-100 transition-colors flex items-center gap-2"
              >
                <GitHubIcon className="w-4 h-4" />
                <span>GitHub Portfolio</span>
              </a>
            </li>
            <li>
              <a 
                href="https://linkedin.com/in/shreyanshgupta205" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-blue-400 transition-colors flex items-center gap-2"
              >
                <LinkedInIcon className="w-4 h-4 text-blue-500" />
                <span>LinkedIn Network</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>© {new Date().getFullYear()} Connectly Technologies Inc.</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Builders
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-400 cursor-pointer">Security & GDPR</span>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { 
  ChevronDown, 
  Check, 
  ArrowRight, 
  Layers, 
  QrCode, 
  User, 
  Search, 
  ExternalLink, 
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { GoogleAuthModal, GoogleIcon } from '../common/GoogleAuthModal';
import { BrandLogo } from '../common/BrandLogo';

interface NavbarProps {
  currentRoute: string;
  navigateTo: (route: string) => void;
  onOpenCommand?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigateTo, onOpenCommand }) => {
  const { currentProfile, profiles, switchProfile, resetToDemo, currentUser, logout, isAdmin } = useProfile();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isLanding = currentRoute === 'landing';

  const navItems = isLanding ? [
    { 
      label: 'Features', 
      onClick: () => {
        const el = document.getElementById('features-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      icon: null,
      active: false
    },
    { 
      label: 'Compare', 
      onClick: () => {
        const el = document.getElementById('compare-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      icon: null,
      active: false
    },
    { 
      label: 'Pricing', 
      onClick: () => {
        const el = document.getElementById('pricing-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      icon: null,
      active: false
    },
    { 
      label: 'FAQ', 
      onClick: () => {
        const el = document.getElementById('faq-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      icon: null,
      active: false
    },
    {
      label: 'Admin',
      onClick: () => navigateTo('admin'),
      icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />,
      active: false
    }
  ] : [
    { label: 'Home', onClick: () => navigateTo('landing'), icon: null, active: false },
    { label: 'Studio', onClick: () => navigateTo('dashboard'), icon: <Layers className="w-3.5 h-3.5" />, active: currentRoute === 'dashboard' },
    { label: 'Live Profile', onClick: () => navigateTo(`@${currentProfile.username}`), icon: <User className="w-3.5 h-3.5" />, active: currentRoute.startsWith('@') || currentRoute.startsWith('/@') },
    { label: 'Print Poster', onClick: () => navigateTo(`poster-${currentProfile.username}`), icon: <QrCode className="w-3.5 h-3.5" />, active: currentRoute.startsWith('poster-') },
    { label: 'Admin', onClick: () => navigateTo('admin'), icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />, active: currentRoute === 'admin' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Unified Brand Logo */}
          <BrandLogo 
            variant="dark" 
            showBadge 
            badgeText={isLanding ? "OS" : "Studio"} 
            onClick={() => navigateTo('landing')} 
          />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  item.active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* Quick Command Button */}
            {onOpenCommand && (
              <button
                onClick={onOpenCommand}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xl:inline">Search...</span>
                <kbd className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 border border-white/10">⌘K</kbd>
              </button>
            )}

            {/* Google Sign In / Sync CTA */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              <GoogleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">
                {currentUser?.email ? 'Google Synced' : 'Sign in with Google'}
              </span>
            </button>

            {/* Profile Switcher & Actions */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-all text-xs text-slate-200"
              >
                <img
                  src={currentProfile.avatarUrl}
                  alt={currentProfile.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40"
                />
                <span className="hidden sm:inline font-medium max-w-[90px] truncate">
                  @{currentProfile.username}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl shadow-black/80 p-2 z-50 backdrop-blur-2xl"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/[0.07] mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profiles</p>
                    {currentUser?.email && (
                      <span className="text-[10px] text-emerald-400 font-semibold truncate max-w-[120px]">
                        {currentUser.email}
                      </span>
                    )}
                  </div>
                  {Object.values(profiles).map(p => (
                    <button
                      key={p.username}
                      onClick={() => switchProfile(p.username)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs ${
                        p.username === currentProfile.username
                          ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/25 font-semibold'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={p.avatarUrl} alt={p.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-100 truncate text-[12px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">@{p.username}</p>
                        </div>
                      </div>
                      {p.username === currentProfile.username && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}

                  <div className="mt-2 pt-2 border-t border-white/[0.07] space-y-1">
                    <button
                      onClick={() => navigateTo('dashboard')}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/10 rounded-xl transition-colors flex items-center justify-between"
                    >
                      <span>Open Creator Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => navigateTo('admin')}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Admin Control Panel</span>
                      </span>
                      {isAdmin && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          ROOT
                        </span>
                      )}
                    </button>
                    
                    {currentUser && (
                      <button
                        onClick={() => logout()}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    )}

                    <button
                      onClick={() => resetToDemo()}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
                    >
                      Clear Local Cache
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {isLanding ? (
              <button
                onClick={() => navigateTo('dashboard')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Launch Studio
              </button>
            ) : (
              <button
                onClick={() => navigateTo(`@${currentProfile.username}`)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Live</span>
              </button>
            )}

          </div>

        </div>
      </header>

      <GoogleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => navigateTo('dashboard')}
      />
    </>
  );
};

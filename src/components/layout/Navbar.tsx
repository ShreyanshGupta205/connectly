import React, { useState } from 'react';
import { 
  ChevronDown, 
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
  const { currentProfile, currentUser, logout, isAdmin } = useProfile();
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
    ...(isAdmin ? [{
      label: 'Admin',
      onClick: () => navigateTo('admin'),
      icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />,
      active: false
    }] : [])
  ] : [
    { label: 'Home', onClick: () => navigateTo('landing'), icon: null, active: false },
    { label: 'Studio', onClick: () => navigateTo('dashboard'), icon: <Layers className="w-3.5 h-3.5" />, active: currentRoute === 'dashboard' },
    { label: 'Live Profile', onClick: () => navigateTo(`@${currentProfile.username}`), icon: <User className="w-3.5 h-3.5" />, active: currentRoute.startsWith('@') || currentRoute.startsWith('/@') },
    { label: 'Print Poster', onClick: () => navigateTo(`poster-${currentProfile.username}`), icon: <QrCode className="w-3.5 h-3.5" />, active: currentRoute.startsWith('poster-') },
    ...(isAdmin ? [{ label: 'Admin', onClick: () => navigateTo('admin'), icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />, active: currentRoute === 'admin' }] : [])
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

            {/* If NOT logged in: Prominent "Sign in with Google" button */}
            {!currentUser ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            ) : (
              /* If logged in: User Account Menu (Exclusively for this logged-in account) */
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-all text-xs text-slate-200"
                >
                  <img
                    src={currentUser.avatarUrl || currentProfile.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40"
                  />
                  <span className="hidden sm:inline font-medium max-w-[100px] truncate">
                    @{currentUser.username}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl shadow-black/80 p-3 z-50 backdrop-blur-2xl"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    {/* Logged In User Card */}
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-2.5">
                      <img
                        src={currentUser.avatarUrl || currentProfile.avatarUrl}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/40"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-white truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-indigo-300 font-mono truncate">@{currentUser.username}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    {/* Account Shortcuts */}
                    <div className="space-y-1">
                      <button
                        onClick={() => navigateTo('dashboard')}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/15 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>My Creator Studio</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => navigateTo(`@${currentUser.username}`)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          <span>View My Live Profile</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => navigateTo(`poster-${currentUser.username}`)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <QrCode className="w-3.5 h-3.5 text-purple-400" />
                          <span>Download QR Poster</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => navigateTo('admin')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Admin Control Panel</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            ROOT
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Sign Out Action */}
                    <div className="mt-2 pt-2 border-t border-white/[0.07]">
                      <button
                        onClick={() => logout()}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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

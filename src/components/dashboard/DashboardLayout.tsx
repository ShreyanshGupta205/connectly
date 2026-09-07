import React, { useState } from 'react';
import { 
  Layers, 
  User, 
  Link as LinkIcon, 
  Palette, 
  QrCode, 
  BarChart3, 
  Smartphone, 
  Eye
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import type { ActiveTab } from '../../types';
import { OverviewTab } from './OverviewTab';
import { ProfileEditorTab } from './ProfileEditorTab';
import { LinksManagerTab } from './LinksManagerTab';
import { AppearanceTab } from './AppearanceTab';
import { QRStudioTab } from './QRStudioTab';
import { AnalyticsTab } from './AnalyticsTab';
import { LivePhonePreview } from './LivePhonePreview';
import { AIAssistantModal } from './AIAssistantModal';
import { GoogleAuthModal, GoogleIcon } from '../common/GoogleAuthModal';

interface DashboardLayoutProps {
  navigateTo: (route: string) => void;
  onOpenQR: () => void;
  onOpenShare: () => void;
  onOpenCommand?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  navigateTo, 
  onOpenQR, 
  onOpenShare,
  onOpenCommand 
}) => {
  const { currentProfile, currentUser, activeTab, setActiveTab } = useProfile();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobilePhonePreviewOpen, setMobilePhonePreviewOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'editor', label: 'Profile Identity', icon: <User className="w-4 h-4" /> },
    { id: 'links', label: 'Social Links', icon: <LinkIcon className="w-4 h-4" />, badge: `${currentProfile.links.length}` },
    { id: 'appearance', label: 'Themes & Styles', icon: <Palette className="w-4 h-4" /> },
    { id: 'qr', label: 'QR Poster Studio', icon: <QrCode className="w-4 h-4" />, badge: 'Print' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Mobile Bar Switcher */}
      <div className="flex lg:hidden items-center justify-between p-3 rounded-2xl bg-dark-900 border border-white/10 mb-6">
        <div className="flex items-center gap-2">
          <img src={currentProfile.avatarUrl} alt={currentProfile.name} className="w-8 h-8 rounded-full object-cover" />
          <div className="truncate">
            <p className="font-bold text-xs text-white truncate">{currentProfile.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">@{currentProfile.username}</p>
          </div>
        </div>

        <button
          onClick={() => setMobilePhonePreviewOpen(!mobilePhonePreviewOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{mobilePhonePreviewOpen ? 'Hide Mobile' : 'Preview Mobile'}</span>
        </button>
      </div>

      {/* Main Grid: Sidebar + Center Content + Right Live Phone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 lg:gap-7 items-start">
        
        {/* Left Sidebar Navigation (3 cols) */}
        <aside className="lg:col-span-3 xl:col-span-3 space-y-4">
          
          {/* User Card */}
          <div className="p-5 rounded-3xl bg-dark-900 border border-white/10 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentProfile.avatarUrl}
                  alt={currentProfile.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500 shadow-md"
                />
                {currentProfile.isVerified && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] ring-2 ring-dark-950 font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm text-white truncate">{currentProfile.name}</h3>
                <p className="text-xs text-brand-300 font-medium font-mono truncate">@{currentProfile.username}</p>
              </div>
            </div>

            {/* Live Auto-save indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="truncate">Auto-saved to cloud sync</span>
            </div>

            {/* Command Palette Button */}
            {onOpenCommand && (
              <button
                onClick={onOpenCommand}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-indigo-400">⌘</span>
                  <span>Command Menu</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">⌘K</kbd>
              </button>
            )}

            {/* Profile Health Score */}
            <div className="pt-1 px-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Profile Strength</span>
                <span className="text-emerald-400 font-bold font-mono">96% Excellent</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full w-[96%]" />
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 rounded-3xl bg-dark-900 border border-white/10 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    activeTab === item.id ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Google Auth Status Card */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GoogleIcon className="w-4 h-4" />
                <span className="font-bold text-xs text-white">Google Account</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {currentUser?.email ? 'Connected' : 'Guest'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {currentUser?.email || 'Sign in with Google to sync cloud data.'}
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <GoogleIcon className="w-3.5 h-3.5" />
              <span>{currentUser?.email ? 'Switch Google Account' : 'Sign in with Google'}</span>
            </button>
          </div>

          {/* Quick Profile View Link */}
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Public Link</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Live</span>
            </div>
            <p className="font-mono text-[11px] text-indigo-300 truncate">
              connectly.bio/@{currentProfile.username}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/#/@${currentProfile.username}`;
                  navigator.clipboard.writeText(url);
                }}
                className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <span>Copy URL</span>
              </button>
              <button
                onClick={() => navigateTo(`@${currentProfile.username}`)}
                className="py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
            </div>
          </div>

        </aside>

        {/* Center Content Tab Area (6 cols on xl, 5 cols on lg) */}
        <main className={`lg:col-span-5 xl:col-span-6 min-w-0 ${mobilePhonePreviewOpen ? 'hidden lg:block' : 'block'}`}>
          {activeTab === 'overview' && <OverviewTab navigateTo={navigateTo} onOpenAI={() => setIsAIModalOpen(true)} />}
          {activeTab === 'editor' && <ProfileEditorTab onOpenAI={() => setIsAIModalOpen(true)} />}
          {activeTab === 'links' && <LinksManagerTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'qr' && <QRStudioTab navigateTo={navigateTo} />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </main>

        {/* Right Live Phone Simulator (3 cols on xl, 4 cols on lg) */}
        <aside className={`lg:col-span-4 xl:col-span-3 flex justify-center ${mobilePhonePreviewOpen ? 'block' : 'hidden lg:flex'}`}>
          <LivePhonePreview onOpenQR={onOpenQR} onOpenShare={onOpenShare} />
        </aside>

      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />

      {/* Google Auth Modal */}
      <GoogleAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
};

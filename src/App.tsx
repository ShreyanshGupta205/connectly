import React, { useState, useEffect } from 'react';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { PublicProfileView } from './components/profile/PublicProfileView';
import { PrintablePoster } from './components/poster/PrintablePoster';
import { ShareModal } from './components/profile/ShareModal';
import { QRModal } from './components/profile/QRModal';
import { CommandPalette } from './components/common/CommandPalette';
import { AdminPanel } from './components/admin/AdminPanel';
import { PrivacyPolicyView } from './components/legal/PrivacyPolicyView';
import { 
  parseRoute, 
  pathToRoute, 
  routeToPath, 
  extractUsername, 
  isPublicProfileRoute, 
  isPosterRoute as checkIsPosterRoute 
} from './utils/router';
import { Analytics } from '@vercel/analytics/react';

const AppContent: React.FC = () => {
  const { currentProfile, switchProfile, profiles } = useProfile();

  // Route state initialized from pathname + legacy hash
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const { route, canonicalPath, isLegacyHash } = parseRoute(window.location.pathname, window.location.hash);
    if (isLegacyHash && typeof window !== 'undefined') {
      // Cleanly replace legacy hash with canonical path in browser history
      window.history.replaceState(null, '', canonicalPath);
    }
    return route;
  });

  const [globalShareOpen, setGlobalShareOpen] = useState(false);
  const [globalQROpen, setGlobalQROpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Sync route and handle browser Back/Forward (popstate)
  useEffect(() => {
    const handleLocationChange = () => {
      const { route, canonicalPath, isLegacyHash } = parseRoute(window.location.pathname, window.location.hash);
      
      if (isLegacyHash) {
        window.history.replaceState(null, '', canonicalPath);
      }

      setCurrentRoute(route);

      // Sync active profile if viewing a public profile
      const username = extractUsername(route);
      if (username && profiles[username]) {
        switchProfile(username);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    // Also listen to hashchange for backwards compatibility with any remaining in-page anchors
    window.addEventListener('hashchange', handleLocationChange);
    
    // Initial sync
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [profiles, switchProfile]);

  // Global keyboard shortcut for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (route: string) => {
    const canonical = routeToPath(route);
    const internal = pathToRoute(canonical);

    if (window.location.pathname !== canonical) {
      window.history.pushState(null, '', canonical);
    }

    setCurrentRoute(internal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPublicProfile = isPublicProfileRoute(currentRoute);
  const isPosterRoute = checkIsPosterRoute(currentRoute);

  const targetUsername = extractUsername(currentRoute) || currentProfile.username;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* Show Navbar on Landing and Dashboard routes */}
      {!isPosterRoute && !isPublicProfile && (
        <Navbar 
          currentRoute={currentRoute} 
          navigateTo={navigateTo} 
          onOpenCommand={() => setCommandPaletteOpen(true)}
        />
      )}

      {/* Main Routed Content */}
      <main className="flex-1">
        {currentRoute === 'landing' && (
          <LandingPage navigateTo={navigateTo} />
        )}

        {currentRoute === 'dashboard' && (
          <DashboardLayout
            navigateTo={navigateTo}
            onOpenQR={() => setGlobalQROpen(true)}
            onOpenShare={() => setGlobalShareOpen(true)}
            onOpenCommand={() => setCommandPaletteOpen(true)}
          />
        )}

        {currentRoute === 'admin' && (
          <AdminPanel navigateTo={navigateTo} />
        )}

        {currentRoute === 'privacy' && (
          <PrivacyPolicyView navigateTo={navigateTo} />
        )}

        {isPublicProfile && (
          <PublicProfileView username={targetUsername} navigateTo={navigateTo} />
        )}

        {isPosterRoute && (
          <PrintablePoster username={targetUsername} navigateTo={navigateTo} />
        )}
      </main>

      {/* Footer on Landing & Dashboard */}
      {!isPosterRoute && !isPublicProfile && (
        <Footer navigateTo={navigateTo} />
      )}

      {/* Global Modals */}
      <ShareModal
        profile={currentProfile}
        isOpen={globalShareOpen}
        onClose={() => setGlobalShareOpen(false)}
        onOpenQR={() => setGlobalQROpen(true)}
      />

      <QRModal
        profile={currentProfile}
        isOpen={globalQROpen}
        onClose={() => setGlobalQROpen(false)}
        onOpenPoster={() => navigateTo(`poster-${currentProfile.username}`)}
      />

      {/* Cmd+K Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        navigateTo={navigateTo}
      />

    </div>
  );
};

export default function App() {
  return (
    <ProfileProvider>
      <ToastProvider>
        <AppContent />
        <Analytics />
      </ToastProvider>
    </ProfileProvider>
  );
}


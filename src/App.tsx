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

const AppContent: React.FC = () => {
  const { currentProfile, switchProfile, profiles } = useProfile();

  // Route state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const raw = window.location.hash.replace(/^#\/?/, '').replace(/^\/+/, '');
    return raw || 'landing';
  });

  const [globalShareOpen, setGlobalShareOpen] = useState(false);
  const [globalQROpen, setGlobalQROpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      let rawHash = window.location.hash.replace(/^#\/?/, '');
      if (rawHash.startsWith('/')) rawHash = rawHash.replace(/^\/+/, '');
      const targetRoute = rawHash || 'landing';
      setCurrentRoute(targetRoute);

      // If route is @username or /@username or p/username, sync profile
      const cleanUsername = targetRoute.replace(/^\/+/, '').replace(/^@/, '').replace(/^p\//, '');
      if ((targetRoute.startsWith('@') || targetRoute.startsWith('/@') || targetRoute.startsWith('p/')) && profiles[cleanUsername]) {
        switchProfile(cleanUsername);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
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
    const cleanRoute = route.replace(/^\/+/, '');
    window.location.hash = `#/${cleanRoute}`;
    setCurrentRoute(cleanRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPublicProfile = currentRoute.startsWith('@') || currentRoute.startsWith('/@') || currentRoute.startsWith('p/');
  const isPosterRoute = currentRoute.startsWith('poster-') || currentRoute.startsWith('poster/');

  const targetUsername = isPublicProfile
    ? currentRoute.replace(/^\/+/, '').replace(/^@/, '').replace(/^p\//, '')
    : isPosterRoute
      ? currentRoute.replace(/^poster-/, '').replace(/^poster\//, '')
      : currentProfile.username;

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
      </ToastProvider>
    </ProfileProvider>
  );
}

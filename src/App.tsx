import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { PublicProfileView } from './components/profile/PublicProfileView';
import { ShareModal } from './components/profile/ShareModal';
import { QRModal } from './components/profile/QRModal';
import { CommandPalette } from './components/common/CommandPalette';
import { NotFoundView } from './components/common/NotFoundView';
import { 
  parseRoute, 
  pathToRoute, 
  routeToPath, 
  extractUsername, 
  isPublicProfileRoute, 
  isPosterRoute as checkIsPosterRoute 
} from './utils/router';
import { Analytics } from '@vercel/analytics/react';

// Code-split heavy components for optimal initial bundle & page speed
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const PrintablePoster = lazy(() => import('./components/poster/PrintablePoster').then(m => ({ default: m.PrintablePoster })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const AIMissionControl = lazy(() => import('./components/admin/AIMissionControl').then(m => ({ default: m.AIMissionControl })));
const PrivacyPolicyView = lazy(() => import('./components/legal/PrivacyPolicyView').then(m => ({ default: m.PrivacyPolicyView })));

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 gap-4">
    <div className="w-10 h-10 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
    <span className="text-slate-400 text-xs font-mono tracking-wider uppercase animate-pulse">Loading component...</span>
  </div>
);

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
        <Suspense fallback={<RouteLoadingFallback />}>
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

          {currentRoute === 'mission-control' && (
            <AIMissionControl navigateTo={navigateTo} />
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

          {/* 404 Destination Not Found Fallback */}
          {currentRoute !== 'landing' &&
           currentRoute !== 'dashboard' &&
           currentRoute !== 'admin' &&
           currentRoute !== 'mission-control' &&
           currentRoute !== 'privacy' &&
           !isPublicProfile &&
           !isPosterRoute && (
            <NotFoundView navigateTo={navigateTo} attemptedPath={window.location.pathname} />
          )}
        </Suspense>
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


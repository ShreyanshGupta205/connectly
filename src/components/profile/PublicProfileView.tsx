import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Share2, 
  QrCode, 
  MapPin, 
  UserPlus
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { getThemeById } from '../../data/themes';
import { SocialLinkCard } from './SocialLinkCard';
import { LikeButton } from './LikeButton';
import { ShareModal } from './ShareModal';
import { QRModal } from './QRModal';
import { downloadVCard } from '../../utils/vcardUtils';
import { useToast } from '../../context/ToastContext';
import { BrandLogo, BrandIcon } from '../common/BrandLogo';

interface PublicProfileViewProps {
  username: string;
  navigateTo: (route: string) => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ username, navigateTo }) => {
  const { profiles, recordProfileView, recordLinkClick } = useProfile();
  const toast = useToast();
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);

  const cleanUsername = username.replace(/^@/, '');
  const profile = profiles[cleanUsername] || profiles['shreyansh'];

  const theme = getThemeById(profile?.themeId || 'aurora-glass');

  // Dynamic Document Title
  useEffect(() => {
    if (profile) {
      document.title = `${profile.name} (@${profile.username}) • Connectly`;
    }
    return () => {
      document.title = 'Connectly — One Profile. Every Connection.';
    };
  }, [profile]);

  // Record profile visit on mount
  useEffect(() => {
    if (profile) {
      recordProfileView(profile.username);
    }
  }, [cleanUsername, profile?.username]);

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-slate-400 mb-6">The username @{cleanUsername} has not been claimed yet.</p>
        <button
          onClick={() => navigateTo('landing')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm"
        >
          Claim this username
        </button>
      </div>
    );
  }

  const fontClasses: Record<string, string> = {
    sans: 'font-sans',
    outfit: 'font-outfit',
    mono: 'font-mono',
    display: 'font-display',
  };

  const currentFont = fontClasses[theme.fontFamily] || 'font-sans';

  return (
    <div className={`min-h-screen ${theme.bgClass} ${currentFont} text-slate-100 transition-colors duration-500 relative pb-28 overflow-x-hidden`}>
      
      {/* Background Animated Ambient Mesh Gradient Blob */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/25 to-pink-600/15 rounded-full blur-3xl animate-mesh-pulse" />
        <div className="absolute top-1/2 -left-20 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-20 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Floating Top Nav with Back & Share */}
      <div className="sticky top-0 z-30 w-full backdrop-blur-xl bg-slate-950/40 border-b border-white/[0.08] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <BrandLogo
            size="xs"
            variant="dark"
            onClick={() => navigateTo('landing')}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQROpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4 text-cyan-300" />
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4 text-indigo-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Profile Container */}
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Profile Card Header */}
        <div className="text-center space-y-3.5 animate-fade-in-up">
          
          {/* Avatar with multi-stop gradient ring + pulse glow */}
          <div className="relative inline-block mx-auto group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-2xl mx-auto animate-pulse-glow">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover bg-slate-900"
              />
            </div>
            {profile.isVerified && (
              <div 
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full ring-4 ring-slate-950 shadow-lg flex items-center justify-center" 
                title="Verified Creator Profile"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Name & Handle with Tagline */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {profile.name}
            </h1>
            <p className="text-sm font-semibold text-slate-400 tracking-wide">
              @{profile.username} {profile.tagline ? `• ${profile.tagline}` : ''}
            </p>
          </div>

          {/* Location & Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {profile.category && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                {profile.category}
              </span>
            )}
            {profile.location && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{profile.location}</span>
              </span>
            )}
          </div>

          {/* Bio text */}
          {profile.bio && (
            <p className="text-sm text-slate-300/90 max-w-md mx-auto leading-relaxed px-2 font-normal">
              {profile.bio}
            </p>
          )}

          {/* Main Action Buttons: Like Profile & QR Code (Matches Image 4 Mockup) */}
          <div className="flex items-center justify-center gap-2.5 pt-1">
            <LikeButton 
              username={profile.username} 
              theme={theme} 
              variant="default" 
            />
            <button
              onClick={() => setIsQROpen(true)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5 text-indigo-300" />
            </button>
          </div>

          {/* Skills / Tech Tags — micro-chip style */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto pt-1">
              {profile.skills.map((skill, idx) => {
                const chipColors = [
                  'bg-indigo-500/12 text-indigo-300 border-indigo-500/20',
                  'bg-purple-500/12 text-purple-300 border-purple-500/20',
                  'bg-cyan-500/12 text-cyan-300 border-cyan-500/20',
                  'bg-emerald-500/12 text-emerald-300 border-emerald-500/20',
                  'bg-amber-500/12 text-amber-300 border-amber-500/20',
                  'bg-pink-500/12 text-pink-300 border-pink-500/20',
                ];
                const color = chipColors[idx % chipColors.length];
                return (
                  <span
                    key={idx}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${color} backdrop-blur-sm`}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          )}

          {/* Save Contact Link */}
          <div className="pt-1 flex items-center justify-center">
            <button
              onClick={() => {
                downloadVCard(profile);
                toast.success('Contact card downloaded!', `${profile.name}.vcf added to downloads.`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-slate-200 font-semibold text-xs backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
              <span>Save Contact (vCard)</span>
            </button>
          </div>

        </div>

        {/* Social Links Stack — staggered fade in */}
        <div className="space-y-2.5 pt-2 stagger-children">
          {profile.links.filter(l => l.isVisible).map(link => (
            <div key={link.id} className="animate-fade-in-up">
              <SocialLinkCard
                link={link}
                theme={theme}
                onLinkClick={(id) => recordLinkClick(profile.username, id)}
              />
            </div>
          ))}
        </div>

        {/* Bottom Connectly Promo Banner */}
        <div className="pt-8 pb-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2.5 p-1.5 pl-3 pr-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
            <BrandIcon sizeClass="w-4 h-4" />
            <span className="text-xs text-slate-300">Create your verified digital identity</span>
            <button
              onClick={() => navigateTo('landing')}
              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Join Connectly
            </button>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <span>One Profile. Every Connection.</span>
            <span>•</span>
            <span className="font-semibold text-slate-400">Connectly</span>
          </p>
        </div>

      </div>

      {/* Floating Sticky Bottom Action Bar (Luxe Minimal Design) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <div className="flex items-center justify-between p-1.5 px-3 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/60 ring-1 ring-white/10">
          
          {/* Heart / Like Button in Action Bar */}
          <LikeButton 
            username={profile.username} 
            theme={theme} 
            variant="action-bar" 
          />

          <div className="h-4 w-[1px] bg-white/15" />

          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all font-semibold text-xs active:scale-95"
          >
            <Share2 className="w-4 h-4 text-slate-300" />
            <span>Share</span>
          </button>

          <div className="h-4 w-[1px] bg-white/15" />

          {/* QR Code Button */}
          <button
            onClick={() => setIsQROpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-indigo-300 hover:text-white hover:bg-white/10 transition-all font-semibold text-xs active:scale-95"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>QR Code</span>
          </button>

        </div>
      </div>

      {/* Share & QR Modals */}
      <ShareModal
        profile={profile}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onOpenQR={() => setIsQROpen(true)}
      />

      <QRModal
        profile={profile}
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        onOpenPoster={() => navigateTo(`poster-${profile.username}`)}
      />

    </div>
  );
};

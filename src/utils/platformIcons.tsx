import React from 'react';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Globe, 
  Mail, 
  Music, 
  Tv, 
  AtSign, 
  ExternalLink
} from 'lucide-react';
import type { SocialPlatform } from '../types';

// Custom crisp SVG brand icons for missing lucide icons
export const YouTubeIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const InstagramIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export const LinkedInIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export const GitHubIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

export const TwitterIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const DribbbleIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94"/>
    <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32"/>
    <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72"/>
  </svg>
);

export interface PlatformMetadata {
  label: string;
  placeholder: string;
  defaultTitle: string;
  color: string;
  bgBadge: string;
  icon: (className?: string) => React.ReactNode;
}

export const PLATFORM_REGISTRY: Record<SocialPlatform, PlatformMetadata> = {
  youtube: {
    label: 'YouTube',
    placeholder: 'https://youtube.com/@username',
    defaultTitle: 'YouTube Channel',
    color: '#FF0000',
    bgBadge: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: (cls = 'w-5 h-5') => <YouTubeIcon className={cls} style={{ color: '#FF0000' }} />,
  },
  instagram: {
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    defaultTitle: 'Instagram',
    color: '#E4405F',
    bgBadge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    icon: (cls = 'w-5 h-5') => <InstagramIcon className={cls} style={{ color: '#E4405F' }} />,
  },
  linkedin: {
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    defaultTitle: 'LinkedIn Network',
    color: '#0A66C2',
    bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: (cls = 'w-5 h-5') => <LinkedInIcon className={cls} style={{ color: '#0A66C2' }} />,
  },
  github: {
    label: 'GitHub',
    placeholder: 'https://github.com/username',
    defaultTitle: 'GitHub Repos',
    color: '#f0f6fc',
    bgBadge: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    icon: (cls = 'w-5 h-5') => <GitHubIcon className={cls} />,
  },
  x: {
    label: 'X (Twitter)',
    placeholder: 'https://x.com/username',
    defaultTitle: 'X / Twitter',
    color: '#1DA1F2',
    bgBadge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    icon: (cls = 'w-5 h-5') => <TwitterIcon className={cls} style={{ color: '#1DA1F2' }} />,
  },
  discord: {
    label: 'Discord',
    placeholder: 'https://discord.gg/inviteCode',
    defaultTitle: 'Discord Community',
    color: '#5865F2',
    bgBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: (cls = 'w-5 h-5') => <MessageSquare className={cls} style={{ color: '#5865F2' }} />,
  },
  telegram: {
    label: 'Telegram',
    placeholder: 'https://t.me/username',
    defaultTitle: 'Telegram Channel',
    color: '#229ED9',
    bgBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: (cls = 'w-5 h-5') => <Send className={cls} style={{ color: '#229ED9' }} />,
  },
  whatsapp: {
    label: 'WhatsApp',
    placeholder: 'https://wa.me/phone_number',
    defaultTitle: 'WhatsApp Direct',
    color: '#25D366',
    bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: (cls = 'w-5 h-5') => <Phone className={cls} style={{ color: '#25D366' }} />,
  },
  spotify: {
    label: 'Spotify',
    placeholder: 'https://open.spotify.com/artist/...',
    defaultTitle: 'Spotify Playlist / Artist',
    color: '#1DB954',
    bgBadge: 'bg-green-500/10 text-green-400 border-green-500/20',
    icon: (cls = 'w-5 h-5') => <Music className={cls} style={{ color: '#1DB954' }} />,
  },
  twitch: {
    label: 'Twitch',
    placeholder: 'https://twitch.tv/username',
    defaultTitle: 'Twitch Stream',
    color: '#9146FF',
    bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: (cls = 'w-5 h-5') => <Tv className={cls} style={{ color: '#9146FF' }} />,
  },
  threads: {
    label: 'Threads',
    placeholder: 'https://threads.net/@username',
    defaultTitle: 'Threads Feed',
    color: '#FFFFFF',
    bgBadge: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
    icon: (cls = 'w-5 h-5') => <AtSign className={cls} />,
  },
  dribbble: {
    label: 'Dribbble',
    placeholder: 'https://dribbble.com/username',
    defaultTitle: 'Dribbble Shots',
    color: '#EA4C89',
    bgBadge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    icon: (cls = 'w-5 h-5') => <DribbbleIcon className={cls} style={{ color: '#EA4C89' }} />,
  },
  behance: {
    label: 'Behance',
    placeholder: 'https://behance.net/username',
    defaultTitle: 'Behance Portfolio',
    color: '#1769FF',
    bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: (cls = 'w-5 h-5') => <Globe className={cls} style={{ color: '#1769FF' }} />,
  },
  website: {
    label: 'Website / Portfolio',
    placeholder: 'https://yourwebsite.com',
    defaultTitle: 'My Website',
    color: '#8B5CF6',
    bgBadge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: (cls = 'w-5 h-5') => <Globe className={cls} style={{ color: '#8B5CF6' }} />,
  },
  email: {
    label: 'Email Address',
    placeholder: 'mailto:you@example.com',
    defaultTitle: 'Send Me an Email',
    color: '#3B82F6',
    bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: (cls = 'w-5 h-5') => <Mail className={cls} style={{ color: '#3B82F6' }} />,
  },
  custom: {
    label: 'Custom Link',
    placeholder: 'https://anylink.com',
    defaultTitle: 'Featured Link',
    color: '#A855F7',
    bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: (cls = 'w-5 h-5') => <ExternalLink className={cls} />,
  }
};

export const getPlatformMeta = (platform: SocialPlatform): PlatformMetadata => {
  return PLATFORM_REGISTRY[platform] || PLATFORM_REGISTRY.custom;
};

export type SocialPlatform = 
  | 'youtube'
  | 'instagram'
  | 'linkedin'
  | 'github'
  | 'x'
  | 'discord'
  | 'telegram'
  | 'whatsapp'
  | 'website'
  | 'email'
  | 'spotify'
  | 'twitch'
  | 'threads'
  | 'dribbble'
  | 'behance'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  title: string;
  url: string;
  subtitle?: string;
  icon?: string;
  position: number;
  isVisible: boolean;
  clicks: number;
  featured?: boolean;
  color?: string;
}

export type ButtonShape = 'rounded' | 'pill' | 'sharp' | 'glass';
export type BackgroundStyle = 'gradient' | 'mesh' | 'particles' | 'grid' | 'cyber' | 'minimal' | 'solid';

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
  bgClass: string;
  bgStyle?: React.CSSProperties;
  cardClass: string;
  cardHoverClass: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  buttonShape: ButtonShape;
  fontFamily: 'sans' | 'outfit' | 'mono' | 'display';
  previewGradient: string;
  badgeClass: string;
  likeBtnClass: string;
}

export interface DayMetric {
  date: string;
  views: number;
  clicks: number;
  likes: number;
  qrScans: number;
}

export interface LinkClickMetric {
  id: string;
  platform: SocialPlatform;
  title: string;
  clicks: number;
  url: string;
}

export interface DeviceBreakdown {
  mobile: number; // percentage
  desktop: number;
  tablet: number;
}

export interface TrafficSource {
  source: string;
  percentage: number;
  count: number;
}

export interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalLikes: number;
  totalShares: number;
  totalQrScans: number;
  ctr: number; // Click through rate %
  timeSeries: DayMetric[];
  linkClicks: LinkClickMetric[];
  devices: DeviceBreakdown;
  sources: TrafficSource[];
  recentActivity: {
    id: string;
    type: 'like' | 'click' | 'view' | 'qr';
    label: string;
    timestamp: string;
    location?: string;
  }[];
}

export interface QRSettings {
  fgColor: string;
  bgColor: string;
  includeAvatar: boolean;
  style: 'minimal' | 'badge' | 'poster' | 'neon' | 'cyber';
  dotType: 'squares' | 'dots' | 'rounded';
  customText?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  isVerified: boolean;
  themeId: string;
  customTheme?: Partial<ThemeConfig>;
  links: SocialLink[];
  stats: {
    views: number;
    likes: number;
    shares: number;
    qrScans: number;
  };
  qrSettings: QRSettings;
  plan: 'free' | 'pro' | 'creator';
  createdAt: string;
  email?: string;
  location?: string;
  category?: 'Developer' | 'AI Builder' | 'Creator' | 'Student' | 'Designer' | 'Founder';
  skills?: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  plan: 'free' | 'pro' | 'creator';
}

export type ActiveTab = 'overview' | 'editor' | 'links' | 'appearance' | 'qr' | 'analytics' | 'settings';

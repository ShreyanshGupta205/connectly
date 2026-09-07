import type { UserProfile, AnalyticsData } from '../types';

export const INITIAL_PROFILES: Record<string, UserProfile> = {
  shreyansh: {
    id: 'user-shreyansh',
    username: 'shreyansh',
    name: 'Shreyansh Gupta',
    tagline: 'AI Developer • Hackathon Builder',
    bio: 'Exploring Artificial Intelligence, building full-stack products, and explaining tech simply. Learn. Build. Explain.',
    avatarUrl: '/shreyansh-avatar.jpg',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    isVerified: true,
    themeId: 'aurora-glass',
    plan: 'pro',
    createdAt: new Date().toISOString(),
    email: 'shreyanshg2005@gmail.com',
    location: 'Bengaluru, India',
    category: 'AI Builder',
    skills: ['Python', 'TypeScript', 'PyTorch', 'React', 'Generative AI', 'Full Stack'],
    stats: {
      views: 4280,
      likes: 1284,
      shares: 340,
      qrScans: 620,
    },
    qrSettings: {
      fgColor: '#8b5cf6',
      bgColor: '#0d1117',
      includeAvatar: true,
      style: 'badge',
      dotType: 'rounded',
      customText: 'Scan to connect with Shreyansh',
    },
    links: [
      {
        id: 'link-yt',
        platform: 'youtube',
        title: 'YouTube Channel',
        subtitle: '@shreyanshbuild • 240k Subscribers • AI Tutorials',
        url: 'https://youtube.com/@shreyanshbuild',
        position: 1,
        isVisible: true,
        clicks: 2450,
        featured: true,
      },
      {
        id: 'link-gh',
        platform: 'github',
        title: 'GitHub Repositories',
        subtitle: 'ShreyanshGupta205 • Open-source AI & Web Apps',
        url: 'https://github.com/ShreyanshGupta205',
        position: 2,
        isVisible: true,
        clicks: 1820,
        featured: true,
      },
      {
        id: 'link-li',
        platform: 'linkedin',
        title: 'LinkedIn Network',
        subtitle: '/in/shreyanshgupta205 • Let\'s connect professionally',
        url: 'https://linkedin.com/in/shreyanshgupta205',
        position: 3,
        isVisible: true,
        clicks: 940,
        featured: false,
      },
      {
        id: 'link-ig',
        platform: 'instagram',
        title: 'Instagram',
        subtitle: '@shreyanshg2005 • Behind the scenes & tech updates',
        url: 'https://instagram.com/shreyanshg2005',
        position: 4,
        isVisible: true,
        clicks: 1120,
        featured: false,
      },
      {
        id: 'link-devpost',
        platform: 'website',
        title: 'Devpost & Hackathon Portfolio',
        subtitle: 'Winner Badges • 18+ Hackathons Won',
        url: 'https://devpost.com/ShreyanshGupta205',
        position: 5,
        isVisible: true,
        clicks: 650,
        featured: false,
      },
      {
        id: 'link-x',
        platform: 'x',
        title: 'X / Twitter',
        subtitle: '@shreyansh_build • Tech thoughts & AI drops',
        url: 'https://x.com/shreyansh_build',
        position: 6,
        isVisible: true,
        clicks: 480,
        featured: false,
      },
    ],
  },
};

export const getMockAnalyticsForProfile = (profile: UserProfile): AnalyticsData => {
  const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const viewsCount = profile.stats?.views || 0;
  const likesCount = profile.stats?.likes || 0;
  const qrCount = profile.stats?.qrScans || 0;
  const sharesCount = profile.stats?.shares || 0;
  const totalClicksCount = profile.links?.reduce((acc, l) => acc + (l.clicks || 0), 0) || 0;

  const baseViews = Math.floor(viewsCount / 7);
  const timeSeries = dates.map((date) => {
    const views = baseViews;
    const clicks = Math.floor(views * 0.35);
    const likes = Math.floor(views * 0.08);
    const qrScans = Math.floor(views * 0.12);
    return {
      date,
      views,
      clicks,
      likes,
      qrScans,
    };
  });

  const linkClicks = (profile.links || []).map(l => ({
    id: l.id,
    platform: l.platform,
    title: l.title,
    clicks: l.clicks || 0,
    url: l.url,
  })).sort((a, b) => b.clicks - a.clicks);

  const ctr = viewsCount > 0 
    ? Number(((totalClicksCount / viewsCount) * 100).toFixed(1)) 
    : 0;

  return {
    totalViews: viewsCount,
    totalClicks: totalClicksCount,
    totalLikes: likesCount,
    totalShares: sharesCount,
    totalQrScans: qrCount,
    ctr,
    timeSeries,
    linkClicks,
    devices: {
      mobile: 65,
      desktop: 30,
      tablet: 5,
    },
    sources: [
      { source: 'Direct / Social Link', percentage: 45, count: Math.floor(viewsCount * 0.45) },
      { source: 'QR Code / Poster Scan', percentage: 35, count: qrCount },
      { source: 'GitHub & Portfolio Referral', percentage: 20, count: Math.floor(viewsCount * 0.20) },
    ],
    recentActivity: [
      { id: '1', type: 'like', label: `Visitor liked @${profile.username}'s profile`, timestamp: '2m ago', location: profile.location || 'Bengaluru, India' },
      { id: '2', type: 'view', label: 'Profile visited via direct link', timestamp: '5m ago', location: 'Mumbai, India' },
      { id: '3', type: 'click', label: 'Clicked "YouTube Channel" link', timestamp: '12m ago', location: 'Delhi, India' },
      { id: '4', type: 'qr', label: 'QR code scanned from poster', timestamp: '28m ago', location: 'Hyderabad, India' },
      { id: '5', type: 'like', label: `@${profile.username}'s profile received a like`, timestamp: '45m ago', location: 'Pune, India' },
      { id: '6', type: 'click', label: 'Clicked "GitHub Repositories" link', timestamp: '1h ago', location: 'Bengaluru, India' },
      { id: '7', type: 'view', label: 'Profile visited via QR scan', timestamp: '2h ago', location: 'Chennai, India' },
    ]
  };
};

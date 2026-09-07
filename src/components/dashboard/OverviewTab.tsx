import React, { useState } from 'react';
import { 
  Eye, 
  Heart, 
  MousePointerClick, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';

interface OverviewTabProps {
  navigateTo: (route: string) => void;
  onOpenAI: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ navigateTo, onOpenAI }) => {
  const { currentProfile, analytics, setActiveTab, isCloudConnected } = useProfile();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [chartMetric, setChartMetric] = useState<'views' | 'clicks'>('views');

  const profileUrl = `${window.location.origin}/#/@${currentProfile.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Profile Link Copied!', profileUrl);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    {
      title: 'Profile Views',
      value: currentProfile.stats.views.toLocaleString(),
      change: '+14.2% this week',
      icon: <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />,
      bg: 'from-indigo-600/20 to-purple-600/5',
      borderColor: 'border-indigo-500/30',
      sparklineColor: '#6366f1',
      sparklineData: [38, 52, 48, 64, 70, 78, 88],
    },
    {
      title: 'Link Clicks',
      value: analytics.totalClicks.toLocaleString(),
      change: `${analytics.ctr}% CTR`,
      icon: <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />,
      bg: 'from-cyan-600/20 to-blue-600/5',
      borderColor: 'border-cyan-500/30',
      sparklineColor: '#06b6d4',
      sparklineData: [22, 34, 28, 46, 55, 68, 75],
    },
    {
      title: 'Visitor Likes',
      value: currentProfile.stats.likes.toLocaleString(),
      change: '+18.3% this week',
      icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />,
      bg: 'from-pink-600/20 to-rose-600/5',
      borderColor: 'border-pink-500/30',
      sparklineColor: '#ec4899',
      sparklineData: [18, 28, 24, 36, 42, 55, 68],
    },
    {
      title: 'QR Scans',
      value: currentProfile.stats.qrScans.toLocaleString(),
      change: '14.5% of total views',
      icon: <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
      bg: 'from-amber-600/20 to-orange-600/5',
      borderColor: 'border-amber-500/30',
      sparklineColor: '#f59e0b',
      sparklineData: [12, 20, 18, 30, 38, 48, 56],
    },
  ];

  // 7-day trend chart data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = chartMetric === 'views' 
    ? [280, 420, 390, 560, 680, 890, 1140]
    : [95, 140, 130, 190, 230, 310, 420];
  const maxVal = Math.max(...chartData);

  return (
    <div className="space-y-5">
      
      {/* Top Banner / URL Share Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Your Live Digital Identity</span>
              {currentProfile.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {isCloudConnected && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Firebase Connected
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              connectly.bio/@{currentProfile.username}
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => navigateTo(`@${currentProfile.username}`)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards with Micro-Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {statCards.map((s, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border ${s.borderColor} bg-gradient-to-br ${s.bg} shadow-lg space-y-2.5 relative overflow-hidden group hover:border-white/30 transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">{s.title}</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                {s.icon}
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl xl:text-3xl font-black text-white tracking-tight whitespace-nowrap">
                {s.value}
              </p>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 truncate">
                <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{s.change}</span>
              </p>
            </div>

            {/* Micro Sparkline Curve */}
            <div className="pt-1">
              <svg viewBox="0 0 100 22" className="w-full h-5.5" fill="none">
                <path
                  d={`M0,${22 - (s.sparklineData[0]/80)*18} L16,${22 - (s.sparklineData[1]/80)*18} L33,${22 - (s.sparklineData[2]/80)*18} L50,${22 - (s.sparklineData[3]/80)*18} L66,${22 - (s.sparklineData[4]/80)*18} L83,${22 - (s.sparklineData[5]/80)*18} L100,${22 - (s.sparklineData[6]/80)*18}`}
                  stroke={s.sparklineColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Quick Action: AI Profile Assistant */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-purple-950/20 border border-purple-500/30 flex flex-col justify-between space-y-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/30 transition-all">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">✨ AI Profile Assistant</h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              Auto-generate bios, high-impact taglines, matching themes, and recommended social links.
            </p>
          </div>
          <button
            onClick={onOpenAI}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 mt-1"
          >
            <span>Launch AI Generator</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Action: Print QR Poster */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between space-y-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/30 transition-all">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Print QR Poster & Badges</h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              High-res printable event posters and hackathon lanyard cards for real-life networking.
            </p>
          </div>
          <button
            onClick={() => navigateTo(`poster-${currentProfile.username}`)}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 mt-1"
          >
            <span>Open Poster Studio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Action: Customize Appearance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-amber-950/20 border border-amber-500/30 flex flex-col justify-between space-y-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-950/30 transition-all">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Themes & Appearance</h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              Customize fonts, button styling, neon glow, and choose from 8 aesthetic presets.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('appearance')}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 mt-1"
          >
            <span>Change Theme</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 7-Day Performance & Traffic Analytics Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-base">7-Day Engagement Velocity</h3>
            </div>
            <p className="text-xs text-slate-400">Track high-intent views and clicks over time</p>
          </div>

          {/* Metric Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setChartMetric('views')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                chartMetric === 'views' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Profile Views
            </button>
            <button
              onClick={() => setChartMetric('clicks')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                chartMetric === 'clicks' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Link Clicks
            </button>
          </div>
        </div>

        {/* CSS/SVG Bar Graph */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-36 pt-4 px-2 border-b border-white/10 pb-2">
          {chartData.map((val, idx) => {
            const heightPercent = Math.round((val / maxVal) * 100);
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}
                </span>
                <div 
                  className={`w-full max-w-[36px] rounded-xl transition-all duration-500 group-hover:brightness-125 ${
                    chartMetric === 'views'
                      ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-lg shadow-indigo-600/20'
                      : 'bg-gradient-to-t from-cyan-600 to-blue-500 shadow-lg shadow-cyan-600/20'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] font-bold text-slate-400">
                  {days[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Links + Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performing Links */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Top Performing Links</h3>
            </div>
            <button 
              onClick={() => setActiveTab('links')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Manage All
            </button>
          </div>

          <div className="space-y-2.5">
            {currentProfile.links.slice(0, 4).map((link, idx) => {
              const clickPercent = Math.min(100, Math.round((link.clicks / (analytics.totalClicks || 1)) * 100));
              return (
                <div key={link.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                      <span className="font-semibold text-white truncate">{link.title}</span>
                    </div>
                    <span className="font-mono text-cyan-300 font-bold">{link.clicks} clicks</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full" 
                      style={{ width: `${clickPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Live Activity Stream */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Live Visitor Activity</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Stream
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-1">
            {analytics.recentActivity.map(act => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    act.type === 'like' ? 'bg-pink-500/20 text-pink-400' :
                    act.type === 'qr' ? 'bg-cyan-500/20 text-cyan-400' :
                    act.type === 'click' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {act.type === 'like' ? <Heart className="w-3.5 h-3.5 fill-current" /> :
                     act.type === 'qr' ? <QrCode className="w-3.5 h-3.5" /> :
                     act.type === 'click' ? <MousePointerClick className="w-3.5 h-3.5" /> :
                     <Eye className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{act.label}</p>
                    {act.location && <p className="text-[10px] text-slate-500 truncate">{act.location}</p>}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

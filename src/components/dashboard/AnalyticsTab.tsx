import React, { useState } from 'react';
import { 
  TrendingUp, 
  MousePointerClick, 
  Eye, 
  Heart, 
  QrCode, 
  Smartphone, 
  Monitor, 
  Tablet
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { getPlatformMeta } from '../../utils/platformIcons';

export const AnalyticsTab: React.FC = () => {
  const { analytics } = useProfile();
  const [metricFilter, setMetricFilter] = useState<'views' | 'clicks' | 'likes' | 'qrScans'>('views');

  const maxDailyValue = Math.max(...analytics.timeSeries.map(d => d[metricFilter]), 10);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-900 border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white">Engagement Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time metrics, CTR conversions, physical QR scan tracking, and link performance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-dark-950/80 p-1 rounded-xl border border-white/10 text-xs">
          <span className="px-3 py-1 bg-brand-600/20 text-brand-300 font-bold rounded-lg border border-brand-500/30">
            Last 7 Days
          </span>
        </div>
      </div>

      {/* 4 Big Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-dark-900 border border-brand-500/30 bg-gradient-to-br from-brand-600/15 to-transparent space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Profile Views</span>
            <Eye className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{analytics.totalViews.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs last week
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900 border border-cyan-500/30 bg-gradient-to-br from-cyan-600/15 to-transparent space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Link Clicks</span>
            <MousePointerClick className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{analytics.totalClicks.toLocaleString()}</p>
          <p className="text-[11px] text-cyan-300 font-semibold">
            {analytics.ctr}% Click-Through Rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900 border border-pink-500/30 bg-gradient-to-br from-pink-600/15 to-transparent space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Visitor ❤️ Likes</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{analytics.totalLikes.toLocaleString()}</p>
          <p className="text-[11px] text-pink-300 font-semibold">
            {((analytics.totalLikes / Math.max(analytics.totalViews, 1)) * 100).toFixed(1)}% Like Conversion
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900 border border-amber-500/30 bg-gradient-to-br from-amber-600/15 to-transparent space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">QR Poster Scans</span>
            <QrCode className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{analytics.totalQrScans.toLocaleString()}</p>
          <p className="text-[11px] text-amber-300 font-semibold">
            From Event Badges & Posters
          </p>
        </div>

      </div>

      {/* Visual Activity Chart */}
      <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Traffic & Engagement Timeline</h3>
            <p className="text-xs text-slate-400">Daily breakdown of visitors and interactions</p>
          </div>

          {/* Metric selector pill */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-dark-950/80 border border-white/10">
            {(['views', 'clicks', 'likes', 'qrScans'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMetricFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  metricFilter === m 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'qrScans' ? 'QR Scans' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-4 pb-2">
          <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2">
            {analytics.timeSeries.map((day, idx) => {
              const val = day[metricFilter];
              const heightPercent = Math.max(12, Math.round((val / maxDailyValue) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  
                  {/* Tooltip value */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-dark-950 border border-white/20 px-2 py-1 rounded text-[10px] font-mono text-white pointer-events-none mb-1 shadow-lg">
                    {val.toLocaleString()}
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-dark-950/70 rounded-xl p-1 h-full flex flex-col justify-end border border-white/5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-lg transition-all duration-500 group-hover:brightness-125 ${
                        metricFilter === 'views' ? 'bg-gradient-to-t from-brand-600 to-indigo-400 shadow-lg shadow-brand-600/30' :
                        metricFilter === 'clicks' ? 'bg-gradient-to-t from-cyan-600 to-teal-400 shadow-lg shadow-cyan-600/30' :
                        metricFilter === 'likes' ? 'bg-gradient-to-t from-pink-600 to-rose-400 shadow-lg shadow-pink-600/30' :
                        'bg-gradient-to-t from-amber-600 to-yellow-400 shadow-lg shadow-amber-600/30'
                      }`}
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2-Column: Link Performance Leaderboard & Traffic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Link Performance (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Top Performing Links</h3>
            <span className="text-xs text-slate-400 font-mono">Ranked by Clicks</span>
          </div>

          <div className="space-y-3">
            {analytics.linkClicks.map((link, idx) => {
              const meta = getPlatformMeta(link.platform);
              const percent = analytics.totalClicks > 0 ? Math.round((link.clicks / analytics.totalClicks) * 100) : 0;

              return (
                <div key={link.id} className="p-3.5 rounded-2xl bg-dark-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-500 w-4">#{idx + 1}</span>
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        {meta.icon('w-3.5 h-3.5')}
                      </div>
                      <span className="font-bold text-xs text-white truncate">{link.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-cyan-300 font-mono">{link.clicks.toLocaleString()} clicks</span>
                      <span className="text-[10px] text-slate-400">({percent}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, percent)}%` }}
                      className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Devices & Traffic Sources (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Device Split */}
          <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-base">Device Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Smartphone className="w-3.5 h-3.5 text-brand-400" /> Mobile Phones
                  </span>
                  <span className="text-white font-mono">{analytics.devices.mobile}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${analytics.devices.mobile}%` }} className="h-full bg-brand-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" /> Desktop & Laptops
                  </span>
                  <span className="text-white font-mono">{analytics.devices.desktop}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${analytics.devices.desktop}%` }} className="h-full bg-cyan-400 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Tablet className="w-3.5 h-3.5 text-purple-400" /> Tablets & iPads
                  </span>
                  <span className="text-white font-mono">{analytics.devices.tablet}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${analytics.devices.tablet}%` }} className="h-full bg-purple-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-3">
            <h3 className="font-bold text-white text-base">Traffic Channels</h3>
            <div className="space-y-2">
              {analytics.sources.map((src, sIdx) => (
                <div key={sIdx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-dark-950/60 border border-white/5">
                  <span className="text-slate-300">{src.source}</span>
                  <span className="font-mono font-bold text-brand-300">{src.count.toLocaleString()} ({src.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

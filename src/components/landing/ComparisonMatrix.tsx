import React from 'react';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';

interface ComparisonMatrixProps {
  navigateTo: (route: string) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({ navigateTo }) => {
  const features = [
    {
      name: 'Printable Vector QR Poster & Badge Studio',
      connectly: true,
      linktree: false,
      biolink: false,
      highlight: true,
    },
    {
      name: 'Real-Time Visitor ❤️ Like Reactions & Bursts',
      connectly: true,
      linktree: false,
      biolink: false,
      highlight: true,
    },
    {
      name: '1-Click vCard (.vcf) Contact Card Export',
      connectly: true,
      linktree: 'Paid / Pro',
      biolink: false,
      highlight: true,
    },
    {
      name: 'AI Bio, Tagline & Link Recommendation Copilot',
      connectly: true,
      linktree: 'Addon',
      biolink: false,
      highlight: false,
    },
    {
      name: 'In-Depth Visitor Referrer & Device Analytics',
      connectly: 'Included Free',
      linktree: '$9 / month',
      biolink: 'Limited',
      highlight: false,
    },
    {
      name: 'Platform Transaction Fee on Community Links',
      connectly: '0% (Always Free)',
      linktree: '5% - 10%',
      biolink: '5%',
      highlight: true,
    },
    {
      name: 'Custom Glassmorphic & Cyberpunk Visual Presets',
      connectly: '8 Curated Styles',
      linktree: 'Basic Themes',
      biolink: 'Minimalist Only',
      highlight: false,
    },
    {
      name: 'Fast Global Edge Delivery & SEO Meta Tags',
      connectly: true,
      linktree: true,
      biolink: true,
      highlight: false,
    },
  ];

  const renderCell = (val: boolean | string, isConnectly = false) => {
    if (val === true) {
      return (
        <div className="flex items-center justify-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isConnectly ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'bg-slate-800 text-slate-300'}`}>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      );
    }
    if (val === false) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
      );
    }
    return (
      <span className={`text-xs font-bold ${isConnectly ? 'text-indigo-300 font-extrabold' : 'text-slate-400'}`}>
        {val}
      </span>
    );
  };

  return (
    <section className="py-24 bg-slate-950 border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Switch To Connectly</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            How Connectly compares to traditional link trees
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-3">
            Built from the ground up for modern physical-to-digital networking, zero fees, and deep engagement.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900">
                  <th className="p-5 sm:p-6 text-sm font-bold text-slate-300 w-2/5">
                    Platform Capability
                  </th>
                  <th className="p-5 sm:p-6 text-center w-1/5 bg-indigo-950/40 border-x border-indigo-500/20">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-base text-white">Connectly</span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">Recommended</span>
                    </div>
                  </th>
                  <th className="p-5 sm:p-6 text-center w-1/5 text-sm font-bold text-slate-400">
                    Linktree
                  </th>
                  <th className="p-5 sm:p-6 text-center w-1/5 text-sm font-bold text-slate-400">
                    Bio.link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {features.map((row, i) => (
                  <tr 
                    key={i} 
                    className={`hover:bg-white/[0.02] transition-colors ${row.highlight ? 'bg-indigo-950/20' : ''}`}
                  >
                    <td className="p-4 sm:p-5 font-medium text-slate-200 text-xs sm:text-sm">
                      {row.name}
                      {row.highlight && (
                        <span className="ml-2 inline-block text-[10px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                          Exclusive
                        </span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-center bg-indigo-950/30 border-x border-indigo-500/20">
                      {renderCell(row.connectly, true)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      {renderCell(row.linktree)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      {renderCell(row.biolink)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer CTA */}
          <div className="p-6 bg-slate-950 border-t border-white/10 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-base text-white">Ready to upgrade your link & offline networking?</p>
              <p className="text-xs text-slate-400 mt-0.5">Get your verified handle in less than 60 seconds.</p>
            </div>
            <button
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

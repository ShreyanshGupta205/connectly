import React from 'react';
import { Palette, Check, Type, Square } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEMES, getThemeById } from '../../data/themes';
import type { ButtonShape } from '../../types';

export const AppearanceTab: React.FC = () => {
  const { currentProfile, updateCurrentProfile } = useProfile();
  const currentTheme = getThemeById(currentProfile.themeId || 'aurora-glass');

  const buttonShapes: { id: ButtonShape; label: string; previewClass: string }[] = [
    { id: 'rounded', label: 'Rounded (Modern)', previewClass: 'rounded-xl' },
    { id: 'pill', label: 'Pill (Soft)', previewClass: 'rounded-full' },
    { id: 'sharp', label: 'Sharp (Cyber / Brutalist)', previewClass: 'rounded-none' },
    { id: 'glass', label: 'Glassmorphic Float', previewClass: 'rounded-2xl border-white/20' },
  ];

  const fonts: { id: 'sans' | 'outfit' | 'mono' | 'display'; label: string; fontClass: string; example: string }[] = [
    { id: 'sans', label: 'Plus Jakarta Sans', fontClass: 'font-sans', example: 'Clean, neutral modern typography' },
    { id: 'outfit', label: 'Outfit Geometric', fontClass: 'font-outfit', example: 'Bold, friendly geometric headers' },
    { id: 'mono', label: 'JetBrains Mono', fontClass: 'font-mono', example: 'Technical, developer terminal look' },
    { id: 'display', label: 'Syne Display', fontClass: 'font-display', example: 'High-fashion editorial luxury' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-dark-900 border border-white/10">
        <h2 className="text-xl font-extrabold text-white">Appearance & Theming</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Choose from curated presets or customize fonts, shapes, and colors for your digital brand.
        </p>
      </div>

      {/* 8 Preset Themes Grid */}
      <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-white text-base">Select Visual Theme</h3>
          </div>
          <span className="text-xs text-slate-400">8 hand-crafted styles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => updateCurrentProfile({ themeId: theme.id })}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                currentProfile.themeId === theme.id 
                  ? 'border-brand-500 bg-brand-500/15 ring-2 ring-brand-500/50 shadow-xl shadow-brand-950/60' 
                  : 'border-white/10 bg-dark-950/70 hover:border-white/20 hover:bg-dark-950'
              }`}
            >
              {/* Theme Mini Canvas */}
              <div className={`w-full h-24 rounded-xl p-2.5 flex flex-col justify-between mb-3 ${theme.bgClass} border border-white/10 shadow-inner`}>
                <div className="flex justify-between items-center">
                  <span className="w-3 h-3 rounded-full bg-white/30" />
                  {currentProfile.themeId === theme.id && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className={`w-full h-3 rounded ${theme.cardClass}`} />
                  <div className={`w-3/4 h-3 rounded ${theme.cardClass}`} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-bold text-xs text-white truncate">{theme.name}</p>
                {theme.isPro && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{theme.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Button Shapes & Font Customization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Typography */}
        <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Typography Font</h3>
          </div>
          <div className="space-y-2">
            {fonts.map(f => (
              <div
                key={f.id}
                onClick={() => updateCurrentProfile({ 
                  customTheme: { ...currentProfile.customTheme, fontFamily: f.id } 
                })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  (currentProfile.customTheme?.fontFamily || currentTheme.fontFamily) === f.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-white/10 bg-dark-950/60 text-slate-300 hover:border-white/20'
                }`}
              >
                <div>
                  <p className={`font-bold text-xs ${f.fontClass}`}>{f.label}</p>
                  <p className="text-[10px] text-slate-400">{f.example}</p>
                </div>
                {(currentProfile.customTheme?.fontFamily || currentTheme.fontFamily) === f.id && (
                  <Check className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Button Shapes */}
        <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Square className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-base">Button Shape</h3>
          </div>
          <div className="space-y-2">
            {buttonShapes.map(b => (
              <div
                key={b.id}
                onClick={() => updateCurrentProfile({ 
                  customTheme: { ...currentProfile.customTheme, buttonShape: b.id } 
                })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  (currentProfile.customTheme?.buttonShape || currentTheme.buttonShape) === b.id
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-white/10 bg-dark-950/60 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-5 bg-white/20 border border-white/30 ${b.previewClass}`} />
                  <p className="font-bold text-xs text-white">{b.label}</p>
                </div>
                {(currentProfile.customTheme?.buttonShape || currentTheme.buttonShape) === b.id && (
                  <Check className="w-4 h-4 text-purple-400" />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

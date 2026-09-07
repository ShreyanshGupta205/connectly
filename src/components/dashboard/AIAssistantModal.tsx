import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Wand2, 
  Palette, 
  Bot
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { generateProfileWithAI } from '../../utils/aiAssistant';
import type { AISuggestionResult } from '../../utils/aiAssistant';
import { getThemeById } from '../../data/themes';
import { BrandIcon } from '../common/BrandLogo';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { updateCurrentProfile } = useProfile();
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AISuggestionResult | null>(null);
  const [selectedBioTone, setSelectedBioTone] = useState<'builder' | 'minimal' | 'executive'>('builder');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      const generated = await generateProfileWithAI(prompt);
      setResult(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    
    updateCurrentProfile({
      tagline: result.tagline,
      bio: result.bios[selectedBioTone],
      themeId: result.suggestedThemeId,
      category: result.category,
      skills: result.skills,
    });

    onClose();
  };

  const quickPrompts = [
    "First-year CS student building AI hackathon projects and explaining tech simply.",
    "Product Designer crafting spatial interfaces, design systems & 3D renders.",
    "Low-level Rust systems hacker and cybersecurity kernel researcher.",
    "Indie SaaS founder building full-stack web products in public.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-2xl rounded-3xl bg-dark-900 border border-purple-500/30 shadow-2xl shadow-purple-950/80 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <BrandIcon sizeClass="w-10 h-10 rounded-2xl" />
            <div>
              <h3 className="font-extrabold text-xl text-white">Connectly AI Copilot</h3>
              <p className="text-xs text-slate-400">Synthesize punchy bios, taglines, matching themes, and skills.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300">Describe your role, background, or goals:</label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I'm a developer building open-source AI tools, participating in hackathons, and making YouTube tutorials..."
              className="w-full bg-dark-950/80 border border-white/15 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium py-1">Inspirations:</span>
            {quickPrompts.map((qp, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => setPrompt(qp)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 transition-colors text-left"
              >
                {qp.slice(0, 38)}...
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-brand-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Bot className="w-4 h-4 animate-bounce" />
                <span>Synthesizing Profile...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Profile Suggestions</span>
              </>
            )}
          </button>
        </div>

        {/* Results Area */}
        {result && (
          <div className="p-6 rounded-2xl bg-dark-950/80 border border-purple-500/40 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Suggestions Ready
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {result.category}
              </span>
            </div>

            {/* Tagline */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Suggested Headline:</span>
              <p className="text-sm font-extrabold text-white">{result.tagline}</p>
            </div>

            {/* Bio Tone Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400">Select Bio Tone:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['builder', 'minimal', 'executive'] as const).map(tone => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedBioTone(tone)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedBioTone === tone
                        ? 'border-purple-500 bg-purple-500/20 text-white font-bold'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <p className="capitalize font-bold">{tone}</p>
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed italic">
                "{result.bios[selectedBioTone]}"
              </div>
            </div>

            {/* Suggested Theme & Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Recommended Theme:</span>
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> {getThemeById(result.suggestedThemeId).name}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {result.skills.map((s, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
              >
                <Check className="w-4 h-4" />
                <span>Apply to My Profile</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

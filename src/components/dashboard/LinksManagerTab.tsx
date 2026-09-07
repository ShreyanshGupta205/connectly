import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  MousePointerClick,
  Edit2,
  X
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import type { SocialPlatform, SocialLink } from '../../types';
import { PLATFORM_REGISTRY, getPlatformMeta } from '../../utils/platformIcons';

export const LinksManagerTab: React.FC = () => {
  const { currentProfile, addSocialLink, updateSocialLink, deleteSocialLink, reorderSocialLinks } = useProfile();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('youtube');
  const [titleInput, setTitleInput] = useState('');
  const [subtitleInput, setSubtitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const handleSelectPlatform = (p: SocialPlatform) => {
    setSelectedPlatform(p);
    const meta = PLATFORM_REGISTRY[p];
    setTitleInput(meta.defaultTitle);
    setSubtitleInput('');
    setUrlInput(meta.placeholder);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim()) return;

    addSocialLink({
      platform: selectedPlatform,
      title: titleInput.trim(),
      subtitle: subtitleInput.trim() || undefined,
      url: urlInput.trim(),
      isVisible: true,
      featured: isFeatured,
    });

    setIsAdding(false);
    setTitleInput('');
    setSubtitleInput('');
    setUrlInput('');
    setIsFeatured(false);
  };

  const startEdit = (link: SocialLink) => {
    setEditingLinkId(link.id);
    setSelectedPlatform(link.platform);
    setTitleInput(link.title);
    setSubtitleInput(link.subtitle || '');
    setUrlInput(link.url);
    setIsFeatured(link.featured || false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLinkId) return;
    updateSocialLink(editingLinkId, {
      platform: selectedPlatform,
      title: titleInput.trim(),
      subtitle: subtitleInput.trim() || undefined,
      url: urlInput.trim(),
      featured: isFeatured,
    });
    setEditingLinkId(null);
    setTitleInput('');
    setSubtitleInput('');
    setUrlInput('');
  };

  const availablePlatforms: SocialPlatform[] = [
    'youtube', 'instagram', 'linkedin', 'github', 'x', 'discord', 
    'telegram', 'whatsapp', 'spotify', 'twitch', 'threads', 'dribbble', 'website', 'email', 'custom'
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-900 border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white">Social & Portfolio Links</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your profiles, reorder positions, and track real-time click engagement.
          </p>
        </div>
        {!isAdding && !editingLinkId && (
          <button
            onClick={() => {
              setIsAdding(true);
              handleSelectPlatform('youtube');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Link</span>
          </button>
        )}
      </div>

      {/* Add or Edit Form Drawer */}
      {(isAdding || editingLinkId) && (
        <div className="p-6 rounded-3xl bg-dark-900/90 border-2 border-brand-500/40 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">
              {editingLinkId ? 'Edit Link Details' : 'Add Social or Custom Link'}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingLinkId(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Picker Chips */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Choose Platform</label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-dark-950/60 rounded-2xl border border-white/5">
              {availablePlatforms.map(p => {
                const meta = PLATFORM_REGISTRY[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPlatform(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedPlatform === p 
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {meta.icon('w-3.5 h-3.5')}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={editingLinkId ? handleSaveEdit : handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Link Title</label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. YouTube Channel"
                  className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Subtitle / Handle (Optional)</label>
                <input
                  type="text"
                  value={subtitleInput}
                  onChange={(e) => setSubtitleInput(e.target.value)}
                  placeholder="e.g. @shreyanshbuild • 10k subscribers"
                  className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Destination URL</label>
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-white/20 bg-dark-950 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isFeatured" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
                Highlight this link (Featured card with glow)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingLinkId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all"
              >
                {editingLinkId ? 'Save Changes' : 'Add Link'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Links List */}
      <div className="space-y-3">
        {currentProfile.links.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-3">
            <p className="text-sm font-semibold text-slate-300">No links added yet.</p>
            <p className="text-xs text-slate-500">Add your YouTube, GitHub, LinkedIn, or personal website links above.</p>
          </div>
        ) : (
          currentProfile.links.map((link, index) => {
            const meta = getPlatformMeta(link.platform);
            return (
              <div
                key={link.id}
                className={`p-4 rounded-2xl bg-dark-900 border transition-all duration-200 flex items-center justify-between gap-4 ${
                  link.isVisible 
                    ? 'border-white/10 hover:border-white/20 shadow-md' 
                    : 'border-white/5 opacity-50 bg-dark-950'
                }`}
              >
                {/* Left Drag & Icon info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Up / Down Controls */}
                  <div className="flex flex-col gap-1 text-slate-500">
                    <button
                      disabled={index === 0}
                      onClick={() => reorderSocialLinks(index, index - 1)}
                      className="hover:text-white disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === currentProfile.links.length - 1}
                      onClick={() => reorderSocialLinks(index, index + 1)}
                      className="hover:text-white disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {meta.icon('w-5 h-5')}
                  </div>

                  {/* Details */}
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-white truncate">{link.title}</p>
                      {link.featured && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-sm">{link.url}</p>
                    {link.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate">{link.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Right Actions: Clicks, Visibility, Edit, Delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  
                  {/* Click counter badge */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
                    <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{link.clicks.toLocaleString()} clicks</span>
                  </div>

                  {/* Visibility Toggle */}
                  <button
                    onClick={() => updateSocialLink(link.id, { isVisible: !link.isVisible })}
                    className={`p-2 rounded-xl border transition-colors ${
                      link.isVisible 
                        ? 'bg-brand-500/15 border-brand-500/30 text-brand-300 hover:bg-brand-500/25' 
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                    }`}
                    title={link.isVisible ? 'Hide from public profile' : 'Show on public profile'}
                  >
                    {link.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => startEdit(link)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Edit link"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteSocialLink(link.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                    title="Delete link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

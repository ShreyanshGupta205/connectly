import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  X, 
  Check, 
  AlertCircle,
  Save
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface ProfileEditorTabProps {
  onOpenAI: () => void;
}

export const ProfileEditorTab: React.FC<ProfileEditorTabProps> = ({ onOpenAI }) => {
  const { currentProfile, updateCurrentProfile, isUsernameAvailable } = useProfile();
  const [skillInput, setSkillInput] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    updateCurrentProfile({ username: clean });
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const currentSkills = currentProfile.skills || [];
    if (!currentSkills.includes(skillInput.trim())) {
      updateCurrentProfile({ skills: [...currentSkills, skillInput.trim()] });
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = currentProfile.skills || [];
    updateCurrentProfile({ skills: currentSkills.filter(s => s !== skillToRemove) });
  };

  const handleQuickSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const isHandleAvailable = isUsernameAvailable(currentProfile.username);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentProfile.username}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentProfile.username}`
  ];

  return (
    <div className="space-y-6">
      
      {/* Header with AI trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-900 border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white">Edit Profile Identity</h2>
          <p className="text-xs text-slate-400 mt-0.5">Customize your name, handle, bio, and visual presentation</p>
        </div>
        <button
          onClick={onOpenAI}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate with AI</span>
        </button>
      </div>

      {/* Basic Info Form */}
      <div className="p-6 rounded-3xl bg-dark-900 border border-white/10 space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Display Name</label>
            <div className="relative">
              <input
                type="text"
                value={currentProfile.name}
                onChange={(e) => updateCurrentProfile({ name: e.target.value })}
                placeholder="e.g. Shreyansh Gupta"
                className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Username Handle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Handle / URL</label>
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                isHandleAvailable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isHandleAvailable ? (
                  <>
                    <Check className="w-3 h-3" /> Available
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" /> Taken
                  </>
                )}
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500 text-sm font-semibold select-none">@</span>
              <input
                type="text"
                value={currentProfile.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="shreyansh"
                className="w-full bg-dark-950/80 border border-white/15 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

        </div>

        {/* Tagline / Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Tagline / Headline</label>
          <input
            type="text"
            value={currentProfile.tagline}
            onChange={(e) => updateCurrentProfile({ tagline: e.target.value })}
            placeholder="e.g. AI • Developer • Builder"
            className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Bio Text */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">About / Bio</label>
            <span className="text-[10px] text-slate-500">{currentProfile.bio.length}/200 characters</span>
          </div>
          <textarea
            rows={3}
            maxLength={200}
            value={currentProfile.bio}
            onChange={(e) => updateCurrentProfile({ bio: e.target.value })}
            placeholder="Tell visitors who you are and what you build..."
            className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
          />
        </div>

        {/* Avatar Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300">Profile Photo</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={currentProfile.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-500 shadow-md"
            />
            <div className="flex-1 space-y-2 w-full">
              <input
                type="text"
                value={currentProfile.avatarUrl}
                onChange={(e) => updateCurrentProfile({ avatarUrl: e.target.value })}
                placeholder="Paste Image URL..."
                className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Presets:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {presetAvatars.map((url, pIdx) => (
                    <img
                      key={pIdx}
                      src={url}
                      alt="Preset"
                      onClick={() => updateCurrentProfile({ avatarUrl: url })}
                      className="w-6 h-6 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Cover Banner URL (Optional)</label>
          <input
            type="text"
            value={currentProfile.coverUrl || ''}
            onChange={(e) => updateCurrentProfile({ coverUrl: e.target.value })}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Primary Category</label>
            <select
              value={currentProfile.category || 'Developer'}
              onChange={(e) => updateCurrentProfile({ category: e.target.value as any })}
              className="w-full bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="AI Builder">AI Builder</option>
              <option value="Developer">Developer / Engineer</option>
              <option value="Creator">Content Creator</option>
              <option value="Designer">Product Designer</option>
              <option value="Student">Student / Researcher</option>
              <option value="Founder">Founder / Startup</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={currentProfile.location || ''}
                onChange={(e) => updateCurrentProfile({ location: e.target.value })}
                placeholder="e.g. Bengaluru, India"
                className="w-full bg-dark-950/80 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Skills & Badges */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Key Skills & Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(currentProfile.skills || []).map((skill, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-xs font-medium text-brand-300"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add skill (e.g. PyTorch, React, UI/UX)..."
              className="flex-1 bg-dark-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        {/* Verified Badge Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Verified Creator Badge</p>
              <p className="text-[11px] text-slate-400">Display the blue verification checkmark on your public profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateCurrentProfile({ isVerified: !currentProfile.isVerified })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              currentProfile.isVerified ? 'bg-brand-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                currentProfile.isVerified ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Save button & feedback */}
        <div className="flex items-center justify-between pt-2">
          {saveToast ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Changes saved to local storage!
            </span>
          ) : (
            <span className="text-xs text-slate-500">Live preview syncs automatically</span>
          )}

          <button
            onClick={handleQuickSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>

      </div>

    </div>
  );
};

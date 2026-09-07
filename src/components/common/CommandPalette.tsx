import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Layers, 
  Link as LinkIcon, 
  Palette, 
  QrCode, 
  BarChart3, 
  Copy, 
  ExternalLink, 
  Download,
  Zap,
  X,
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import { downloadVCard } from '../../utils/vcardUtils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  navigateTo: (route: string) => void;
}

interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Profiles';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  navigateTo,
}) => {
  const { currentProfile, profiles, switchProfile } = useProfile();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // List of all commands
  const commands: CommandItem[] = [
    // Quick Actions
    {
      id: 'action-studio',
      category: 'Actions',
      title: 'Open Creator Studio',
      subtitle: 'Edit links, bio, and visual themes',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      shortcut: '↵',
      action: () => {
        navigateTo('dashboard');
        toast.info('Opened Creator Studio');
        onClose();
      },
    },
    {
      id: 'action-copy-link',
      category: 'Actions',
      title: 'Copy Profile Link',
      subtitle: `connectly.bio/@${currentProfile.username}`,
      icon: <Copy className="w-4 h-4 text-emerald-400" />,
      shortcut: '⌘C',
      action: () => {
        const url = `${window.location.origin}/#/@${currentProfile.username}`;
        navigator.clipboard.writeText(url);
        toast.success('Link Copied to Clipboard!', url);
        onClose();
      },
    },
    {
      id: 'action-download-vcard',
      category: 'Actions',
      title: 'Download Contact Card (.vcf)',
      subtitle: 'Add to iOS / Android Address Book',
      icon: <Download className="w-4 h-4 text-blue-400" />,
      action: () => {
        downloadVCard(currentProfile);
        toast.success('Contact card downloaded!', `${currentProfile.name}.vcf`);
        onClose();
      },
    },
    {
      id: 'action-view-profile',
      category: 'Actions',
      title: 'View Live Public Profile',
      subtitle: `@${currentProfile.username}`,
      icon: <ExternalLink className="w-4 h-4 text-purple-400" />,
      action: () => {
        navigateTo(`@${currentProfile.username}`);
        onClose();
      },
    },
    {
      id: 'action-admin-panel',
      category: 'Actions',
      title: 'Open Super Admin Control Center',
      subtitle: 'Restricted to shreyanshg2005@gmail.com',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        navigateTo('admin');
        toast.info('Navigated to Admin Portal');
        onClose();
      },
    },
    // Navigation
    {
      id: 'nav-overview',
      category: 'Navigation',
      title: 'Dashboard: Overview',
      subtitle: 'Stats, live preview, quick controls',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      action: () => {
        navigateTo('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-links',
      category: 'Navigation',
      title: 'Dashboard: Links Manager',
      subtitle: 'Add, reorder, and toggle social links',
      icon: <LinkIcon className="w-4 h-4 text-cyan-400" />,
      action: () => {
        navigateTo('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-themes',
      category: 'Navigation',
      title: 'Dashboard: Appearance & Themes',
      subtitle: '8 aesthetic presets, fonts, button styling',
      icon: <Palette className="w-4 h-4 text-pink-400" />,
      action: () => {
        navigateTo('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-qr',
      category: 'Navigation',
      title: 'Dashboard: QR Poster Studio',
      subtitle: 'Download vector print badges & stickers',
      icon: <QrCode className="w-4 h-4 text-indigo-400" />,
      action: () => {
        navigateTo('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      title: 'Dashboard: Analytics',
      subtitle: 'CTR, link performance, visitor source breakdown',
      icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
      action: () => {
        navigateTo('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-poster',
      category: 'Navigation',
      title: 'Printable Poster View',
      subtitle: `High-res badge format for @${currentProfile.username}`,
      icon: <QrCode className="w-4 h-4 text-slate-300" />,
      action: () => {
        navigateTo(`poster-${currentProfile.username}`);
        onClose();
      },
    },
    // Profiles
    ...Object.values(profiles).map(p => ({
      id: `profile-${p.username}`,
      category: 'Profiles' as const,
      title: `Switch to ${p.name}`,
      subtitle: `@${p.username} · ${p.category || 'Creator'}`,
      icon: (
        <img 
          src={p.avatarUrl} 
          alt={p.name} 
          className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20" 
        />
      ),
      action: () => {
        switchProfile(p.username);
        toast.success(`Switched Profile to @${p.username}`);
        onClose();
      },
    })),
  ];

  // Filter commands by search query
  const filtered = commands.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.subtitle?.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 animate-scale-up"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded border border-white/10">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/[0.04]">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-sm ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] leading-tight text-white truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1.5 py-0.5 rounded bg-white/5">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 bg-indigo-500/10 rounded border border-indigo-500/20">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="font-mono bg-white/5 px-1 py-0.5 rounded">↑</kbd> <kbd className="font-mono bg-white/5 px-1 py-0.5 rounded">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-white/5 px-1 py-0.5 rounded">↵</kbd> to select</span>
          </div>
          <span>Connectly Quick Actions</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import type { ThemeConfig } from '../../types';

interface LikeButtonProps {
  username: string;
  theme: ThemeConfig;
  className?: string;
  variant?: 'default' | 'compact' | 'action-bar';
}

interface HeartParticle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ 
  username, 
  theme, 
  className = '', 
  variant = 'default' 
}) => {
  const { profiles, toggleLikeProfile, likedProfileIds } = useProfile();
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<HeartParticle[]>([]);

  const profile = profiles[username];
  const isLiked = likedProfileIds.includes(username);
  const likesCount = profile ? profile.stats.likes : 0;

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const PARTICLE_COLORS = [
    'text-rose-400', 'text-pink-400', 'text-red-400',
    'text-fuchsia-400', 'text-orange-400', 'text-amber-400',
  ];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    
    // Spawn 5-6 floating heart particles with varied positions & delays
    const baseId = Date.now();
    const count = 5 + Math.floor(Math.random() * 2); // 5 or 6
    const newParticles: HeartParticle[] = Array.from({ length: count }, (_, i) => ({
      id: baseId + i,
      x: (Math.random() - 0.5) * 60,
      delay: i * 80,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 10 + Math.random() * 6,
    }));

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1100);

    toggleLikeProfile(username);
    setTimeout(() => setAnimating(false), 500);
  };


  if (variant === 'action-bar') {
    return (
      <button
        onClick={handleClick}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-300 transform active:scale-95 ${
          isLiked 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-lg shadow-rose-500/10' 
            : 'text-rose-400 hover:text-rose-300 hover:bg-white/10'
        } ${animating ? 'scale-110' : ''} ${className}`}
      >
        {/* Floating Heart Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{ transform: `translateX(${p.x}px)`, animationDelay: `${p.delay}ms` }}
            className={`absolute top-0 left-1/2 pointer-events-none animate-float-like z-50 ${p.color} font-extrabold`}
          >
            <Heart style={{ width: p.size, height: p.size }} className="fill-current" />
          </div>
        ))}

        <Heart 
          className={`w-4 h-4 transition-transform ${
            isLiked 
              ? 'fill-rose-500 text-rose-500 scale-110' 
              : 'fill-rose-400/20 text-rose-400'
          } ${animating ? 'animate-bounce' : ''}`} 
        />
        <span className="font-bold tracking-tight">
          {formatCount(likesCount)} {likesCount === 1 ? 'like' : 'likes'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 transform active:scale-95 shadow-xl ${
        isLiked 
          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white ring-2 ring-pink-400 shadow-pink-600/40' 
          : theme.likeBtnClass
      } ${animating ? 'scale-110' : 'hover:scale-105'} ${className}`}
    >
      {/* Floating Heart Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{ transform: `translateX(${p.x}px)`, animationDelay: `${p.delay}ms` }}
          className={`absolute -top-2 left-1/2 pointer-events-none animate-float-like z-50 ${p.color}`}
        >
          <Heart style={{ width: p.size, height: p.size }} className="fill-current" />
        </div>
      ))}

      <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-white scale-110' : 'fill-none'} ${animating ? 'animate-bounce' : ''}`} />
      <span>{isLiked ? 'Liked Profile' : 'Like Profile'}</span>
      <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-xs font-mono">
        {formatCount(likesCount)}
      </span>
      {isLiked && <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin" />}
    </button>
  );
};

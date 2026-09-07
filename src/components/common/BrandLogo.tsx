import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'glass';
  showText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  onClick?: () => void;
  className?: string;
}

export const BrandIcon: React.FC<{ sizeClass?: string; className?: string }> = ({ 
  sizeClass = "w-8 h-8",
  className = ""
}) => (
  <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 shadow-md shadow-indigo-600/30 flex-shrink-0 select-none overflow-hidden ${sizeClass} ${className}`}>
    {/* Inner Ambient Glow */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-60 pointer-events-none" />
    
    {/* Crisp Geometric Connectly C & Link Nodes */}
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-[68%] h-[68%] text-white"
    >
      {/* Outer C Arc */}
      <path 
        d="M22 10.5C20.2 8.3 17.5 7 14.5 7C9.25 7 5 11.25 5 16.5C5 21.75 9.25 26 14.5 26C17.5 26 20.2 24.7 22 22.5" 
        stroke="currentColor" 
        strokeWidth="3.2" 
        strokeLinecap="round"
      />
      {/* Center Connected Pulse Node */}
      <circle cx="17.5" cy="16.5" r="3" fill="#38bdf8" />
      <path 
        d="M21 16.5H27" 
        stroke="#38bdf8" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  </div>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showText = true,
  showBadge = false,
  badgeText = 'Studio',
  onClick,
  className = '',
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6 rounded-lg', text: 'text-sm font-extrabold', badge: 'text-[9px] px-1 py-0.2' },
    sm: { icon: 'w-7 h-7 rounded-xl', text: 'text-base font-extrabold', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { icon: 'w-8 h-8 rounded-xl', text: 'text-xl font-black', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { icon: 'w-10 h-10 rounded-2xl', text: 'text-2xl font-black', badge: 'text-xs px-2 py-0.5' },
    xl: { icon: 'w-12 h-12 rounded-2xl', text: 'text-3xl font-black', badge: 'text-xs px-2.5 py-1' },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const textColor = variant === 'light' 
    ? 'text-slate-900' 
    : 'text-white';

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none transition-all ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''} ${className}`}
      onClick={onClick}
    >
      <BrandIcon sizeClass={selectedSize.icon} />

      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`tracking-tight ${selectedSize.text} ${textColor}`}>
            Connectly
          </span>

          {showBadge && (
            <span className={`uppercase font-extrabold tracking-wider rounded-md border ${selectedSize.badge} ${
              variant === 'light'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            }`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

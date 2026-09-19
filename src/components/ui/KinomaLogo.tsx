import React from 'react';

interface KinomaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'typography';
  className?: string;
  onClick?: () => void;
}

export function KinomaLogo({
  size = 'md',
  variant = 'full',
  className = '',
  onClick
}: KinomaLogoProps) {
  // Dimensions & typography scaling
  const sizeMap = {
    sm: {
      mark: 'w-6 h-6',
      markInner: 'w-2 h-2',
      text: 'text-lg',
      subText: 'text-[9px]'
    },
    md: {
      mark: 'w-8 h-8',
      markInner: 'w-2.5 h-2.5',
      text: 'text-2xl',
      subText: 'text-[10px]'
    },
    lg: {
      mark: 'w-11 h-11',
      markInner: 'w-3.5 h-3.5',
      text: 'text-3xl sm:text-4xl',
      subText: 'text-xs'
    },
    xl: {
      mark: 'w-16 h-16',
      markInner: 'w-5 h-5',
      text: 'text-5xl sm:text-6xl',
      subText: 'text-sm'
    }
  };

  const currentSize = sizeMap[size];

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* 1. Sleek Distinctive Ring Glyph (matching the reference image) */}
      {(variant === 'full' || variant === 'mark') && (
        <div 
          className={`relative ${currentSize.mark} rounded-full bg-gradient-to-tr from-[#7b1fa2] via-[#9c27b0] to-[#f472b6] p-[2px] shadow-[0_0_20px_rgba(156,39,176,0.55)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(232,121,249,0.7)] transition-all duration-300 shrink-0`}
        >
          {/* Dark inner disc */}
          <div className="w-full h-full rounded-full bg-[#0a0b10] flex items-center justify-center relative overflow-hidden">
            {/* Ambient inner sheen */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40" />
            {/* Glowing core dot */}
            <div 
              className={`${currentSize.markInner} rounded-full bg-gradient-to-tr from-[#c084fc] via-[#e879f9] to-white shadow-[0_0_10px_rgba(192,132,252,0.9)]`} 
            />
          </div>
        </div>
      )}

      {/* 2. Custom Font-Styled Typographic Logo */}
      {(variant === 'full' || variant === 'typography') && (
        <div className="flex items-baseline tracking-[-0.04em]">
          <span 
            className={`${currentSize.text} font-black text-white group-hover:text-purple-100 transition-colors drop-shadow-sm font-['Outfit']`}
            style={{ letterSpacing: '-0.04em' }}
          >
            kino
          </span>
          <span 
            className={`${currentSize.text} font-black bg-gradient-to-r from-[#d8b4fe] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent group-hover:brightness-110 transition-all font-['Outfit']`}
            style={{ letterSpacing: '-0.04em' }}
          >
            ma
          </span>
          {/* Subtle brand dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] ml-0.5 shadow-[0_0_8px_rgba(192,132,252,0.8)] self-end mb-1" />
        </div>
      )}
    </div>
  );
}

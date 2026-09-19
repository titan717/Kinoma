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
      text: 'text-lg',
      kWidth: '22',
      kHeight: '22',
    },
    md: {
      mark: 'w-8 h-8',
      text: 'text-2xl',
      kWidth: '28',
      kHeight: '28',
    },
    lg: {
      mark: 'w-10 h-10',
      text: 'text-3xl sm:text-4xl',
      kWidth: '36',
      kHeight: '36',
    },
    xl: {
      mark: 'w-16 h-16',
      text: 'text-5xl sm:text-6xl',
      kWidth: '56',
      kHeight: '56',
    }
  };

  const currentSize = sizeMap[size];

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* 1. Sleek Sculpted Streaming Ribbon 'K' Lettermark (No circle) */}
      {(variant === 'full' || variant === 'mark') && (
        <div className={`relative ${currentSize.mark} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
          <svg 
            width={currentSize.kWidth} 
            height={currentSize.kHeight} 
            viewBox="0 0 36 36" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_14px_rgba(168,85,247,0.6)]"
          >
            <defs>
              <linearGradient id="kStem" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="60%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
              <linearGradient id="kUpper" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e879f9" />
              </linearGradient>
              <linearGradient id="kLower" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
            {/* Architectural streaming vertical ribbon */}
            <path 
              d="M5 4C5 2.89543 5.89543 2 7 2H11C12.1046 2 13 2.89543 13 4V32C13 33.1046 12.1046 34 11 34H7C5.89543 34 5 33.1046 5 32V4Z" 
              fill="url(#kStem)" 
            />
            {/* Sculpted upper angular wing */}
            <path 
              d="M14.5 19L27.8 4.7C28.6 3.8 30 4.4 30 5.6V11.2C30 12.2 29.5 13.1 28.7 13.7L19.2 21.2L14.5 19Z" 
              fill="url(#kUpper)" 
            />
            {/* Sculpted lower power wing */}
            <path 
              d="M17.8 17.5L28.6 30.6C29.4 31.5 28.8 33 27.6 33H22C21.1 33 20.2 32.5 19.6 31.8L13 23L17.8 17.5Z" 
              fill="url(#kLower)" 
            />
          </svg>
        </div>
      )}

      {/* 2. Custom Sleek Typographic Wordmark (No full stop) */}
      {(variant === 'full' || variant === 'typography') && (
        <div className="flex items-baseline tracking-[-0.04em]">
          <span 
            className={`${currentSize.text} font-black text-white group-hover:text-purple-100 transition-colors drop-shadow-sm font-['Outfit']`}
            style={{ letterSpacing: '-0.04em' }}
          >
            kino
          </span>
          <span 
            className={`${currentSize.text} font-black bg-gradient-to-r from-[#d8b4fe] via-[#c084fc] to-[#e879f9] bg-clip-text text-transparent group-hover:brightness-110 transition-all font-['Outfit']`}
            style={{ letterSpacing: '-0.04em' }}
          >
            ma
          </span>
        </div>
      )}
    </div>
  );
}

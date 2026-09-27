import React from 'react';

interface KinomaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'typography';
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { width: 96, height: 30 },
  md: { width: 132, height: 40 },
  lg: { width: 170, height: 52 },
  xl: { width: 240, height: 74 },
} as const;

function PandaMark({ size, className = '' }: { size: number; className?: string }) {
  return (
    <span className={`panda-logo-mark ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none">
        <circle cx="16" cy="15" r="10" fill="#1A1A1A" />
        <circle cx="48" cy="15" r="10" fill="#1A1A1A" />
        <rect x="11" y="12" width="42" height="42" rx="20" fill="#FFFFFF" />
        <ellipse cx="22" cy="30" rx="8" ry="11" transform="rotate(28 22 30)" fill="#1A1A1A" />
        <ellipse cx="42" cy="30" rx="8" ry="11" transform="rotate(-28 42 30)" fill="#1A1A1A" />
        <circle cx="24" cy="29" r="2.4" fill="#FFFFFF" />
        <circle cx="40" cy="29" r="2.4" fill="#FFFFFF" />
        <path d="M29 39c1.8-2.2 4.2-2.2 6 0-1 3.4-5 4.1-6 0Z" fill="#1A1A1A" />
        <path d="M32 42v3" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="40" r="3" fill="#FFEBEE" opacity=".9" />
        <circle cx="46" cy="40" r="3" fill="#FFEBEE" opacity=".9" />
        <path d="M8 50c7-4 13-2 17 3H8Z" fill="#E8F5E9" />
        <path d="M56 50c-7-4-13-2-17 3h17Z" fill="#E8F5E9" />
      </svg>
    </span>
  );
}

export function KinomaLogo({ size = 'md', variant = 'full', className = '', onClick }: KinomaLogoProps) {
  const dimensions = SIZE_MAP[size];

  if (variant === 'mark') {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center select-none ${className}`} style={{ width: dimensions.height, height: dimensions.height }} onClick={onClick}>
        <PandaMark size={dimensions.height} />
      </span>
    );
  }

  if (variant === 'typography') {
    return (
      <span className={`panda-wordmark inline-flex shrink-0 items-center select-none ${className}`} onClick={onClick} aria-label="Panda.fun">
        panda<span>.fun</span>
      </span>
    );
  }

  return (
    <span className={`panda-wordmark-wrap inline-flex shrink-0 items-center select-none ${className}`} onClick={onClick} aria-label="Panda.fun">
      <PandaMark size={dimensions.height} />
      <span className="panda-wordmark">panda<span>.fun</span></span>
    </span>
  );
}

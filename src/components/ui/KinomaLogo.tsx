import React from 'react';

interface KinomaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'typography';
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { width: 96, height: 28 },
  md: { width: 128, height: 38 },
  lg: { width: 166, height: 50 },
  xl: { width: 232, height: 70 },
} as const;

const LOGO_SRC = 'https://raw.githubusercontent.com/titan717/Kinoma/126eee1aa37038a4e78954d666c058551b517f83/KINOMA-9-23-2026.png';

export function KinomaLogo({ size = 'md', variant = 'full', className = '', onClick }: KinomaLogoProps) {
  const dimensions = SIZE_MAP[size];
  const isMark = variant === 'mark';

  return (
    <span className={`inline-flex shrink-0 items-center select-none ${className}`} onClick={onClick}>
      <img
        src={LOGO_SRC}
        alt={onClick ? 'Kinoma' : ''}
        width={isMark ? dimensions.height : dimensions.width}
        height={dimensions.height}
        draggable={false}
        className="block h-auto w-full object-contain object-left"
        style={{ maxWidth: isMark ? dimensions.height : dimensions.width, maxHeight: dimensions.height }}
      />
    </span>
  );
}

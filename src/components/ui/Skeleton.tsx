import React from 'react';

export function Skeleton({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-[#1c1c22] rounded animate-shimmer ${className || ''}`} {...props} />
  );
}

import React from 'react';

export function Skeleton({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-[#141622] rounded-xl animate-shimmer ${className || ''}`} {...props} />
  );
}


import React from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[var(--kinoma-bg)] text-[var(--kinoma-text)] flex flex-col overflow-x-hidden">
      <div className="relative z-10 w-full flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

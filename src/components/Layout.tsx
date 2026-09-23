import React from 'react';
import { Footer } from './ui/Footer';
import { ModernNavbar } from './ui/modern/ModernNavbar';
import { useAuth } from '../lib/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { openAuthModal } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[var(--kinoma-bg)] text-[var(--kinoma-text)] flex flex-col overflow-x-hidden">
      <ModernNavbar onOpenAuth={() => openAuthModal('signin')} />
      <div className="relative z-10 w-full flex-1 flex flex-col min-w-0">
        {children}
      </div>
      <Footer />
    </div>
  );
}

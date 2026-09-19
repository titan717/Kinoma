import React, { useState } from 'react';
import { Download, Tv, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { useTVMode } from '../../lib/TVModeContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'tv-badge' | 'menu-item';
  showTVOption?: boolean;
}

export function PWAInstallButton({ 
  className = '', 
  variant = 'pill',
  showTVOption = true 
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, install, isAndroidTV, isIOS } = usePWAInstall();
  const { openAndroidTVModal } = useTVMode();
  const [installing, setInstalling] = useState(false);

  // If already running standalone and not requesting TV modal, can hide or show TV info
  if (isInstalled && !showTVOption) {
    return null;
  }

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else {
      // If ambient prompt not ready or user wants Android TV / iOS instructions
      openAndroidTVModal();
    }
  };

  if (variant === 'menu-item') {
    return (
      <button
        onClick={handleInstallClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-left cursor-pointer transition-colors ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
          <span>Add to Android TV / App</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20">
          TV
        </span>
      </button>
    );
  }

  if (variant === 'tv-badge') {
    return (
      <button
        onClick={() => openAndroidTVModal()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 transition-all cursor-pointer backdrop-blur-md ${className}`}
        title="Add Kinoma as an app on Android TV or Install PWA"
      >
        <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
        <span>Android TV</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleInstallClick}
        className={`w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer ${className}`}
        title="Install Kinoma / Add to Android TV"
        aria-label="Install App"
      >
        <Tv className="w-4 h-4 text-[#c084fc]" />
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      disabled={installing}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white shadow-sm transition-all cursor-pointer ${className}`}
    >
      <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
      <span>{installing ? 'Installing...' : 'Add to Android TV'}</span>
    </button>
  );
}

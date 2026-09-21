import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TVModeContextType {
  isTVMode: boolean;
  setTVMode: (enabled: boolean) => void;
  toggleTVMode: () => void;
  isAndroidTVDetected: boolean;
  isAndroidTVModalOpen: boolean;
  openAndroidTVModal: () => void;
  closeAndroidTVModal: () => void;
}

const TVModeContext = createContext<TVModeContextType | null>(null);

export function TVModeProvider({ children }: { children: React.ReactNode }) {
  const [isTVMode, setIsTVModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('kinoma_tv_mode');
    if (saved !== null) return saved === 'true';
    
    // Auto-enable if detected Android TV / Large screen TV or Kinoma TV APK
    const ua = window.navigator.userAgent.toLowerCase();
    return /android.*(tv|googletv|leanback|smarttv|large screen|aft)/i.test(ua) ||
      /smart-tv|hbbtv|appletv|roku/i.test(ua) ||
      ua.includes('kinomatv') ||
      Boolean((window as any).isKinomaAndroidTV);
  });

  const [isAndroidTVDetected, setIsAndroidTVDetected] = useState(false);
  const [isAndroidTVModalOpen, setIsAndroidTVModalOpen] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isTV = /android.*(tv|googletv|leanback|smarttv|large screen|aft)/i.test(ua) ||
      /smart-tv|hbbtv|appletv|roku/i.test(ua) ||
      ua.includes('kinomatv') ||
      Boolean((window as any).isKinomaAndroidTV);
    setIsAndroidTVDetected(isTV);

    // Apply or remove TV class to document body
    if (isTVMode) {
      document.documentElement.classList.add('tv-mode');
    } else {
      document.documentElement.classList.remove('tv-mode');
    }
  }, [isTVMode]);

  const setTVMode = useCallback((enabled: boolean) => {
    setIsTVModeState(enabled);
    localStorage.setItem('kinoma_tv_mode', enabled ? 'true' : 'false');
  }, []);

  const toggleTVMode = useCallback(() => {
    setTVMode(!isTVMode);
  }, [isTVMode, setTVMode]);

  const openAndroidTVModal = useCallback(() => setIsAndroidTVModalOpen(true), []);
  const closeAndroidTVModal = useCallback(() => setIsAndroidTVModalOpen(false), []);

  // Listen for custom event so any button can open Android TV modal easily
  useEffect(() => {
    const handleOpen = () => setIsAndroidTVModalOpen(true);
    window.addEventListener('kinoma_open_android_tv', handleOpen);
    return () => window.removeEventListener('kinoma_open_android_tv', handleOpen);
  }, []);

  // D-Pad / Remote Navigation Listener when TV Mode is active
  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input or textarea, don't hijack
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Android TV / Remote key codes
      // Back button on TV remote (Key code 8, 27, 461, 10009 or Escape)
      if (e.key === 'Escape' || e.keyCode === 10009 || e.keyCode === 461) {
        if (isAndroidTVModalOpen) {
          setIsAndroidTVModalOpen(false);
          e.preventDefault();
        }
      }

      // Quick Fullscreen for TV Remote (Green / Yellow button or 'f')
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTVMode, isAndroidTVModalOpen]);

  return (
    <TVModeContext.Provider
      value={{
        isTVMode,
        setTVMode,
        toggleTVMode,
        isAndroidTVDetected,
        isAndroidTVModalOpen,
        openAndroidTVModal,
        closeAndroidTVModal,
      }}
    >
      {children}
    </TVModeContext.Provider>
  );
}

export function useTVMode() {
  const context = useContext(TVModeContext);
  if (!context) {
    throw new Error('useTVMode must be used within a TVModeProvider');
  }
  return context;
}

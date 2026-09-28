import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PlayerSettings {
  autoPlay: boolean;
  autoNext: boolean;
  skipIntro: boolean;
  skipOutro: boolean;
  preferredAudio: 'sub' | 'dub';
}

export type SettingsTab = 'appearance' | 'player' | 'library';

interface AppearanceContextType {
  playerSettings: PlayerSettings;
  updatePlayerSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
  isSettingsModalOpen: boolean;
  openSettingsModal: (tab?: SettingsTab) => void;
  closeSettingsModal: () => void;
  activeSettingsTab: SettingsTab;
  setActiveSettingsTab: (tab: SettingsTab) => void;
}

const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  autoPlay: true,
  autoNext: true,
  skipIntro: true,
  skipOutro: false,
  preferredAudio: 'sub',
};

const PLAYER_SETTINGS_KEY = 'panda_player_settings';
const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => {
    try {
      if (typeof window === 'undefined') return DEFAULT_PLAYER_SETTINGS;
      const stored = window.localStorage.getItem(PLAYER_SETTINGS_KEY);
      if (stored) return { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PLAYER_SETTINGS;
  });

  useEffect(() => {
    const handleOnboarding = (event: Event) => {
      const detail = (event as CustomEvent<Partial<PlayerSettings>>).detail;
      if (!detail) return;
      setPlayerSettings(current => {
        const updated = {
          ...current,
          ...(typeof detail.autoPlay === 'boolean' ? { autoPlay: detail.autoPlay } : {}),
          ...(typeof detail.autoNext === 'boolean' ? { autoNext: detail.autoNext } : {}),
          ...(typeof detail.skipIntro === 'boolean' ? { skipIntro: detail.skipIntro } : {}),
          ...(typeof detail.skipOutro === 'boolean' ? { skipOutro: detail.skipOutro } : {}),
        };
        try { window.localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    };
    window.addEventListener('panda_onboarding_complete', handleOnboarding);
    return () => window.removeEventListener('panda_onboarding_complete', handleOnboarding);
  }, []);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('player');

  const updatePlayerSetting = useCallback(<K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => {
    setPlayerSettings(prev => {
      const updated = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('panda_player_settings_change', { detail: updated }));
      } catch {}
      return updated;
    });
  }, []);

  const openSettingsModal = useCallback((tab: SettingsTab = 'player') => {
    setActiveSettingsTab(tab);
    setIsSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);

  return (
    <AppearanceContext.Provider value={{
      playerSettings, updatePlayerSetting, isSettingsModalOpen, openSettingsModal,
      closeSettingsModal, activeSettingsTab, setActiveSettingsTab
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within an AppearanceProvider');
  return context;
}

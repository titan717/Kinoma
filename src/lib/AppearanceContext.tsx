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

const PLAYER_SETTINGS_KEY = 'kinoma_player_settings';
const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => {
    try {
      const stored = localStorage.getItem(PLAYER_SETTINGS_KEY);
      if (stored) return { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PLAYER_SETTINGS;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('player');

  const updatePlayerSetting = useCallback(<K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => {
    setPlayerSettings(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('kinoma_player_settings_change', { detail: updated }));
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

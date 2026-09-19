import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'modern' | 'classic' | 'system';
export type ResolvedTheme = 'modern' | 'classic';

export interface PlayerSettings {
  autoPlay: boolean;
  autoNext: boolean;
  skipIntro: boolean;
  skipOutro: boolean;
  preferredAudio: 'sub' | 'dub';
}

interface AppearanceContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  playerSettings: PlayerSettings;
  updatePlayerSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
  isSettingsModalOpen: boolean;
  openSettingsModal: (tab?: 'appearance' | 'player' | 'library') => void;
  closeSettingsModal: () => void;
  activeSettingsTab: 'appearance' | 'player' | 'library';
  setActiveSettingsTab: (tab: 'appearance' | 'player' | 'library') => void;
}

const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  autoPlay: true,
  autoNext: true,
  skipIntro: true,
  skipOutro: false,
  preferredAudio: 'sub',
};

const THEME_STORAGE_KEY = 'kinoma_appearance_theme';
const PLAYER_SETTINGS_KEY = 'kinoma_player_settings';

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  // Theme Mode: defaults to 'modern' (or stored preference)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'classic' || stored === 'modern' || stored === 'system') {
        return stored;
      }
    } catch {}
    return 'modern';
  });

  // Calculate resolved theme (modern or classic)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (themeMode === 'classic') return 'classic';
    if (themeMode === 'modern') return 'modern';
    // If system, check preference or default to modern
    return 'modern';
  });

  // Player settings
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => {
    try {
      const stored = localStorage.getItem(PLAYER_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PLAYER_SETTINGS;
  });

  // Settings modal visibility
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'player' | 'library'>('appearance');

  // React to themeMode changes
  useEffect(() => {
    let resolved: ResolvedTheme = 'modern';
    if (themeMode === 'classic') {
      resolved = 'classic';
    } else if (themeMode === 'modern') {
      resolved = 'modern';
    } else {
      // System default: default to modern
      resolved = 'modern';
    }
    setResolvedTheme(resolved);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
      window.dispatchEvent(new CustomEvent('kinoma_appearance_change', { detail: { themeMode, resolvedTheme: resolved } }));
    } catch {}
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

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

  const openSettingsModal = useCallback((tab: 'appearance' | 'player' | 'library' = 'appearance') => {
    setActiveSettingsTab(tab);
    setIsSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  return (
    <AppearanceContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        setThemeMode,
        playerSettings,
        updatePlayerSetting,
        isSettingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
        activeSettingsTab,
        setActiveSettingsTab,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}

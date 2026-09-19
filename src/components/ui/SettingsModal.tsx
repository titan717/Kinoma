import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  LayoutTemplate, 
  Monitor, 
  Tv, 
  Play, 
  FastForward, 
  SkipForward, 
  Volume2, 
  Database, 
  Check, 
  Sliders,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAppearance, ThemeMode } from '../../lib/AppearanceContext';
import { historyUtil } from '../../lib/history';
import { libraryManager } from '../../lib/library';

export function SettingsModal() {
  const { 
    isSettingsModalOpen, 
    closeSettingsModal, 
    themeMode, 
    setThemeMode, 
    resolvedTheme,
    playerSettings, 
    updatePlayerSetting,
    activeSettingsTab,
    setActiveSettingsTab
  } = useAppearance();

  if (!isSettingsModalOpen) return null;

  const handleClearHistory = () => {
    if (window.confirm('Clear your entire watch history? This cannot be undone.')) {
      historyUtil.clearHistory();
    }
  };

  const handleClearLibrary = () => {
    if (window.confirm('Clear your Watchlist, Completed, and Favorites lists? This cannot be undone.')) {
      libraryManager.clearAll();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-[#0f1015] border border-[#222230] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c28] bg-[#12131b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7b1fa2] to-[#ab47bc] flex items-center justify-center text-white shadow-md">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Kinoma Settings</h2>
              <p className="text-[11px] text-gray-400">Appearance style and playback preferences</p>
            </div>
          </div>

          <button
            onClick={closeSettingsModal}
            className="w-8 h-8 rounded-xl bg-[#1a1b24] hover:bg-[#252633] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#1c1c28] bg-[#101118]">
          <button
            onClick={() => setActiveSettingsTab('appearance')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold transition-colors relative ${
              activeSettingsTab === 'appearance' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Appearance / UI Style</span>
            {activeSettingsTab === 'appearance' && (
              <motion.div 
                layoutId="settingsTabIndicator" 
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#c084fc] rounded-full" 
              />
            )}
          </button>

          <button
            onClick={() => setActiveSettingsTab('player')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold transition-colors relative ${
              activeSettingsTab === 'player' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Player Preferences</span>
            {activeSettingsTab === 'player' && (
              <motion.div 
                layoutId="settingsTabIndicator" 
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#c084fc] rounded-full" 
              />
            )}
          </button>

          <button
            onClick={() => setActiveSettingsTab('library')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold transition-colors relative ${
              activeSettingsTab === 'library' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Storage & Data</span>
            {activeSettingsTab === 'library' && (
              <motion.div 
                layoutId="settingsTabIndicator" 
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#c084fc] rounded-full" 
              />
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-300">
          
          {/* APPEARANCE TAB */}
          {activeSettingsTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Select Interface Style</h3>
                <p className="text-xs text-gray-400">
                  Switch between Kinoma&apos;s next-generation OTT streaming layout and the preserved classic experience. Changes take effect immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                
                {/* Modern Theme Card */}
                <div
                  onClick={() => setThemeMode('modern')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                    themeMode === 'modern'
                      ? 'bg-[#181524] border-[#c084fc] shadow-[0_0_20px_rgba(192,132,252,0.2)]'
                      : 'bg-[#13141c] border-[#222230] hover:border-[#353545]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#271d3d] border border-[#4a2e7a] flex items-center justify-center text-[#c084fc]">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Modern Mode</h4>
                    </div>
                    {themeMode === 'modern' && (
                      <span className="w-5 h-5 rounded-full bg-[#c084fc] text-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Contemporary OTT streaming UI with cinematic hero art, frosted capsule pills, soft horizontal carousels, and titles placed cleanly below cards.
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#271d3d] text-[#e9d5ff]">
                      Recommended
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e1e2c] text-gray-400">
                      OTT Carousels
                    </span>
                  </div>
                </div>

                {/* Classic Theme Card */}
                <div
                  onClick={() => setThemeMode('classic')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                    themeMode === 'classic'
                      ? 'bg-[#181524] border-[#c084fc] shadow-[0_0_20px_rgba(192,132,252,0.2)]'
                      : 'bg-[#13141c] border-[#222230] hover:border-[#353545]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1a1b26] border border-[#2b2c3a] flex items-center justify-center text-gray-300">
                        <Tv className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Classic Mode</h4>
                    </div>
                    {themeMode === 'classic' && (
                      <span className="w-5 h-5 rounded-full bg-[#c084fc] text-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Preserves the original Kinoma dark cinematic layout with right sidebar top rankings, catalog grid, and classic badge overlay cards.
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e1e2c] text-gray-400">
                      Sidebar & Grid
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e1e2c] text-gray-400">
                      Original
                    </span>
                  </div>
                </div>

              </div>

              {/* System Default Option */}
              <div
                onClick={() => setThemeMode('system')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  themeMode === 'system'
                    ? 'bg-[#181524] border-[#c084fc]'
                    : 'bg-[#13141c] border-[#222230] hover:border-[#353545]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">System Default</h5>
                    <p className="text-[11px] text-gray-400">
                      Currently using: <span className="text-[#c084fc] font-semibold capitalize">{resolvedTheme}</span>
                    </p>
                  </div>
                </div>
                {themeMode === 'system' && (
                  <span className="w-5 h-5 rounded-full bg-[#c084fc] text-black flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="p-3 bg-[#13141c] border border-[#222230] rounded-xl text-[11px] text-gray-400 leading-relaxed">
                💡 <span className="font-semibold text-gray-300">Preserved Data Guarantee:</span> Switching themes does not affect your watch history, watchlist, saved bookmarks, player preferences, or episode timestamps.
              </div>

              {/* Cinematic Intro Card */}
              <div className="p-4 bg-gradient-to-r from-[#171424] to-[#12131c] border border-purple-500/20 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
                    <span>Kinoma Signature Intro</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Experience the Netflix-style opening animation and custom synthesized cinematic audio.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeSettingsModal();
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('kinoma_replay_intro'));
                    }, 200);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all shrink-0 cursor-pointer shadow-md"
                >
                  Play Intro
                </button>
              </div>
            </div>
          )}

          {/* PLAYER PREFERENCES TAB */}
          {activeSettingsTab === 'player' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Streaming & Playback</h3>
                <p className="text-xs text-gray-400">
                  Configure your preferred defaults across all video playback screens.
                </p>
              </div>

              <div className="space-y-3">
                
                {/* Auto Play */}
                <div className="flex items-center justify-between p-3.5 bg-[#13141c] border border-[#222230] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-[#c084fc]" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Auto Play</h4>
                      <p className="text-[11px] text-gray-400">Start playing episode automatically upon loading</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePlayerSetting('autoPlay', !playerSettings.autoPlay)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      playerSettings.autoPlay ? 'bg-[#7b1fa2]' : 'bg-[#222230]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        playerSettings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Next */}
                <div className="flex items-center justify-between p-3.5 bg-[#13141c] border border-[#222230] rounded-xl">
                  <div className="flex items-center gap-3">
                    <FastForward className="w-4 h-4 text-[#c084fc]" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Auto Next Episode</h4>
                      <p className="text-[11px] text-gray-400">Advance to the next episode when the current one finishes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePlayerSetting('autoNext', !playerSettings.autoNext)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      playerSettings.autoNext ? 'bg-[#7b1fa2]' : 'bg-[#222230]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        playerSettings.autoNext ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Skip Intro */}
                <div className="flex items-center justify-between p-3.5 bg-[#13141c] border border-[#222230] rounded-xl">
                  <div className="flex items-center gap-3">
                    <SkipForward className="w-4 h-4 text-[#c084fc]" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Skip Intro</h4>
                      <p className="text-[11px] text-gray-400">Prompt / fast-skip 85-second opening theme sequences</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePlayerSetting('skipIntro', !playerSettings.skipIntro)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      playerSettings.skipIntro ? 'bg-[#7b1fa2]' : 'bg-[#222230]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        playerSettings.skipIntro ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Skip Outro */}
                <div className="flex items-center justify-between p-3.5 bg-[#13141c] border border-[#222230] rounded-xl">
                  <div className="flex items-center gap-3">
                    <SkipForward className="w-4 h-4 text-gray-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Skip Outro</h4>
                      <p className="text-[11px] text-gray-400">Skip ending credits to jump immediately to the next episode</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePlayerSetting('skipOutro', !playerSettings.skipOutro)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      playerSettings.skipOutro ? 'bg-[#7b1fa2]' : 'bg-[#222230]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        playerSettings.skipOutro ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Default Audio */}
                <div className="flex items-center justify-between p-3.5 bg-[#13141c] border border-[#222230] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[#c084fc]" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Preferred Audio</h4>
                      <p className="text-[11px] text-gray-400">Default audio channel when available</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-[#1c1c28] p-1 rounded-lg border border-[#2b2b3b]">
                    <button
                      onClick={() => updatePlayerSetting('preferredAudio', 'sub')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                        playerSettings.preferredAudio === 'sub' ? 'bg-[#7b1fa2] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      SUB
                    </button>
                    <button
                      onClick={() => updatePlayerSetting('preferredAudio', 'dub')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                        playerSettings.preferredAudio === 'dub' ? 'bg-[#7b1fa2] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      DUB
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STORAGE & DATA TAB */}
          {activeSettingsTab === 'library' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Local State & Cache</h3>
                <p className="text-xs text-gray-400">
                  Manage cached stream URLs, stored progress records, and catalog lists.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#13141c] border border-[#222230] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Watch History</h4>
                    <p className="text-[11px] text-gray-400">Reset your in-progress timestamps and continue watching list</p>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1618] hover:bg-red-950/50 text-red-400 border border-red-900/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#13141c] border border-[#222230] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">My List & Bookmarks</h4>
                    <p className="text-[11px] text-gray-400">Clear saved watchlist, completed titles, and favorites</p>
                  </div>
                  <button
                    onClick={handleClearLibrary}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1618] hover:bg-red-950/50 text-red-400 border border-red-900/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1c1c28] bg-[#12131b] flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            Current mode: <span className="text-gray-300 font-semibold capitalize">{resolvedTheme}</span>
          </div>
          <button
            onClick={closeSettingsModal}
            className="px-5 py-2 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] hover:from-[#6a1b9a] hover:to-[#ab47bc] text-white text-xs font-bold rounded-xl shadow-[0_2px_12px_rgba(123,31,162,0.3)] transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

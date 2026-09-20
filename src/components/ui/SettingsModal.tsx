import React, { useState } from 'react';
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
  Trash2,
  Download,
  QrCode,
  Gamepad2,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { useAppearance, ThemeMode } from '../../lib/AppearanceContext';
import { useTVMode } from '../../lib/TVModeContext';
import { usePWAInstall } from '../../lib/usePWAInstall';
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

  const { openAndroidTVModal, isTVMode, toggleTVMode, isAndroidTVDetected } = useTVMode();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const fetchLatestRelease = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus('Querying GitHub latest release...');
    try {
      // Query GitHub API for latest release assets
      const res = await fetch('https://api.github.com/repos/titan717/Kinoma/releases/latest');
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }
      const data = await res.json();
      const apkAsset = data.assets?.find((asset: any) => asset.name && asset.name.endsWith('.apk'));
      if (apkAsset && apkAsset.browser_download_url) {
        setUpdateStatus(`Found version ${data.tag_name || 'latest'}! Downloading APK...`);
        const a = document.createElement('a');
        a.href = apkAsset.browser_download_url;
        a.download = apkAsset.name || 'Kinoma.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => setUpdateStatus('Download started successfully!'), 1500);
      } else {
        throw new Error('No .apk asset found in the latest GitHub release.');
      }
    } catch (err: any) {
      // Fallback to local server APK package endpoint
      setUpdateStatus('Falling back to local release package download...');
      try {
        const a = document.createElement('a');
        a.href = 'https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk';
        a.download = 'Kinoma.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => setUpdateStatus('Local APK download triggered successfully!'), 1500);
      } catch (e) {
        setUpdateStatus(`Download error: ${err.message || 'Failed'}`);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

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

          <button
            onClick={() => setActiveSettingsTab('androidtv')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold transition-colors relative ${
              activeSettingsTab === 'androidtv' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Android TV</span>
            {activeSettingsTab === 'androidtv' && (
              <motion.div 
                layoutId="settingsTabIndicator" 
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#c084fc] rounded-full" 
              />
            )}
          </button>

          <button
            onClick={() => setActiveSettingsTab('updates')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold transition-colors relative ${
              activeSettingsTab === 'updates' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Updates & APK</span>
            {activeSettingsTab === 'updates' && (
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

              {/* Android TV & Big Screen App Card */}
              <div className="p-4 bg-gradient-to-r from-[#1c162b] to-[#12131c] border border-purple-500/30 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
                    <span>Android TV & Big Screen App</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Install Kinoma as an app on your Android TV or toggle 10-foot remote navigation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeSettingsModal();
                    setTimeout(() => openAndroidTVModal(), 150);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#9333ea] hover:bg-[#a855f7] text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-md"
                >
                  TV Guide & App
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

          {/* ANDROID TV TAB */}
          {activeSettingsTab === 'androidtv' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Android TV & Big Screen Experience</h3>
                <p className="text-xs text-gray-400">
                  Install Kinoma as an app on your Android TV, Google TV, or Fire TV for leanback 10-foot remote browsing and 4K playback.
                </p>
              </div>

              {/* Direct TV Guide & Action Modal Button */}
              <div className="p-4 bg-gradient-to-r from-purple-950/40 via-[#181926] to-[#12131c] border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[#c084fc] shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Full TV Setup & QR Code</h4>
                    <p className="text-[11px] text-gray-400">
                      Step-by-step guides for TV Bro, Downloader app, and Chromecast.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    closeSettingsModal();
                    setTimeout(() => openAndroidTVModal(), 150);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs transition-all cursor-pointer shadow-md shrink-0 text-center"
                >
                  Open TV Hub
                </button>
              </div>

              {/* TV Remote 10-Foot Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#13141c] border border-[#222230] rounded-xl">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-[#c084fc]" />
                  <div>
                    <h4 className="text-xs font-bold text-white">TV 10-Foot Navigation Mode</h4>
                    <p className="text-[11px] text-gray-400">
                      Enlarges card scales and enables D-Pad arrow remote navigation.
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTVMode}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isTVMode
                      ? 'bg-[#22c55e] text-black shadow-lg shadow-green-500/20'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {isTVMode ? 'Active' : 'Enable'}
                </button>
              </div>

              {/* Quick Remote Key Reference */}
              <div className="p-3.5 bg-[#101117] border border-white/5 rounded-xl text-[11px] space-y-2">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <span>Remote Shortcuts</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div><span className="text-gray-200 font-semibold">Arrows:</span> Move focus</div>
                  <div><span className="text-gray-200 font-semibold">Enter/OK:</span> Select / Play</div>
                  <div><span className="text-gray-200 font-semibold">Back/Esc:</span> Go Back</div>
                  <div><span className="text-gray-200 font-semibold">F Key:</span> TV Fullscreen</div>
                </div>
              </div>
            </div>
          )}

          {/* UPDATES & APK TAB */}
          {activeSettingsTab === 'updates' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">GitHub Releases & APK Updater</h3>
                <p className="text-xs text-gray-400">
                  Fetch the latest release directly from GitHub API, extract the .apk download URL, and trigger download instantly.
                </p>
              </div>

              <div className="p-4 bg-[#13141c] border border-[#222230] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Check GitHub Latest Release</h4>
                    <p className="text-[11px] text-gray-400">Query GitHub API and trigger direct APK download</p>
                  </div>
                  <button
                    onClick={fetchLatestRelease}
                    disabled={isCheckingUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Checking...' : 'Check For Updates'}</span>
                  </button>
                </div>

                {updateStatus && (
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-lg text-xs text-purple-200 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c084fc] shrink-0" />
                    <span>{updateStatus}</span>
                  </div>
                )}
              </div>

              <div className="max-w-md flex flex-col sm:flex-row gap-3">
                <a
                  href="https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk"
                  download="Kinoma.apk"
                  className="flex-1 p-3.5 bg-[#13141c] hover:bg-[#1a1b26] border border-[#222230] rounded-xl flex items-center justify-between transition-all group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#c084fc]">Download TV APK</h4>
                    <p className="text-[10px] text-gray-400">Kinoma.apk</p>
                  </div>
                  <Download className="w-4 h-4 text-purple-400" />
                </a>
                <a
                  href="https://github.com/titan717/Kinoma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#13141c] hover:bg-[#1a1b26] border border-[#222230] rounded-xl flex items-center justify-between transition-all group sm:w-48"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-400">GitHub Repo</h4>
                    <p className="text-[10px] text-gray-400">titan717/Kinoma</p>
                  </div>
                  <GitBranch className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                </a>
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

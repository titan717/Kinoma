import React, { useState } from 'react';
import { 
  Tv, 
  Download, 
  QrCode, 
  Cast, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  Sparkles, 
  Gamepad2, 
  ArrowRight,
  Monitor,
  Maximize2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { useTVMode } from '../../lib/TVModeContext';

export function AndroidTVModal() {
  const { isAndroidTVModalOpen, closeAndroidTVModal, isTVMode, setTVMode, toggleTVMode, isAndroidTVDetected } = useTVMode();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  
  const [activeTab, setActiveTab] = useState<'browser' | 'downloader' | 'cast' | 'remote'>('browser');
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isAndroidTVModalOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kinoma.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl"
        onClick={closeAndroidTVModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#0f1016] border border-[#262838] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header Banner */}
          <div className="relative bg-gradient-to-r from-[#1e1b38] via-[#161726] to-[#12131c] px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9333ea] to-[#c084fc] flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Add Kinoma to Android TV
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/30">
                    Google TV & Android TV
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Stream on the big screen with 10-foot remote navigation and full 4K audio/video.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTVMode(true);
                  closeAndroidTVModal();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7b1fa2] via-[#9c27b0] to-[#ba68c8] hover:from-[#6a1b9a] hover:to-[#ab47bc] text-white text-xs font-black shadow-[0_4px_16px_rgba(156,39,176,0.4)] transition-all cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Launch TV UI</span>
              </button>

              <button
                onClick={closeAndroidTVModal}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Direct Install Banner if supported on current browser */}
          {isInstallable && (
            <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-[#181926] border border-purple-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#c084fc] shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white">Direct TV Install Available</h3>
                  <p className="text-[11px] text-gray-300">
                    Your current browser supports 1-click installation to your home launcher.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-black text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstalling ? 'Installing...' : 'Install Now'}</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-green-950/40 border border-green-500/30 flex items-center gap-3 text-xs text-green-300">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span>Kinoma is running in standalone app mode!</span>
            </div>
          )}

          {/* Content Area with Scrollable Tabs */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Direct APK Download / GitHub Actions Banner */}
            <div className="bg-gradient-to-r from-purple-900/40 via-[#161726] to-[#12131c] border border-purple-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <Download className="w-6 h-6 text-[#c084fc]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">GitHub Actions Cloud APK Builder (Recommended)</h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Web containers cannot compile native Android binaries. Push this repo to GitHub to let GitHub Actions automatically build the full <code className="text-white font-bold">Kinoma.apk</code> with auto-updates!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href="https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk"
                  download="Kinoma.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download TV APK</span>
                </a>
                <button
                  onClick={() => {
                    setTVMode(true);
                    closeAndroidTVModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>Launch Instant Web TV Mode</span>
                </button>
              </div>
            </div>

            {/* Quick Connect: QR Code & TV Link */}
            <div className="bg-[#14151f] border border-[#212330] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
              
              {/* QR Code Container */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-2xl p-2.5 flex items-center justify-center shrink-0 shadow-xl shadow-black/60">
                {/* SVG QR Code pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
                  {/* Top-left position marker */}
                  <rect x="5" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="14" y="14" width="12" height="12" rx="2" />
                  {/* Top-right position marker */}
                  <rect x="65" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="74" y="14" width="12" height="12" rx="2" />
                  {/* Bottom-left position marker */}
                  <rect x="5" y="65" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="14" y="74" width="12" height="12" rx="2" />
                  {/* Dynamic matrix dots */}
                  <rect x="42" y="10" width="8" height="8" rx="1.5" />
                  <rect x="42" y="24" width="8" height="8" rx="1.5" />
                  <rect x="10" y="42" width="8" height="8" rx="1.5" />
                  <rect x="24" y="42" width="8" height="8" rx="1.5" />
                  <rect x="42" y="42" width="16" height="16" rx="3" fill="#9333ea" />
                  <rect x="65" y="42" width="8" height="8" rx="1.5" />
                  <rect x="82" y="42" width="8" height="8" rx="1.5" />
                  <rect x="42" y="65" width="8" height="8" rx="1.5" />
                  <rect x="65" y="65" width="8" height="8" rx="1.5" />
                  <rect x="80" y="75" width="10" height="10" rx="2" />
                </svg>
              </div>

              {/* URL & Instant Copy */}
              <div className="flex-1 w-full flex flex-col justify-center gap-2 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c084fc]">
                  Instant TV Setup URL
                </span>
                <p className="text-xs text-gray-300">
                  Scan with your phone to cast, or enter this URL into your Android TV browser / Downloader app:
                </p>
                <div className="flex items-center gap-2 bg-[#0c0d12] border border-[#212330] rounded-xl px-3 py-2">
                  <span className="text-xs font-mono text-gray-200 truncate flex-1 select-all">
                    {currentUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 cursor-pointer"
                    title="Copy TV Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Navigation Guide Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#14151f] rounded-2xl border border-[#212330] overflow-x-auto no-scrollbar text-xs font-semibold">
              <button
                onClick={() => setActiveTab('browser')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'browser' 
                    ? 'bg-[#9333ea] text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>1. TV Browser (Easiest)</span>
              </button>

              <button
                onClick={() => setActiveTab('downloader')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'downloader' 
                    ? 'bg-[#9333ea] text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>2. Downloader App</span>
              </button>

              <button
                onClick={() => setActiveTab('cast')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'cast' 
                    ? 'bg-[#9333ea] text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Cast className="w-3.5 h-3.5" />
                <span>3. Google Cast</span>
              </button>

              <button
                onClick={() => setActiveTab('remote')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'remote' 
                    ? 'bg-[#9333ea] text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>4. TV Remote Mode</span>
              </button>
            </div>

            {/* Tab 1: Android TV Browser Guide */}
            {activeTab === 'browser' && (
              <div className="space-y-3.5 text-xs text-gray-300 bg-[#12131c] p-4 sm:p-5 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>How to install via Android TV / Google TV Browser:</span>
                </h4>
                <ol className="space-y-3 list-decimal list-inside leading-relaxed text-gray-300">
                  <li className="pl-1">
                    <strong className="text-white">Open your TV's browser</strong> — We recommend installing <span className="text-[#c084fc] font-bold">TV Bro</span>, <span className="text-[#c084fc] font-bold">JioPages</span>, or <span className="text-[#c084fc] font-bold">Chrome</span> from the Google Play Store on your TV.
                  </li>
                  <li className="pl-1">
                    <strong className="text-white">Type the Kinoma URL</strong> or scan the QR code above using your phone to open the link on your TV.
                  </li>
                  <li className="pl-1">
                    <strong className="text-white">Click "Install App" or "Add to Home screen"</strong> in the browser's menu bar.
                  </li>
                  <li className="pl-1">
                    <strong className="text-white">Done!</strong> A dedicated Kinoma icon will now appear in your Android TV's <span className="text-white font-semibold">"Your Apps"</span> home screen row.
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 2: Downloader App Guide */}
            {activeTab === 'downloader' && (
              <div className="space-y-3.5 text-xs text-gray-300 bg-[#12131c] p-4 sm:p-5 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Using the popular Downloader App (Fire TV & Android TV):</span>
                </h4>
                <ol className="space-y-3 list-decimal list-inside leading-relaxed text-gray-300">
                  <li className="pl-1">
                    <strong className="text-white">Install Downloader</strong> by AFTVnews from the Google Play Store or Amazon Appstore.
                  </li>
                  <li className="pl-1">
                    <strong className="text-white">Enter the Kinoma URL:</strong> Type <code className="bg-black/50 text-[#c084fc] px-1.5 py-0.5 rounded font-mono">{currentUrl}</code> into the Home tab box and click <span className="text-white font-bold">GO</span>.
                  </li>
                  <li className="pl-1">
                    <strong className="text-white">Save as Favorite:</strong> Press the menu button on your remote inside Downloader and select <span className="text-white font-semibold">"Add current page to favorites"</span> for 1-click launch anytime!
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 3: Google Cast Guide */}
            {activeTab === 'cast' && (
              <div className="space-y-3.5 text-xs text-gray-300 bg-[#12131c] p-4 sm:p-5 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Stream directly via Google Cast / Chromecast:</span>
                </h4>
                <p className="leading-relaxed">
                  No installation required! You can cast any anime episode straight from your phone, tablet, or laptop to your Android TV:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-[#171924] rounded-xl border border-white/5 flex items-start gap-2.5">
                    <Cast className="w-4 h-4 text-[#c084fc] mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-white">Chromecast / Google TV</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">Ensure both devices are on the same Wi-Fi network.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#171924] rounded-xl border border-white/5 flex items-start gap-2.5">
                    <Maximize2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-white">4K & HDR Pass-through</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">Retains native video resolution, multi-subtitles, and stereo sound.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: TV Remote 10-Foot Mode Settings */}
            {activeTab === 'remote' && (
              <div className="space-y-4 text-xs text-gray-300 bg-[#12131c] p-4 sm:p-5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h4 className="font-bold text-white text-sm">TV 10-Foot Navigation Mode</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Enlarges UI cards and enables high-contrast remote D-pad focus indicators.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!isTVMode) {
                        setTVMode(true);
                        closeAndroidTVModal();
                      } else {
                        setTVMode(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isTVMode
                        ? 'bg-[#22c55e] text-black shadow-lg shadow-green-500/20'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {isTVMode ? 'TV Mode Active (Click to Exit)' : 'Launch TV Mode'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2.5 bg-[#171924] rounded-xl border border-white/5">
                    <span className="font-bold text-white block">D-Pad Arrows</span>
                    <span className="text-gray-400">Navigate cards & menus</span>
                  </div>
                  <div className="p-2.5 bg-[#171924] rounded-xl border border-white/5">
                    <span className="font-bold text-white block">OK / Enter</span>
                    <span className="text-gray-400">Play episode or select</span>
                  </div>
                  <div className="p-2.5 bg-[#171924] rounded-xl border border-white/5">
                    <span className="font-bold text-white block">Back / Esc</span>
                    <span className="text-gray-400">Return to home screen</span>
                  </div>
                  <div className="p-2.5 bg-[#171924] rounded-xl border border-white/5">
                    <span className="font-bold text-white block">Space / K</span>
                    <span className="text-gray-400">Play / Pause playback</span>
                  </div>
                  <div className="p-2.5 bg-[#171924] rounded-xl border border-white/5">
                    <span className="font-bold text-white block">F Key</span>
                    <span className="text-gray-400">Toggle TV Fullscreen</span>
                  </div>
                  <div className="p-2.5 bg-[#171924] rounded-xl border border-white/5">
                    <span className="font-bold text-white block">M Key</span>
                    <span className="text-gray-400">Mute / Unmute audio</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-[#0a0b0f] border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
              <span>Full PWA Progressive Web App Verified</span>
            </div>

            <button
              onClick={closeAndroidTVModal}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Tv, Sparkles, X, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTVMode } from '../../lib/TVModeContext';
import { preferencesUtil } from '../../lib/preferences';

export function TVExperiencePrompt() {
  const { isTVMode, setTVMode, isAndroidTVDetected } = useTVMode();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0); // 0: Yes, 1: No
  const switchBtnRef = useRef<HTMLButtonElement>(null);
  const stayBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Prompt if device is a TV or large screen (width >= 1024), user is not in TV mode, and hasn't dismissed.
    const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if ((isAndroidTVDetected || isLargeScreen) && !isTVMode && !preferencesUtil.hasDismissedTVPrompt()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAndroidTVDetected, isTVMode]);

  // Keyboard / D-pad spatial navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(0);
        switchBtnRef.current?.focus();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(1);
        stayBtnRef.current?.focus();
      } else if (e.key === 'Escape' || e.keyCode === 10009 || e.keyCode === 461) {
        e.preventDefault();
        handleNo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      switchBtnRef.current?.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleYes = () => {
    preferencesUtil.setDismissedTVPrompt(true);
    setIsOpen(false);
    setTVMode(true);
  };

  const handleNo = () => {
    preferencesUtil.setDismissedTVPrompt(true);
    setIsOpen(false);
    setTVMode(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tv-prompt-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#0e0f17] border border-[#26283a] rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white"
        >
          {/* Header Visual */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7b1fa2] to-[#c084fc] flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#c084fc] uppercase tracking-wider">Display Mode</span>
              <h2 id="tv-prompt-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Enable TV UI?
              </h2>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mb-6">
            We noticed you are on a large display. Would you like to enable Kinoma's TV experience with 10-foot typography and remote navigation?
          </p>

          {/* Action Buttons: Yes / No */}
          <div className="flex items-center gap-3">
            <button
              ref={switchBtnRef}
              onClick={handleYes}
              onFocus={() => setFocusedIndex(0)}
              className={`flex-1 py-3 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                focusedIndex === 0
                  ? 'bg-[#7b1fa2] text-white shadow-[0_0_24px_rgba(123,31,162,0.65)] ring-2 ring-white scale-[1.02]'
                  : 'bg-[#7b1fa2]/80 text-white hover:bg-[#7b1fa2]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Yes</span>
            </button>

            <button
              ref={stayBtnRef}
              onClick={handleNo}
              onFocus={() => setFocusedIndex(1)}
              className={`flex-1 py-3 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                focusedIndex === 1
                  ? 'bg-white/15 text-white border-white ring-2 ring-white/50 scale-[1.02]'
                  : 'bg-[#141520] text-gray-300 hover:text-white border-[#26283a] hover:bg-[#1b1c2b]'
              }`}
            >
              <span>No</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

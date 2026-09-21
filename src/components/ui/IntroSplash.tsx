import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KinomaLogo } from './KinomaLogo';
import { kinomaAudio } from '../../lib/audioSound';

interface IntroSplashProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function IntroSplash({ forceShow = false, onComplete }: IntroSplashProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (forceShow) return true;
    if (typeof window === 'undefined') return false;
    // Check if shown in this session
    const hasShown = sessionStorage.getItem('kinoma_intro_shown_v2');
    return !hasShown;
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  const completeIntro = useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('kinoma_intro_shown_v2', 'true');
    } catch {}
    if (onComplete) onComplete();
  }, [onComplete]);

  // Listen to manual replay events from navbar or settings
  useEffect(() => {
    const handleReplay = () => {
      setIsVisible(true);
      setHasInteracted(true);
      kinomaAudio.playIntroSound();
    };

    window.addEventListener('kinoma_replay_intro', handleReplay);
    return () => window.removeEventListener('kinoma_replay_intro', handleReplay);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Trigger audio immediately (if audio policy allows)
    kinomaAudio.playIntroSound();

    // Auto-dismiss after 2.6 seconds
    const timer = setTimeout(() => {
      completeIntro();
    }, 2600);

    // Any key press (e.g. TV remote DPAD or Enter) dismisses immediately
    const handleKey = () => completeIntro();
    window.addEventListener('keydown', handleKey, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isVisible, completeIntro]);

  // Click on screen also triggers sound if browser required user gesture
  const handleScreenClick = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      kinomaAudio.playIntroSound();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="kinoma-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[100] bg-[#06070a] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
          onClick={handleScreenClick}
        >
          {/* Ambient Cinematic Deep Obsidian Space */}
          <div className="absolute inset-0 bg-[#050608] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.18)_0%,rgba(5,6,8,0.98)_80%)] pointer-events-none" />

          {/* Anamorphic Horizontal Laser Beam (Netflix / Disney flare) */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ 
              scaleX: [0, 0.4, 1.8, 2.2], 
              opacity: [0, 0.9, 0.6, 0],
              transition: { duration: 2.2, times: [0, 0.25, 0.7, 1], ease: [0.16, 1, 0.3, 1] } 
            }}
            className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[#e879f9] to-transparent shadow-[0_0_40px_#c084fc] pointer-events-none"
          />

          {/* Subtle Vertical Prism Streaks */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-40">
            {[-120, -60, 0, 60, 120].map((offset, i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: ['0%', '100%', '100%'], 
                  opacity: [0, 0.6, 0],
                  transition: { duration: 1.8, delay: 0.15 + i * 0.05, ease: 'easeOut' }
                }}
                className="w-[1px] bg-gradient-to-b from-transparent via-purple-400 to-transparent absolute"
                style={{ transform: `translateX(${offset}px)` }}
              />
            ))}
          </div>

          {/* Central Streaming Wordmark & Ribbon Hero */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, filter: 'blur(12px)' }}
            animate={{ 
              scale: [0.88, 1.0, 1.08], 
              opacity: [0, 1, 1],
              filter: ['blur(12px)', 'blur(0px)', 'blur(0px)'],
              transition: { duration: 2.4, times: [0, 0.4, 1], ease: [0.16, 1, 0.3, 1] } 
            }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-4"
          >
            {/* Gloss / Light reflection sweep over the logo */}
            <div className="relative overflow-hidden py-4 px-6 rounded-2xl">
              <KinomaLogo size="xl" variant="full" className="pointer-events-none drop-shadow-[0_0_50px_rgba(192,132,252,0.65)]" />

              {/* Shimmer line passing through */}
              <motion.div 
                initial={{ x: '-150%', opacity: 0 }}
                animate={{ 
                  x: ['-150%', '150%'], 
                  opacity: [0, 0.8, 0],
                  transition: { duration: 1.2, delay: 0.45, ease: 'easeInOut' }
                }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-25 pointer-events-none"
              />
            </div>
          </motion.div>

          {/* Minimalist Studio Skip Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              completeIntro();
            }}
            className="absolute bottom-8 sm:bottom-10 right-6 sm:right-10 z-20 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-medium tracking-wider uppercase text-gray-300 hover:text-white backdrop-blur-md transition-all active:scale-95"
          >
            Skip &rarr;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

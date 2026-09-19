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

    return () => clearTimeout(timer);
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
          {/* Ambient Cinematic Vignette & Flare */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(156,39,176,0.18)_0%,rgba(6,7,10,0.95)_75%)] pointer-events-none" />

          {/* Expanding Light Rays / Horizontal Anamorphic Flare */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ 
              scaleX: [0, 1.4, 2], 
              opacity: [0, 0.8, 0],
              transition: { duration: 2.2, ease: 'easeOut' } 
            }}
            className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-[#c084fc] to-transparent shadow-[0_0_35px_#e879f9] pointer-events-none"
          />

          {/* Central Logo Bloom Container */}
          <motion.div
            initial={{ scale: 0.82, opacity: 0, filter: 'blur(10px)' }}
            animate={{ 
              scale: [0.82, 1.05, 1.15], 
              opacity: [0, 1, 1],
              filter: ['blur(10px)', 'blur(0px)', 'blur(0px)'],
              transition: { duration: 2.4, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] } 
            }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-4"
          >
            {/* Glowing Ring & Typographic Logo */}
            <KinomaLogo size="xl" variant="full" className="pointer-events-none drop-shadow-[0_0_40px_rgba(192,132,252,0.6)]" />

            {/* Tagline / Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: [0, 0.85, 1], y: [12, 0, -2], transition: { delay: 0.5, duration: 1.2 } }}
              className="mt-4 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-gray-400 font-mono"
            >
              Anime &middot; Manga &middot; Cinematic
            </motion.p>
          </motion.div>

          {/* Skip Intro Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              completeIntro();
            }}
            className="absolute bottom-8 sm:bottom-12 right-6 sm:right-12 z-20 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-gray-300 hover:text-white backdrop-blur-md transition-all"
          >
            Skip Intro &rarr;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

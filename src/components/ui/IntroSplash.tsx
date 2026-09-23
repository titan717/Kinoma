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

    // Non-skippable cinematic intro: allow the full animation to complete.
    const timer = setTimeout(() => {
      completeIntro();
    }, 3200);

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
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
          onClick={handleScreenClick}
        >
          {/* Netflix-style cinematic black stage — adapted to Kinoma's purple identity. */}
          <div className="absolute inset-0 bg-black pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.7, 1.15, 1.5] }}
            transition={{ duration: 2.1, ease: 'easeOut' }}
            className="absolute w-[55vw] h-[55vw] max-w-[720px] max-h-[720px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.20),transparent_68%)] blur-2xl pointer-events-none"
          />

          {/* Light-camera inspired processing sweep. */}
          <motion.div
            initial={{ rotate: -18, x: '-65%', opacity: 0 }}
            animate={{ x: ['-65%', '0%', '65%'], opacity: [0, 0.85, 0] }}
            transition={{ duration: 2.6, ease: 'easeInOut' }}
            className="absolute w-[180%] h-[12px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent blur-md pointer-events-none"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0,1,2,3,4,5,6,7].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
                transition={{ duration: 1.8, delay: i * 0.12, repeat: 1 }}
                className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]"
                style={{ transform: `rotate(${i * 45}deg) translateX(120px)` }}
              />
            ))}
          </div>

          {/* Netflix-inspired central studio wordmark reveal */}
          <motion.div
            initial={{ scale: 0.68, opacity: 0, filter: 'blur(16px)' }}
            animate={{ 
              scale: [0.68, 0.94, 1.0, 1.04], 
              opacity: [0, 1, 1, 0.92],
              filter: ['blur(12px)', 'blur(0px)', 'blur(0px)'],
              transition: { duration: 2.35, times: [0, 0.38, 0.78, 1], ease: [0.16, 1, 0.3, 1] } 
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


        </motion.div>
      )}
    </AnimatePresence>
  );
}

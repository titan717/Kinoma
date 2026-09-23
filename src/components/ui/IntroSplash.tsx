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
          {/* Clean anime-style black stage — the logo is the only visual focus. */}
          <div className="absolute inset-0 bg-black pointer-events-none" />

          {/* Clean central wordmark reveal. */}
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
            <div className="py-4 px-6">
              <KinomaLogo size="xl" variant="full" className="pointer-events-none" />
            </div>
          </motion.div>


        </motion.div>
      )}
    </AnimatePresence>
  );
}

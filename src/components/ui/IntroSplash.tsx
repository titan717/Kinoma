import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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
    return !sessionStorage.getItem('panda_intro_shown_v3');
  });
  const [ready, setReady] = useState(false);

  const completeIntro = useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('panda_intro_shown_v3', 'true');
      window.dispatchEvent(new Event('panda_intro_complete'));
    } catch {}
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    const replay = () => {
      setIsVisible(true);
      setReady(false);
      kinomaAudio.playIntroSound();
    };
    window.addEventListener('panda_replay_intro', replay);
    return () => window.removeEventListener('panda_replay_intro', replay);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    kinomaAudio.playIntroSound();
    const timer = window.setTimeout(() => setReady(true), 2200);
    return () => window.clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(completeIntro, 1500);
    return () => window.clearTimeout(timer);
  }, [ready, completeIntro]);

  const enter = () => {
    setReady(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="panda-new-intro"
          className="panda-intro-v4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .45 }}
          onClick={enter}
          role="dialog"
          aria-label="Panda.fun introduction"
        >
          <div className="panda-intro-v4__grain" />
          <div className="panda-intro-v4__orbit panda-intro-v4__orbit--one" />
          <div className="panda-intro-v4__orbit panda-intro-v4__orbit--two" />

          <header className="panda-intro-v4__header">
            <span>EST. FOR YOUR NEXT WATCH</span>
            <span>01 / 01</span>
          </header>

          <main className="panda-intro-v4__stage">
            <motion.div
              className="panda-intro-v4__mark"
              initial={{ scale: .35, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 1.1, delay: .2, ease: [.16, 1, .3, 1] }}
            >
              <KinomaLogo size="lg" variant="mark" />
            </motion.div>

            <motion.div
              className="panda-intro-v4__wordmark"
              initial={{ opacity: 0, y: 35, letterSpacing: '.35em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '-.04em' }}
              transition={{ duration: .9, delay: .75, ease: [.16, 1, .3, 1] }}
            >
              <KinomaLogo size="xl" variant="typography" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25, duration: .7 }}
            >
              Stories, picked for the way you watch.
            </motion.p>
          </main>

          <footer className="panda-intro-v4__footer">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.8, delay: .15, ease: 'linear' }}
              className="panda-intro-v4__line"
            />
            <button type="button" onClick={(event) => { event.stopPropagation(); enter(); }}>
              <span>{ready ? 'ENTER' : 'SKIP INTRO'}</span>
              <ArrowRight size={15} />
            </button>
          </footer>

          <motion.div
            className="panda-intro-v4__corner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            PANDA / CINEMA / ANIME / SERIES
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

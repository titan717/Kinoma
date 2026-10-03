import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KinomaLogo } from '../ui/KinomaLogo';
import './panda-intro.css';
import introAudioUrl from '../../../assets/reelaudio-52430_VbuEeMF7.mp3';

const INTRO_DURATION = 5200;
const FOG_TRANSITION = 1050;

function createParticles(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const seed = (index * 47 + 19) % 101;
    return {
      id: index,
      x: (index * 37.7 + 11) % 100,
      y: (index * 61.3 + 7) % 100,
      size: 1 + (index % 4) * 0.55,
      delay: -((index * 0.17) % 2.8),
      duration: 2.8 + (index % 7) * 0.45,
      drift: ((seed % 23) - 11) * 1.8,
      opacity: 0.16 + (index % 6) * 0.045,
    };
  });
}

export function PandaIntro() {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const particles = useMemo(() => createParticles(110), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = audioRef.current;
    let cancelled = false;

    const startAudio = async () => {
      if (!audio || cancelled) return;
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch {
        // Autoplay can only be rejected by the browser itself. We retry on the
        // first trusted interaction without adding a skip control to the intro.
      }
    };

    const retryAudio = () => {
      void startAudio();
      window.removeEventListener('pointerdown', retryAudio);
      window.removeEventListener('keydown', retryAudio);
    };

    // Try immediately and again after the document is interactive. No muted
    // fallback is used: the intro is always intended to play with its audio.
    void startAudio();
    const begin = window.setTimeout(startAudio, 120);
    window.addEventListener('pointerdown', retryAudio, { once: true, passive: true });
    window.addEventListener('keydown', retryAudio, { once: true });

    finishTimerRef.current = window.setTimeout(() => {
      if (cancelled) return;
      setLeaving(true);
      transitionTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        window.dispatchEvent(new CustomEvent('panda_intro_complete'));
      }, FOG_TRANSITION);
    }, INTRO_DURATION);

    return () => {
      cancelled = true;
      window.clearTimeout(begin);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      window.removeEventListener('pointerdown', retryAudio);
      window.removeEventListener('keydown', retryAudio);
      audio?.pause();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`panda-intro ${leaving ? 'is-leaving' : ''}`} role="presentation" aria-hidden="true">
      <audio ref={audioRef} src={introAudioUrl} preload="auto" playsInline />
      <div className="panda-intro__backdrop" />
      <div className="panda-intro__fog panda-intro__fog--back" />
      <div className="panda-intro__fog panda-intro__fog--mid" />
      <div className="panda-intro__particles">
        {particles.map((particle) => (
          <i key={particle.id} style={{
            '--x': `${particle.x}%`,
            '--y': `${particle.y}%`,
            '--size': `${particle.size}px`,
            '--delay': `${particle.delay}s`,
            '--duration': `${particle.duration}s`,
            '--drift': `${particle.drift}px`,
            '--opacity': particle.opacity,
          } as React.CSSProperties} />
        ))}
      </div>
      <div className="panda-intro__mark">
        <div className="panda-intro__halo" />
        <div className="panda-intro__logo"><KinomaLogo size="lg" variant="full" /></div>
        <span className="panda-intro__wordmark">PANDA.FUN</span>
      </div>
      <div className="panda-intro__fog panda-intro__fog--front" />
      <div className="panda-intro__rush" />
      <div className="panda-intro__grain" />
    </div>
  );
}

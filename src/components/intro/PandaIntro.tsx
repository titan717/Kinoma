import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KinomaLogo } from '../ui/KinomaLogo';
import './panda-intro.css';

const INTRO_SEEN_KEY = 'panda_intro_seen_v4';
const INTRO_SHOWN_SESSION_KEY = 'panda_intro_shown_v3';
const INTRO_DURATION = 5200;

function hasSeenIntro() {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, '1');
    window.sessionStorage.setItem(INTRO_SHOWN_SESSION_KEY, '1');
  } catch {}
}

function completeIntro() {
  markIntroSeen();
  window.dispatchEvent(new CustomEvent('panda_intro_complete'));
}

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
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const particles = useMemo(() => createParticles(110), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (hasSeenIntro()) {
      window.setTimeout(completeIntro, 0);
      return;
    }

    setVisible(true);
    const audio = audioRef.current;
    let cancelled = false;

    const startAudio = async () => {
      if (!audio || cancelled) return;
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch {
        // Browser autoplay policy may block sound. The cinematic visual still runs.
      }
    };

    const begin = window.setTimeout(startAudio, 80);
    finishTimerRef.current = window.setTimeout(() => {
      if (cancelled) return;
      setLeaving(true);

      window.setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        completeIntro();
      }, 1050);
    }, INTRO_DURATION);

    return () => {
      cancelled = true;
      window.clearTimeout(begin);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
      audio?.pause();
    };
  }, []);

  useEffect(() => {
    if (!visible || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setLeaving(true);
      window.setTimeout(() => {
        setVisible(false);
        completeIntro();
      }, 450);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`panda-intro ${leaving ? 'is-leaving' : ''}`} role="presentation" aria-hidden="true">
      <audio ref={audioRef} src="/assets/reelaudio-52430_VbuEeMF7.mp3" preload="auto" />

      <div className="panda-intro__backdrop" />
      <div className="panda-intro__fog panda-intro__fog--back" />
      <div className="panda-intro__fog panda-intro__fog--mid" />
      <div className="panda-intro__particles">
        {particles.map((particle) => (
          <i
            key={particle.id}
            style={{
              '--x': `${particle.x}%`,
              '--y': `${particle.y}%`,
              '--size': `${particle.size}px`,
              '--delay': `${particle.delay}s`,
              '--duration': `${particle.duration}s`,
              '--drift': `${particle.drift}px`,
              '--opacity': particle.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="panda-intro__mark">
        <div className="panda-intro__halo" />
        <div className="panda-intro__logo">
          <KinomaLogo size="lg" variant="full" />
        </div>
        <span className="panda-intro__wordmark">PANDA.FUN</span>
      </div>

      <div className="panda-intro__fog panda-intro__fog--front" />
      <div className="panda-intro__rush" />
      <div className="panda-intro__grain" />
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KinomaLogo } from '../ui/KinomaLogo';
import './panda-intro.css';
import introAudioUrl from '../../../assets/reelaudio-52430_VbuEeMF7.mp3';

const INTRO_DURATION = 9000;
const FOG_TRANSITION = 1800;
const INTRO_SESSION_KEY = 'panda_intro_seen';

function createParticles(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: ((index * 73.37 + 17) % 100) - 50,
    y: ((index * 41.91 + 29) % 100) - 50,
    z: -520 + ((index * 97.13 + 7) % 100) * 10.4,
    size: 1 + (index % 7) * 0.55,
    delay: -((index * 0.043) % 6),
    duration: 5.2 + (index % 9) * 0.62,
    driftX: ((index * 19) % 31) - 15,
    driftY: ((index * 23) % 25) - 12,
    driftZ: 80 + (index % 13) * 24,
    opacity: 0.12 + (index % 8) * 0.035,
  }));
}

function hasSeenIntroThisSession() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  } catch {
    // If storage is unavailable, the intro still plays normally.
  }
}

export function PandaIntro() {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !hasSeenIntroThisSession();
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const particles = useMemo(() => createParticles(420), []);

  useEffect(() => {
    if (typeof window === 'undefined' || !visible) return;
    const audio = audioRef.current;
    let cancelled = false;

    const startAudio = async () => {
      if (!audio || cancelled || !audio.paused) return;
      try { audio.currentTime = 0; await audio.play(); } catch {}
    };

    const retryAudio = () => {
      void startAudio();
      window.removeEventListener('pointerdown', retryAudio);
      window.removeEventListener('keydown', retryAudio);
    };

    void startAudio();
    const begin = window.setTimeout(startAudio, 120);
    window.addEventListener('pointerdown', retryAudio, { once: true, passive: true });
    window.addEventListener('keydown', retryAudio, { once: true });

    finishTimerRef.current = window.setTimeout(() => {
      if (cancelled) return;
      setLeaving(true);
      transitionTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        markIntroSeen();
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
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={"panda-intro " + (leaving ? 'is-leaving' : '')} role="presentation" aria-hidden="true">
      <audio ref={audioRef} src={introAudioUrl} preload="auto" autoPlay playsInline />
      <div className="panda-intro__backdrop" />
      <div className="panda-intro__volumetric panda-intro__volumetric--back" />
      <div className="panda-intro__volumetric panda-intro__volumetric--mid" />
      <div className="panda-intro__fog panda-intro__fog--back" />
      <div className="panda-intro__fog panda-intro__fog--mid" />
      <div className="panda-intro__depth">
        {particles.map((particle) => (
          <i key={particle.id} style={{
            '--x': particle.x + 'vw', '--y': particle.y + 'vh', '--z': particle.z + 'px',
            '--size': particle.size + 'px', '--delay': particle.delay + 's', '--duration': particle.duration + 's',
            '--dx': particle.driftX + 'vw', '--dy': particle.driftY + 'vh', '--dz': particle.driftZ + 'px', '--opacity': particle.opacity,
          } as React.CSSProperties} />
        ))}
      </div>
      <div className="panda-intro__mist-field"><span /><span /><span /><span /><span /><span /><span /><span /></div>
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

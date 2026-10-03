import React, { useEffect, useMemo, useRef, useState } from 'react';
import './panda-intro.css';
import introAudioUrl from '../../../assets/reelaudio-52430_VbuEeMF7.mp3';

const INTRO_DURATION = 9000;
const FOG_TRANSITION = 1800;
const INTRO_SESSION_KEY = 'panda_intro_seen';

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
      <div className="panda-intro__fog-simple" />
      <div className="panda-intro__mark">
        <span className="panda-intro__wordmark" aria-label="PANDA.FUN">
          <span className="panda-intro__typed">PANDA.FUN</span>
        </span>
      </div>
      </div>

    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { KinomaLogo } from './KinomaLogo';
import { preferencesUtil } from '../../lib/preferences';
import { PandaScene } from './panda3d/PandaScene';
import { PandaOnboardingFallback } from './panda3d/PandaOnboardingFallback';
import { PandaDialogue } from './panda3d/PandaDialogue';
import { PreferenceStage } from './panda3d/PreferenceStage';
import { CompletionTransition } from './panda3d/CompletionTransition';
import type { PandaSceneEvent } from './panda3d/pandaSceneTypes';

const STORAGE_KEY = 'panda_onboarding_v1';
const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Sports', 'Slice of Life'];
const LANGUAGES = ['English', 'Japanese', 'Hindi', 'Korean', 'Spanish'];
const AVATARS = [
  { id: 'classic', emoji: '🐼', label: 'Classic Panda' },
  { id: 'sleepy', emoji: '😴🐼', label: 'Sleepy Panda' },
  { id: 'gamer', emoji: '🎮🐼', label: 'Gamer Panda' },
  { id: 'chill', emoji: '😎🐼', label: 'Chill Panda' },
  { id: 'bamboo', emoji: '🎋🐼', label: 'Bamboo Panda' },
  { id: 'night', emoji: '🌙🐼', label: 'Night Panda' },
];

interface OnboardingState {
  name: string; avatar: string; genres: string[]; audioLanguage: string; subtitleLanguage: string;
  autoPlay: boolean; previews: boolean; skipIntro: boolean; skipOutro: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  name: '', avatar: 'classic', genres: [], audioLanguage: 'English', subtitleLanguage: 'English',
  autoPlay: true, previews: true, skipIntro: true, skipOutro: false,
};

function readState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {}
  return DEFAULT_STATE;
}

function hasStorageValue(key: string, storage: Storage | undefined) {
  if (!storage) return false;
  try { return Boolean(storage.getItem(key)); } catch { return false; }
}

const events: PandaSceneEvent[] = ['recognize', 'genre-select', 'language-select', 'playback-toggle', 'ready'];

export function PandaOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneEvent, setSceneEvent] = useState<PandaSceneEvent>('arrive');
  const finishTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasStorageValue(STORAGE_KEY, window.localStorage)) return;

    setState(readState());
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      setVisible(true);
    };

    // Re-check the intro state after mounting. This closes the race where
    // IntroSplash completes before this listener is attached (notably in
    // React StrictMode and on fast refreshes).
    if (hasStorageValue('panda_intro_shown_v3', window.sessionStorage)) {
      const timer = window.setTimeout(open, 80);
      return () => window.clearTimeout(timer);
    }

    window.addEventListener('panda_intro_complete', open);
    const recoveryTimer = window.setTimeout(() => {
      if (hasStorageValue('panda_intro_shown_v3', window.sessionStorage)) open();
    }, 900);

    return () => {
      window.removeEventListener('panda_intro_complete', open);
      window.clearTimeout(recoveryTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    setSceneEvent(step === 0 ? 'arrive' : events[Math.min(step - 1, events.length - 1)]);
  }, [step, visible]);

  const reducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = useCallback(() => {
    const next = { ...state, name: state.name.trim() || 'Panda' };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      preferencesUtil.setAudioPreference('sub');
      window.dispatchEvent(new CustomEvent('panda_onboarding_complete', { detail: next }));
    } catch {}
    const exitDelay = reducedMotion ? 0 : 720;
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;
      setVisible(false);
    }, exitDelay);
  }, [state, reducedMotion]);

  useEffect(() => () => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
  }, []);

  const skip = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_STATE }));
      window.dispatchEvent(new CustomEvent('panda_onboarding_complete', { detail: DEFAULT_STATE }));
    } catch {}
    setVisible(false);
  }, []);

  const update = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) =>
    setState(current => ({ ...current, [key]: value }));

  const toggleGenre = (genre: string) =>
    update('genres', state.genres.includes(genre) ? state.genres.filter(item => item !== genre) : [...state.genres, genre].slice(0, 6));

  const togglePlaybackSetting = (key: 'autoPlay' | 'previews' | 'skipIntro' | 'skipOutro') => {
    update(key, !state[key]);
    setSceneEvent('playback-toggle');
  };

  const canContinue = useMemo(() => {
    if (step === 1) return state.name.trim().length > 0;
    if (step === 2) return state.genres.length >= 3;
    return true;
  }, [step, state]);

  if (!visible) return null;

  return (
    <div className="panda-onboarding" role="dialog" aria-modal="true" aria-labelledby="panda-onboarding-title">
      <div className="panda-onboarding__backdrop" />
      <div className="panda-onboarding__ambient" />
      <div className="panda-onboarding__scene-wrap">
        {sceneFailed ? <PandaOnboardingFallback /> : (
          <PandaScene event={sceneEvent} reducedMotion={reducedMotion} onError={() => setSceneFailed(true)} />
        )}
      </div>

      <section className="panda-onboarding__panel">
        <header className="panda-onboarding__top">
          <KinomaLogo size="md" variant="full" />
          <button type="button" className="panda-onboarding__skip" onClick={skip}>Skip for now</button>
        </header>

        <div className="panda-onboarding__progress" aria-label={`Step ${step + 1} of 6`}>
          {Array.from({ length: 6 }).map((_, index) => <span key={index} className={index <= step ? 'is-active' : ''} />)}
        </div>

        <div className="panda-onboarding__content" aria-live="polite" aria-atomic="true">
          {step === 0 && (
            <div className="panda-onboarding__welcome">
              <PandaDialogue eyebrow="WELCOME TO YOUR LOUNGE" title="Your next watch is waiting." description="Let's make panda.fun feel a little more like yours. A few quick choices tune your home screen and playback experience." />
              <button type="button" className="panda-onboarding__primary" onClick={() => setStep(1)}>
                <span>Make it mine</span><ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 1 && (
            <PreferenceStage>
              <PandaDialogue eyebrow="YOUR PANDA" title="Who's watching?" description="Give your lounge a name." />
              <input autoFocus className="panda-onboarding__input" value={state.name} onChange={event => update('name', event.target.value)} placeholder="Your name" maxLength={24} />
              <div className="panda-avatar-grid">
                {AVATARS.map(avatar => (
                  <button key={avatar.id} type="button" className={`panda-avatar ${state.avatar === avatar.id ? 'is-selected' : ''}`} onClick={() => update('avatar', avatar.id)} aria-label={avatar.label} aria-pressed={state.avatar === avatar.id}>
                    <span>{avatar.emoji}</span><small>{avatar.label}</small>
                  </button>
                ))}
              </div>
            </PreferenceStage>
          )}

          {step === 2 && (
            <PreferenceStage>
              <PandaDialogue eyebrow="PERSONALIZE" title="What are you into?" description="Pick at least three. Panda will use these as starting signals." />
              <div className="panda-chip-grid">
                {GENRES.map(genre => <button key={genre} type="button" className={`panda-chip ${state.genres.includes(genre) ? 'is-selected' : ''}`} onClick={() => { toggleGenre(genre); setSceneEvent('genre-select'); }} aria-pressed={state.genres.includes(genre)}>{state.genres.includes(genre) && <Check size={14} />}{genre}</button>)}
              </div>
              <small className="panda-onboarding__hint">{state.genres.length}/3 minimum selected</small>
            </PreferenceStage>
          )}

          {step === 3 && (
            <PreferenceStage>
              <PandaDialogue eyebrow="LANGUAGES" title="Make every line feel right." description="These are defaults. You can change them anytime in Settings." />
              <label className="panda-setting-field"><span>Preferred audio</span><select value={state.audioLanguage} onChange={event => { update('audioLanguage', event.target.value); setSceneEvent('language-select'); }}>{LANGUAGES.map(language => <option key={language}>{language}</option>)}</select></label>
              <label className="panda-setting-field"><span>Preferred subtitles</span><select value={state.subtitleLanguage} onChange={event => { update('subtitleLanguage', event.target.value); setSceneEvent('language-select'); }}>{LANGUAGES.map(language => <option key={language}>{language}</option>)}</select></label>
            </PreferenceStage>
          )}

          {step === 4 && (
            <PreferenceStage>
              <PandaDialogue eyebrow="PLAYBACK" title="Set the lounge on autopilot." description="We'll keep these preferences on this device for now." />
              {[
                ['autoPlay', 'Autoplay next episode', 'Keep the story moving.'],
                ['previews', 'Autoplay previews', 'Preview trailers when you hover a title.'],
                ['skipIntro', 'Skip intros automatically', 'Jump over known intros when available.'],
                ['skipOutro', 'Skip outros automatically', 'Move on when an outro is detected.'],
              ].map(([key, label, description]) => (
                <button key={key} type="button" className="panda-toggle-row" onClick={() => togglePlaybackSetting(key as 'autoPlay' | 'previews' | 'skipIntro' | 'skipOutro')}>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <i className={state[key as keyof OnboardingState] ? 'is-on' : ''}><b /></i>
                </button>
              ))}
            </PreferenceStage>
          )}

          {step === 5 && (
            <CompletionTransition>
              <PandaDialogue eyebrow="READY" title="Your lounge is ready." description="We'll use your choices to shape Panda around you. Nothing here is permanent — you can tune it later." />
              <button type="button" className="panda-onboarding__primary" onClick={() => { setSceneEvent('exit'); finish(); }}>
                <Play size={16} fill="currentColor" /> Enter panda.fun
              </button>
            </CompletionTransition>
          )}
        </div>

        {step > 0 && step < 5 && (
          <footer className="panda-onboarding__actions">
            <button type="button" className="panda-onboarding__back" onClick={() => setStep(value => value - 1)}><ChevronLeft size={17} /> Back</button>
            <button type="button" className="panda-onboarding__primary" disabled={!canContinue} onClick={() => setStep(value => value + 1)}>Continue <ChevronRight size={17} /></button>
          </footer>
        )}
      </section>
    </div>
  );
}

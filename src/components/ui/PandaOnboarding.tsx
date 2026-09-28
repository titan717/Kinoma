import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { KinomaLogo } from './KinomaLogo';
import { preferencesUtil } from '../../lib/preferences';

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
  name: string;
  avatar: string;
  genres: string[];
  audioLanguage: string;
  subtitleLanguage: string;
  autoPlay: boolean;
  previews: boolean;
  skipIntro: boolean;
  skipOutro: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  name: '',
  avatar: 'classic',
  genres: [],
  audioLanguage: 'English',
  subtitleLanguage: 'English',
  autoPlay: true,
  previews: true,
  skipIntro: true,
  skipOutro: false,
};

function readState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

export function PandaOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (hasCompleted) return;
    setState(readState());
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  const finish = () => {
    const next = { ...state, name: state.name.trim() || 'Panda' };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      preferencesUtil.setAudioPreference('sub');
      window.dispatchEvent(new CustomEvent('panda_onboarding_complete', { detail: next }));
    } catch {}
    setVisible(false);
  };

  const skip = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_STATE }));
      window.dispatchEvent(new CustomEvent('panda_onboarding_complete', { detail: DEFAULT_STATE }));
    } catch {}
    setVisible(false);
  };

  const canContinue = useMemo(() => {
    if (step === 1) return state.name.trim().length > 0;
    if (step === 2) return state.genres.length >= 3;
    return true;
  }, [step, state]);

  const update = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) =>
    setState(current => ({ ...current, [key]: value }));

  const toggleGenre = (genre: string) =>
    update('genres', state.genres.includes(genre) ? state.genres.filter(item => item !== genre) : [...state.genres, genre].slice(0, 6));

  if (!visible) return null;

  return (
    <div className="panda-onboarding" role="dialog" aria-modal="true" aria-labelledby="panda-onboarding-title">
      <div className="panda-onboarding__backdrop" />
      <div className="panda-onboarding__glow panda-onboarding__glow--one" />
      <div className="panda-onboarding__glow panda-onboarding__glow--two" />

      <section className="panda-onboarding__panel">
        <header className="panda-onboarding__top">
          <KinomaLogo size="md" variant="full" />
          <button type="button" className="panda-onboarding__skip" onClick={skip}>Skip for now</button>
        </header>

        <div className="panda-onboarding__progress" aria-label={`Step ${step + 1} of 6`}>
          {Array.from({ length: 6 }).map((_, index) => <span key={index} className={index <= step ? 'is-active' : ''} />)}
        </div>

        <div className="panda-onboarding__content">
          {step === 0 && (
            <div className="panda-onboarding__welcome">
              <div className="panda-onboarding__panda" aria-hidden="true">🐼</div>
              <span className="panda-onboarding__eyebrow">WELCOME TO YOUR LOUNGE</span>
              <h1 id="panda-onboarding-title">Your next watch is waiting.</h1>
              <p>Let's make panda.fun feel a little more like yours. A few quick choices tune your home screen and playback experience.</p>
              <button type="button" className="panda-onboarding__primary" onClick={() => setStep(1)}>
                <span>Make it mine</span><ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <span className="panda-onboarding__eyebrow">YOUR PANDA</span>
              <h1 id="panda-onboarding-title">Who's watching?</h1>
              <p className="panda-onboarding__intro">Give your lounge a name.</p>
              <input autoFocus className="panda-onboarding__input" value={state.name} onChange={event => update('name', event.target.value)} placeholder="Your name" maxLength={24} />
              <div className="panda-avatar-grid">
                {AVATARS.map(avatar => (
                  <button key={avatar.id} type="button" className={`panda-avatar ${state.avatar === avatar.id ? 'is-selected' : ''}`} onClick={() => update('avatar', avatar.id)} aria-label={avatar.label} aria-pressed={state.avatar === avatar.id}>
                    <span>{avatar.emoji}</span><small>{avatar.label}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <span className="panda-onboarding__eyebrow">PERSONALIZE</span>
              <h1 id="panda-onboarding-title">What are you into?</h1>
              <p className="panda-onboarding__intro">Pick at least three. Panda will use these as starting signals.</p>
              <div className="panda-chip-grid">
                {GENRES.map(genre => <button key={genre} type="button" className={`panda-chip ${state.genres.includes(genre) ? 'is-selected' : ''}`} onClick={() => toggleGenre(genre)}>{state.genres.includes(genre) && <Check size={14} />}{genre}</button>)}
              </div>
              <small className="panda-onboarding__hint">{state.genres.length}/3 minimum selected</small>
            </div>
          )}

          {step === 3 && (
            <div>
              <span className="panda-onboarding__eyebrow">LANGUAGES</span>
              <h1 id="panda-onboarding-title">Make every line feel right.</h1>
              <p className="panda-onboarding__intro">These are defaults. You can change them anytime in Settings.</p>
              <label className="panda-setting-field"><span>Preferred audio</span><select value={state.audioLanguage} onChange={event => update('audioLanguage', event.target.value)}>{LANGUAGES.map(language => <option key={language}>{language}</option>)}</select></label>
              <label className="panda-setting-field"><span>Preferred subtitles</span><select value={state.subtitleLanguage} onChange={event => update('subtitleLanguage', event.target.value)}>{LANGUAGES.map(language => <option key={language}>{language}</option>)}</select></label>
            </div>
          )}

          {step === 4 && (
            <div>
              <span className="panda-onboarding__eyebrow">PLAYBACK</span>
              <h1 id="panda-onboarding-title">Set the lounge on autopilot.</h1>
              <p className="panda-onboarding__intro">We'll keep these preferences on this device for now.</p>
              {[
                ['autoPlay', 'Autoplay next episode', 'Keep the story moving.'],
                ['previews', 'Autoplay previews', 'Preview trailers when you hover a title.'],
                ['skipIntro', 'Skip intros automatically', 'Jump over known intros when available.'],
                ['skipOutro', 'Skip outros automatically', 'Move on when an outro is detected.'],
              ].map(([key, label, description]) => (
                <button key={key} type="button" className="panda-toggle-row" onClick={() => update(key as keyof OnboardingState, !state[key as keyof OnboardingState])}>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <i className={state[key as keyof OnboardingState] ? 'is-on' : ''}><b /></i>
                </button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="panda-onboarding__ready">
              <div className="panda-onboarding__ready-panda" aria-hidden="true">🐼</div>
              <span className="panda-onboarding__eyebrow">READY</span>
              <h1 id="panda-onboarding-title">Your lounge is ready.</h1>
              <p>We'll use your choices to shape Panda around you. Nothing here is permanent — you can tune it later.</p>
              <button type="button" className="panda-onboarding__primary" onClick={finish}><Play size={16} fill="currentColor" /> Enter panda.fun</button>
            </div>
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

import React from 'react';
import { Link } from 'wouter';
import { ChevronRight, Play, Database, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppearance } from '../lib/AppearanceContext';
import { updateSEO } from '../lib/seo';
import { KinomaLogo } from '../components/ui/KinomaLogo';

export function Settings() {
  const { openSettingsModal } = useAppearance();

  React.useEffect(() => {
    updateSEO({ title: 'Settings', description: 'Manage your Panda.fun preferences.', type: 'website' });
  }, []);

  const cards = [
    { tab: 'appearance' as const, icon: Sparkles, eyebrow: 'LOOK & FEEL', title: 'Appearance', description: 'Tune the Panda.fun interface and replay the cinematic intro.' },
    { tab: 'player' as const, icon: Play, eyebrow: 'WATCHING', title: 'Player', description: 'Control autoplay, next episode, skip behaviour and audio preferences.' },
    { tab: 'library' as const, icon: Database, eyebrow: 'YOUR DATA', title: 'Library & Storage', description: 'Manage your saved titles, watch history and local data.' },
  ];

  return (
    <main className="panda-settings-page">
      <div className="panda-settings-page__glow" aria-hidden="true" />
      <div className="panda-settings-page__inner">
        <header className="panda-settings-page__header">
          <div className="panda-settings-page__identity">
            <KinomaLogo variant="mark" size="lg" className="panda-settings-page__mark" />
            <div>
              <span className="panda-settings-page__eyebrow">MAKE IT YOURS</span>
              <h1>Settings</h1>
              <p>Small preferences, a more comfortable way to watch.</p>
            </div>
          </div>
          <Link href="/home" className="panda-settings-page__back">Back to Home <ChevronRight size={15} /></Link>
        </header>

        <section className="panda-settings-page__grid" aria-label="Settings categories">
          {cards.map(({ tab, icon: Icon, eyebrow, title, description }) => (
            <button key={tab} type="button" onClick={() => openSettingsModal(tab)} className="panda-settings-card">
              <span className="panda-settings-card__top">
                <span className="panda-settings-card__icon"><Icon size={19} /></span>
                <ChevronRight size={17} className="panda-settings-card__arrow" />
              </span>
              <span className="panda-settings-card__copy">
                <span className="panda-settings-card__eyebrow">{eyebrow}</span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <span className="panda-settings-card__hint">Open preferences</span>
            </button>
          ))}
        </section>

        <section className="panda-settings-footer">
          <div className="panda-settings-footer__icon"><ShieldCheck size={17} /></div>
          <div>
            <strong>Your preferences stay on your device</strong>
            <p>Playback preferences and library controls are stored locally in your browser unless a connected account feature explicitly syncs them.</p>
          </div>
          <span className="panda-settings-footer__paw" aria-hidden="true">🐾</span>
        </section>

        <div className="panda-settings-page__brand" aria-hidden="true">panda<span>.fun</span></div>
      </div>
    </main>
  );
}

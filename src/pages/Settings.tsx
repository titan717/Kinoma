import React from 'react';
import { Link } from 'wouter';
import { ChevronRight, Play, Sliders, Database, Sparkles } from 'lucide-react';
import { useAppearance } from '../lib/AppearanceContext';
import { updateSEO } from '../lib/seo';

export function Settings() {
  const { openSettingsModal } = useAppearance();

  React.useEffect(() => {
    updateSEO({ title: 'Settings', description: 'Manage your Panda.fun preferences.', type: 'website' });
  }, []);

  const cards = [
    { tab: 'appearance' as const, icon: Sparkles, title: 'Appearance & UI', description: 'Manage the Panda.fun interface and replay the cinematic intro.' },
    { tab: 'player' as const, icon: Play, title: 'Player Preferences', description: 'Auto play, auto next, skip controls and preferred audio.' },
    { tab: 'library' as const, icon: Database, title: 'Storage & Data', description: 'Manage watch history, bookmarks and local catalog data.' },
  ];

  return (
    <div className="kinoma-settings-page">
      <div className="kinoma-settings-page__inner">
        <div className="kinoma-settings-page__header">
          <div>
            <span>PERSONALIZE KINOMA</span>
            <h1>Settings</h1>
            <p>Everything you need to tune your streaming experience, in one place.</p>
          </div>
          <Link href="/home" className="kinoma-settings-page__back">Back to Home</Link>
        </div>

        <div className="kinoma-settings-page__grid">
          {cards.map(({ tab, icon: Icon, title, description }) => (
            <button key={tab} type="button" onClick={() => openSettingsModal(tab)} className="kinoma-settings-page__card">
              <span className="kinoma-settings-page__icon"><Icon size={18} /></span>
              <span className="kinoma-settings-page__copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>

        <div className="kinoma-settings-page__note">
          <Sliders size={16} />
          <div>
            <strong>Settings stay local</strong>
            <p>Your playback preferences and library controls are stored in your browser unless a connected account feature explicitly syncs them.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, Play, Plus, Sparkles, Tv, Film, Clapperboard } from 'lucide-react';

type CatalogItem = {
  title: string;
  meta: string;
  kind: 'tv' | 'movie' | 'anime';
  tone: string;
};

const TV_SHOWS: CatalogItem[] = [
  { title: 'Midnight Stories', meta: 'Drama • 8 episodes', kind: 'tv', tone: 'rose' },
  { title: 'Tiny Worlds', meta: 'Comedy • 10 episodes', kind: 'tv', tone: 'violet' },
  { title: 'Afterglow', meta: 'Mystery • 6 episodes', kind: 'tv', tone: 'blue' },
  { title: 'The Last Station', meta: 'Thriller • 9 episodes', kind: 'tv', tone: 'amber' },
];

const MOVIES: CatalogItem[] = [
  { title: 'Neon Skies', meta: '2h 04m • Sci-Fi', kind: 'movie', tone: 'blue' },
  { title: 'Little Moon', meta: '1h 42m • Romance', kind: 'movie', tone: 'rose' },
  { title: 'Paper Kingdom', meta: '1h 56m • Fantasy', kind: 'movie', tone: 'amber' },
  { title: 'After Midnight', meta: '1h 48m • Mystery', kind: 'movie', tone: 'violet' },
];

const ANIME: CatalogItem[] = [
  { title: 'Anime Placeholder', meta: 'Anime • Ready for API', kind: 'anime', tone: 'pink' },
  { title: 'Anime Placeholder', meta: 'Anime • Ready for API', kind: 'anime', tone: 'blue' },
  { title: 'Anime Placeholder', meta: 'Anime • Ready for API', kind: 'anime', tone: 'violet' },
  { title: 'Anime Placeholder', meta: 'Anime • Ready for API', kind: 'anime', tone: 'amber' },
];

const toneClass: Record<string, string> = {
  rose: 'is-rose',
  violet: 'is-violet',
  blue: 'is-blue',
  amber: 'is-amber',
  pink: 'is-pink',
};

function SectionIcon({ kind }: { kind: CatalogItem['kind'] }) {
  if (kind === 'movie') return <Film size={16} strokeWidth={1.8} />;
  if (kind === 'anime') return <Sparkles size={16} strokeWidth={1.8} />;
  return <Tv size={16} strokeWidth={1.8} />;
}

function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <article className={`kinoma-catalog-card ${toneClass[item.tone] || ''}`}>
      <div className="kinoma-catalog-card__art" aria-hidden="true">
        <span className="kinoma-catalog-card__shine" />
        <span className="kinoma-catalog-card__orb" />
        <span className="kinoma-catalog-card__mini-icon"><SectionIcon kind={item.kind} /></span>
      </div>
      <div className="kinoma-catalog-card__copy">
        <h3>{item.title}</h3>
        <p>{item.meta}</p>
      </div>
    </article>
  );
}

function CatalogSection({
  title,
  subtitle,
  items,
  kind,
}: {
  title: string;
  subtitle: string;
  items: CatalogItem[];
  kind: CatalogItem['kind'];
}) {
  return (
    <section className="kinoma-home-section" aria-labelledby={`kinoma-${kind}-heading`}>
      <div className="kinoma-home-section__heading">
        <div>
          <div className="kinoma-home-section__eyebrow"><SectionIcon kind={kind} /> {kind === 'tv' ? 'Series' : kind === 'movie' ? 'Cinema' : 'Anime'}</div>
          <h2 id={`kinoma-${kind}-heading`}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="kinoma-home-section__link" type="button" aria-label={`See all ${title}`}>
          See all <ArrowRight size={15} />
        </button>
      </div>
      <div className="kinoma-catalog-grid">
        {items.map((item, index) => <CatalogCard key={`${item.title}-${index}`} item={item} />)}
      </div>
    </section>
  );
}

function ThreeDButton({
  children,
  secondary = false,
}: {
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href="/search"
      className={`kinoma-3d-button ${secondary ? 'kinoma-3d-button--secondary' : ''}`}
    >
      <span className="kinoma-3d-button__face">{children}</span>
      <span className="kinoma-3d-button__depth" aria-hidden="true" />
    </Link>
  );
}

export function Home() {
  return (
    <div className="kinoma-home">
      <div className="kinoma-home__inner">
        <section className="kinoma-home-hero" aria-labelledby="kinoma-home-title">
          <div className="kinoma-home-hero__copy">
            <div className="kinoma-home-hero__eyebrow">
              <Sparkles size={14} /> YOUR SCREEN, YOUR MOOD
            </div>
            <h1 id="kinoma-home-title">Something good<br /><span>is waiting.</span></h1>
            <p>
              A softer place for movies, TV shows, and anime. Pick something fun,
              press play, and settle in.
            </p>
            <div className="kinoma-home-hero__actions">
              <ThreeDButton><Play size={16} fill="currentColor" /> Play Now</ThreeDButton>
              <ThreeDButton secondary><Plus size={16} /> Continue Watching</ThreeDButton>
            </div>
          </div>

          <div className="kinoma-home-hero__banner" role="img" aria-label="Kinoma banner placeholder">
            <div className="kinoma-home-hero__banner-grid" />
            <div className="kinoma-home-hero__banner-glow" />
            <div className="kinoma-home-hero__banner-copy">
              <span>FEATURED BANNER</span>
              <strong>Your artwork<br />goes here.</strong>
              <small>21:9 cinematic safe area</small>
            </div>
            <div className="kinoma-home-hero__banner-film" aria-hidden="true">
              <Clapperboard size={28} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <div className="kinoma-home__divider" />

        <CatalogSection
          title="TV Shows"
          subtitle="Easy-going series for your next little binge."
          items={TV_SHOWS}
          kind="tv"
        />

        <CatalogSection
          title="Movies"
          subtitle="A clean shelf for your next movie night."
          items={MOVIES}
          kind="movie"
        />

        <CatalogSection
          title="Anime"
          subtitle="Placeholder shelf — ready for the new anime source later."
          items={ANIME}
          kind="anime"
        />
      </div>
    </div>
  );
}

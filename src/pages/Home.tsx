import React from 'react';
import { Link } from 'wouter';
import { KinomaLogo } from '../components/ui/KinomaLogo';
import {
  ArrowRight,
  Clapperboard,
  Film,
  Github,
  Instagram,
  Play,
  Plus,
  Sparkles,
  Tv,
  Youtube,
} from 'lucide-react';

type RailKind = 'recommended' | 'trending' | 'latest' | 'popular' | 'airing' | 'tv' | 'movie' | 'anime';

type RailItem = {
  title: string;
  meta: string;
  tone: string;
  kind: RailKind;
};

const RAILS: Record<Exclude<RailKind, 'recommended'>, RailItem[]> = {
  trending: [
    { title: 'Midnight Stories', meta: 'Drama • 8 episodes', tone: 'rose', kind: 'trending' },
    { title: 'Neon Skies', meta: 'Sci-Fi • 2h 04m', tone: 'blue', kind: 'trending' },
    { title: 'Afterglow', meta: 'Mystery • 6 episodes', tone: 'violet', kind: 'trending' },
    { title: 'Paper Kingdom', meta: 'Fantasy • 1h 56m', tone: 'amber', kind: 'trending' },
    { title: 'Little Moon', meta: 'Romance • 1h 42m', tone: 'pink', kind: 'trending' },
    { title: 'The Last Station', meta: 'Thriller • 9 episodes', tone: 'slate', kind: 'trending' },
  ],
  latest: [
    { title: 'First Light', meta: 'New • TV Series', tone: 'blue', kind: 'latest' },
    { title: 'Soft Static', meta: 'New • Movie', tone: 'violet', kind: 'latest' },
    { title: 'Northbound', meta: 'New • TV Series', tone: 'rose', kind: 'latest' },
    { title: 'Sunday Cinema', meta: 'New • Movie', tone: 'amber', kind: 'latest' },
    { title: 'Golden Hour', meta: 'New • Series', tone: 'pink', kind: 'latest' },
    { title: 'Signal 09', meta: 'New • Movie', tone: 'slate', kind: 'latest' },
  ],
  popular: [
    { title: 'After Midnight', meta: 'Mystery • Movie', tone: 'violet', kind: 'popular' },
    { title: 'Tiny Worlds', meta: 'Comedy • Series', tone: 'rose', kind: 'popular' },
    { title: 'Neon Skies', meta: 'Sci-Fi • Movie', tone: 'blue', kind: 'popular' },
    { title: 'The Last Station', meta: 'Thriller • Series', tone: 'amber', kind: 'popular' },
    { title: 'Little Moon', meta: 'Romance • Movie', tone: 'pink', kind: 'popular' },
    { title: 'Paper Kingdom', meta: 'Fantasy • Movie', tone: 'slate', kind: 'popular' },
  ],
  airing: [
    { title: 'Tonight at 8', meta: 'Airing soon • Series', tone: 'rose', kind: 'airing' },
    { title: 'Blue Hour', meta: 'Airing today • Series', tone: 'blue', kind: 'airing' },
    { title: 'Afterglow', meta: 'Airing today • Series', tone: 'violet', kind: 'airing' },
    { title: 'Late Shift', meta: 'Airing tomorrow • Series', tone: 'amber', kind: 'airing' },
    { title: 'Open Skies', meta: 'Airing • Series', tone: 'pink', kind: 'airing' },
    { title: 'Northbound', meta: 'Airing • Series', tone: 'slate', kind: 'airing' },
  ],
  tv: [
    { title: 'Midnight Stories', meta: 'Drama • 8 episodes', tone: 'rose', kind: 'tv' },
    { title: 'Tiny Worlds', meta: 'Comedy • 10 episodes', tone: 'violet', kind: 'tv' },
    { title: 'Afterglow', meta: 'Mystery • 6 episodes', tone: 'blue', kind: 'tv' },
    { title: 'The Last Station', meta: 'Thriller • 9 episodes', tone: 'amber', kind: 'tv' },
    { title: 'Golden Hour', meta: 'Drama • 7 episodes', tone: 'pink', kind: 'tv' },
    { title: 'Northbound', meta: 'Adventure • 12 episodes', tone: 'slate', kind: 'tv' },
  ],
  movie: [
    { title: 'Neon Skies', meta: 'Sci-Fi • 2h 04m', tone: 'blue', kind: 'movie' },
    { title: 'Little Moon', meta: 'Romance • 1h 42m', tone: 'rose', kind: 'movie' },
    { title: 'Paper Kingdom', meta: 'Fantasy • 1h 56m', tone: 'amber', kind: 'movie' },
    { title: 'After Midnight', meta: 'Mystery • 1h 48m', tone: 'violet', kind: 'movie' },
    { title: 'Sunday Cinema', meta: 'Drama • 1h 51m', tone: 'pink', kind: 'movie' },
    { title: 'Soft Static', meta: 'Thriller • 2h 01m', tone: 'slate', kind: 'movie' },
  ],
  anime: [
    { title: 'Anime Placeholder', meta: 'Anime • API disconnected', tone: 'pink', kind: 'anime' },
    { title: 'Anime Placeholder', meta: 'Anime • API disconnected', tone: 'blue', kind: 'anime' },
    { title: 'Anime Placeholder', meta: 'Anime • API disconnected', tone: 'violet', kind: 'anime' },
    { title: 'Anime Placeholder', meta: 'Anime • API disconnected', tone: 'amber', kind: 'anime' },
    { title: 'Anime Placeholder', meta: 'Anime • API disconnected', tone: 'rose', kind: 'anime' },
    { title: 'Anime Placeholder', meta: 'Anime • API disconnected', tone: 'slate', kind: 'anime' },
  ],
};

const RECOMMENDED: RailItem[] = [
  { title: 'A Little Afterglow', meta: 'Because you like mysteries', tone: 'rose', kind: 'recommended' },
  { title: 'Neon Skies', meta: 'Picked for your next movie night', tone: 'blue', kind: 'recommended' },
  { title: 'Tiny Worlds', meta: 'A cozy series for you', tone: 'violet', kind: 'recommended' },
  { title: 'Paper Kingdom', meta: 'A fantasy you may enjoy', tone: 'amber', kind: 'recommended' },
];

const RAIL_META: Record<Exclude<RailKind, 'recommended'>, { title: string; eyebrow: string; subtitle: string }> = {
  trending: { title: 'Trending now', eyebrow: 'In the spotlight', subtitle: 'The titles everyone is talking about.' },
  latest: { title: 'Latest', eyebrow: 'Fresh arrivals', subtitle: 'New shelves, new stories, ready to discover.' },
  popular: { title: 'Popular', eyebrow: 'Crowd favourites', subtitle: 'The most-loved picks on the shelf.' },
  airing: { title: 'Airing', eyebrow: 'Right now', subtitle: 'Keep up with what is coming next.' },
  tv: { title: 'TV Series', eyebrow: 'Series', subtitle: 'Longer stories made for your next binge.' },
  movie: { title: 'Movies', eyebrow: 'Cinema', subtitle: 'One sitting. One story. Movie night starts here.' },
  anime: { title: 'Anime', eyebrow: 'Placeholder shelf', subtitle: 'Ready for the future MovieApi connection.' },
};

const toneClass: Record<string, string> = {
  rose: 'is-rose',
  violet: 'is-violet',
  blue: 'is-blue',
  amber: 'is-amber',
  pink: 'is-pink',
  slate: 'is-slate',
};

function KindIcon({ kind }: { kind: RailKind }) {
  if (kind === 'movie') return <Film size={16} strokeWidth={1.8} />;
  if (kind === 'anime') return <Sparkles size={16} strokeWidth={1.8} />;
  return <Tv size={16} strokeWidth={1.8} />;
}

function RailCard({ item }: { item: RailItem }) {
  const contentType = item.kind === 'anime' ? 'anime' : /movie/i.test(item.meta) ? 'movie' : 'series';
  return (
    <Link href={`/details/${encodeURIComponent(item.title)}?type=${contentType}`} className={`kinoma-rail-card ${toneClass[item.tone] || ''}`} aria-label={`Open ${item.title}`}>
      <div className="kinoma-rail-card__art" aria-hidden="true">
        <span className="kinoma-rail-card__orb kinoma-rail-card__orb--one" />
        <span className="kinoma-rail-card__orb kinoma-rail-card__orb--two" />
        <span className="kinoma-rail-card__shine" />
        <span className="kinoma-rail-card__icon"><KindIcon kind={item.kind} /></span>
        <span className="kinoma-rail-card__badge">{item.kind === 'anime' ? 'Soon' : 'KINOMA'}</span>
      </div>
      <div className="kinoma-rail-card__copy">
        <h3>{item.title}</h3>
        <p>{item.meta}</p>
      </div>
    </Link>
  );
}

function ContentRail({
  kind,
  items,
}: {
  kind: Exclude<RailKind, 'recommended'>;
  items: RailItem[];
}) {
  const meta = RAIL_META[kind];
  return (
    <section className="kinoma-home-section" aria-labelledby={`kinoma-${kind}-heading`}>
      <div className="kinoma-home-section__heading">
        <div>
          <div className="kinoma-home-section__eyebrow"><KindIcon kind={kind} /> {meta.eyebrow}</div>
          <h2 id={`kinoma-${kind}-heading`}>{meta.title}</h2>
          <p>{meta.subtitle}</p>
        </div>
        <Link href="/search" className="kinoma-home-section__link">
          See all <ArrowRight size={15} />
        </Link>
      </div>
      <div className="kinoma-rail" tabIndex={0} aria-label={meta.title}>
        {items.map((item, index) => <RailCard key={`${kind}-${item.title}-${index}`} item={item} />)}
      </div>
    </section>
  );
}

function RecommendedSection() {
  return (
    <section className="kinoma-recommended" aria-labelledby="kinoma-recommended-heading">
      <div className="kinoma-recommended__glow" aria-hidden="true" />
      <div className="kinoma-recommended__heading">
        <div>
          <div className="kinoma-home-section__eyebrow"><Sparkles size={16} /> Made for you</div>
          <h2 id="kinoma-recommended-heading">Recommended for you</h2>
          <p>Personalised shelves will plug into your profile once MovieApi is connected.</p>
        </div>
        <span className="kinoma-recommended__signal">PERSONAL PICKS</span>
      </div>
      <div className="kinoma-recommended__grid">
        {RECOMMENDED.map((item, index) => (
          <RailCard key={`recommended-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function ThreeDButton({ children, secondary = false }: { children: React.ReactNode; secondary?: boolean }) {
  return (
    <Link href={secondary ? '/library' : '/search'} className={`kinoma-3d-button ${secondary ? 'kinoma-3d-button--secondary' : ''}`}>
      <span className="kinoma-3d-button__face">{children}</span>
      <span className="kinoma-3d-button__depth" aria-hidden="true" />
    </Link>
  );
}

export function Home() {
  return (
    <div className="kinoma-home">
      <div className="kinoma-home__ambient" aria-hidden="true">
        <span className="kinoma-home__ambient-orb kinoma-home__ambient-orb--one" />
        <span className="kinoma-home__ambient-orb kinoma-home__ambient-orb--two" />
      </div>

      <div className="kinoma-home__inner">
        <section className="kinoma-home-hero" aria-labelledby="kinoma-home-title">
          <div className="kinoma-home-hero__copy">
            <div className="kinoma-home-hero__eyebrow"><Sparkles size={14} /> YOUR SCREEN, YOUR MOOD</div>
            <h1 id="kinoma-home-title">Something good<br /><span>is waiting.</span></h1>
            <p>A softer place for movies, TV shows, and anime. Pick something fun, press play, and settle in.</p>
            <div className="kinoma-home-hero__actions">
              <ThreeDButton><Play size={16} fill="currentColor" /> Play Now</ThreeDButton>
              <ThreeDButton secondary><Plus size={16} /> Continue Watching</ThreeDButton>
            </div>
          </div>

          <div className="kinoma-home-hero__banner" role="img" aria-label="Kinoma featured banner placeholder">
            <div className="kinoma-home-hero__banner-grid" />
            <div className="kinoma-home-hero__banner-glow" />
            <div className="kinoma-home-hero__banner-copy">
              <span>FEATURED BANNER</span>
              <strong>Your artwork<br />goes here.</strong>
              <small>21:9 cinematic safe area</small>
            </div>
            <div className="kinoma-home-hero__banner-film" aria-hidden="true"><Clapperboard size={28} strokeWidth={1.5} /></div>
          </div>
        </section>

        <RecommendedSection />

        <ContentRail kind="trending" items={RAILS.trending} />
        <ContentRail kind="latest" items={RAILS.latest} />
        <ContentRail kind="popular" items={RAILS.popular} />
        <div className="kinoma-home-pair">
          <ContentRail kind="tv" items={RAILS.tv.slice(0, 4)} />
          <ContentRail kind="movie" items={RAILS.movie.slice(0, 4)} />
        </div>

        <footer className="kinoma-home-footer">
          <div className="kinoma-home-footer__art" aria-hidden="true">
            <div className="kinoma-home-footer__halo" />
            <div className="kinoma-home-footer__orbit kinoma-home-footer__orbit--one" />
            <div className="kinoma-home-footer__orbit kinoma-home-footer__orbit--two" />
            <div className="kinoma-home-footer__orbit kinoma-home-footer__orbit--three" />
            <div className="kinoma-home-footer__core">
              <span className="kinoma-home-footer__core-glow" />
              <KinomaLogo size="md" variant="mark" className="kinoma-home-footer__mark" />
            </div>
            <div className="kinoma-home-footer__spark kinoma-home-footer__spark--one">✦</div>
            <div className="kinoma-home-footer__spark kinoma-home-footer__spark--two">·</div>
          </div>
          <div className="kinoma-home-footer__content">
            <div className="kinoma-home-footer__brand">
              <div className="kinoma-home-footer__logo" aria-label="Kinoma">
                <KinomaLogo size="lg" variant="full" />
              </div>
              <p>Stories, shelves and little moments worth pressing play for.</p>
            </div>
            <div className="kinoma-home-footer__links">
              <div><span>Explore</span><Link href="/home">Home</Link><Link href="/search">Search</Link><Link href="/library">My List</Link></div>
              <div><span>Kinoma</span><Link href="/about">About</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div>
              <div><span>Follow</span><a href="https://github.com/titan717/Kinoma" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a><a href="#" aria-label="Kinoma Instagram"><Instagram size={15} /> Instagram</a><a href="#" aria-label="Kinoma YouTube"><Youtube size={15} /> YouTube</a></div>
            </div>
          </div>
          <div className="kinoma-home-footer__bottom">
            <span>© 2026 Kinoma</span>
            <span>Built for the next watch.</span>
            <Link href="/contact">Contact / Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

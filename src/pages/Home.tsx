import React from 'react';
import { Link } from 'wouter';
import { KinomaLogo } from '../components/ui/KinomaLogo';
import { ArrowRight, Clapperboard, Film, Github, Instagram, Play, Plus, Sparkles, Tv, Youtube } from 'lucide-react';

type RailKind = 'trending' | 'latest' | 'popular' | 'tv' | 'movie' | 'anime';

type RailItem = {
  title: string;
  meta: string;
  tone: string;
  kind: RailKind;
};

const RAILS: Record<RailKind, RailItem[]> = {
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
  anime: [],
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
  if (kind === 'movie') return <Film size={15} strokeWidth={1.8} />;
  if (kind === 'anime') return <Sparkles size={15} strokeWidth={1.8} />;
  return <Tv size={15} strokeWidth={1.8} />;
}

function RailCard({ item }: { item: RailItem }) {
  const contentType = /movie/i.test(item.meta) ? 'movie' : 'series';

  return (
    <Link
      href={`/details/${encodeURIComponent(item.title)}?type=${contentType}`}
      className={`kinoma-rail-card ${toneClass[item.tone] || ''}`}
      aria-label={`Open ${item.title}`}
    >
      <div className="kinoma-rail-card__art" aria-hidden="true">
        <span className="kinoma-rail-card__orb kinoma-rail-card__orb--one" />
        <span className="kinoma-rail-card__orb kinoma-rail-card__orb--two" />
        <span className="kinoma-rail-card__shine" />
        <span className="kinoma-rail-card__icon"><KindIcon kind={item.kind} /></span>
        <span className="kinoma-rail-card__badge">KINOMA</span>
      </div>
      <div className="kinoma-rail-card__copy">
        <h3>{item.title}</h3>
        <p>{item.meta}</p>
      </div>
    </Link>
  );
}

function ContentRail({ kind, title, items }: { kind: RailKind; title: string; items: RailItem[] }) {
  if (!items.length) return null;

  return (
    <section className="kinoma-home-section" aria-labelledby={`kinoma-${kind}-heading`}>
      <div className="kinoma-home-section__heading">
        <div>
          <div className="kinoma-home-section__eyebrow"><KindIcon kind={kind} /> {kind === 'trending' ? 'For tonight' : kind === 'latest' ? 'Fresh' : kind === 'popular' ? 'Most watched' : kind === 'tv' ? 'Series' : 'Cinema'}</div>
          <h2 id={`kinoma-${kind}-heading`}>{title}</h2>
        </div>
        <Link href="/search" className="kinoma-home-section__link">See all <ArrowRight size={14} /></Link>
      </div>

      <div className="kinoma-rail" tabIndex={0} aria-label={title}>
        {items.map((item, index) => <RailCard key={`${kind}-${item.title}-${index}`} item={item} />)}
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
    <main className="kinoma-home">
      <div className="kinoma-home__ambient" aria-hidden="true">
        <span className="kinoma-home__ambient-orb kinoma-home__ambient-orb--one" />
        <span className="kinoma-home__ambient-orb kinoma-home__ambient-orb--two" />
      </div>

      <div className="kinoma-home__inner">
        <section className="kinoma-home-hero" aria-labelledby="kinoma-home-title">
          <div className="kinoma-home-hero__copy">
            <div className="kinoma-home-hero__eyebrow"><Sparkles size={14} /> YOUR NEXT WATCH</div>
            <h1 id="kinoma-home-title">Something good<br /><span>is waiting.</span></h1>
            <p>Movies, series and stories worth pressing play for. Discover something, save it, and come back whenever you like.</p>
            <div className="kinoma-home-hero__actions">
              <ThreeDButton><Play size={16} fill="currentColor" /> Explore</ThreeDButton>
              <ThreeDButton secondary><Plus size={16} /> My List</ThreeDButton>
            </div>
          </div>

          <div className="kinoma-home-hero__banner" role="img" aria-label="Kinoma featured artwork placeholder">
            <div className="kinoma-home-hero__banner-grid" />
            <div className="kinoma-home-hero__banner-glow" />
            <div className="kinoma-home-hero__banner-copy">
              <span>FEATURED</span>
              <strong>Your artwork<br />goes here.</strong>
              <small>API-ready cinematic space</small>
            </div>
            <div className="kinoma-home-hero__banner-film" aria-hidden="true"><Clapperboard size={28} strokeWidth={1.5} /></div>
          </div>
        </section>

        <ContentRail kind="trending" title="Trending now" items={RAILS.trending} />
        <ContentRail kind="latest" title="New on Kinoma" items={RAILS.latest} />
        <ContentRail kind="popular" title="Popular right now" items={RAILS.popular} />

        <section className="kinoma-home-section kinoma-home-section--split" aria-label="Browse by format">
          <div className="kinoma-home-section__heading">
            <div>
              <div className="kinoma-home-section__eyebrow"><Tv size={15} /> Browse</div>
              <h2>Pick your format</h2>
            </div>
            <Link href="/search" className="kinoma-home-section__link">Discover <ArrowRight size={14} /></Link>
          </div>
          <div className="kinoma-home-format-grid">
            <Link href="/search?keyword=series" className="kinoma-home-format-card kinoma-home-format-card--series">
              <Tv size={22} />
              <span>TV Series</span>
              <small>Stories made for a binge.</small>
            </Link>
            <Link href="/search?keyword=movie" className="kinoma-home-format-card kinoma-home-format-card--movie">
              <Film size={22} />
              <span>Movies</span>
              <small>One story. One sitting.</small>
            </Link>
          </div>
        </section>

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
              <div className="kinoma-home-footer__logo" aria-label="Kinoma"><KinomaLogo size="lg" variant="full" /></div>
              <p>Stories, shelves and little moments worth pressing play for.</p>
            </div>
            <div className="kinoma-home-footer__links">
              <div><span>Explore</span><Link href="/home">Home</Link><Link href="/search">Search</Link><Link href="/library">My List</Link></div>
              <div><span>Kinoma</span><Link href="/about">About</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div>
              <div><span>Follow</span><a href="https://github.com/titan717/Kinoma" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a><a href="#" aria-label="Kinoma Instagram"><Instagram size={15} /> Instagram</a><a href="#" aria-label="Kinoma YouTube"><Youtube size={15} /> YouTube</a></div>
            </div>
          </div>
          <div className="kinoma-home-footer__bottom">
            <span>© 2026 Kinoma</span><span>Built for the next watch.</span><Link href="/contact">Contact / Support</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { KinomaLogo } from '../components/ui/KinomaLogo';
import { ArrowRight, Clapperboard, Film, Github, Instagram, Play, Plus, Sparkles, Tv, Youtube } from 'lucide-react';
import { api, MovieApiError, MovieApiMedia } from '../lib/api';
import { libraryManager } from '../lib/library';
import { ModernContinueWatching } from '../components/ui/modern/ModernContinueWatching';

type RailKind = 'trending' | 'latest' | 'popular' | 'tv' | 'movie';

function KindIcon({ kind }: { kind: RailKind }) {
  if (kind === 'movie') return <Film size={15} strokeWidth={1.8} />;
  if (kind === 'trending') return <Sparkles size={15} strokeWidth={1.8} />;
  return <Tv size={15} strokeWidth={1.8} />;
}

function trailerSrc(url: unknown, soundEnabled = false) {
  if (typeof url !== 'string' || !url) return '';
  try {
    const parsed = new URL(url);
    const isYouTube = /(^|\.)youtube(?:-nocookie)?\.com$/.test(parsed.hostname) || parsed.hostname === 'youtu.be';
    parsed.searchParams.set('autoplay', '1');
    parsed.searchParams.set('mute', soundEnabled ? '0' : '1');
    parsed.searchParams.set('playsinline', '1');
    parsed.searchParams.set('controls', '0');
    parsed.searchParams.set('disablekb', '1');
    parsed.searchParams.set('fs', '0');
    parsed.searchParams.set('iv_load_policy', '3');
    parsed.searchParams.set('rel', '0');
    if (isYouTube) {
      parsed.searchParams.set('enablejsapi', '1');
      parsed.searchParams.set('origin', window.location.origin);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function RailCard({ item }: { item: MovieApiMedia }) {
  const kind = item.type === 'movie' ? 'movie' : 'tv';
  return (
    <Link href={`/details/${encodeURIComponent(item.id)}?type=${kind === 'movie' ? 'movie' : 'series'}`} className="kinoma-rail-card" aria-label={`Open ${item.title}`}>
      <div className="kinoma-rail-card__art" aria-hidden="true">
        {(item.backdrop || item.poster) ? <img src={(item.backdrop || item.poster) as string} alt="" loading="lazy" decoding="async" /> : <span className="kinoma-rail-card__orb kinoma-rail-card__orb--one" />}
        <span className="kinoma-rail-card__shine" />
      </div>
      <div className="kinoma-rail-card__copy">
        <h3>{item.title}</h3>
        <p>{[item.year, item.rating ? `★ ${item.rating}` : null, ...(item.genres || []).slice(0, 1)].filter(Boolean).join(' • ') || 'MovieApi'}</p>
      </div>
    </Link>
  );
}

function ContentRail({ kind, title, items }: { kind: RailKind; title: string; items: MovieApiMedia[] }) {
  if (!items.length) return null;
  return (
    <section className="kinoma-home-section" aria-labelledby={`kinoma-${kind}-heading`}>
      <div className="kinoma-home-section__heading">
        <div>
          <div className="kinoma-home-section__eyebrow"><KindIcon kind={kind} /> {kind === 'trending' ? 'For tonight' : kind === 'latest' ? 'Fresh' : 'Most watched'}</div>
          <h2 id={`kinoma-${kind}-heading`}>{title}</h2>
        </div>
        <Link href="/search" className="kinoma-home-section__link">See all <ArrowRight size={14} /></Link>
      </div>
      <div className="kinoma-rail" tabIndex={0} aria-label={title}>
        {items.slice(0, 4).map((item, index) => <RailCard key={`${kind}-${item.id}-${index}`} item={item} />)}
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
  const [home, setHome] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [trailer, setTrailer] = useState<any>(null);
  const [isInList, setIsInList] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [trailerReady, setTrailerReady] = useState(false);
  const trailerFrameRef = useRef<HTMLIFrameElement | null>(null);
  const pandaSecretBuffer = useRef('');
  const pandaSecretTimer = useRef<number | null>(null);
  const pandaTapCount = useRef(0);
  const [pandaSecret, setPandaSecret] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getHome()
      .then(async data => { if (!active) return; setHome(data); if (data?.featured?.id) { const result = await api.getTrailer(data.featured.id).catch(() => ({ available: false, trailer: null })); if (active) setTrailer(result); } })
      .catch((err: unknown) => active && setError(err instanceof MovieApiError ? err.message : 'MovieApi is unavailable right now.'));
    return () => { active = false; };
  }, []);

  const featured = home?.featured as MovieApiMedia | null | undefined;
  const sections = home?.sections;
  const trending = sections?.trending || [];
  const featuredType = featured?.type === 'movie' ? 'movie' : 'series';
  const featuredWatchUrl = featured?.id ? '/watch/' + encodeURIComponent(featured.id) + '?type=' + featuredType : '/search';
  const enableTrailerSound = () => {
    setSoundEnabled(true);
    window.setTimeout(() => {
      const frame = trailerFrameRef.current;
      if (!frame?.contentWindow) return;
      try {
        const origin = new URL(frame.src).origin;
        const message = JSON.stringify({ event: 'command', func: 'unMute', args: [] });
        frame.contentWindow.postMessage(message, origin);
        frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), origin);
      } catch {
        // The normal iframe URL remains the source of truth for non-YouTube trailers.
      }
    }, 120);
  };
  const toggleFeaturedList = () => { if (featured) setIsInList(libraryManager.toggleWatchlist({ id: featured.id, title: featured.title, image: featured.poster || '' })); };
  useEffect(() => {
    setTrailerReady(false);
    setSoundEnabled(false);
    if (featured?.id) setIsInList(libraryManager.isInWatchlist(featured.id));
  }, [featured?.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.length !== 1) return;
      pandaSecretBuffer.current = (pandaSecretBuffer.current + event.key.toLowerCase()).slice(-12);
      if (pandaSecretBuffer.current.endsWith('panda')) {
        setPandaSecret('🐼 You found the sleepy panda den.');
        pandaSecretBuffer.current = '';
        if (pandaSecretTimer.current) window.clearTimeout(pandaSecretTimer.current);
        pandaSecretTimer.current = window.setTimeout(() => setPandaSecret(null), 3600);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (pandaSecretTimer.current) window.clearTimeout(pandaSecretTimer.current);
    };
  }, []);

  const wakePanda = () => {
    pandaTapCount.current += 1;
    if (pandaTapCount.current >= 3) {
      setPandaSecret('🌿 The panda noticed you. Keep browsing.');
      pandaTapCount.current = 0;
      if (pandaSecretTimer.current) window.clearTimeout(pandaSecretTimer.current);
      pandaSecretTimer.current = window.setTimeout(() => setPandaSecret(null), 3600);
    }
  };

  return (
    <main className="kinoma-home">
      <div className="kinoma-home__ambient" aria-hidden="true"><span className="kinoma-home__ambient-orb kinoma-home__ambient-orb--one" /><span className="kinoma-home__ambient-orb kinoma-home__ambient-orb--two" /></div>
      <div className="kinoma-home__inner">
        <section className="kinoma-home-hero kinoma-home-hero--trailer" aria-labelledby="kinoma-home-title">
          <div className="kinoma-home-hero__trailer-bg" aria-label={featured?.title ? featured.title + ' trailer' : 'Featured trailer'}>
            {featured?.backdrop && <img src={featured.backdrop} alt="" className="kinoma-home-hero__banner-image kinoma-home-hero__banner-image--underlay" loading="eager" fetchPriority="high" decoding="async" />}
            {trailer?.trailer?.embedUrl ? <iframe ref={trailerFrameRef} src={trailerSrc(trailer.trailer.embedUrl, soundEnabled)} title={featured?.title ? featured.title + ' trailer' : 'Featured trailer'} className={`kinoma-home-hero__trailer-video${trailerReady ? ' is-ready' : ''}`} onLoad={() => setTrailerReady(true)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : featured?.backdrop ? <img src={featured.backdrop} alt="" className="kinoma-home-hero__banner-image" loading="eager" fetchPriority="high" decoding="async" /> : <div className="kinoma-home-hero__banner-grid" />}
            <div className="kinoma-home-hero__trailer-shade" />
          </div>
          <div className="kinoma-home-hero__copy">
            <button type="button" className="kinoma-home-hero__eyebrow panda-secret-trigger" onClick={wakePanda}><Sparkles size={14} /> YOUR NEXT WATCH</button>
            <h1 id="kinoma-home-title">{featured?.title || 'Something good is waiting.'}</h1>
            <p>{featured?.overview || error || 'Movies, series and stories worth pressing play for. Discover something, save it, and come back whenever you like.'}</p>
            <div className="kinoma-home-hero__actions">
              <Link href={featuredWatchUrl} className="kinoma-3d-button"><span className="kinoma-3d-button__face"><Play size={16} fill="currentColor" /> Watch Now</span><span className="kinoma-3d-button__depth" aria-hidden="true" /></Link>
              <button type="button" onClick={toggleFeaturedList} className={"kinoma-3d-button kinoma-3d-button--secondary" + (isInList ? " is-added" : "")}><span className="kinoma-3d-button__face">{isInList ? <><span>✓</span> In My List</> : <><Plus size={16} /> Add to My List</>}</span><span className="kinoma-3d-button__depth" aria-hidden="true" /></button>
            </div>
          </div>
        </section>

        {trailer?.trailer?.embedUrl && !soundEnabled && (
          <div className="kinoma-sound-permission" role="dialog" aria-modal="false" aria-label="Enable trailer sound">
            <div className="kinoma-sound-permission__panel">
              <span>TRAILER SOUND</span>
              <strong>Turn sound on?</strong>
              <p>Allow Kinoma to play the featured trailer with sound.</p>
              <button type="button" onClick={enableTrailerSound}><span><Play size={15} fill="currentColor" /> Enable sound</span></button>
            </div>
          </div>
        )}

        <ModernContinueWatching />
        {trending.length > 0 && <ContentRail kind="trending" title="Trending today" items={trending} />}
        {sections?.popularMovies?.length > 0 && <ContentRail kind="movie" title="Popular movies" items={sections.popularMovies} />}
        {sections?.popularTv?.length > 0 && <ContentRail kind="tv" title="Popular series" items={sections.popularTv} />}
        {sections?.latestMovies?.length > 0 && <ContentRail kind="movie" title="Fresh movies" items={sections.latestMovies} />}
        {sections?.latestTv?.length > 0 && <ContentRail kind="tv" title="Fresh series" items={sections.latestTv} />}

        <section className="kinoma-home-section kinoma-home-section--split" aria-label="Browse by format">
          <div className="kinoma-home-section__heading"><div><div className="kinoma-home-section__eyebrow"><Tv size={15} /> Browse</div><h2>Pick your format</h2></div><Link href="/search" className="kinoma-home-section__link">Discover <ArrowRight size={14} /></Link></div>
          <div className="kinoma-home-format-grid"><Link href="/search?keyword=series" className="kinoma-home-format-card kinoma-home-format-card--series"><Tv size={22} /><span>TV Series</span><small>Stories made for a binge.</small></Link><Link href="/search?keyword=movie" className="kinoma-home-format-card kinoma-home-format-card--movie"><Film size={22} /><span>Movies</span><small>One story. One sitting.</small></Link></div>
        </section>

        <footer className="kinoma-home-footer">
          <div className="kinoma-home-footer__art" aria-hidden="true"><div className="kinoma-home-footer__halo" /><div className="kinoma-home-footer__orbit kinoma-home-footer__orbit--one" /><div className="kinoma-home-footer__orbit kinoma-home-footer__orbit--two" /><div className="kinoma-home-footer__orbit kinoma-home-footer__orbit--three" /><div className="kinoma-home-footer__core"><span className="kinoma-home-footer__core-glow" /><button type="button" className="kinoma-home-footer__panda-button" onClick={wakePanda} aria-label="Wake the Panda"><KinomaLogo size="md" variant="mark" className="kinoma-home-footer__mark" /></button></div></div>
          <div className="kinoma-home-footer__content"><div className="kinoma-home-footer__brand"><div className="kinoma-home-footer__logo" aria-label="Panda.fun"><KinomaLogo size="lg" variant="full" /></div><p>Stories, shelves and little moments worth pressing play for.</p></div><div className="kinoma-home-footer__links"><div><span>Explore</span><Link href="/home">Home</Link><Link href="/search">Search</Link><Link href="/library">My List</Link></div><div><span>Panda.fun</span><Link href="/about">About</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div><div><span>Follow</span><a href="https://github.com/titan717/Panda.fun" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a><a href="#" aria-label="Panda.fun Instagram"><Instagram size={15} /> Instagram</a><a href="#" aria-label="Panda.fun YouTube"><Youtube size={15} /> YouTube</a></div></div></div>
          <div className="kinoma-home-footer__bottom"><span>© 2026 Panda.fun</span><span>Built for the next watch.</span><Link href="/contact">Contact / Support</Link></div>
        </footer>
      </div>
      {pandaSecret && <div className="panda-easter-egg" role="status" aria-live="polite">{pandaSecret}</div>}
    </main>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Film, Play, Sparkles, Tv } from 'lucide-react';
import { api } from '../lib/api';
import { AnimeItem } from '../types';
import { ModernCard } from '../components/ui/modern/ModernCard';
import { historyUtil, HistoryItem } from '../lib/history';
import { updateSEO } from '../lib/seo';

const titleOf = (item: AnimeItem) =>
  typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || 'Unknown title';

const contentKind = (item: AnimeItem): 'anime' | 'series' | 'movie' => {
  const format = String(item.type || '').toUpperCase();
  return format === 'MOVIE' ? 'movie' : 'series';
};

function Rail({ title, description, items, badge }: { title: string; description?: string; items: AnimeItem[]; badge?: string }) {
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const visible = items.slice(page * pageSize, page * pageSize + pageSize);
  if (!items.length) return null;

  return (
    <section className="kinoma-home__section" aria-labelledby={title.replace(/\s+/g, '-').toLowerCase()}>
      <div className="kinoma-home__section-head">
        <div>
          <div className="kinoma-home__section-kicker">{badge || 'KINOMA COLLECTION'}</div>
          <h2 id={title.replace(/\s+/g, '-').toLowerCase()}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="kinoma-home__rail-controls">
          <Link href="/search" className="kinoma-home__view-all">View all <ArrowRight size={14} /></Link>
          {pages > 1 && (
            <div className="kinoma-home__rail-buttons">
              <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} aria-label={\`Previous \${title}\`}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => setPage((value) => Math.min(pages - 1, value + 1))} disabled={page === pages - 1} aria-label={\`Next \${title}\`}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="kinoma-home__cards">
        {visible.map((item) => (
          <ModernCard
            key={item.id}
            item={item}
            badgeText={badge}
            subText={contentKind(item) === 'movie' ? 'Movie' : item.totalEpisodes ? \`\${item.totalEpisodes} episodes\` : 'Series'}
          />
        ))}
      </div>
    </section>
  );
}

function ContinueWatching({ items }: { items: HistoryItem[] }) {
  if (!items.length) return null;
  return (
    <section className="kinoma-home__continue" aria-labelledby="continue-watching">
      <div className="kinoma-home__section-head">
        <div>
          <div className="kinoma-home__section-kicker">PICK UP WHERE YOU LEFT OFF</div>
          <h2 id="continue-watching">Continue Watching</h2>
          <p>Your progress is kept locally so your next episode is always close.</p>
        </div>
        <Link href="/library" className="kinoma-home__view-all">Library <ArrowRight size={14} /></Link>
      </div>
      <div className="kinoma-home__continue-grid">
        {items.slice(0, 3).map((item) => {
          const episodeId = item.episodeId || \`\${item.animeId}|\${item.episodeNumber}\`;
          const progress = Math.min(100, Math.max(0, item.completionPercentage || 0));
          return (
            <Link key={\`\${item.slug}-\${item.episodeNumber}\`} href={\`/watch/\${encodeURIComponent(episodeId)}\`} className="kinoma-home__continue-card">
              <img src={item.image} alt={item.title} loading="lazy" />
              <div className="kinoma-home__continue-overlay" />
              <div className="kinoma-home__continue-info">
                <span>EP {item.episodeNumber} · S{item.seasonNumber}</span>
                <strong>{item.title}</strong>
                <div className="kinoma-home__progress"><span style={{ width: \`\${progress}%\` }} /></div>
                <div className="kinoma-home__continue-bottom">
                  <small>{Math.round(progress)}% watched</small>
                  <span><Play size={12} fill="currentColor" /> Continue</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function Home() {
  const [trending, setTrending] = useState<AnimeItem[]>([]);
  const [popular, setPopular] = useState<AnimeItem[]>([]);
  const [movies, setMovies] = useState<AnimeItem[]>([]);
  const [airing, setAiring] = useState<AnimeItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updateSEO({ title: 'Home', description: 'Discover anime, series and movies on Kinoma.', type: 'website' });
    const syncHistory = () => setHistory(historyUtil.getHistory().filter((item) => !item.isCompleted).sort((a, b) => b.lastWatchedTime - a.lastWatchedTime));
    syncHistory();

    let mounted = true;
    Promise.allSettled([api.getTrending(), api.getPopular(), api.getMovies(18), api.getAiringToday()]).then((results) => {
      if (!mounted) return;
      const [trend, pop, movie, today] = results;
      setTrending(trend.status === 'fulfilled' ? trend.value.results || [] : []);
      setPopular(pop.status === 'fulfilled' ? pop.value.results || [] : []);
      setMovies(movie.status === 'fulfilled' ? movie.value.results || [] : []);
      setAiring(today.status === 'fulfilled' ? today.value.results || [] : []);
      setLoading(false);
    });

    window.addEventListener('kinoma_progress_update', syncHistory);
    return () => {
      mounted = false;
      window.removeEventListener('kinoma_progress_update', syncHistory);
    };
  }, []);

  const hero = trending[0] || popular[0];
  const series = useMemo(
    () => [...popular, ...trending].filter((item, index, all) => contentKind(item) === 'series' && all.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 18),
    [popular, trending],
  );
  const anime = useMemo(() => airing.length ? airing : trending.filter((item) => contentKind(item) === 'series'), [airing, trending]);

  return (
    <div className="kinoma-home">
      <div className="kinoma-home__content">
        {loading && !hero ? (
          <div className="kinoma-home__loading" aria-label="Loading Kinoma"><div className="kinoma-home__spinner" /></div>
        ) : (
          <>
            {hero && (
              <section className="kinoma-home__hero">
                <img className="kinoma-home__hero-art" src={hero.banner || hero.cover || hero.image} alt="" />
                <div className="kinoma-home__hero-shade" />
                <div className="kinoma-home__hero-copy">
                  <div className="kinoma-home__hero-kicker"><Sparkles size={13} /> FEATURED ON KINOMA</div>
                  <h1>{titleOf(hero)}</h1>
                  <div className="kinoma-home__hero-meta">
                    <span>{hero.type || 'TV'}</span>
                    {hero.releaseDate && <span>{hero.releaseDate}</span>}
                    {hero.rating && <span>★ {hero.rating}</span>}
                    {hero.genres?.slice(0, 2).map((genre) => <span key={genre}>{genre}</span>)}
                  </div>
                  <p>{hero.description?.replace(/<[^>]+>/g, '').slice(0, 240) || 'Start watching on Kinoma.'}</p>
                  <div className="kinoma-home__hero-actions">
                    <Link href={\`/details/\${hero.id}\`} className="kinoma-home__play"><Play size={16} fill="currentColor" /> View title</Link>
                    <Link href="/search" className="kinoma-home__secondary">Explore catalog <ArrowRight size={15} /></Link>
                  </div>
                </div>
              </section>
            )}

            <ContinueWatching items={history} />

            <div className="kinoma-home__layout">
              <main>
                <Rail title="Latest Episodes" description="Fresh episodes and recently updated titles." items={anime} badge="LATEST" />
                <Rail title="Series" description="Long-form stories, seasons and ongoing shows." items={series} badge="SERIES" />
                <Rail title="Movies" description="A dedicated shelf for feature-length anime movies." items={movies} badge="MOVIES" />
                <Rail title="Trending Now" description="Popular titles worth adding to your watchlist." items={trending} badge="TRENDING" />
              </main>

              <aside className="kinoma-home__side">
                <div className="kinoma-home__side-card">
                  <div className="kinoma-home__side-head"><div><span>QUICK DISCOVERY</span><h2>Explore Kinoma</h2></div><Sparkles size={16} /></div>
                  <Link href="/search?keyword=action"><Tv size={16} /> Anime <ArrowRight size={14} /></Link>
                  <Link href="/search?keyword=movie"><Film size={16} /> Movies <ArrowRight size={14} /></Link>
                  <Link href="/library"><Play size={16} /> My Library <ArrowRight size={14} /></Link>
                </div>
                <div className="kinoma-home__side-card kinoma-home__side-card--note">
                  <span>BUILT FOR WHAT COMES NEXT</span>
                  <h3>Anime, movies and series share the same catalog experience.</h3>
                  <p>Kinoma's home rails are content-type aware, so new catalogs can be added without redesigning the shell.</p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

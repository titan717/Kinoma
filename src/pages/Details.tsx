import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Play, Plus, Check, ChevronRight, Film, Tv, Clock3 } from 'lucide-react';
import { api } from '../lib/api';
import { DEFAULT_POSTER, DEFAULT_BANNER } from '../types';
import { libraryManager } from '../lib/library';
import { updateSEO } from '../lib/seo';

type DetailKind = 'movie' | 'series';

type DetailModel = {
  id: string;
  title: string;
  kind: DetailKind;
  year: string;
  rating: string;
  duration: string;
  genres: string[];
  synopsis: string;
  poster: string;
  backdrop: string;
  trailerUrl?: string;
  seasons: Array<{
    number: number;
    episodes: Array<{ number: number; title: string; synopsis: string; image: string }>;
  }>;
};

const PLACEHOLDER_SEASONS = [1, 2, 3];
const PLACEHOLDER_EPISODES = Array.from({ length: 6 }, (_, index) => ({
  number: index + 1,
  title: `Episode ${index + 1}`,
  synopsis: 'Episode synopsis from TVMaze will appear here once MovieApi is connected.',
  image: '',
}));

function normaliseKind(raw: string | null, data: any): DetailKind {
  if (raw === 'movie') return 'movie';
  if (raw === 'series' || raw === 'tv') return 'series';
  return data?.contentType === 'movie' || /movie/i.test(data?.type || '') ? 'movie' : 'series';
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : '';
}

export function Details() {
  const [, params] = useRoute<{ id: string }>('/details/:id');
  const [location, setLocation] = useLocation();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  const queryType = new URLSearchParams(location.split('?')[1] || '').get('type');
  const [data, setData] = useState<any>(null);
  const [trailer, setTrailer] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isInList, setIsInList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getDetails(id).then(result => active && setData(result)).catch(() => active && setData(null));
    api.getTrailer(id).then(result => active && setTrailer(result)).catch(() => active && setTrailer(null));
    return () => { active = false; };
  }, [id]);

  const model: DetailModel = useMemo(() => {
    const title = typeof data?.title === 'string'
      ? data.title
      : data?.title?.english || data?.title?.romaji || id || 'Untitled';
    const kind = normaliseKind(queryType, data);
    const seasons = PLACEHOLDER_SEASONS.map(number => ({
      number,
      episodes: PLACEHOLDER_EPISODES.map(ep => ({ ...ep, image: data?.image || '' })),
    }));
    return {
      id,
      title,
      kind,
      year: data?.releaseDate ? String(data.releaseDate).slice(0, 4) : '2026',
      rating: data?.rating ? String(data.rating) : '—',
      duration: kind === 'movie' ? '2h 04m' : 'Series',
      genres: data?.genres?.length ? data.genres : ['Drama', 'Mystery', 'Adventure'],
      synopsis: cleanText(data?.description) || 'A cinematic synopsis will appear here once the MovieApi connection is active. This space is deliberately shaped for long-form metadata so the API can drop in the real story without another UI rebuild.',
      poster: data?.image || DEFAULT_POSTER,
      backdrop: data?.cover || data?.banner || DEFAULT_BANNER,
      trailerUrl: trailer?.trailer?.embedUrl || trailer?.trailer?.url || trailer?.url || undefined,
      seasons,
    };
  }, [data, id, queryType, trailer]);

  useEffect(() => {
    updateSEO({ title: model.title, description: model.synopsis.slice(0, 160), image: model.poster, type: 'video.tv_show' });
    setIsInList(libraryManager.isInWatchlist(model.id));
  }, [model.title, model.synopsis, model.poster, model.id]);

  const toggleList = () => {
    const added = libraryManager.toggleWatchlist({
      id: model.id,
      title: model.title,
      image: model.poster,
    });
    setIsInList(added);
  };

  const watch = () => {
    if (model.kind === 'movie') {
      setLocation(`/watch/${encodeURIComponent(model.id)}`);
      return;
    }
    setLocation(`/watch/${encodeURIComponent(model.id + '$episode$1')}`);
  };

  return (
    <main className="kinoma-details-page">\n      {loading && <div className="kinoma-details-bottom">Loading metadata from MovieApi…</div>}\n      {error && <div className="kinoma-details-bottom">{error}</div>}
      <section className="kinoma-details-hero kinoma-details-hero--trailer">
        <div className="kinoma-details-hero__trailer-bg" aria-label={`${model.title} trailer preview`}>
          {model.trailerUrl ? (
            <iframe
              src={model.trailerUrl}
              title={`${model.title} trailer`}
              className="kinoma-details-hero__trailer-video"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="kinoma-details-hero__trailer-placeholder">
              <div><Film size={42} /></div>
              <span>TRAILER PREVIEW</span>
              <strong>Trailer will play across the hero</strong>
              <small>MovieApi trailer source placeholder</small>
            </div>
          )}
          <div className="kinoma-details-hero__trailer-shade" />
        </div>

        <div className="kinoma-details-hero__content">

          <div className="kinoma-details-copy">
            <div className="kinoma-details-eyebrow">{model.kind === 'movie' ? <Film size={13} /> : <Tv size={13} />} {model.kind === 'movie' ? 'Movie' : 'TV Series'}</div>
            <h1>{model.title}</h1>
            <div className="kinoma-details-meta">
              <span>{model.year}</span><span>{model.rating === '—' ? 'Preview' : `★ ${model.rating}`}</span><span>{model.duration}</span>
              {model.genres.slice(0, 3).map(g => <span key={g}>{g}</span>)}
            </div>
            <p className="kinoma-details-synopsis">{model.synopsis}</p>
            <div className="kinoma-details-actions">
              <button className="kinoma-details-3d-button kinoma-details-3d-button--watch" onClick={watch}>
                <span><Play size={18} fill="currentColor" /> Watch now</span>
              </button>
              <button className={`kinoma-details-3d-button kinoma-details-3d-button--list ${isInList ? 'is-added' : ''}`} onClick={toggleList}>
                <span>{isInList ? <Check size={18} /> : <Plus size={18} />} {isInList ? 'In My List' : 'Add to My List'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {model.kind === 'series' ? (
        <section className="kinoma-details-section">
          <div className="kinoma-details-section__heading"><div><span>KEEP WATCHING</span><h2>Seasons & Episodes</h2></div><small>{model.seasons.length} seasons</small></div>
          <div className="kinoma-season-tabs">
            {model.seasons.map(season => (
              <button key={season.number} className={selectedSeason === season.number ? 'is-selected' : ''} onClick={() => setSelectedSeason(season.number)}>
                Season {season.number}
              </button>
            ))}
          </div>
          <div className="kinoma-episode-list">
            {model.seasons.find(s => s.number === selectedSeason)?.episodes.map(ep => (
              <button key={ep.number} className="kinoma-episode-card" onClick={() => setLocation(`/watch/${encodeURIComponent(model.id + '$episode$' + ep.number)}`)}>
                <div className="kinoma-episode-art">
                  {ep.image ? <img src={ep.image} alt="" /> : <span><Play size={20} /></span>}
                  <b>EP {ep.number}</b>
                </div>
                <div className="kinoma-episode-copy">
                  <strong>{ep.title}</strong>
                  <p>{ep.synopsis}</p>
                </div>
                <ChevronRight className="kinoma-episode-arrow" size={18} />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="kinoma-details-section">
          <div className="kinoma-details-section__heading"><div><span>KEEP EXPLORING</span><h2>More like this</h2></div><small>Because one movie is never enough.</small></div>
          <div className="kinoma-more-grid">
            {['After Midnight', 'Paper Kingdom', 'Little Moon', 'Neon Skies', 'Sunday Cinema'].map((title, i) => (
              <button key={title} className="kinoma-more-card" onClick={() => setLocation(`/details/${encodeURIComponent(title)}?type=movie`)}>
                <div className={`kinoma-more-card__art tone-${i % 5}`}><Film size={25} /></div>
                <strong>{title}</strong><span>{model.genres[i % model.genres.length]} • Movie</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="kinoma-details-bottom"><Clock3 size={14} /> API-ready placeholders: trailer, episode synopses, genres and recommendations can be filled without changing this layout.</div>
    </main>
  );
}

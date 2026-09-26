import React, { useEffect, useMemo, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, ChevronRight, Film, Pause, Play, Plus, Tv, Volume2, VolumeX } from 'lucide-react';
import { api, MovieApiError } from '../lib/api';
import { libraryManager } from '../lib/library';
import { updateSEO } from '../lib/seo';

type WatchKind = 'movie' | 'series';
type Episode = { id: string; number: number; title?: string; synopsis?: string; image?: string };
type WatchModel = {
  id: string; title: string; kind: WatchKind; synopsis: string; poster: string;
  episodes: Episode[]; seasons: Array<{ number: number; episodes?: Episode[] }>; streamUrl?: string;
};

const placeholderEpisodes = (season: number): Episode[] =>
  Array.from({ length: 6 }, (_, index) => ({
    id: 'episode-' + season + '-' + (index + 1),
    number: index + 1,
    title: 'Episode ' + (index + 1),
    synopsis: 'Episode synopsis from MovieApi / TVMaze will appear here once the content provider is connected.',
    image: '',
  }));

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : '';
}

function detectKind(data: any, query: URLSearchParams): WatchKind {
  const type = query.get('type');
  if (type === 'movie') return 'movie';
  if (type === 'series' || type === 'tv') return 'series';
  return data?.contentType === 'movie' || /movie/i.test(data?.type || '') ? 'movie' : 'series';
}

function parseWatchId(raw: string) {
  const decoded = decodeURIComponent(raw);
  const marker = '$episode$';
  const index = decoded.indexOf(marker);
  return index >= 0
    ? { id: decoded.slice(0, index), episode: Number(decoded.slice(index + marker.length)) || 1 }
    : { id: decoded, episode: 1 };
}

export function Watch() {
  const [isMatch, params] = useRoute<{ id: string }>('/watch/:id');
  const raw = isMatch && params ? params.id : '';
  const parsed = useMemo(() => parseWatchId(raw), [raw]);
  const query = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const [data, setData] = useState<any>(null);
  const [activeSeason, setActiveSeason] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!parsed.id) return;
    api.getDetails(parsed.id).then(result => {
      if (active) setData(result);
    }).catch(() => {
      if (active) setData(null);
    });
    return () => { active = false; };
  }, [parsed.id]);

  const model: WatchModel = useMemo(() => {
    const kind = detectKind(data, query);
    const apiEpisodes: Episode[] = Array.isArray(data?.episodes)
      ? data.episodes.map((ep: any, index: number) => ({
          id: String(ep.id || parsed.id + '-episode-' + (ep.number || index + 1)),
          number: Number(ep.number || index + 1),
          title: cleanText(ep.title) || 'Episode ' + (ep.number || index + 1),
          synopsis: cleanText(ep.synopsis || ep.description) || 'Episode synopsis from MovieApi / TVMaze will appear here once the content provider is connected.',
          image: ep.image || ep.thumbnail || '',
        }))
      : [];
    const apiSeasons = Array.isArray(data?.seasons) ? data.seasons : [];
    const seasons = apiSeasons.length
      ? apiSeasons.map((season: any, index: number) => ({
          number: Number(season.number || index + 1),
          episodes: Array.isArray(season.episodes) ? season.episodes : undefined,
        }))
      : [{ number: 1 }, { number: 2 }, { number: 3 }];
    return {
      id: parsed.id,
      title: cleanText(data?.title) || parsed.id || 'Untitled',
      kind,
      synopsis: cleanText(data?.description || data?.synopsis) || 'The synopsis will appear here when MovieApi is connected.',
      poster: data?.image || data?.poster || '',
      episodes: apiEpisodes.length ? apiEpisodes : placeholderEpisodes(activeSeason),
      seasons,
      streamUrl: data?.streamUrl || data?.stream?.url || '',
    };
  }, [data, parsed.id, activeSeason, query]);

  const currentEpisode = model.kind === 'series'
    ? model.episodes.find(ep => ep.number === parsed.episode) || model.episodes[0]
    : null;

  useEffect(() => {
    setIsInList(libraryManager.isInWatchlist(model.id));
    updateSEO({ title: 'Watching ' + model.title + ' — Kinoma', description: model.synopsis, image: model.poster, type: 'video.other' });
  }, [model.id, model.title, model.synopsis, model.poster]);

  const handleAddToList = () => {
    const result = libraryManager.toggleWatchlist({ id: model.id, title: model.title, image: model.poster });
    setIsInList(result);
  };

  return (
    <main className="kinoma-player-page">
      {playbackError && <div className="kinoma-details-bottom" role="alert">{playbackError}</div>}\n      <header className="kinoma-player-topbar">
        <Link href="/home" className="kinoma-player-back"><ArrowLeft size={17} /><span>Back to Kinoma</span></Link>
        <div className="kinoma-player-titlebar">
          {model.kind === 'movie' ? <Film size={14} /> : <Tv size={14} />}
          <span>{model.title}</span>
          {model.kind === 'series' && currentEpisode && <small>Episode {currentEpisode.number}</small>}
        </div>
      </header>

      <section className="kinoma-player-stage" aria-label="Video player">
        <div className="kinoma-player-frame">
          {model.streamUrl ? (
            <video
              src={model.streamUrl}
              className="kinoma-player-video"
              controls
              playsInline
              autoPlay
              muted={muted}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onVolumeChange={event => setMuted(event.currentTarget.muted)}
            />
          ) : (
            <div className="kinoma-player-placeholder">
              <div className="kinoma-player-placeholder__icon">{playing ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}</div>
              <span>PLAYER READY</span>
              <strong>Your video will play here.</strong>
              <p>{playbackError || (loading ? 'Loading metadata and playback source…' : 'MovieApi did not return a playback source for this title.')}</p>
              <button type="button" onClick={() => setPlaying(value => !value)}><Play size={15} fill="currentColor" />{playing ? 'Pause' : 'Preview'}</button>
            </div>
          )}
        </div>
        <div className="kinoma-player-controls">
          <button type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</button>
          <button type="button" onClick={() => setMuted(value => !value)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <span>{model.kind === 'movie' ? 'Movie' : 'Episode ' + parsed.episode}</span>
        </div>
      </section>

      <section className="kinoma-player-info">
        <div className="kinoma-player-info__main">
          <div className="kinoma-player-poster">{model.poster ? <img src={model.poster} alt="" /> : <Film size={25} />}</div>
          <div className="kinoma-player-copy">
            <div className="kinoma-player-eyebrow">{model.kind === 'movie' ? 'Movie' : 'Season ' + activeSeason + ' • Episode ' + parsed.episode}</div>
            <h1>{model.title}</h1>
            {model.kind === 'series' && currentEpisode && <h2>{currentEpisode.title}</h2>}
            <p>{model.synopsis}</p>
          </div>
        </div>
        <button type="button" className={'kinoma-player-list-button ' + (isInList ? 'is-added' : '')} onClick={handleAddToList}><Plus size={16} />{isInList ? 'In My List' : 'Add to My List'}</button>
      </section>

      {model.kind === 'series' ? (
        <section className="kinoma-player-layout">
          <div className="kinoma-player-main-column">
            <div className="kinoma-player-section kinoma-player-section--episodes">
              <div className="kinoma-player-section__heading">
                <div><span>KEEP WATCHING</span><h2>Seasons & Episodes</h2></div>
                <small>{model.episodes.length} episodes</small>
              </div>
              <div className="kinoma-player-episodes">
                {model.episodes.map(episode => (
                  <Link key={episode.id} href={'/watch/' + encodeURIComponent(model.id + '$episode$' + episode.number) + '?type=series'} className={'kinoma-player-episode ' + (episode.number === parsed.episode ? 'is-current' : '')}>
                    <div className="kinoma-player-episode__image">{episode.image ? <img src={episode.image} alt="" /> : <Tv size={19} />}<b>{episode.number}</b></div>
                    <div className="kinoma-player-episode__copy">
                      <strong>Episode {episode.number}{episode.title && episode.title !== 'Episode ' + episode.number ? ' — ' + episode.title : ''}</strong>
                      <p>{episode.synopsis}</p>
                    </div>
                    <ChevronRight size={17} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <aside className="kinoma-player-episode-sidebar" aria-label="Season and episode navigation">
            <div className="kinoma-player-episode-sidebar__header">
              <span>QUICK ACCESS</span>
              <strong>Seasons</strong>
            </div>
            <div className="kinoma-player-seasons" role="tablist" aria-label="Seasons">
              {model.seasons.map(season => (
                <button type="button" role="tab" aria-selected={activeSeason === season.number} key={season.number} className={activeSeason === season.number ? 'is-active' : ''} onClick={() => setActiveSeason(season.number)}>
                  Season {season.number}
                </button>
              ))}
            </div>
            <div className="kinoma-player-episode-sidebar__hint">Select a season to load its episodes.</div>
          </aside>
        </section>
      ) : (   )}

      <footer className="kinoma-player-footer"><Link href="/home">Home</Link><Link href={'/details/' + encodeURIComponent(model.id)}>View details</Link></footer>
    </main>
  );
}

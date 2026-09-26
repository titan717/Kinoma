import React, { useEffect, useMemo, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, ChevronRight, Film, Pause, Play, Plus, Tv, Volume2, VolumeX } from 'lucide-react';
import { api } from '../lib/api';
import type { AnimeDetails, Episode, AnimeSeasonItem } from '../types';
import { libraryManager } from '../lib/library';
import { historyUtil } from '../lib/history';
import { updateSEO } from '../lib/seo';

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : '';
}

function parseWatchId(raw: string) {
  const decoded = decodeURIComponent(raw || '');
  const match = decoded.match(/^(.*)\$season\$(\d+)\$episode\$(\d+)$/);
  if (match) return { id: match[1], season: Math.max(1, Number(match[2])), episode: Math.max(1, Number(match[3])) };
  const legacy = decoded.match(/^(.*)\$episode\$(\d+)$/);
  if (legacy) return { id: legacy[1], season: 1, episode: Math.max(1, Number(legacy[2])) };
  return { id: decoded, season: 1, episode: 1 };
}

function titleOf(data: AnimeDetails | null, fallback: string) {
  if (typeof data?.title === 'string') return data.title;
  return data?.title?.english || data?.title?.romaji || data?.title?.native || fallback;
}

export function Watch() {
  const [isMatch, params] = useRoute<{ id: string }>('/watch/:id');
  const raw = isMatch && params ? params.id : '';
  const parsed = useMemo(() => parseWatchId(raw), [raw]);
  const query = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const media = api.getDetailsMediaId(parsed.id);
  const requestedKind = query.get('type');
  const [data, setData] = useState<AnimeDetails | null>(null);
  const [seasons, setSeasons] = useState<AnimeSeasonItem[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeSeason, setActiveSeason] = useState(parsed.season);
  const [source, setSource] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const kind = requestedKind === 'movie' || media?.type === 'movie' || data?.contentType === 'movie' ? 'movie' : 'series';

  useEffect(() => setActiveSeason(parsed.season), [parsed.id, parsed.season]);

  useEffect(() => {
    let active = true;
    if (!parsed.id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getDetails(parsed.id),
      api.getWatchLink(parsed.id, kind === 'series' ? parsed.season : 1, kind === 'series' ? parsed.episode : 1),
      kind === 'series' ? api.getSeasons(parsed.id) : Promise.resolve({ seasons: [] as AnimeSeasonItem[] })
    ]).then(([details, playback, seasonResult]) => {
      if (!active) return;
      setData(details);
      setSource(playback.source);
      setSeasons(seasonResult.seasons);
      setIsInList(libraryManager.isInWatchlist(parsed.id));
      updateSEO({ title: 'Watching ' + titleOf(details, parsed.id) + ' — Panda.fun', description: cleanText(details.description), image: details.image, type: 'video.other' });
      setLoading(false);
    }).catch(err => {
      if (!active) return;
      setError(err instanceof Error ? err.message : 'Playback is unavailable right now.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [parsed.id, parsed.season, parsed.episode, kind]);

  useEffect(() => {
    if (kind !== 'series') return;
    let active = true;
    api.getSeasonEpisodes(parsed.id, activeSeason).then(result => active && setEpisodes(result.episodes)).catch(() => active && setEpisodes([]));
    return () => { active = false; };
  }, [parsed.id, activeSeason, kind]);

  const title = titleOf(data, parsed.id || 'Untitled');
  const currentEpisode = episodes.find(ep => ep.number === parsed.episode);
  const poster = data?.image || '';
  const synopsis = cleanText(data?.description) || 'No synopsis is available for this title yet.';
  const timestamp = Math.max(0, Number(query.get('t') || 0));

  const watchUrl = (season: number, episode: number) =>
    '/watch/' + encodeURIComponent(parsed.id + '$season$' + season + '$episode$' + episode) + '?type=series';

  const saveProgress = (currentTime: number, duration: number) => {
    historyUtil.saveProgress(
      parsed.id,
      kind === 'movie' ? parsed.id : (currentEpisode?.id || parsed.id + '-episode-' + parsed.episode),
      kind === 'movie' ? 1 : parsed.episode,
      currentTime,
      duration,
      { title, image: poster, animeId: parsed.id, seasonNumber: activeSeason }
    );
  };

  const handleVideoProgress = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (Number.isFinite(video.currentTime)) saveProgress(video.currentTime, Number.isFinite(video.duration) ? video.duration : 0);
  };

  const addToList = () => setIsInList(libraryManager.toggleWatchlist({ id: parsed.id, title, image: poster }));

  return (
    <main className="kinoma-player-page">
      {error && <div className="kinoma-details-bottom" role="alert">{error}</div>}
      <header className="kinoma-player-topbar">
        <Link href="/home" className="kinoma-player-back"><ArrowLeft size={17} /><span>Back to Panda.fun</span></Link>
        <div className="kinoma-player-titlebar">
          {kind === 'movie' ? <Film size={14} /> : <Tv size={14} />}<span>{title}</span>
          {kind === 'series' && <small>S{activeSeason} · E{parsed.episode}</small>}
        </div>
      </header>

      <section className="kinoma-player-stage" aria-label="Video player">
        <div className="kinoma-player-frame">
          {source?.url ? (
            source.type === 'embed' ? (
              <iframe
                src={source.url}
                title={title + ' player'}
                className="kinoma-player-video"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
                onLoad={() => kind === 'series' && saveProgress(timestamp, currentEpisode?.duration || 0)}
              />
            ) : (
              <video
                src={source.url}
                className="kinoma-player-video"
                controls
                playsInline
                autoPlay
                muted={muted}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={handleVideoProgress}
                onEnded={handleVideoProgress}
                onVolumeChange={event => setMuted(event.currentTarget.muted)}
              />
            )
          ) : (
            <div className="kinoma-player-placeholder">
              <div className="kinoma-player-placeholder__icon">{playing ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}</div>
              <span>{loading ? 'LOADING' : 'PLAYER UNAVAILABLE'}</span>
              <strong>{loading ? 'Preparing your stream…' : 'No playback source is available.'}</strong>
              <p>{error || 'Try again later or choose another episode.'}</p>
            </div>
          )}
        </div>
        <div className="kinoma-player-controls">
          <button type="button" onClick={() => setPlaying(v => !v)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</button>
          <button type="button" onClick={() => setMuted(v => !v)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <span>{kind === 'movie' ? 'Movie' : 'S' + activeSeason + ' · E' + parsed.episode}</span>
        </div>
      </section>

      <section className="kinoma-player-info">
        <div className="kinoma-player-info__main">
          <div className="kinoma-player-poster">{poster ? <img src={poster} alt="" /> : <Film size={25} />}</div>
          <div className="kinoma-player-copy">
            <div className="kinoma-player-eyebrow">{kind === 'movie' ? 'Movie' : 'Season ' + activeSeason + ' • Episode ' + parsed.episode}</div>
            <h1>{title}</h1>
            {kind === 'series' && currentEpisode && <h2>{currentEpisode.title}</h2>}
            <p>{synopsis}</p>
          </div>
        </div>
        <button type="button" className={'kinoma-player-list-button ' + (isInList ? 'is-added' : '')} onClick={addToList}><Plus size={16} />{isInList ? 'In My List' : 'Add to My List'}</button>
      </section>

      {kind === 'series' && (
        <section className="kinoma-player-layout">
          <div className="kinoma-player-main-column">
            <div className="kinoma-player-section kinoma-player-section--episodes">
              <div className="kinoma-player-section__heading"><div><span>KEEP WATCHING</span><h2>Season {activeSeason}</h2></div><small>{episodes.length} episodes</small></div>
              <div className="kinoma-player-episodes">
                {episodes.map(episode => (
                  <Link key={episode.id} href={watchUrl(activeSeason, episode.number)} className={'kinoma-player-episode ' + (episode.number === parsed.episode ? 'is-current' : '')}>
                    <div className="kinoma-player-episode__image">{episode.image ? <img src={episode.image} alt="" /> : <Tv size={19} />}<b>{episode.number}</b></div>
                    <div className="kinoma-player-episode__copy"><strong>Episode {episode.number}{episode.title ? ' — ' + episode.title : ''}</strong></div>
                    <ChevronRight size={17} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <aside className="kinoma-player-episode-sidebar" aria-label="Season and episode navigation">
            <div className="kinoma-player-episode-sidebar__header"><span>QUICK ACCESS</span><strong>Seasons</strong></div>
            <div className="kinoma-player-seasons" role="tablist">
              {seasons.map(season => <button type="button" role="tab" aria-selected={activeSeason === season.seasonNumber} key={season.seasonNumber} className={activeSeason === season.seasonNumber ? 'is-active' : ''} onClick={() => setActiveSeason(season.seasonNumber)}>Season {season.seasonNumber}</button>)}
            </div>
            <div className="kinoma-player-episode-sidebar__hint">Select a season to load its episodes.</div>
          </aside>
        </section>
      )}

      <footer className="kinoma-player-footer"><Link href="/home">Home</Link><Link href={'/details/' + encodeURIComponent(parsed.id) + '?type=' + (kind === 'movie' ? 'movie' : 'series')}>View details</Link></footer>
    </main>
  );
}

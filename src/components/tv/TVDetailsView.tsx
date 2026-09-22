import React, { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import { Play, Plus, Check, ArrowLeft, Star, ListVideo } from 'lucide-react';
import { api } from '../../lib/api';
import { AnimeItem, AnimeDetails, Episode, DEFAULT_BANNER, DEFAULT_POSTER } from '../../types';
import { libraryManager } from '../../lib/library';
import { historyUtil } from '../../lib/history';
import { prefetchImage } from './TVCard';

interface TVDetailsViewProps {
  animeId: string;
  initialItem?: AnimeItem | null;
  onPlayEpisode: (episodeId: string, timestamp?: number) => void;
  onBack: () => void;
}

export function TVDetailsView({
  animeId,
  initialItem,
  onPlayEpisode,
  onBack
}: TVDetailsViewProps) {
  const { data: detailsData, isLoading } = useSWR(
    animeId ? `tv-details-${animeId}` : null,
    () => api.getDetails(animeId, initialItem || undefined),
    { revalidateOnFocus: false }
  );

  const anime: AnimeDetails | AnimeItem | null = detailsData || initialItem || null;
  const episodes = useMemo(() => detailsData?.episodes || [], [detailsData]);
  const [seasonEpisodesMap, setSeasonEpisodesMap] = useState<Record<number, Episode[]>>({});

  // Group episodes into seasons (preferring real API seasons)
  const seasonGroups = useMemo(() => {
    if (detailsData?.seasons && detailsData.seasons.length > 0) {
      return detailsData.seasons.map(s => ({
        seasonNumber: s.seasonNumber,
        title: s.title || `Season ${s.seasonNumber}`,
        animeId: s.animeId,
        anilistId: s.anilistId,
        episodes: seasonEpisodesMap[s.seasonNumber] || (s.seasonNumber === 1 ? episodes : [])
      }));
    }

    if (episodes.length === 0) return [{ title: 'Season 1', seasonNumber: 1, animeId, anilistId: anime?.anilist_id, episodes: [] }];
    
    // If fewer than 26 episodes, single season
    if (episodes.length <= 25) {
      return [{ title: 'Season 1', seasonNumber: 1, animeId, anilistId: anime?.anilist_id, episodes }];
    }

    // Group into 24-episode seasons for smooth TV pagination
    const groups: { title: string; seasonNumber: number; animeId: string; anilistId?: number; episodes: typeof episodes }[] = [];
    const chunkSize = 24;
    for (let i = 0; i < episodes.length; i += chunkSize) {
      const seasonNum = Math.floor(i / chunkSize) + 1;
      const endEp = Math.min(i + chunkSize, episodes.length);
      groups.push({
        seasonNumber: seasonNum,
        animeId,
        anilistId: anime?.anilist_id,
        title: `Season ${seasonNum} (Ep ${i + 1}-${endEp})`,
        episodes: episodes.slice(i, endEp)
      });
    }
    return groups;
  }, [detailsData?.seasons, episodes, seasonEpisodesMap, animeId, anime?.anilist_id]);

  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);

  // Fetch season episodes when TV user navigates between seasons
  useEffect(() => {
    const currentGroup = seasonGroups[selectedSeasonIdx];
    if (!currentGroup || !animeId) return;

    const sNum = currentGroup.seasonNumber || selectedSeasonIdx + 1;
    if (seasonEpisodesMap[sNum] && seasonEpisodesMap[sNum].length > 0) return;

    if (sNum === 1 && episodes.length > 0) {
      setSeasonEpisodesMap(prev => ({ ...prev, [1]: episodes }));
      return;
    }

    api.getSeasonEpisodes(animeId, sNum, currentGroup.animeId, currentGroup.anilistId)
      .then(res => {
        if (res?.episodes) {
          setSeasonEpisodesMap(prev => ({ ...prev, [sNum]: res.episodes }));
        }
      })
      .catch(err => {
        console.error('TV season load error:', err);
      });
  }, [animeId, selectedSeasonIdx, seasonGroups, episodes, seasonEpisodesMap]);
  const [isInList, setIsInList] = useState(false);

  // Focus zones: 'cta' | 'seasons' | 'episodes'
  const [focusZone, setFocusZone] = useState<'cta' | 'seasons' | 'episodes'>('cta');
  const [focusedCtaIdx, setFocusedCtaIdx] = useState(0); // 0: Play/Resume, 1: My List, 2: Back
  const [focusedSeasonIdx, setFocusedSeasonIdx] = useState(0);
  const [focusedEpIdx, setFocusedEpIdx] = useState(0);

  const epRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (anime) {
      setIsInList(libraryManager.isInWatchlist(anime.id));
    }
  }, [anime]);

  const titleString = typeof anime?.title === 'string'
    ? anime.title
    : anime?.title?.english || anime?.title?.romaji || 'Anime Details';

  const backdropImage = anime?.cover || anime?.image || DEFAULT_BANNER;

  const currentSeasonEpisodes = seasonGroups[selectedSeasonIdx]?.episodes || [];

  // Check watch history to resume or start fresh
  const ctaInfo = useMemo(() => {
    if (!animeId || episodes.length === 0) return null;
    return historyUtil.calculateWatchCTA(animeId, episodes, titleString);
  }, [animeId, episodes, titleString]);

  const handlePlayPrimary = () => {
    if (ctaInfo?.episode) {
      onPlayEpisode(ctaInfo.episode.id, ctaInfo.playbackTimestamp);
    } else if (episodes.length > 0) {
      onPlayEpisode(episodes[0].id, 0);
    }
  };

  const handleToggleList = () => {
    if (!anime) return;
    const updated = libraryManager.toggleWatchlist({
      id: anime.id,
      title: titleString,
      image: anime.image || DEFAULT_POSTER
    });
    setIsInList(updated);
  };

  // Auto-scroll focused episode into view & prefetch next episode thumbnail
  useEffect(() => {
    if (focusZone === 'episodes' && epRefs.current[focusedEpIdx]) {
      epRefs.current[focusedEpIdx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      // Prefetch images for focused and next 2 episodes
      const currEp = currentSeasonEpisodes[focusedEpIdx];
      const nextEp = currentSeasonEpisodes[focusedEpIdx + 1];
      if (currEp?.image) prefetchImage(currEp.image);
      if (nextEp?.image) prefetchImage(nextEp.image);
    }
  }, [focusZone, focusedEpIdx, currentSeasonEpisodes]);

  // Spatial TV D-pad navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009 || e.keyCode === 461) {
        onBack();
        return;
      }

      if (e.key === 'ArrowUp') {
        if (focusZone === 'episodes') {
          if (seasonGroups.length > 1) {
            setFocusZone('seasons');
            setFocusedSeasonIdx(selectedSeasonIdx);
          } else {
            setFocusZone('cta');
            setFocusedCtaIdx(0);
          }
        } else if (focusZone === 'seasons') {
          setFocusZone('cta');
          setFocusedCtaIdx(0);
        }
      } else if (e.key === 'ArrowDown') {
        if (focusZone === 'cta') {
          if (seasonGroups.length > 1) {
            setFocusZone('seasons');
            setFocusedSeasonIdx(selectedSeasonIdx);
          } else if (currentSeasonEpisodes.length > 0) {
            setFocusZone('episodes');
            setFocusedEpIdx(0);
          }
        } else if (focusZone === 'seasons') {
          if (currentSeasonEpisodes.length > 0) {
            setFocusZone('episodes');
            setFocusedEpIdx(0);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (focusZone === 'cta') {
          if (focusedCtaIdx > 0) setFocusedCtaIdx(prev => prev - 1);
        } else if (focusZone === 'seasons') {
          if (focusedSeasonIdx > 0) {
            const next = focusedSeasonIdx - 1;
            setFocusedSeasonIdx(next);
            setSelectedSeasonIdx(next);
          }
        } else if (focusZone === 'episodes') {
          if (focusedEpIdx > 0) setFocusedEpIdx(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (focusZone === 'cta') {
          if (focusedCtaIdx < 2) setFocusedCtaIdx(prev => prev + 1);
        } else if (focusZone === 'seasons') {
          if (focusedSeasonIdx < seasonGroups.length - 1) {
            const next = focusedSeasonIdx + 1;
            setFocusedSeasonIdx(next);
            setSelectedSeasonIdx(next);
          }
        } else if (focusZone === 'episodes') {
          if (focusedEpIdx < currentSeasonEpisodes.length - 1) {
            setFocusedEpIdx(prev => prev + 1);
          }
        }
      } else if (e.key === 'Enter') {
        if (focusZone === 'cta') {
          if (focusedCtaIdx === 0) handlePlayPrimary();
          else if (focusedCtaIdx === 1) handleToggleList();
          else if (focusedCtaIdx === 2) onBack();
        } else if (focusZone === 'seasons') {
          setSelectedSeasonIdx(focusedSeasonIdx);
        } else if (focusZone === 'episodes') {
          const ep = currentSeasonEpisodes[focusedEpIdx];
          if (ep) onPlayEpisode(ep.id, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusZone, focusedCtaIdx, focusedSeasonIdx, focusedEpIdx, selectedSeasonIdx, seasonGroups, currentSeasonEpisodes, onBack, onPlayEpisode]);

  const cleanDescription = anime?.description
    ? anime.description.replace(/<[^>]*>?/gm, '').slice(0, 320) + '...'
    : 'No detailed synopsis available.';

  return (
    <div className="relative w-full min-h-screen bg-[#07080d] text-white overflow-x-hidden select-none">
      {/* 1. Massive Cinematic Backdrop Image */}
      <div className="absolute top-0 left-0 right-0 h-[62vh] overflow-hidden">
        <img
          src={backdropImage}
          alt={titleString}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.08]"
        />
        {/* Cinematic Scrims */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/85 via-40% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/90 via-20% to-transparent" />
      </div>

      {/* 2. Top Header / Back Trigger */}
      <div className="relative z-10 px-8 lg:px-14 pt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 hover:bg-black/80 border border-white/10 text-xs font-bold text-gray-300 backdrop-blur-md cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>
      </div>

      {/* 3. Hero Details Info */}
      <div className="relative z-10 px-8 lg:px-14 pt-8 max-w-5xl">
        {/* Metadata badges */}
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-0.5 rounded-md bg-white/15 border border-white/20 text-white font-black text-xs uppercase tracking-wider">
            Ultra HD
          </span>
          {anime?.rating && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#4ade80] font-bold text-xs">
              <Star className="w-3 h-3 fill-current" />
              <span>{typeof anime.rating === 'number' && !isNaN(anime.rating) ? `${Math.round(anime.rating)}% Match` : String(anime.rating)}</span>
            </span>
          )}
          {(anime as any)?.contentRating && (
            <span className="px-2.5 py-0.5 rounded-md bg-[#7b1fa2]/30 border border-[#9c27b0]/50 text-[#e1bee7] font-bold text-xs">
              {(anime as any).contentRating}
            </span>
          )}
          {anime?.releaseDate && (
            <span className="text-gray-300 font-medium text-xs">
              {anime.releaseDate}
            </span>
          )}
          {episodes.length > 0 && (
            <span className="text-gray-400 text-xs font-medium">
              • {episodes.length} Episodes
            </span>
          )}
          {anime?.genres && (
            <span className="text-gray-400 text-xs hidden sm:inline">
              • {anime.genres.slice(0, 3).join(', ')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight font-['Outfit'] mb-3">
          {titleString}
        </h1>

        {/* Synopsis */}
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl mb-6">
          {cleanDescription}
        </p>

        {/* Remote Action Controls: Play / Resume, My List, Back */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={handlePlayPrimary}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-base transition-all duration-200 cursor-pointer outline-none ${
              focusZone === 'cta' && focusedCtaIdx === 0
                ? 'bg-white text-black scale-105 shadow-[0_0_28px_rgba(255,255,255,0.55)] ring-3 ring-white'
                : 'bg-gradient-to-r from-white via-[#e9d5ff] to-[#c084fc] hover:brightness-105 text-black shadow-lg'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{ctaInfo?.type === 'continue_watching' ? ctaInfo.label : 'Play Episode 1'}</span>
          </button>

          <button
            onClick={handleToggleList}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 cursor-pointer outline-none backdrop-blur-md ${
              focusZone === 'cta' && focusedCtaIdx === 1
                ? 'bg-white text-black scale-105 shadow-[0_0_28px_rgba(255,255,255,0.55)] ring-3 ring-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            }`}
          >
            {isInList ? (
              <>
                <Check className={`w-5 h-5 ${focusZone === 'cta' && focusedCtaIdx === 1 ? 'text-black' : 'text-[#4ade80]'}`} />
                <span>In My List</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>My List</span>
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 cursor-pointer outline-none backdrop-blur-md ${
              focusZone === 'cta' && focusedCtaIdx === 2
                ? 'bg-white text-black scale-105 shadow-[0_0_28px_rgba(255,255,255,0.55)] ring-3 ring-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            }`}
          >
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* 4. Reference-style 10-foot season + episode layout */}
      <section className="relative z-10 px-8 lg:px-14 pb-20">
        <div className="flex items-center gap-3 mb-5">
          <ListVideo className="w-5 h-5 text-white/70" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit']">Seasons & Episodes</h2>
            <p className="text-xs text-white/40 mt-0.5">Use the left rail for seasons and the right panel for episodes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 rounded-3xl border border-white/10 bg-[#0b0c12]/90 overflow-hidden shadow-2xl">
          <aside className="border-b lg:border-b-0 lg:border-r border-white/10 p-5 bg-white/[.025]">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35 mb-3">Seasons</div>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {seasonGroups.map((grp, idx) => {
                const selected = selectedSeasonIdx === idx;
                const focused = focusZone === 'seasons' && focusedSeasonIdx === idx;
                return (
                  <button
                    key={grp.title}
                    onClick={() => { setSelectedSeasonIdx(idx); setFocusedSeasonIdx(idx); }}
                    className={`shrink-0 lg:w-full text-left rounded-2xl border px-4 py-4 transition-all outline-none ${
                      focused ? 'bg-white text-black border-white scale-[1.02] shadow-lg' :
                      selected ? 'bg-white/10 text-white border-white/25' : 'bg-white/[.03] text-white/55 border-white/[.06] hover:bg-white/[.06]'
                    }`}
                  >
                    <div className="font-black text-sm">{grp.title}</div>
                    <div className={`text-[11px] mt-1 ${focused ? 'text-black/60' : 'text-white/35'}`}>{grp.episodes.length || 0} episodes</div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="p-5 lg:p-7 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Episode List</div>
                <h3 className="text-lg font-black">{seasonGroups[selectedSeasonIdx]?.title || 'Season 1'}</h3>
              </div>
              <span className="text-xs text-white/40">{currentSeasonEpisodes.length} available</span>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 py-10 text-white/45">
                <div className="w-6 h-6 border-2 border-white/15 border-t-white rounded-full animate-spin" />
                <span>Loading episodes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
                {currentSeasonEpisodes.map((ep, idx) => {
                  const isFocused = focusZone === 'episodes' && focusedEpIdx === idx;
                  const isCurrent = ctaInfo?.episode?.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      ref={el => (epRefs.current[idx] = el)}
                      onClick={() => onPlayEpisode(ep.id, 0)}
                      className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all outline-none ${
                        isFocused ? 'bg-white text-black border-white scale-[1.015] shadow-lg' :
                        isCurrent ? 'bg-white/[.08] border-white/25 text-white' : 'bg-white/[.025] border-white/[.06] text-white/75 hover:bg-white/[.05]'
                      }`}
                    >
                      <img src={ep.image || anime?.image || DEFAULT_POSTER} alt="" loading={isFocused ? 'eager' : 'lazy'} decoding="async" className="w-32 aspect-video rounded-xl object-cover bg-black/30" />
                      <div className="min-w-0 flex-1">
                        <div className={`text-[10px] font-black uppercase tracking-wider ${isFocused ? 'text-black/50' : 'text-white/35'}`}>Episode {ep.number}</div>
                        <div className="truncate font-black text-sm mt-1">{ep.title || `Episode ${ep.number}`}</div>
                        <div className={`text-[11px] mt-1 ${isFocused ? 'text-black/50' : 'text-white/35'}`}>{ep.duration ? `${Math.round(ep.duration / 60)} min` : '24 min'}</div>
                      </div>
                      {isCurrent && <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isFocused ? 'bg-black/10' : 'bg-white/10 text-white/60'}`}>RESUME</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

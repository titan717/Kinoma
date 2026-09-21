import React, { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import { Play, Plus, Check, ArrowLeft, Star, Clock, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { AnimeItem, AnimeDetails, Episode, DEFAULT_BANNER, DEFAULT_POSTER } from '../../types';
import { libraryManager } from '../../lib/library';
import { historyUtil } from '../../lib/history';

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

  const epRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Auto-scroll focused episode into view
  useEffect(() => {
    if (focusZone === 'episodes' && epRefs.current[focusedEpIdx]) {
      epRefs.current[focusedEpIdx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [focusZone, focusedEpIdx]);

  // Spatial TV D-pad navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
                : 'bg-white/90 hover:bg-white text-black shadow-lg'
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

      {/* 4. Seasons Navigation (if multiple) */}
      {seasonGroups.length > 1 && (
        <div className="relative z-10 px-8 lg:px-14 mb-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {seasonGroups.map((grp, idx) => {
              const isSelected = selectedSeasonIdx === idx;
              const isFocused = focusZone === 'seasons' && focusedSeasonIdx === idx;

              return (
                <button
                  key={grp.title}
                  onClick={() => {
                    setSelectedSeasonIdx(idx);
                    setFocusedSeasonIdx(idx);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer outline-none whitespace-nowrap ${
                    isFocused
                      ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.5)] ring-2 ring-white'
                      : isSelected
                      ? 'bg-purple-900/60 text-white border border-purple-500/50 shadow-sm'
                      : 'bg-[#151622] text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {grp.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Episodes Section: Large TV-Friendly Cards */}
      <div className="relative z-10 px-8 lg:px-14 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Episodes
          </h2>
          <span className="text-xs text-gray-400">
            {currentSeasonEpisodes.length} episodes available
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 py-10 text-gray-400">
            <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <span>Loading episodes catalog...</span>
          </div>
        ) : (
          <div 
            className="flex items-center gap-5 overflow-x-auto py-4 scrollbar-none scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {currentSeasonEpisodes.map((ep, idx) => {
              const isFocused = focusZone === 'episodes' && focusedEpIdx === idx;
              const isCurrent = ctaInfo?.episode?.id === ep.id;

              return (
                <div
                  key={ep.id}
                  ref={el => (epRefs.current[idx] = el)}
                  onClick={() => onPlayEpisode(ep.id, 0)}
                  className={`shrink-0 w-64 sm:w-72 flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer outline-none ${
                    isFocused
                      ? 'scale-[1.06] z-20 ring-3 ring-white shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_24px_rgba(255,255,255,0.35)]'
                      : isCurrent
                      ? 'ring-1 ring-purple-500/50'
                      : 'opacity-90 hover:opacity-100'
                  } bg-[#11121b] border border-[#20212f]`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-[#0a0b12] overflow-hidden">
                    <img
                      src={ep.image || anime?.image || DEFAULT_POSTER}
                      alt={`Episode ${ep.number}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center filter brightness-[0.9]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play button overlay when focused */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                      isFocused ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-black/70 text-white border border-white/20 px-2 py-0.5 rounded-md backdrop-blur-md">
                        Episode {ep.number}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="p-3.5 flex flex-col gap-1 bg-[#0f1017]">
                    <h3 className={`text-sm font-bold truncate ${
                      isFocused ? 'text-white' : 'text-gray-300'
                    }`}>
                      {ep.title || `Episode ${ep.number}`}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {ep.duration ? `${Math.round(ep.duration / 60)} mins` : '24 mins'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

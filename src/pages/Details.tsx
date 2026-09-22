import React, { useState, useEffect, useMemo } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import useSWR from 'swr';
import { api } from '../lib/api';
import { Play, Bookmark, Heart, Star, Sparkles, CheckCircle2, ChevronRight, Layers, Film, X } from 'lucide-react';
import { motion } from 'motion/react';
import { historyUtil, WatchCTAInfo, parseSeasonNumber } from '../lib/history';
import { libraryManager } from '../lib/library';
import { preferencesUtil } from '../lib/preferences';
import { updateSEO } from '../lib/seo';
import { KinomaErrorState } from '../components/ui/KinomaErrorState';
import { AnimeGrid } from '../components/ui/AnimeGrid';
import { AnimeDetails, Episode, DEFAULT_POSTER, DEFAULT_BANNER } from '../types';

export function Details() {
  const [isMatch, params] = useRoute<{id: string}>('/details/:id');
  const [, setLocation] = useLocation();
  const id = (isMatch && params) ? decodeURIComponent(params.id) : '';

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [seasonEpisodesMap, setSeasonEpisodesMap] = useState<Record<number, Episode[]>>({});
  const [isLoadingSeasonEps, setIsLoadingSeasonEps] = useState<boolean>(false);
  const [progressVersion, setProgressVersion] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Fetch Anime Details
  const { data, isLoading, error, mutate: retryDetails } = useSWR<AnimeDetails>(
    id ? `info-${id}` : null,
    () => api.getDetails(id),
    { dedupingInterval: 60000 }
  );

  const { data: trailerData } = useSWR(
    id ? `trailer-${id}` : null,
    () => api.getTrailer(id),
    { dedupingInterval: 86400000, revalidateOnFocus: false }
  );

  // Fetch Recommendations
  const { data: recsData } = useSWR(
    id ? `recs-${id}` : null,
    () => api.getRecommendations(id),
    { dedupingInterval: 60000 }
  );

  // Listen for progress updates
  useEffect(() => {
    const handleProgressUpdate = () => setProgressVersion(v => v + 1);
    window.addEventListener('kinoma_progress_update', handleProgressUpdate);
    return () => window.removeEventListener('kinoma_progress_update', handleProgressUpdate);
  }, []);

  const episodes = data?.episodes || [];

  // Update SEO & genre personalization when data loads
  useEffect(() => {
    if (data) {
      const titleStr = typeof data.title === 'string' 
        ? data.title 
        : data.title?.english || data.title?.romaji || id;
      const cleanDesc = (data.description || '').replace(/<[^>]*>?/gm, '');

      updateSEO({
        title: titleStr,
        description: cleanDesc.slice(0, 160) || `Watch ${titleStr} streaming in HD on Kinoma.`,
        image: data.cover || data.image,
        type: 'video.tv_show'
      });

      if (data.genres && data.genres.length > 0) {
        preferencesUtil.recordGenreInteraction(data.genres);
      }

      setIsBookmarked(libraryManager.isInWatchlist(data.id || id));
    }
  }, [data, id]);

  // Compute Dynamic Watch CTA
  const watchCTA: WatchCTAInfo = useMemo(() => {
    return historyUtil.calculateWatchCTA(id, episodes, data?.title, data?._reanimeSlug || data?.id);
  }, [id, episodes, data, progressVersion]);

  // Handle canonical Season Structure
  const seasons = useMemo(() => {
    if (data?.seasons && data.seasons.length > 0) {
      return data.seasons.map(s => ({
        seasonNumber: s.seasonNumber,
        title: s.title || `Season ${s.seasonNumber}`,
        animeId: s.animeId,
        anilistId: s.anilistId,
        episodeCount: s.episodeCount,
        episodes: seasonEpisodesMap[s.seasonNumber] || (s.seasonNumber === 1 ? episodes : [])
      }));
    }

    if (!episodes || episodes.length === 0) return [];

    const map = new Map<number, typeof episodes>();
    episodes.forEach((ep: any) => {
      let sNum = ep.seasonNumber || (ep as any).season;
      if (!sNum) {
        if (episodes.length > 12) {
          sNum = Math.ceil(ep.number / 12);
        } else {
          sNum = parseSeasonNumber(data?.title, 1);
        }
      }
      if (!map.has(sNum)) map.set(sNum, []);
      map.get(sNum)!.push(ep);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([seasonNumber, seasonEpisodes]) => ({
        seasonNumber,
        title: `Season ${seasonNumber}`,
        animeId: id,
        anilistId: data?.anilist_id,
        episodeCount: seasonEpisodes.length,
        episodes: seasonEpisodes
      }));
  }, [data?.seasons, episodes, seasonEpisodesMap, id, data?.anilist_id, data?.title]);

  // Fetch season episodes on season tab change
  useEffect(() => {
    if (!id || !selectedSeasonNumber) return;
    if (seasonEpisodesMap[selectedSeasonNumber] && seasonEpisodesMap[selectedSeasonNumber].length > 0) return;

    const seasonObj = seasons.find(s => s.seasonNumber === selectedSeasonNumber);
    if (!seasonObj) return;

    if (selectedSeasonNumber === 1 && episodes && episodes.length > 0) {
      setSeasonEpisodesMap(prev => ({ ...prev, [1]: episodes }));
      return;
    }

    setIsLoadingSeasonEps(true);
    api.getSeasonEpisodes(seasonObj.animeId || id, selectedSeasonNumber)
      .then(res => {
        const rawList = res.episodes || [];
        const formatted: Episode[] = rawList.map((ep: any) => ({
          id: ep.id || `${seasonObj.animeId || id}$episode$${ep.number || 1}`,
          number: ep.number || 1,
          title: ep.title || `Episode ${ep.number || 1}`,
          seasonNumber: selectedSeasonNumber,
          image: ep.image || data?.image || DEFAULT_POSTER
        }));
        setSeasonEpisodesMap(prev => ({ ...prev, [selectedSeasonNumber]: formatted }));
      })
      .catch(() => {
        setSeasonEpisodesMap(prev => ({ ...prev, [selectedSeasonNumber]: [] }));
      })
      .finally(() => {
        setIsLoadingSeasonEps(false);
      });
  }, [id, selectedSeasonNumber, seasons, episodes, seasonEpisodesMap, data?.image]);

  const activeEpisodes = useMemo(() => {
    if (seasons.length > 0) {
      const target = seasons.find(s => s.seasonNumber === selectedSeasonNumber);
      if (target && seasonEpisodesMap[selectedSeasonNumber]) {
        return seasonEpisodesMap[selectedSeasonNumber];
      }
      if (target && target.episodes && target.episodes.length > 0) {
        return target.episodes;
      }
    }
    return episodes;
  }, [seasons, selectedSeasonNumber, seasonEpisodesMap, episodes]);

  const toggleWatchlist = () => {
    if (!data) return;
    const titleStr = typeof data.title === 'string' ? data.title : data.title?.english || data.title?.romaji || id;
    const added = libraryManager.toggleWatchlist({
      id: data.id || id,
      title: titleStr,
      image: data.image || DEFAULT_POSTER
    });
    setIsBookmarked(added);
  };

  const animeTitle = data 
    ? (typeof data.title === 'string' ? data.title : data.title?.english || data.title?.romaji || id)
    : id;

  const altTitle = data && typeof data.title === 'object'
    ? (data.title.romaji !== animeTitle ? data.title.romaji : data.title.native)
    : undefined;

  const firstEp = activeEpisodes[0] || episodes[0] || null;

  const handleLaunchCTA = () => {
    if (watchCTA.episode?.id) {
      const startParam = watchCTA.playbackTimestamp > 15 ? `?t=${Math.floor(watchCTA.playbackTimestamp)}` : '';
      setLocation(`/watch/${encodeURIComponent(watchCTA.episode.id)}${startParam}`);
    } else if (firstEp?.id) {
      setLocation(`/watch/${encodeURIComponent(firstEp.id)}`);
    } else {
      setLocation(`/watch/${encodeURIComponent(id)}`);
    }
  };

  if (error) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-12">
        <KinomaErrorState onRetry={retryDetails} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center bg-[#07080c]">
        <div className="w-12 h-12 border-3 border-[#7b1fa2]/30 border-t-[#7b1fa2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#07080c] pb-24 text-white font-sans selection:bg-[#7b1fa2] selection:text-white">
      
      {/* 1. CINEMATIC HERO SECTION */}
      <div className="relative w-full min-h-[55vh] lg:min-h-[65vh] flex items-end overflow-hidden pb-10">
        
        {/* Backdrop Artwork */}
        <div className="absolute inset-0 z-0">
          <img
            src={data.cover || data.image || DEFAULT_BANNER}
            alt={animeTitle}
            className="w-full h-full object-cover object-center filter brightness-60 scale-105"
          />
          {/* Subtle multi-layer cinematic gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/80 to-transparent" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col md:flex-row gap-6 lg:gap-10 items-start md:items-end">
          
          {/* Cover Poster */}
          <div className="hidden sm:block w-36 sm:w-44 md:w-52 lg:w-60 aspect-[2/3] rounded-2xl overflow-hidden bg-[#12131c] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] shrink-0">
            <img
              src={data.image || DEFAULT_POSTER}
              alt={animeTitle}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details & Metadata Hierarchy */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 max-w-3xl">
            
            {/* Meta Tags: Year, Rating, Status, Quality */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-300">
              {data.releaseDate && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  {data.releaseDate}
                </span>
              )}
              {data.rating && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{data.rating}%</span>
                </span>
              )}
              {data.status && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  {data.status}
                </span>
              )}
              {data.type && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#7b1fa2]/20 border border-[#7b1fa2]/40 text-[#c084fc]">
                  {data.type}
                </span>
              )}
            </div>

            {/* Anime Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {animeTitle}
            </h1>

            {/* Alternative Title */}
            {altTitle && (
              <p className="text-xs sm:text-sm text-gray-400 font-medium -mt-1 line-clamp-1">
                {altTitle}
              </p>
            )}

            {/* Genres List */}
            {data.genres && data.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.genres.map(g => (
                  <span key={g} className="text-[11px] font-semibold text-gray-300 bg-[#161724]/80 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis Description */}
            <p 
              className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3 md:line-clamp-4 pt-1 max-w-2xl"
              dangerouslySetInnerHTML={{ __html: data.description || 'No description provided.' }}
            />

            {/* Action Bar: Primary Play Button + Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              
              {/* PRIMARY ACTION: Continue Watching or Watch Now */}
              <button
                onClick={handleLaunchCTA}
                className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl bg-[#7b1fa2] hover:bg-[#9c27b0] text-white font-bold text-sm sm:text-base transition-all shadow-[0_4px_24px_rgba(123,31,162,0.6)] active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>{watchCTA.label}</span>
              </button>

              {trailerData?.available && trailerData.trailer?.id && trailerData.trailer.site === 'youtube' && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>Watch Trailer</span>
                </button>
              )}

              {/* SECONDARY ACTION: My List Bookmark */}
              <button
                onClick={toggleWatchlist}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#7b1fa2]/25 text-white border-[#ba68c8]/50 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border-white/10'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#c084fc] text-[#c084fc]' : ''}`} />
                <span>{isBookmarked ? 'In My List' : 'Add to List'}</span>
              </button>

              {/* SECONDARY ACTION: Like */}
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
                }`}
                title="Like this anime"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

            </div>

          </div>

        </div>
      </div>

      {trailerOpen && trailerData?.trailer?.id && trailerData.trailer.site === 'youtube' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${animeTitle} trailer`} onClick={() => setTrailerOpen(false)}>
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c10] shadow-[0_30px_100px_rgba(0,0,0,.7)]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setTrailerOpen(false)} aria-label="Close trailer" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white/80 hover:bg-black/90 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${encodeURIComponent(trailerData.trailer.id)}?autoplay=1&rel=0`}
                title={`${animeTitle} trailer`}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {trailerData?.available && trailerData.trailer?.id && trailerData.trailer.site === 'youtube' && (
        <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)] gap-6 lg:gap-8 items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-4 h-4 text-white/70" />
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Trailer</h2>
              </div>
              <div className="relative w-full aspect-video overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-black shadow-[0_18px_50px_rgba(0,0,0,.35)]">
                <iframe
                  src={`https://www.youtube.com/embed/${encodeURIComponent(trailerData.trailer.id)}?autoplay=1&mute=1&controls=1&rel=0&playsinline=1`}
                  title={`${animeTitle} trailer preview`}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:pl-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Trailer Preview</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">{animeTitle}</h3>
              <p className="text-sm leading-relaxed text-gray-400">Watch the trailer directly here before starting the anime.</p>
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="w-fit flex items-center gap-2 rounded-xl bg-white text-black px-5 py-3 text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                <Film className="w-4 h-4" />
                Open Trailer
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. EPISODES & SEASONS EXPERIENCE */}
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 mt-8 flex flex-col gap-6">
        
        {/* Section Header & Reusable Season/Part Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Episodes
            </h2>
            <span className="text-xs text-gray-400 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
              {activeEpisodes.length} available
            </span>
          </div>

          {/* Reusable Canonical Season Selector Tabs */}
          {seasons.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {seasons.map(s => {
                const isSelected = s.seasonNumber === selectedSeasonNumber;
                return (
                  <button
                    key={`season-${s.seasonNumber}`}
                    onClick={() => setSelectedSeasonNumber(s.seasonNumber)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-[#7b1fa2] text-white border-[#ba68c8]/60 shadow-[0_2px_12px_rgba(123,31,162,0.4)]'
                        : 'bg-[#12131c] text-gray-400 hover:text-white border-white/5 hover:bg-[#191a26]'
                    }`}
                  >
                    {s.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Episode Grid */}
        {isLoadingSeasonEps ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#7b1fa2]/30 border-t-[#7b1fa2] rounded-full animate-spin" />
          </div>
        ) : activeEpisodes.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No episodes currently listed for this release.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {activeEpisodes.map((ep) => {
              const epProg = historyUtil.getEpisodeProgress(id, ep.number);
              const isWatched = epProg?.isCompleted || (epProg && epProg.completionPercentage >= 85);
              const epWatchUrl = `/watch/${encodeURIComponent(ep.id || `${id}$episode$${ep.number}`)}`;

              return (
                <Link key={ep.id} href={epWatchUrl}>
                  <div className="group flex flex-col w-full rounded-2xl bg-[#0f1016] hover:bg-[#161722] border border-white/5 hover:border-white/15 p-2.5 sm:p-3 transition-all cursor-pointer select-none">
                    
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#181924] mb-2.5">
                      <img
                        src={ep.image || data.image || DEFAULT_POSTER}
                        alt={`Episode ${ep.number}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#7b1fa2] text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Episode Number Pill */}
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-white">
                        EP {ep.number}
                      </div>

                      {/* Watched Checkmark */}
                      {isWatched && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Progress bar if partially watched */}
                      {epProg && !isWatched && epProg.completionPercentage > 5 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                          <div 
                            className="h-full bg-[#c084fc]"
                            style={{ width: `${epProg.completionPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Title & Runtime */}
                    <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {ep.title || `Episode ${ep.number}`}
                    </h4>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>

      {/* 3. RECOMMENDATIONS / MORE LIKE THIS */}
      {recsData?.results && recsData.results.length > 0 && (
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 mt-16">
          <AnimeGrid
            title="More Like This"
            items={recsData.results.slice(0, 12)}
          />
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import useSWR from 'swr';
import { api } from '../lib/api';
import { Play, Bookmark, Heart, Plus, Star, Film, Globe, RotateCcw, Check, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { AnimeLoader } from '../components/ui/AnimeLoader';
import { historyUtil, HistoryItem, formatPlaybackTimestamp, parseSeasonNumber, WatchCTAInfo } from '../lib/history';
import { libraryManager } from '../lib/library';
import { DEFAULT_POSTER, DEFAULT_BANNER, AnimeDetails } from '../types';

export function Details() {
  const [isMatch, params] = useRoute<{id: string}>('/details/:id');
  const id = (isMatch && params) ? params.id : '';
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState(0);
  const [progressVersion, setProgressVersion] = useState(0);
  
  const { data, isLoading } = useSWR<AnimeDetails>(id ? `info-${id}` : null, () => api.getDetails(id));

  // Listen to live watch progress updates
  useEffect(() => {
    const handleProgressUpdate = () => setProgressVersion(v => v + 1);
    window.addEventListener('kinoma_progress_update', handleProgressUpdate);
    return () => window.removeEventListener('kinoma_progress_update', handleProgressUpdate);
  }, []);

  const episodes = data?.episodes || [];
  const firstEp = episodes[0];

  // Dynamic Watch CTA calculation based on progress across episodes & seasons
  const watchCTA: WatchCTAInfo = useMemo(() => {
    return historyUtil.calculateWatchCTA(id, episodes, data?.title, data?._reanimeSlug || data?.id);
  }, [id, episodes, data, progressVersion]);

  // Map of per-episode progress
  const epProgressMap = useMemo(() => {
    return historyUtil.getAnimeEpisodesProgress(id, data?._reanimeSlug || data?.id);
  }, [id, data, progressVersion]);

  // Multi-season identification & grouping
  const seasons = useMemo(() => {
    if (!episodes || episodes.length === 0) return [];

    const map = new Map<number, typeof episodes>();
    episodes.forEach((ep: any) => {
      let sNum = ep.season;
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
        episodes: seasonEpisodes
      }));
  }, [episodes, data?.title]);

  // Automatically select the season of the next unwatched episode
  useEffect(() => {
    if (watchCTA.seasonNumber) {
      setSelectedSeasonNumber(watchCTA.seasonNumber);
    } else if (seasons.length > 0) {
      setSelectedSeasonNumber(seasons[0].seasonNumber);
    }
  }, [watchCTA.seasonNumber, seasons.length]);

  useEffect(() => {
    setSelectedChunk(0);
  }, [id, selectedSeasonNumber]);

  useEffect(() => {
    if (data && data._reanimeSlug) {
      const animTitle = typeof data.title === 'string'
        ? data.title
        : data.title?.english || data.title?.romaji || id;
      const animImage = data.image || DEFAULT_POSTER;
      const animId = String(data.id || id);

      historyUtil.saveMeta(data._reanimeSlug, {
        title: animTitle,
        image: animImage,
        animeId: animId,
        seasonNumber: watchCTA.seasonNumber
      });
      
      if (data?.id) {
        setIsBookmarked(libraryManager.isInWatchlist(data.id));
        setIsCompleted(libraryManager.isCompleted(data.id));
        setIsFavorite(libraryManager.isFavorite(data.id));
      }
    }
  }, [data, watchCTA.seasonNumber, id]);

  // Listen to library updates (sync across tabs/windows)
  useEffect(() => {
    const handleLibUpdate = () => {
      if (data?.id) {
        setIsBookmarked(libraryManager.isInWatchlist(data.id));
        setIsCompleted(libraryManager.isCompleted(data.id));
        setIsFavorite(libraryManager.isFavorite(data.id));
      }
    };
    window.addEventListener('kinoma_library_update', handleLibUpdate);
    return () => window.removeEventListener('kinoma_library_update', handleLibUpdate);
  }, [data?.id]);

  const handleClearProgress = () => {
    if (data?._reanimeSlug) historyUtil.removeHistory(data._reanimeSlug);
    if (data?.id) historyUtil.removeHistory(data.id);
    if (id) historyUtil.removeHistory(id);
    setProgressVersion(v => v + 1);
  };

  const toggleWatchlist = () => {
    if (!data) return;
    const itemTitle = typeof data.title === 'string' ? data.title : (data.title?.english || data.title?.romaji || id);
    const inWatch = libraryManager.toggleWatchlist({
      id: data.id,
      title: itemTitle,
      image: data.image || DEFAULT_POSTER
    });
    setIsBookmarked(inWatch);
  };

  const toggleFavorite = () => {
    if (!data) return;
    const itemTitle = typeof data.title === 'string' ? data.title : (data.title?.english || data.title?.romaji || id);
    const inFav = libraryManager.toggleFavorite({
      id: data.id,
      title: itemTitle,
      image: data.image || DEFAULT_POSTER
    });
    setIsFavorite(inFav);
  };

  const toggleCompleted = () => {
    if (!data) return;
    const itemTitle = typeof data.title === 'string' ? data.title : (data.title?.english || data.title?.romaji || id);
    const inComp = libraryManager.toggleCompleted({
      id: data.id,
      title: itemTitle,
      image: data.image || DEFAULT_POSTER
    });
    setIsCompleted(inComp);
  };

  // Filter episodes by currently selected season
  const currentSeasonObj = seasons.find(s => s.seasonNumber === selectedSeasonNumber) || seasons[0];
  const seasonEpisodes = currentSeasonObj?.episodes || episodes;

  const CHUNK_SIZE = 100;
  const totalChunks = Math.ceil(seasonEpisodes.length / CHUNK_SIZE);
  const displayedEpisodes = seasonEpisodes.slice(selectedChunk * CHUNK_SIZE, (selectedChunk + 1) * CHUNK_SIZE);

  const title = typeof data?.title === 'string' 
    ? data.title 
    : data?.title?.english || data?.title?.romaji || 'Anime Details';
    
  const altTitle = typeof data?.title !== 'string' ? data?.title?.romaji : '';

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0e0f11] text-white flex flex-col items-center justify-center p-8">
        <AnimeLoader text="Summoning Anime Episodes..." size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold">Anime Not Found</h2>
        <Link href="/">
          <button className="px-6 py-2.5 bg-[#7b1fa2] hover:bg-[#9c27b0] rounded-xl font-bold transition-colors">
            Return Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0e0f11] min-h-screen text-white pb-24">
      {/* Hero Banner Section */}
      <div className="relative w-full h-[60vh] min-h-[450px] max-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-[#0e0f11]">
          <img 
            src={data.cover || data.image || DEFAULT_BANNER} 
            alt={title} 
            className="w-full h-full object-cover opacity-35 filter blur-sm scale-105" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f11] via-[#0e0f11]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0f11] via-[#0e0f11]/50 to-transparent" />

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto h-full flex flex-col md:flex-row items-end gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 pb-10 z-10">
          
          {/* Poster (Left) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[180px] sm:w-[220px] md:w-[260px] shrink-0 mx-auto md:mx-0 shadow-2xl rounded-xl overflow-hidden border border-white/10 hidden md:block"
          >
            <img src={data.image || DEFAULT_POSTER} alt={title} className="w-full aspect-[3/4] object-cover" />
          </motion.div>

          {/* Info (Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col gap-4 justify-end"
          >
            <div>
              {altTitle && <p className="text-gray-400 font-medium tracking-widest text-sm mb-1">{altTitle}</p>}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                {title}
              </h1>
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold drop-shadow-md mt-2">
              <span className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-white border border-white/10">
                <Star className="w-4 h-4 text-yellow-400 fill-current" /> {data.rating ? `${(data.rating / 10).toFixed(1)}/10` : 'N/A'}
              </span>
              <span className="flex items-center gap-1 text-gray-200 bg-white/5 px-2 py-1 rounded">
                <Film className="w-4 h-4 text-gray-400" /> {data.type || 'TV'} • {data.releaseDate || 'Unknown'}
              </span>
              <span className="flex items-center gap-1 text-gray-200 bg-white/5 px-2 py-1 rounded text-emerald-400">
                {data.status || 'Finished'}
              </span>
              <span className="flex items-center gap-1 text-gray-200">
                <Globe className="w-4 h-4 text-gray-400" /> Sub/Dub
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              {(data.genres || []).map((genre: string) => (
                <span key={genre} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-600/50 px-2 py-0.5 rounded-full">
                  {genre}
                </span>
              ))}
            </div>

            <p 
              className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed max-w-3xl drop-shadow-lg mt-2" 
              dangerouslySetInnerHTML={{ __html: data.description || 'No synopsis available.' }} 
            />

            {/* Cinematic CTA Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              
              {/* 1. NEVER WATCHED: Watch Now */}
              {watchCTA.type === 'watch_now' && (
                <Link href={`/watch/${encodeURIComponent(watchCTA.episode?.id || firstEp?.id || '')}?t=0&fs=1`}>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#7b1fa2] via-[#9c27b0] to-[#ba68c8] hover:from-[#6a1b9a] hover:to-[#ab47bc] text-white px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-black transition-all shadow-[0_4px_24px_rgba(156,39,176,0.45)]"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Watch Now</span>
                  </motion.button>
                </Link>
              )}

              {/* 2. PARTIALLY WATCHED: Continue Watching (e.g. Continue Watching · S2 E7 — 14:32) */}
              {watchCTA.type === 'continue_watching' && watchCTA.episode && (
                <>
                  <Link href={`/watch/${encodeURIComponent(watchCTA.episode.id)}?t=${Math.floor(watchCTA.playbackTimestamp)}&fs=1`}>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#7b1fa2] via-[#9c27b0] to-[#ba68c8] hover:from-[#6a1b9a] hover:to-[#ab47bc] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-black transition-all shadow-[0_4px_24px_rgba(156,39,176,0.45)] group relative overflow-hidden"
                    >
                      <Play className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform" />
                      <span>{watchCTA.label}</span>
                      {watchCTA.completionPercentage > 0 && (
                        <span className="text-[11px] font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/20 ml-1">
                          {Math.round(watchCTA.completionPercentage)}%
                        </span>
                      )}
                    </motion.button>
                  </Link>

                  {/* Secondary Play Ep 1 restart button if not on episode 1 */}
                  {firstEp && firstEp.id !== watchCTA.episode.id && (
                    <Link href={`/watch/${encodeURIComponent(firstEp.id)}?t=0&fs=1`}>
                      <motion.button 
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center justify-center gap-2 bg-black/40 hover:bg-white/10 text-white px-5 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all border border-white/20 backdrop-blur-md"
                      >
                        Play Ep 1
                      </motion.button>
                    </Link>
                  )}
                </>
              )}

              {/* 3. COMPLETED ANIME: Watch Again */}
              {watchCTA.type === 'watch_again' && (
                <Link href={`/watch/${encodeURIComponent(watchCTA.episode?.id || firstEp?.id || '')}?t=0`}>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#7b1fa2] via-[#9c27b0] to-[#ba68c8] hover:from-[#6a1b9a] hover:to-[#ab47bc] text-white px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-black transition-all shadow-[0_4px_24px_rgba(156,39,176,0.45)]"
                  >
                    <RotateCcw className="w-5 h-5 text-white stroke-[2.5]" />
                    <span>Watch Again</span>
                  </motion.button>
                </Link>
              )}

              {/* Fallback if no episodes */}
              {!watchCTA.episode && !firstEp && (
                <button disabled className="flex items-center justify-center gap-2 bg-white/20 text-white/50 cursor-not-allowed px-6 py-3 rounded-xl text-sm font-bold">
                  No Episodes
                </button>
              )}
              
              {/* Watchlist Bookmark Button */}
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleWatchlist}
                className={`flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all border ${isBookmarked ? 'bg-[#7b1fa2]/30 text-white border-[#9c27b0] shadow-[0_0_15px_rgba(156,39,176,0.3)] backdrop-blur-md' : 'bg-black/40 text-white border-white/20 hover:bg-white/10 backdrop-blur-md'}`}
              >
                {isBookmarked ? <Bookmark className="w-5 h-5 fill-[#c084fc] text-[#c084fc]" /> : <Plus className="w-5 h-5" strokeWidth={3} />}
                {isBookmarked ? 'In Watchlist' : 'Add to List'}
              </motion.button>

              {/* Favorite Button */}
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleFavorite}
                className={`p-3 sm:p-3.5 rounded-xl transition-all border backdrop-blur-md ${isFavorite ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-black/40 text-white border-white/20 hover:bg-white/10'}`}
                title={isFavorite ? 'Favorited' : 'Add to Favorites'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </motion.button>

              {/* Completed Button */}
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleCompleted}
                className={`p-3 sm:p-3.5 rounded-xl transition-all border backdrop-blur-md ${isCompleted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/40 text-white border-white/20 hover:bg-white/10'}`}
                title={isCompleted ? 'Completed' : 'Mark as Completed'}
              >
                <Check className={`w-5 h-5 ${isCompleted ? 'text-emerald-400 stroke-[3]' : ''}`} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* CONTINUE WATCHING BANNER (If anime has saved watch progress) */}
        {watchCTA.type === 'continue_watching' && watchCTA.episode && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-gradient-to-r from-[#1b1429] via-[#14121d] to-[#121217] border border-[#9c27b0]/40 p-5 sm:p-6 rounded-2xl shadow-[0_8px_32px_rgba(156,39,176,0.18)] relative overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7b1fa2] via-[#ba68c8] to-[#9c27b0]" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              {/* Left Details */}
              <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
                {/* Thumbnail Preview */}
                <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-black/80 shrink-0 border border-white/10 shadow-lg group">
                  <img 
                    src={watchCTA.episode.image || data.image || DEFAULT_POSTER} 
                    alt={`Resume S${watchCTA.seasonNumber} E${watchCTA.episode.number}`}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-8 h-8 rounded-full bg-[#7b1fa2] flex items-center justify-center shadow">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/85 text-[10px] font-bold text-white rounded shadow">
                    {watchCTA.formattedTimestamp}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#c084fc] bg-[#7b1fa2]/25 border border-[#9c27b0]/50 px-2 py-0.5 rounded-md">
                      CONTINUE WATCHING
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">
                      S{watchCTA.seasonNumber} E{watchCTA.episode.number} — {watchCTA.formattedTimestamp}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white line-clamp-1">
                    {watchCTA.episode.title || `Episode ${watchCTA.episode.number}`}
                  </h3>

                  {/* Progress Bar & Details */}
                  <div className="mt-2.5 max-w-md">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>{watchCTA.formattedTimestamp} / 24:00</span>
                      <span className="text-[#c084fc] font-bold">{Math.round(watchCTA.completionPercentage)}% completed</span>
                    </div>
                    <div className="w-full h-2 bg-[#261f36] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7b1fa2] via-[#9c27b0] to-[#ba68c8] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, watchCTA.completionPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <Link href={`/watch/${encodeURIComponent(watchCTA.episode.id)}?t=${Math.floor(watchCTA.playbackTimestamp)}`}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 bg-[#7b1fa2] hover:bg-[#9c27b0] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(123,31,162,0.4)] transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume S{watchCTA.seasonNumber} E{watchCTA.episode.number}</span>
                  </motion.button>
                </Link>

                <button 
                  onClick={handleClearProgress}
                  className="px-3.5 py-2.5 bg-[#1f1b29] hover:bg-[#2c243c] text-gray-400 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors"
                  title="Reset Watch Progress"
                >
                  Reset
                </button>
              </div>

            </div>
          </motion.div>
        )}
        
        {/* Episodes Section - LIST VIEW ONLY (Grid view permanently removed) */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#212126] pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">Episodes</h2>
              <span className="text-xs font-semibold text-gray-400 bg-[#1a1a22] px-2.5 py-1 rounded-full border border-[#262630]">
                {seasonEpisodes.length} Episodes
              </span>
              
              {/* Multi-Season Selector Tabs */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-1.5 bg-[#141418] p-1 rounded-xl border border-[#212126] overflow-x-auto">
                  {seasons.map((s) => (
                    <button
                      key={s.seasonNumber}
                      onClick={() => {
                        setSelectedSeasonNumber(s.seasonNumber);
                        setSelectedChunk(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedSeasonNumber === s.seasonNumber
                          ? 'bg-[#7b1fa2] text-white shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>Season {s.seasonNumber}</span>
                      <span className="text-[10px] opacity-75">({s.episodes.length})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Chunk Selector for long series */}
              {totalChunks > 1 && (
                <select 
                  value={selectedChunk}
                  onChange={(e) => setSelectedChunk(Number(e.target.value))}
                  className="bg-[#1c1c22] border border-[#212126] text-white text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-[#4a148c]"
                >
                  {Array.from({ length: totalChunks }).map((_, i) => {
                    const start = i * CHUNK_SIZE + 1;
                    const end = Math.min((i + 1) * CHUNK_SIZE, seasonEpisodes.length);
                    return <option key={i} value={i}>Episodes {start} - {end}</option>;
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Clean Interactive Episode List */}
          {displayedEpisodes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedEpisodes.map((ep: any) => {
                const epProg = epProgressMap[ep.number] || epProgressMap[ep.id];
                const isTargetContinue = watchCTA.type === 'continue_watching' && (
                  ep.id === watchCTA.episode?.id || ep.number.toString() === watchCTA.episode?.number?.toString()
                );
                const epTimestamp = epProg?.playbackTimestamp || (isTargetContinue ? watchCTA.playbackTimestamp : 0);
                const isWatched = epProg?.isCompleted || (epProg && epProg.completionPercentage >= 88);
                const progressPercent = epProg ? epProg.completionPercentage : (isTargetContinue ? watchCTA.completionPercentage : (isWatched ? 100 : 0));
                const seasonNum = ep.season || selectedSeasonNumber || watchCTA.seasonNumber || 1;
                const formattedTime = formatPlaybackTimestamp(epTimestamp);

                return (
                  <Link key={ep.id} href={`/watch/${encodeURIComponent(ep.id)}?t=${Math.floor(epTimestamp)}`}>
                    <motion.div 
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                      className={`transition-all p-3 sm:p-3.5 rounded-xl flex items-center justify-between gap-4 group cursor-pointer relative overflow-hidden transform-gpu border ${
                        isTargetContinue
                          ? 'bg-[#181423] border-2 border-[#9c27b0] shadow-[0_0_20px_rgba(156,39,176,0.3)]'
                          : 'bg-[#111115] border-[#212126] hover:border-[#9c27b0]/60 hover:bg-[#15151c]'
                      }`}
                    >
                      {/* Live Progress Bar at Bottom of Row */}
                      <div className="absolute bottom-0 left-0 h-1 bg-[#212126] w-full">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isWatched ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#7b1fa2] to-[#ba68c8]'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-4 w-full min-w-0">
                        {/* Thumbnail */}
                        <div className="w-28 sm:w-36 aspect-video rounded-lg bg-[#1c1c22] overflow-hidden shrink-0 relative">
                          <img 
                            src={ep.image || data.image || DEFAULT_POSTER} 
                            alt={`EP ${ep.number}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            loading="lazy" 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-7 h-7 fill-white" />
                          </div>
                          <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            {epTimestamp > 0 ? formattedTime : '24:00'}
                          </span>
                        </div>

                        {/* Episode Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              isTargetContinue 
                                ? 'bg-[#7b1fa2] text-white shadow-[0_0_10px_rgba(123,31,162,0.6)]' 
                                : 'bg-white/10 text-white'
                            }`}>
                              S{seasonNum} E{ep.number}
                            </span>

                            {isTargetContinue ? (
                              <span className="text-[10px] font-black text-[#c084fc] bg-[#7b1fa2]/25 border border-[#9c27b0]/50 px-2 py-0.5 rounded flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-[#c084fc]" />
                                RESUME AT {formattedTime} ({Math.round(progressPercent)}%)
                              </span>
                            ) : isWatched ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" /> WATCHED
                              </span>
                            ) : epTimestamp > 0 ? (
                              <span className="text-[10px] font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded">
                                PAUSED AT {formattedTime} ({Math.round(progressPercent)}%)
                              </span>
                            ) : null}
                          </div>

                          <h4 className={`font-bold text-sm sm:text-base truncate transition-colors ${
                            isTargetContinue ? 'text-[#c084fc]' : 'text-white group-hover:text-[#c084fc]'
                          }`}>
                            {ep.title || `Episode ${ep.number}`}
                          </h4>

                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-bold border border-gray-600/50 text-gray-400 px-1.5 py-0.5 rounded uppercase">SUB</span>
                            <span className="text-[9px] font-bold border border-gray-600/50 text-gray-400 px-1.5 py-0.5 rounded uppercase">DUB</span>
                            {epTimestamp > 0 && !isWatched && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                Saved: {formattedTime} / 24:00
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action CTA Button on Right */}
                        <div className="hidden sm:flex shrink-0 items-center pr-2">
                          <div className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isTargetContinue
                              ? 'bg-[#7b1fa2] text-white shadow-[0_0_12px_rgba(123,31,162,0.5)]'
                              : 'bg-[#1c1c24] text-gray-300 group-hover:text-white group-hover:bg-[#282834]'
                          }`}>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isTargetContinue ? `Resume (${formattedTime})` : isWatched ? 'Replay' : 'Play'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-sm py-12 text-center bg-[#111115] rounded-xl border border-[#212126]">
              No episodes available for this season.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

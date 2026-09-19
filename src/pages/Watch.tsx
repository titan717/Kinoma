import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import useSWR from 'swr';
import { api } from '../lib/api';
import { animeApi } from '../services/animeApi';
import { Play, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Bookmark, Heart, Layers, Radio, Maximize, Minimize, Tv } from 'lucide-react';
import { motion } from 'motion/react';
import { historyUtil, parseSeasonNumber } from '../lib/history';
import { libraryManager } from '../lib/library';
import { AnimeGrid } from '../components/ui/AnimeGrid';
import { DEFAULT_POSTER } from '../types';

export function Watch() {
  const [isMatch, params] = useRoute<{id: string}>('/watch/:id');
  const [, setLocation] = useLocation();
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCinemaFullscreen, setIsCinemaFullscreen] = useState(false);
  
  // Robust URL decoding - handles encoded characters like %7C for pipe
  const rawId = decodeURIComponent((isMatch && params) ? params.id : '');
  
  let initialSlug = '';
  let initialEpNum = '1';
  let initialAnilistId = '0';

  if (rawId.includes('|')) {
    const parts = rawId.split('|');
    initialSlug = parts[0] || '';
    initialEpNum = parts[1] || '1';
    initialAnilistId = parts[2] || '0';
  } else if (rawId.includes('$episode$')) {
    const parts = rawId.split('$episode$');
    initialSlug = parts[0] || '';
    initialEpNum = parts[1] || '1';
  } else {
    initialSlug = rawId;
  }

  const slug = initialSlug;
  const epNum = initialEpNum;
  const anilistId = initialAnilistId;

  const [selectedServer, setSelectedServer] = useState<string>('HD-1');
  const [selectedType, setSelectedType] = useState<'sub' | 'dub'>('sub');
  const [selectedChunk, setSelectedChunk] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch anime details
  const { data: animeData } = useSWR(slug ? `info-${slug}` : null, () => api.getDetails(slug));
  const { data: recommendationsData } = useSWR(slug ? `recs-${slug}` : null, () => api.getRecommendations(slug));

  const effectiveAnilistId = Number(anilistId) || animeData?.anilist_id || 0;

  // Fetch servers list
  const { data: serversData, isLoading: loadingServers } = useSWR(
    slug && epNum ? `servers-${slug}-${epNum}-${effectiveAnilistId}` : null,
    () => animeApi.getServers(slug, epNum, effectiveAnilistId)
  );

  const servers = serversData?.servers || [];
  const currentServer = servers.find(s => s.serverName === selectedServer && s.dataType === selectedType) || servers[0];

  // Fetch authorized stream URL
  const { data: streamData, isLoading: loadingStream } = useSWR(
    slug && epNum && currentServer ? `stream-${slug}-${epNum}-${currentServer.serverName}-${currentServer.dataType || selectedType}-${effectiveAnilistId}` : null,
    () => animeApi.getStream(slug, epNum, currentServer.serverName, currentServer.dataType || selectedType, effectiveAnilistId)
  );

  // Immediate reliable stream URL: prefer streamData.url, fallback directly to server.dataLink
  const streamUrl = streamData?.url || currentServer?.dataLink || '';

  const episodes = animeData?.episodes || [];
  const currentEpIndex = episodes.findIndex((e: any) => e.number.toString() === epNum || e.id === rawId);
  const currentEpObj = currentEpIndex !== -1 ? episodes[currentEpIndex] : null;
  const prevEp = currentEpIndex !== -1 && currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex !== -1 && currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  const getAnimeTitle = (titleObj: any, fallback = '') => {
    if (!titleObj) return fallback;
    if (typeof titleObj === 'string') return titleObj;
    return titleObj.english || titleObj.romaji || titleObj.native || fallback;
  };

  const detectedSeason = (currentEpObj as any)?.season || parseSeasonNumber(animeData?.title, 1);
  const animeTitle = getAnimeTitle(animeData?.title, slug);

  // Check Watchlist status with reactive listener
  useEffect(() => {
    if (animeData) {
      setIsBookmarked(libraryManager.isInWatchlist(animeData.id));
    }
    const handleLibUpdate = () => {
      if (animeData) setIsBookmarked(libraryManager.isInWatchlist(animeData.id));
    };
    window.addEventListener('kinoma_library_update', handleLibUpdate);
    return () => window.removeEventListener('kinoma_library_update', handleLibUpdate);
  }, [animeData]);

  const toggleWatchlist = () => {
    if (!animeData) return;
    const inWatch = libraryManager.toggleWatchlist({
      id: animeData.id,
      title: animeTitle,
      image: animeData.image || DEFAULT_POSTER
    });
    setIsBookmarked(inWatch);
  };

  // Save metadata
  useEffect(() => {
    if (slug && animeData) {
      historyUtil.saveMeta(slug, {
        title: animeTitle,
        image: currentEpObj?.image || animeData.image || '',
        animeId: animeData.id || slug,
        seasonNumber: detectedSeason
      });
    }
  }, [slug, animeData, currentEpObj, detectedSeason, animeTitle]);

  // Clean background progress tracking: quietly records watch progress without artificial UI overlays
  useEffect(() => {
    if (!slug || !epNum) return;

    const queryParams = new URLSearchParams(window.location.search);
    const timeParam = queryParams.get('t') || queryParams.get('time');
    const startSec = timeParam ? parseInt(timeParam, 10) : 0;

    // Save initial progress
    historyUtil.saveProgress(slug, rawId, epNum, startSec || 120, 1440, {
      title: animeTitle,
      image: currentEpObj?.image || animeData?.image || '',
      animeId: animeData?.id || slug,
      seasonNumber: detectedSeason
    });

    // Quiet background update every 15s
    let currentSeconds = startSec || 120;
    const interval = setInterval(() => {
      currentSeconds = Math.min(1440, currentSeconds + 15);
      historyUtil.saveProgress(slug, rawId, epNum, currentSeconds, 1440, {
        title: animeTitle,
        image: currentEpObj?.image || animeData?.image || '',
        animeId: animeData?.id || slug,
        seasonNumber: detectedSeason
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [slug, epNum, rawId, animeData, currentEpObj, detectedSeason, animeTitle]);

  const CHUNK_SIZE = 100;
  const totalChunks = Math.ceil(episodes.length / CHUNK_SIZE);
  const displayedEpisodes = episodes.slice(selectedChunk * CHUNK_SIZE, (selectedChunk + 1) * CHUNK_SIZE);

  useEffect(() => {
    if (currentEpIndex !== -1) {
      setSelectedChunk(Math.floor(currentEpIndex / CHUNK_SIZE));
    }
  }, [currentEpIndex]);

  // Default to fullscreen when requested or coming from "Watch Now" / TV mode
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hasFsParam = query.get('fs') === '1' || query.get('fullscreen') === 'true';
    const hasSessionFs = sessionStorage.getItem('kinoma_auto_fullscreen') === '1';
    const isTV = document.documentElement.classList.contains('tv-mode');

    if (hasFsParam || hasSessionFs || isTV) {
      setIsCinemaFullscreen(true);
      try {
        sessionStorage.removeItem('kinoma_auto_fullscreen');
      } catch {}

      // Attempt native DOM fullscreen if allowed by user gesture
      if (playerContainerRef.current && !document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen?.().catch(() => {
          // Native fullscreen requires direct click gesture in some browsers;
          // isCinemaFullscreen handles true edge-to-edge 100vw x 100vh cinema fallback smoothly!
        });
      }
    }
  }, []);

  // Listen to Escape / 'f' key for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && isCinemaFullscreen) {
        setIsCinemaFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCinemaFullscreen]);

  const toggleFullscreen = () => {
    if (!isCinemaFullscreen) {
      setIsCinemaFullscreen(true);
      if (playerContainerRef.current && !document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen?.().catch(() => {});
      }
    } else {
      setIsCinemaFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  return (
    <div className="w-full bg-[#08090d] min-h-screen pb-20 text-white font-sans">
      
      {/* VIDEO PLAYER CONTAINER */}
      <div className={`w-full bg-[#050508] border-b border-[#1c1c26] transition-all duration-300 ${
        isCinemaFullscreen ? 'fixed inset-0 z-50 bg-black flex flex-col justify-center' : ''
      }`}>
        <div className={`w-full mx-auto ${isCinemaFullscreen ? 'h-full max-w-none p-0 flex flex-col' : 'max-w-6xl px-0 sm:px-4 sm:py-4'}`}>
          <div 
            ref={playerContainerRef}
            className={`w-full bg-black overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-[#1a1a24] ${
              isCinemaFullscreen ? 'flex-1 h-full w-full rounded-none border-none' : 'aspect-video sm:rounded-2xl'
            }`}
          >
            {streamUrl ? (
              <iframe 
                key={streamUrl}
                src={streamUrl}
                title={`Episode ${epNum}`}
                className="w-full h-full border-0 outline-none"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b0c10] text-center p-4">
                <div className="w-10 h-10 border-3 border-[#7b1fa2]/30 border-t-[#7b1fa2] rounded-full animate-spin mb-4" />
                <p className="text-gray-300 font-bold text-sm tracking-wide">Connecting to streaming server...</p>
                <p className="text-gray-500 text-xs mt-1">Episode {epNum} • {selectedServer} • {selectedType.toUpperCase()}</p>
              </div>
            )}

            {/* Quick Fullscreen Close Floating Button when Cinema is active */}
            {isCinemaFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-40 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </button>
            )}
          </div>

          {/* Minimalist Player Controls Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0e0f15] border border-[#1c1c26] ${
            isCinemaFullscreen ? 'rounded-none border-x-0 border-b-0 shrink-0' : 'sm:rounded-xl mt-3'
          }`}>
            
            {/* Server and Audio Track Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#14141d] p-1 rounded-xl border border-[#222230]">
                <button
                  onClick={() => setSelectedType('sub')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedType === 'sub' ? 'bg-[#7b1fa2] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  SUB
                </button>
                <button
                  onClick={() => setSelectedType('dub')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedType === 'dub' ? 'bg-[#7b1fa2] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  DUB
                </button>
              </div>

              {servers.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#14141d] p-1 rounded-xl border border-[#222230]">
                  {Array.from(new Set(servers.map(s => s.serverName))).map(sName => (
                    <button
                      key={sName}
                      onClick={() => setSelectedServer(sName)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedServer === sName ? 'bg-[#7b1fa2]/30 text-[#c084fc] border border-[#9c27b0]/40' : 'text-gray-400 hover:text-white'}`}
                    >
                      {sName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episode Quick Switcher Buttons & Fullscreen Action */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14141d] hover:bg-[#1f1f2c] text-gray-300 hover:text-white text-xs font-bold border border-[#222230] transition-colors cursor-pointer"
                title={isCinemaFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isCinemaFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5 text-[#c084fc]" />}
                <span>{isCinemaFullscreen ? 'Collapse' : 'Fullscreen'}</span>
              </button>

              {prevEp && (
                <Link href={`/watch/${encodeURIComponent(prevEp.id)}?fs=1`}>
                  <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14141d] hover:bg-[#1f1f2c] text-gray-300 hover:text-white text-xs font-bold border border-[#222230] transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                </Link>
              )}

              {nextEp && (
                <Link href={`/watch/${encodeURIComponent(nextEp.id)}?fs=1`}>
                  <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#7b1fa2] hover:bg-[#9c27b0] text-white text-xs font-bold shadow-[0_2px_12px_rgba(123,31,162,0.4)] transition-all">
                    <span>Next Ep {nextEp.number}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* EPISODE DETAILS & SELECTION SECTION */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-6 flex flex-col gap-8">
        
        {/* Title and Metadata Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c1c26] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/details/${slug}`}>
                <span className="text-xs font-bold text-[#c084fc] hover:underline cursor-pointer">
                  {animeTitle}
                </span>
              </Link>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs font-semibold text-gray-400">Season {detectedSeason}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Episode {epNum}: {currentEpObj?.title || `Episode ${epNum}`}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isBookmarked 
                  ? 'bg-[#7b1fa2]/25 text-white border-[#9c27b0]/50' 
                  : 'bg-[#14141d] text-gray-300 hover:text-white border-[#222230] hover:bg-[#1b1b26]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#c084fc] text-[#c084fc]' : ''}`} />
              <span>{isBookmarked ? 'In Library' : 'Add to Library'}</span>
            </button>

            <Link href={`/details/${slug}`}>
              <button className="px-4 py-2 rounded-xl bg-[#14141d] hover:bg-[#1b1b26] text-gray-300 hover:text-white text-xs font-bold border border-[#222230] transition-colors">
                All Episodes
              </button>
            </Link>
          </div>
        </div>

        {/* EPISODES GRID SELECTOR */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Episodes</h2>
              <span className="text-xs text-gray-400 bg-[#14141d] px-2.5 py-0.5 rounded-full border border-[#222230]">
                {episodes.length} total
              </span>
            </div>

            {totalChunks > 1 && (
              <select
                value={selectedChunk}
                onChange={(e) => setSelectedChunk(Number(e.target.value))}
                className="bg-[#14141d] border border-[#222230] text-gray-200 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-[#7b1fa2] cursor-pointer"
              >
                {Array.from({ length: totalChunks }).map((_, i) => {
                  const start = i * CHUNK_SIZE + 1;
                  const end = Math.min((i + 1) * CHUNK_SIZE, episodes.length);
                  return <option key={i} value={i}>Episodes {start} - {end}</option>;
                })}
              </select>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {displayedEpisodes.map((ep: any) => {
              const isCurrent = ep.number.toString() === epNum;
              const epProg = historyUtil.getEpisodeProgress(slug, ep.number);
              const isWatched = epProg?.isCompleted || (epProg && epProg.completionPercentage >= 88);

              return (
                <Link key={ep.id} href={`/watch/${encodeURIComponent(ep.id)}`}>
                  <button
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center border cursor-pointer ${
                      isCurrent
                        ? 'bg-[#7b1fa2] text-white border-[#ba68c8] shadow-[0_0_15px_rgba(123,31,162,0.45)]'
                        : isWatched
                          ? 'bg-[#11161d] text-emerald-400 border-emerald-500/30 hover:bg-[#161d27]'
                          : 'bg-[#121219] text-gray-400 border-[#20202c] hover:text-white hover:bg-[#181822] hover:border-[#353548]'
                    }`}
                  >
                    <span>{ep.number}</span>
                    {isWatched && !isCurrent && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 absolute top-1 right-1" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ABOUT ANIME SYNOPSIS */}
        {animeData && (
          <div className="bg-[#0e0f14] border border-[#1c1c26] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
            <img 
              src={animeData.image || DEFAULT_POSTER} 
              alt={animeTitle} 
              className="w-24 sm:w-28 aspect-[3/4] object-cover rounded-xl border border-white/10 shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-2">{animeTitle}</h3>
              <p 
                className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-4"
                dangerouslySetInnerHTML={{ __html: animeData.description || 'No description available.' }} 
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {(animeData.genres || []).map((g: string) => (
                  <span key={g} className="text-[10px] font-bold text-gray-400 bg-[#161622] px-2.5 py-1 rounded-lg border border-[#242434]">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {recommendationsData?.results && recommendationsData.results.length > 0 && (
          <div className="mt-4">
            <AnimeGrid 
              title="You May Also Like" 
              items={recommendationsData.results.slice(0, 10)} 
            />
          </div>
        )}

      </div>
    </div>
  );
}

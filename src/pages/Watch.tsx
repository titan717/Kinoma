import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import useSWR from 'swr';
import { api } from '../lib/api';
import { animeApi } from '../services/animeApi';
import { 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Bookmark, 
  Heart, 
  Maximize, 
  Minimize, 
  Tv, 
  Volume2, 
  Wifi, 
  WifiOff, 
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { historyUtil, parseSeasonNumber } from '../lib/history';
import { libraryManager } from '../lib/library';
import { preferencesUtil } from '../lib/preferences';
import { updateSEO } from '../lib/seo';
import { useTVMode } from '../lib/TVModeContext';
import { AnimeGrid } from '../components/ui/AnimeGrid';
import { AnimeItem, DEFAULT_POSTER } from '../types';
import { TVPlayerOSD } from '../components/tv/TVPlayerOSD';

export function Watch() {
  const [isMatch, params] = useRoute<{id: string}>('/watch/:id');
  const [, setLocation] = useLocation();
  const { isTVMode } = useTVMode();
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  
  // Decoding parameter
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

  // Parse query parameters for ep or anilist if present
  const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const searchEp = queryParams.get('ep') || queryParams.get('episode');
  const searchAnilist = queryParams.get('anilist') || queryParams.get('anilist_id');

  const slug = initialSlug;
  const epNum = searchEp || initialEpNum;
  const anilistId = (searchAnilist && searchAnilist !== '0') ? searchAnilist : initialAnilistId;

  // Local preferences: Audio (sub/dub) and Server with per-anime memory
  const [selectedType, setSelectedType] = useState<'sub' | 'dub'>(() => {
    return preferencesUtil.getAudioPreference(slug);
  });
  const [selectedServer, setSelectedServer] = useState<string>(() => {
    return preferencesUtil.getServerPreference(slug);
  });

  const [isCinemaFullscreen, setIsCinemaFullscreen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [showNetworkNotice, setShowNetworkNotice] = useState(false);

  // TV Player Accordion OSD State
  const [isTVDrawerOpen, setIsTVDrawerOpen] = useState(false);
  const [expandedTVSeason, setExpandedTVSeason] = useState<number>(1);
  const [tvFocusedEpIndex, setTvFocusedEpIndex] = useState<number>(0);

  // Fetch Anime details & recommendations
  const { data: animeData } = useSWR(slug ? `info-${slug}` : null, () => api.getDetails(slug));
  const { data: recommendationsData } = useSWR(slug ? `recs-${slug}` : null, () => api.getRecommendations(slug));

  const effectiveAnilistId = Number(anilistId) || animeData?.anilist_id || 0;

  // Fetch servers list
  const { data: serversData, isLoading: loadingServers } = useSWR(
    slug && epNum ? `servers-${slug}-${epNum}-${effectiveAnilistId}` : null,
    () => animeApi.getServers(slug, epNum, effectiveAnilistId)
  );

  const servers = serversData?.servers || [];
  const currentServer = servers.find(s => s.serverName === selectedServer && s.dataType === selectedType) 
    || servers.find(s => s.dataType === selectedType) 
    || servers[0];

  // Fetch stream URL
  const { data: streamData, isLoading: loadingStream } = useSWR(
    slug && epNum && currentServer ? `stream-${slug}-${epNum}-${currentServer.serverName}-${currentServer.dataType || selectedType}-${effectiveAnilistId}` : null,
    () => animeApi.getStream(
      slug, 
      epNum, 
      currentServer.serverName, 
      currentServer.dataType || selectedType, 
      effectiveAnilistId,
      currentServer.dataLink
    ),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  const streamUrl = (streamData && streamData.url) ? streamData.url : (currentServer?.dataLink || '');
  const isDirectMedia = /\.(m3u8|mp4|webm)(?:\?|$)/i.test(streamUrl);

  const episodes = animeData?.episodes || [];
  const currentEpIndex = episodes.findIndex((e: any) => e.number.toString() === epNum || e.id === rawId);
  const currentEpObj = currentEpIndex !== -1 ? episodes[currentEpIndex] : null;
  const prevEp = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex !== -1 && currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  const animeTitle = animeData 
    ? (typeof animeData.title === 'string' ? animeData.title : animeData.title?.english || animeData.title?.romaji || slug)
    : slug;

  const detectedSeason = (currentEpObj as any)?.season || parseSeasonNumber(animeData?.title, 1);
  const isMovie = animeData?.type === 'Movie' || episodes.length <= 1;

  // Update SEO for the active episode
  useEffect(() => {
    if (animeTitle) {
      updateSEO({
        title: `Episode ${epNum} — ${animeTitle}`,
        description: `Watch ${animeTitle} Episode ${epNum} streaming in HD on Kinoma with subtitle and audio options.`,
        image: currentEpObj?.image || animeData?.image,
        type: 'video.episode'
      });
    }
  }, [animeTitle, epNum, currentEpObj, animeData]);

  // Save Audio & Subtitle memory when user changes them
  const handleSelectType = (type: 'sub' | 'dub') => {
    setSelectedType(type);
    preferencesUtil.setAudioPreference(type, slug);
  };

  const handleSelectServer = (srv: string) => {
    setSelectedServer(srv);
    preferencesUtil.setServerPreference(srv, slug);
  };

  // Check Watchlist status
  useEffect(() => {
    if (animeData) {
      setIsBookmarked(libraryManager.isInWatchlist(animeData.id || slug));
    }
  }, [animeData, slug]);

  const toggleWatchlist = () => {
    if (!animeData) return;
    const inWatch = libraryManager.toggleWatchlist({
      id: animeData.id || slug,
      title: animeTitle,
      image: animeData.image || DEFAULT_POSTER
    });
    setIsBookmarked(inWatch);
  };

  // Continuous background watch progress tracking
  useEffect(() => {
    if (!slug || !epNum) return;

    const queryParams = new URLSearchParams(window.location.search);
    const timeParam = queryParams.get('t') || queryParams.get('time');
    const startSec = timeParam ? parseInt(timeParam, 10) : 0;

    historyUtil.saveProgress(slug, rawId, epNum, startSec || 120, 1440, {
      title: animeTitle,
      image: currentEpObj?.image || animeData?.image || '',
      animeId: animeData?.id || slug,
      seasonNumber: detectedSeason
    });

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

  // Network Quality Monitoring (subtle latency / buffer test)
  useEffect(() => {
    let active = true;
    const checkNetwork = async () => {
      const start = Date.now();
      try {
        await fetch('https://kinomaapi.vercel.app/health', { cache: 'no-store' });
        const latency = Date.now() - start;
        if (!active) return;
        if (latency < 450) {
          setNetworkQuality('excellent');
          setShowNetworkNotice(false);
        } else if (latency < 1200) {
          setNetworkQuality('good');
          setShowNetworkNotice(false);
        } else {
          setNetworkQuality('poor');
          setShowNetworkNotice(true);
        }
      } catch {
        if (active) {
          setNetworkQuality('poor');
          setShowNetworkNotice(true);
        }
      }
    };

    checkNetwork();
    const netInterval = setInterval(checkNetwork, 45000);
    return () => {
      active = false;
      clearInterval(netInterval);
    };
  }, []);

  // FULLSCREEN RULE:
  // On desktop / mobile / tablet, DO NOT automatically enter fullscreen!
  // ONLY TV UI defaults to fullscreen.
  useEffect(() => {
    if (isTVMode) {
      setIsCinemaFullscreen(true);
    }
  }, [isTVMode]);

  // TV remote: any D-pad interaction reveals the master OSD.
  // The OSD itself owns drawer navigation. Back closes the OSD/drawer first.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!isTVMode) toggleFullscreen();
        return;
      }

      if (e.key === 'Escape' && isCinemaFullscreen && !isTVMode) {
        setIsCinemaFullscreen(false);
        return;
      }

      if (!isTVMode) return;

      const isDpad = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
      const isSelect = e.key === 'Enter' || e.key === ' ';
      const isBack = e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009 || e.keyCode === 461;

      if (isBack) {
        if (isTVDrawerOpen) setIsTVDrawerOpen(false);
        else setIsCinemaFullscreen(false);
        return;
      }

      if (isDpad) {
        setIsTVDrawerOpen(true);
        return;
      }

      if (isSelect && !isTVDrawerOpen && isDirectMedia && videoRef.current) {
        e.preventDefault();
        if (videoRef.current.paused) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCinemaFullscreen, isTVMode, isTVDrawerOpen, isDirectMedia]);

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

  // Multi-season breakdown for TV accordion drawer
  const seasonsList = useMemo(() => {
    if (animeData?.seasons && animeData.seasons.length > 0) {
      return animeData.seasons;
    }
    return [{ seasonNumber: detectedSeason, title: `Season ${detectedSeason}`, episodeCount: episodes.length }];
  }, [animeData?.seasons, detectedSeason, episodes.length]);

  return (
    <div className={`w-full bg-[#07080c] min-h-screen text-white font-sans ${isTVMode ? 'tv-player-view' : 'pb-20'}`}>
      
      {/* VIDEO PLAYER CONTAINER */}
      <div className={`w-full bg-black transition-all duration-300 ${
        isCinemaFullscreen || isTVMode ? 'fixed inset-0 z-50 flex flex-col justify-center' : 'border-b border-white/10'
      }`}>
        <div className={`w-full mx-auto ${isCinemaFullscreen || isTVMode ? 'h-full max-w-none p-0 flex flex-col' : 'max-w-6xl px-0 sm:px-4 sm:py-4'}`}>
          <div 
            ref={playerContainerRef}
            className={`w-full bg-black overflow-hidden relative border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] ${
              isCinemaFullscreen || isTVMode ? 'flex-1 h-full w-full rounded-none border-none' : 'aspect-video sm:rounded-2xl'
            }`}
          >
            {streamUrl ? (
              isDirectMedia ? (
                <video
                  ref={videoRef}
                  key={streamUrl}
                  src={streamUrl}
                  className="h-full w-full bg-black object-contain"
                  playsInline
                  autoPlay
                  controls={false}
                  onLoadedMetadata={(e) => {
                    setPlayerDuration(e.currentTarget.duration || 0);
                    const start = Number(new URLSearchParams(window.location.search).get('t') || 0);
                    if (start > 0 && Number.isFinite(start)) e.currentTarget.currentTime = start;
                  }}
                  onTimeUpdate={(e) => setPlayerCurrentTime(e.currentTarget.currentTime || 0)}
                  onPlay={() => setIsPlayerPlaying(true)}
                  onPause={() => setIsPlayerPlaying(false)}
                  onDurationChange={(e) => setPlayerDuration(e.currentTarget.duration || 0)}
                  onClick={(e) => {
                    if (e.currentTarget.paused) e.currentTarget.play().catch(() => {});
                    else e.currentTarget.pause();
                  }}
                />
              ) : (
                <iframe
                  key={streamUrl}
                  src={streamUrl}
                  title={'Episode ' + epNum}
                  className="w-full h-full border-0 outline-none"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#090a10] text-center p-4">
                <div className="w-10 h-10 border-3 border-[#7b1fa2]/30 border-t-[#7b1fa2] rounded-full animate-spin mb-4" />
                <p className="text-gray-200 font-bold text-sm tracking-wide">Connecting to stream...</p>
                <p className="text-gray-400 text-xs mt-1">Episode {epNum} • {selectedServer} • {selectedType.toUpperCase()}</p>
              </div>
            )}

            {/* Subtle Network Quality Indicator in player corner */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-gray-300">
              <span className={`w-2 h-2 rounded-full ${
                networkQuality === 'excellent' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' :
                networkQuality === 'good' ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
              }`} />
              <span className="capitalize">{networkQuality}</span>
            </div>

            {/* Unstable Connection Notice (subtle, non-interrupting) */}
            {showNetworkNotice && (
              <div className="absolute top-12 left-3 z-30 max-w-xs px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg">
                <span>Connection is unstable. Changing server or audio may improve playback.</span>
                <button onClick={() => setShowNetworkNotice(false)} className="text-gray-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Exit Fullscreen Button for normal desktop/mobile cinema mode */}
            {isCinemaFullscreen && !isTVMode && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 z-40 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </button>
            )}


          </div>

          {/* Minimalist Web Player Controls Bar */}
          {!isTVMode && (
            <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0d0e15] border border-white/10 ${
              isCinemaFullscreen ? 'rounded-none border-x-0 border-b-0 shrink-0' : 'sm:rounded-xl mt-3'
            }`}>
              
              {/* Audio Track & Server Selectors (with persistent memory) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-[#141520] p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => handleSelectType('sub')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedType === 'sub' ? 'bg-[#7b1fa2] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    SUB
                  </button>
                  <button
                    onClick={() => handleSelectType('dub')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedType === 'dub' ? 'bg-[#7b1fa2] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    DUB
                  </button>
                </div>

                {servers.length > 0 && (
                  <div className="flex items-center gap-1 bg-[#141520] p-1 rounded-xl border border-white/10">
                    {Array.from(new Set(servers.map(s => s.serverName))).map(sName => (
                      <button
                        key={sName}
                        onClick={() => handleSelectServer(sName)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedServer === sName ? 'bg-[#7b1fa2]/30 text-[#c084fc] border border-[#ba68c8]/40' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {sName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Prev / Next Episode & Fullscreen Toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141520] hover:bg-[#1c1e2e] text-gray-300 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isCinemaFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5 text-[#c084fc]" />}
                  <span>{isCinemaFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </button>

                {prevEp && (
                  <Link href={`/watch/${encodeURIComponent(prevEp.id)}`}>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#141520] hover:bg-[#1c1e2e] text-gray-300 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                  </Link>
                )}

                {nextEp && (
                  <Link href={`/watch/${encodeURIComponent(nextEp.id)}`}>
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7b1fa2] hover:bg-[#9c27b0] text-white text-xs font-bold shadow-md transition-all cursor-pointer">
                      <span>Next Ep {nextEp.number}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MASTER 10-FOOT TV PLAYER OSD */}
      {isTVMode && (
        <TVPlayerOSD
          animeTitle={animeTitle}
          episodeNumber={`E${epNum}`}
          episodeTitle={currentEpObj?.title}
          currentEpisodeIndex={currentEpIndex}
          episodes={episodes}
          seasons={seasonsList}
          currentSeason={Number(detectedSeason) || 1}
          recommendations={recommendationsData?.results || []}
          isMovie={isMovie}
          isOpen={isTVDrawerOpen}
          onClose={() => setIsTVDrawerOpen(false)}
          onBack={() => setLocation(`/details/${encodeURIComponent(slug)}`)}
          onPlayEpisode={(episodeId, timestamp = 0) => {
            setIsTVDrawerOpen(false);
            setLocation(`/watch/${encodeURIComponent(episodeId)}?t=${Math.floor(timestamp)}&fs=1`);
          }}
          selectedType={selectedType}
          onSelectType={handleSelectType}
          servers={servers}
          selectedServer={selectedServer}
          onSelectServer={handleSelectServer}
          currentTime={playerCurrentTime}
          duration={playerDuration}
          isPlaying={isPlayerPlaying}
          onTogglePlay={() => {
            if (videoRef.current) {
              if (videoRef.current.paused) videoRef.current.play().catch(() => {});
              else videoRef.current.pause();
            }
          }}
          onSeek={(time) => {
            if (videoRef.current) {
              videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration || time));
            }
          }}
        />
      )}

      {/* WEB PLAYER: DETAIL & EPISODE SELECTOR SECTION */}
      {!isTVMode && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-6 flex flex-col gap-8">
          
          {/* Header Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
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

            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleWatchlist}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isBookmarked
                    ? 'bg-[#7b1fa2]/25 text-white border-[#ba68c8]/50'
                    : 'bg-[#141520] text-gray-300 hover:text-white border-white/10 hover:bg-[#1b1c2b]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#c084fc] text-[#c084fc]' : ''}`} />
                <span>{isBookmarked ? 'In List' : 'Add to List'}</span>
              </button>

              <Link href={`/details/${slug}`}>
                <button className="px-4 py-2 rounded-xl bg-[#141520] hover:bg-[#1b1c2b] text-gray-300 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer">
                  All Episodes
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Episode Grid */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">All Episodes</h2>
              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                {episodes.length} total
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {episodes.map((ep: any) => {
                const isCurrent = ep.number.toString() === epNum;
                const epProg = historyUtil.getEpisodeProgress(slug, ep.number);
                const isWatched = epProg?.isCompleted || (epProg && epProg.completionPercentage >= 85);

                return (
                  <Link key={ep.id} href={`/watch/${encodeURIComponent(ep.id)}`}>
                    <button
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center border cursor-pointer ${
                        isCurrent
                          ? 'bg-[#7b1fa2] text-white border-[#ba68c8] shadow-[0_0_15px_rgba(123,31,162,0.45)]'
                          : isWatched
                            ? 'bg-[#111818] text-emerald-400 border-emerald-500/30 hover:bg-[#162020]'
                            : 'bg-[#12131c] text-gray-400 border-white/5 hover:text-white hover:bg-[#181926] hover:border-white/15'
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

          {/* Recommendations */}
          {recommendationsData?.results && recommendationsData.results.length > 0 && (
            <div className="mt-4">
              <AnimeGrid 
                title="You May Also Like" 
                items={recommendationsData.results.slice(0, 10)} 
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}

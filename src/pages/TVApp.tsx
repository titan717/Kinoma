import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { useLocation } from 'wouter';
import { api } from '../lib/api';
import { AnimeItem } from '../types';
import { historyUtil, HistoryItem } from '../lib/history';
import { libraryManager, LibraryItem } from '../lib/library';
import { useTVMode } from '../lib/TVModeContext';
import { TVSidebar, TVNavSection, TV_NAV_ITEMS } from '../components/tv/TVSidebar';
import { TVHero } from '../components/tv/TVHero';
import { TVContentRow } from '../components/tv/TVContentRow';
import { TVSearchView } from '../components/tv/TVSearchView';
import { TVDetailsView } from '../components/tv/TVDetailsView';
import { TVVirtualRemote } from '../components/tv/TVVirtualRemote';
import { 
  Compass, 
  Settings as SettingsIcon, 
  Volume2, 
  Monitor, 
  Check, 
  Bookmark, 
  Sparkles,
  Layers,
  ArrowLeft,
  Tv
} from 'lucide-react';

function franchiseKey(item: AnimeItem): string {
  const raw = typeof item.title === 'string'
    ? item.title
    : item.title?.english || item.title?.romaji || item.id;

  return raw
    .toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\b(the\s+)?final\s+(season|chapters?)\b/g, ' ')
    .replace(/\bseason\s*\d+(?:\s*part\s*\d+)?\b/g, ' ')
    .replace(/\bpart\s*\d+\b/g, ' ')
    .replace(/\b(?:cour|arc)\s*\d+\b/g, ' ')
    .replace(/\b(?:ova|ona|special)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function groupFranchises(items: AnimeItem[]): AnimeItem[] {
  const groups = new Map<string, AnimeItem>();

  for (const item of items) {
    const key = franchiseKey(item);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, item);
      continue;
    }

    // Keep the richest representative so the card points at the franchise
    // while retaining the best available artwork/metadata.
    const existingScore =
      Number((existing as any).popularity || 0) +
      Number((existing as any).season_year || 0) +
      (existing.description ? 10 : 0);

    const itemScore =
      Number((item as any).popularity || 0) +
      Number((item as any).season_year || 0) +
      (item.description ? 10 : 0);

    if (itemScore > existingScore) groups.set(key, item);
  }

  return Array.from(groups.values());
}

export function TVApp() {
  const [, setLocation] = useLocation();
  const { isTVMode, setTVMode } = useTVMode();

  useEffect(() => {
    console.log('TVApp mounted');
  }, []);

  // Primary TV Navigation Views
  const [activeSection, setActiveSection] = useState<TVNavSection>('home');
  const [selectedDetailsAnime, setSelectedDetailsAnime] = useState<AnimeItem | null>(null);

  // Spatial TV Focus Model
  // Area: 'sidebar' | 'hero' | 'rows'
  const [focusArea, setFocusArea] = useState<'sidebar' | 'hero' | 'rows'>('hero');
  const [sidebarFocusedIndex, setSidebarFocusedIndex] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  const [heroButtonIndex, setHeroButtonIndex] = useState(0); // 0: Play, 1: My List, 2: Details
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  // Fetch Data with SWR
  const { data: trendingData } = useSWR('tv_trending', api.getTrending, { dedupingInterval: 60000 });
  const { data: popularData } = useSWR('tv_popular', api.getPopular, { dedupingInterval: 60000 });
  const { data: newSeasonData } = useSWR('tv_new_season', () => api.searchPaged('action', 18, 0), { dedupingInterval: 60000 });
  const { data: moviesData } = useSWR('tv_movies', () => api.searchPaged('movie', 18, 0), { dedupingInterval: 60000 });

  // Continue Watching History
  const [continueWatchingItems, setContinueWatchingItems] = useState<HistoryItem[]>([]);
  const [savedWatchlist, setSavedWatchlist] = useState<LibraryItem[]>([]);

  const refreshUserData = useCallback(() => {
    setContinueWatchingItems(historyUtil.getHistory());
    setSavedWatchlist(libraryManager.getWatchlist());
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData, activeSection]);

  const trending = useMemo(() => groupFranchises(trendingData?.results || []), [trendingData]);
  const popular = useMemo(() => groupFranchises(popularData?.results || []), [popularData]);
  const newEpisodes = useMemo(() => groupFranchises(newSeasonData?.results || []), [newSeasonData]);
  const movies = useMemo(() => moviesData?.results || [], [moviesData]);

  // Transform Watchlist items to AnimeItem format for TV rows
  const watchlistAsAnime: AnimeItem[] = useMemo(() => {
    return savedWatchlist.map(w => ({
      id: w.id,
      title: w.title,
      image: w.image,
      cover: w.image,
      genres: []
    }));
  }, [savedWatchlist]);

  // Dynamic hero: use live catalog metadata, never a hardcoded title.
  // Prefer currently airing/recently released high-popularity series.
  const heroItem = useMemo(() => {
    const list = [...trending, ...popular];
    const unique = Array.from(new Map(list.map(item => [item.id, item])).values());
    const seriesOnly = unique.filter(item => {
      const format = String((item as any).format || (item as any).type || '').toLowerCase();
      return format !== 'movie' && format !== 'special' && format !== 'ova' && format !== 'ona';
    });
    return [...seriesOnly].sort((a: any, b: any) => {
      const yearDiff = Number(b.season_year || 0) - Number(a.season_year || 0);
      if (yearDiff !== 0) return yearDiff;
      return Number(b.popularity || 0) - Number(a.popularity || 0);
    })[0] || seriesOnly[0] || unique[0] || null;
  }, [trending, popular]);

  // Dynamic Row Configuration for Current Section
  const contentRows = useMemo(() => {
    if (activeSection === 'home') {
      const rows = [];
      if (continueWatchingItems.length > 0) {
        rows.push({
          id: 'continue_watching',
          title: 'Continue Watching',
          subtitle: 'Resume where you left off',
          isContinueWatching: true,
          historyItems: continueWatchingItems,
          items: []
        });
      }
      if (trending.length > 0) {
        rows.push({
          id: 'trending',
          title: 'Trending Now',
          subtitle: 'Most-watched series this week',
          isContinueWatching: false,
          historyItems: [],
          items: trending
        });
      }
      if (newEpisodes.length > 0) {
        rows.push({
          id: 'new_episodes',
          title: 'New Episodes',
          subtitle: 'Freshly aired simulcasts',
          isContinueWatching: false,
          historyItems: [],
          items: newEpisodes
        });
      }
      if (popular.length > 0) {
        rows.push({
          id: 'recommended',
          title: 'Recommended For You',
          subtitle: 'Based on community favorites',
          isContinueWatching: false,
          historyItems: [],
          items: popular
        });
      }
      return rows;
    }

    if (activeSection === 'mylist') {
      return [
        {
          id: 'mylist_row',
          title: 'My List',
          subtitle: `${watchlistAsAnime.length} titles saved`,
          isContinueWatching: false,
          historyItems: [],
          items: watchlistAsAnime
        }
      ];
    }

    if (activeSection === 'movies') {
      return [
        {
          id: 'movies_row',
          title: 'Featured Anime Movies',
          subtitle: 'Full-length cinematic anime films',
          isContinueWatching: false,
          historyItems: [],
          items: movies
        }
      ];
    }

    if (activeSection === 'new_season') {
      return [
        {
          id: 'new_season_row',
          title: 'New Season Anime',
          subtitle: 'Current seasonal releases',
          isContinueWatching: false,
          historyItems: [],
          items: newEpisodes
        }
      ];
    }

    if (activeSection === 'genres') {
      return [
        {
          id: 'genre_action',
          title: 'Action & Adventure',
          subtitle: 'High-octane battles',
          isContinueWatching: false,
          historyItems: [],
          items: trending
        },
        {
          id: 'genre_popular',
          title: 'Top Rated Across All Genres',
          subtitle: 'Must-watch masterpieces',
          isContinueWatching: false,
          historyItems: [],
          items: popular
        }
      ];
    }

    return [];
  }, [activeSection, continueWatchingItems, trending, newEpisodes, popular, movies, watchlistAsAnime]);

  // Navigate to Player with Default Fullscreen
  const handleLaunchWatch = (episodeOrAnimeId: string, timestamp = 0) => {
    try {
      sessionStorage.setItem('kinoma_auto_fullscreen', '1');
    } catch {}
    setLocation(`/watch/${encodeURIComponent(episodeOrAnimeId)}?t=${Math.floor(timestamp)}&fs=1`);
  };

  // Select Card Action
  const handleSelectCard = (rowIndex: number, cardIndex: number) => {
    const row = contentRows[rowIndex];
    if (!row) return;

    if (row.isContinueWatching) {
      const hItem = row.historyItems[cardIndex];
      if (hItem) {
        handleLaunchWatch(hItem.episodeId || hItem.slug, hItem.playbackTimestamp);
      }
    } else {
      const anime = row.items[cardIndex];
      if (anime) {
        setSelectedDetailsAnime(anime);
      }
    }
  };

  // D-Pad Remote Navigation System
  const handleRemoteDirection = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (selectedDetailsAnime || activeSection === 'search') return;

    if (dir === 'left') {
      if (focusArea === 'sidebar') {
        // Already in sidebar, ignore
      } else if (focusArea === 'hero') {
        if (heroButtonIndex > 0) {
          setHeroButtonIndex(prev => prev - 1);
        } else {
          setFocusArea('sidebar');
          setIsSidebarExpanded(true);
        }
      } else if (focusArea === 'rows') {
        if (focusedCardIndex > 0) {
          setFocusedCardIndex(prev => prev - 1);
        } else {
          setFocusArea('sidebar');
          setIsSidebarExpanded(true);
        }
      }
    } else if (dir === 'right') {
      if (focusArea === 'sidebar') {
        setIsSidebarExpanded(false);
        setFocusArea(activeSection === 'home' ? 'hero' : 'rows');
        setHeroButtonIndex(0);
        setFocusedCardIndex(0);
      } else if (focusArea === 'hero') {
        if (heroButtonIndex < 2) {
          setHeroButtonIndex(prev => prev + 1);
        }
      } else if (focusArea === 'rows') {
        const currentRow = contentRows[focusedRowIndex];
        const count = currentRow?.isContinueWatching ? currentRow.historyItems.length : (currentRow?.items.length || 0);
        if (focusedCardIndex < count - 1) {
          setFocusedCardIndex(prev => prev + 1);
        }
      }
    } else if (dir === 'up') {
      if (focusArea === 'sidebar') {
        if (sidebarFocusedIndex > 0) {
          setSidebarFocusedIndex(prev => prev - 1);
        }
      } else if (focusArea === 'rows') {
        if (focusedRowIndex > 0) {
          setFocusedRowIndex(prev => prev - 1);
          setFocusedCardIndex(0);
        } else if (activeSection === 'home') {
          setFocusArea('hero');
          setHeroButtonIndex(0);
        }
      }
    } else if (dir === 'down') {
      if (focusArea === 'sidebar') {
        if (sidebarFocusedIndex < TV_NAV_ITEMS.length) {
          setSidebarFocusedIndex(prev => prev + 1);
        }
      } else if (focusArea === 'hero') {
        if (contentRows.length > 0) {
          setFocusArea('rows');
          setFocusedRowIndex(0);
          setFocusedCardIndex(0);
        }
      } else if (focusArea === 'rows') {
        if (focusedRowIndex < contentRows.length - 1) {
          setFocusedRowIndex(prev => prev + 1);
          setFocusedCardIndex(0);
        }
      }
    }
  }, [focusArea, heroButtonIndex, focusedCardIndex, focusedRowIndex, sidebarFocusedIndex, activeSection, contentRows, selectedDetailsAnime]);

  const handleRemoteEnter = useCallback(() => {
    if (selectedDetailsAnime || activeSection === 'search') return;

    if (focusArea === 'sidebar') {
      if (sidebarFocusedIndex === TV_NAV_ITEMS.length) {
        setTVMode(false);
        setLocation('/');
      } else {
        const selected = TV_NAV_ITEMS[sidebarFocusedIndex];
        if (selected) {
          setActiveSection(selected.id);
          setIsSidebarExpanded(false);
          setFocusArea('rows');
          setFocusedRowIndex(0);
          setFocusedCardIndex(0);
        }
      }
    } else if (focusArea === 'hero' && heroItem) {
      if (heroButtonIndex === 0) {
        handleLaunchWatch(heroItem.id, 0);
      } else if (heroButtonIndex === 1) {
        libraryManager.toggleWatchlist({
          id: heroItem.id,
          title: typeof heroItem.title === 'string' ? heroItem.title : heroItem.title?.english || '',
          image: heroItem.image || ''
        });
        refreshUserData();
      } else if (heroButtonIndex === 2) {
        setSelectedDetailsAnime(heroItem);
      }
    } else if (focusArea === 'rows') {
      handleSelectCard(focusedRowIndex, focusedCardIndex);
    }
  }, [focusArea, sidebarFocusedIndex, heroButtonIndex, focusedRowIndex, focusedCardIndex, heroItem, activeSection, selectedDetailsAnime, setTVMode, setLocation, refreshUserData, contentRows]);

  const handleRemoteBack = useCallback(() => {
    if (selectedDetailsAnime || activeSection === 'search') return;

    if (focusArea !== 'sidebar') {
      setFocusArea('sidebar');
      setIsSidebarExpanded(true);
    } else {
      setTVMode(false);
      setLocation('/');
    }
  }, [focusArea, selectedDetailsAnime, activeSection, setTVMode, setLocation]);

  const handleRemoteHome = useCallback(() => {
    setSelectedDetailsAnime(null);
    setActiveSection('home');
    setFocusArea('hero');
    setIsSidebarExpanded(false);
    setHeroButtonIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedDetailsAnime || activeSection === 'search') return;

      if (e.key === 'ArrowLeft') handleRemoteDirection('left');
      else if (e.key === 'ArrowRight') handleRemoteDirection('right');
      else if (e.key === 'ArrowUp') handleRemoteDirection('up');
      else if (e.key === 'ArrowDown') handleRemoteDirection('down');
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRemoteEnter();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        handleRemoteBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRemoteDirection, handleRemoteEnter, handleRemoteBack, selectedDetailsAnime, activeSection]);

  // Render TV Details Overlay if selected
  if (selectedDetailsAnime) {
    return (
      <TVDetailsView
        animeId={selectedDetailsAnime.id}
        initialItem={selectedDetailsAnime}
        onPlayEpisode={(epId, timestamp = 0) => handleLaunchWatch(epId, timestamp)}
        onBack={() => setSelectedDetailsAnime(null)}
      />
    );
  }

  // Render TV Search Screen if activeSection is 'search'
  if (activeSection === 'search') {
    return (
      <div className="w-full min-h-screen bg-[#07080d] flex">
        <TVSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            setIsSidebarExpanded(false);
          }}
          isFocused={focusArea === 'sidebar'}
          focusedIndex={sidebarFocusedIndex}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
          onExitTVMode={() => {
            setTVMode(false);
            setLocation('/');
          }}
        />
        <div className="flex-1 ml-20">
          <TVSearchView
            onSelectAnime={(anime) => setSelectedDetailsAnime(anime)}
            onBackToSidebar={() => {
              setActiveSection('home');
              setFocusArea('sidebar');
              setIsSidebarExpanded(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Render TV Settings if activeSection is 'settings'
  if (activeSection === 'settings') {
    return (
      <div className="w-full min-h-screen bg-[#07080d] flex text-white font-sans select-none">
        <TVSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            setIsSidebarExpanded(false);
          }}
          isFocused={focusArea === 'sidebar'}
          focusedIndex={sidebarFocusedIndex}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
          onExitTVMode={() => {
            setTVMode(false);
            setLocation('/');
          }}
        />

        <div className="flex-1 ml-20 p-10 lg:p-16 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] mb-8">
            Android TV Settings
          </h1>

          <div className="flex flex-col gap-6">
            {/* Audio Language Preference */}
            <div className="p-6 bg-[#11121c] border border-[#212232] rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Volume2 className="w-6 h-6 text-[#c084fc]" />
                <div>
                  <h3 className="text-lg font-bold text-white">Default Audio Track</h3>
                  <p className="text-xs text-gray-400">Preferred streaming audio format</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#181926] p-1.5 rounded-2xl border border-white/5">
                <span className="px-4 py-1.5 rounded-xl bg-purple-900/60 text-white font-bold text-xs border border-purple-500/40">
                  SUB (Japanese)
                </span>
              </div>
            </div>

            {/* Video Resolution */}
            <div className="p-6 bg-[#11121c] border border-[#212232] rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Monitor className="w-6 h-6 text-[#c084fc]" />
                <div>
                  <h3 className="text-lg font-bold text-white">TV Playback Engine</h3>
                  <p className="text-xs text-gray-400">Default to 4K Ultra HD Fullscreen</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[#4ade80] text-xs font-bold bg-[#22c55e]/20 px-3 py-1.5 rounded-xl border border-[#22c55e]/40">
                <Check className="w-3.5 h-3.5" /> Enabled
              </span>
            </div>

            {/* Exit TV Mode button */}
            <div className="p-6 bg-[#11121c] border border-[#212232] rounded-3xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Display Mode</h3>
                <p className="text-xs text-gray-400">Switch back to standard web/desktop interface</p>
              </div>
              <button
                onClick={() => {
                  setTVMode(false);
                  setLocation('/');
                }}
                className="px-6 py-3 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 transition-all cursor-pointer"
              >
                Exit TV Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Master TV Home & Catalog Browser
  return (
    <div className="w-full min-h-screen bg-[#07080d] text-white font-sans select-none overflow-x-hidden flex">
      {/* 1. Sleek Collapsible Sidebar Rail */}
      <TVSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setIsSidebarExpanded(false);
          setFocusArea(sec === 'home' ? 'hero' : 'rows');
          setFocusedRowIndex(0);
          setFocusedCardIndex(0);
        }}
        isFocused={focusArea === 'sidebar'}
        focusedIndex={sidebarFocusedIndex}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        onExitTVMode={() => {
          setTVMode(false);
          setLocation('/');
        }}
      />

      {/* 2. Main 10-Foot Content Canvas */}
      <main className="flex-1 ml-20 flex flex-col pb-24 transition-all duration-250">
        {/* Large Cinematic Hero on Home */}
        {activeSection === 'home' && (
          <TVHero
            item={heroItem}
            isFocused={focusArea === 'hero'}
            focusedButtonIndex={heroButtonIndex}
            onPlay={(item) => handleLaunchWatch(item.id, 0)}
            onMoreInfo={(item) => setSelectedDetailsAnime(item)}
            onToggleList={refreshUserData}
          />
        )}

        {/* Section Title Header if Not Home */}
        {activeSection !== 'home' && (
          <div className="pt-10 pb-4 px-8 lg:px-14">
            <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] capitalize">
              {activeSection.replace('_', ' ')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Browse curated anime collections on your television
            </p>
          </div>
        )}

        {/* 3. Horizontal TV Content Rows */}
        <div className={`flex flex-col gap-4 ${activeSection === 'home' ? '-mt-10 sm:-mt-14 relative z-20' : 'mt-2'}`}>
          {contentRows.length > 0 ? (
            contentRows.map((row, rIdx) => {
              const isRowFocused = focusArea === 'rows' && focusedRowIndex === rIdx;

              return (
                <TVContentRow
                  key={row.id}
                  id={row.id}
                  title={row.title}
                  subtitle={row.subtitle}
                  items={row.items}
                  historyItems={row.historyItems}
                  isContinueWatching={row.isContinueWatching}
                  isRowFocused={isRowFocused}
                  focusedCardIndex={focusedCardIndex}
                  onSelectCard={(cIdx) => handleSelectCard(rIdx, cIdx)}
                  rowIndex={rIdx}
                />
              );
            })
          ) : (
            <div className="py-24 text-center text-gray-400">
              <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-base font-bold text-gray-300">
                {activeSection === 'mylist' ? 'Your list is currently empty' : 'No titles found'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {activeSection === 'mylist' ? 'Save anime from the Home screen or Details page to watch here.' : ''}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Virtual Android TV Remote Control */}
      <TVVirtualRemote
        onDirection={handleRemoteDirection}
        onEnter={handleRemoteEnter}
        onBack={handleRemoteBack}
        onHome={handleRemoteHome}
      />
    </div>
  );
}

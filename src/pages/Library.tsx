import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Trash2, 
  Bookmark, 
  Clock, 
  CheckCircle2, 
  Heart, 
  Film, 
  Search as SearchIcon, 
  X, 
  Cloud, 
  ArrowUpDown,
  Check,
  Sparkles
} from 'lucide-react';
import { historyUtil, HistoryItem, formatPlaybackTimestamp } from '../lib/history';
import { libraryManager, LibraryItem } from '../lib/library';
import { useAuth } from '../lib/AuthContext';

type TabType = 'history' | 'watchlist' | 'completed' | 'favorites' | 'search';
type SortOption = 'recent' | 'alphabetical' | 'progress';

export function Library() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Live state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => historyUtil.getHistory());
  const [watchlist, setWatchlist] = useState<LibraryItem[]>(() => libraryManager.getWatchlist());
  const [completedList, setCompletedList] = useState<LibraryItem[]>(() => libraryManager.getCompleted());
  const [favoritesList, setFavoritesList] = useState<LibraryItem[]>(() => libraryManager.getFavorites());
  const [searchHistory, setSearchHistory] = useState<string[]>(() => libraryManager.getSearchHistory());

  // Listen to custom updates across components
  useEffect(() => {
    const handleProgressUpdate = () => {
      setHistoryItems(historyUtil.getHistory());
    };
    const handleLibraryUpdate = () => {
      setWatchlist(libraryManager.getWatchlist());
      setCompletedList(libraryManager.getCompleted());
      setFavoritesList(libraryManager.getFavorites());
    };
    const handleSearchUpdate = () => {
      setSearchHistory(libraryManager.getSearchHistory());
    };

    window.addEventListener('kinoma_progress_update', handleProgressUpdate);
    window.addEventListener('kinoma_library_update', handleLibraryUpdate);
    window.addEventListener('kinoma_search_update', handleSearchUpdate);

    return () => {
      window.removeEventListener('kinoma_progress_update', handleProgressUpdate);
      window.removeEventListener('kinoma_library_update', handleLibraryUpdate);
      window.removeEventListener('kinoma_search_update', handleSearchUpdate);
    };
  }, []);

  // Remove actions with smooth state updates (no page reload)
  const handleRemoveHistoryItem = (slug: string) => {
    historyUtil.removeHistory(slug);
    setHistoryItems(prev => prev.filter(item => item.slug !== slug && item.animeId !== slug));
  };

  const handleClearHistory = () => {
    historyUtil.clearHistory();
    setHistoryItems([]);
    setShowClearConfirm(false);
  };

  const handleRemoveLibraryItem = (id: string, type: 'watchlist' | 'completed' | 'favorites') => {
    libraryManager.removeItem(id, type);
    if (type === 'watchlist') setWatchlist(prev => prev.filter(i => i.id !== id));
    if (type === 'completed') setCompletedList(prev => prev.filter(i => i.id !== id));
    if (type === 'favorites') setFavoritesList(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleFavorite = (item: { id: string; title: string; image?: string }) => {
    const nowFav = libraryManager.toggleFavorite(item);
    if (nowFav) {
      setFavoritesList(libraryManager.getFavorites());
    } else {
      setFavoritesList(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleToggleCompleted = (item: { id: string; title: string; image?: string }) => {
    const nowComp = libraryManager.toggleCompleted(item);
    if (nowComp) {
      setCompletedList(libraryManager.getCompleted());
    } else {
      setCompletedList(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleRemoveSearchQuery = (query: string) => {
    libraryManager.removeSearchQuery(query);
    setSearchHistory(prev => prev.filter(q => q !== query));
  };

  const handleClearSearchHistory = () => {
    libraryManager.clearSearchHistory();
    setSearchHistory([]);
    setShowClearConfirm(false);
  };

  // Filter and sort items based on active search input and sort option
  const filteredHistory = useMemo(() => {
    let list = historyItems;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.title?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'progress') return (b.completionPercentage || 0) - (a.completionPercentage || 0);
      return (b.lastWatchedTime || 0) - (a.lastWatchedTime || 0);
    });
  }, [historyItems, searchQuery, sortBy]);

  const filterAndSortLibrary = (items: LibraryItem[]) => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.title?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  };

  const filteredWatchlist = useMemo(() => filterAndSortLibrary(watchlist), [watchlist, searchQuery, sortBy]);
  const filteredCompleted = useMemo(() => filterAndSortLibrary(completedList), [completedList, searchQuery, sortBy]);
  const filteredFavorites = useMemo(() => filterAndSortLibrary(favoritesList), [favoritesList, searchQuery, sortBy]);

  const totalTracked = historyItems.length + watchlist.length + completedList.length + favoritesList.length;

  const tabs: { id: TabType; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'history', label: 'In Progress', count: historyItems.length, icon: Clock },
    { id: 'watchlist', label: 'Watchlist', count: watchlist.length, icon: Bookmark },
    { id: 'completed', label: 'Completed', count: completedList.length, icon: CheckCircle2 },
    { id: 'favorites', label: 'Favorites', count: favoritesList.length, icon: Heart },
    { id: 'search', label: 'Recent Searches', count: searchHistory.length, icon: SearchIcon },
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-16 py-8 min-h-[85vh] max-w-7xl mx-auto">
      
      {/* Sleek Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#1c1c24]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Library
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#181822] text-[#c084fc] border border-[#2b2538]">
              {totalTracked} titles
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Personal collection, continuous playback sessions, and bookmarks.
          </p>
        </div>

        {/* Cloud Sync Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#13131a] border border-[#242433] text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium truncate max-w-[180px] sm:max-w-none">
                Synced • {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#13131a] hover:bg-[#1e1e2b] border border-[#242433] hover:border-[#7b1fa2]/60 text-xs text-gray-300 hover:text-white transition-all shadow-sm"
              title="Sign in to save your library across all devices"
            >
              <Cloud className="w-3.5 h-3.5 text-[#c084fc]" />
              <span>Back up to Cloud</span>
            </button>
          )}

          {/* Tab Specific Clear Button */}
          {activeTab === 'history' && historyItems.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161620] hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-[#242433] text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          {activeTab === 'search' && searchHistory.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161620] hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-[#242433] text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Searches</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clearing */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121217] border border-[#2b2b3b] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">
                {activeTab === 'history' ? 'Clear Watch History?' : 'Clear Search History?'}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                This action cannot be undone. Your active sessions and timestamps for this list will be reset.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#1a1a24] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={activeTab === 'history' ? handleClearHistory : handleClearSearchHistory}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
                >
                  Confirm Clear
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toolbar: Segmented Tabs + Filter & Sort Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        
        {/* Segmented Tab Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-[#101015] border border-[#1e1e29] rounded-xl overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'text-white shadow-[0_2px_12px_rgba(123,31,162,0.3)]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#161622]/50'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeLibraryTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] rounded-lg -z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#1b1b26] text-gray-400'}`}>
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter and Sort Controls */}
        {activeTab !== 'search' && (
          <div className="flex items-center gap-3">
            {/* Instant Filter Input */}
            <div className="relative flex-1 sm:w-56">
              <SearchIcon className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter titles..."
                className="w-full pl-8 pr-7 py-2 bg-[#101015] border border-[#1e1e29] focus:border-[#7b1fa2] rounded-xl text-xs text-white placeholder-gray-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label="Sort library items"
                className="appearance-none bg-[#101015] border border-[#1e1e29] hover:border-[#2f2f3d] text-gray-300 text-xs font-medium rounded-xl pl-3 pr-7 py-2 cursor-pointer outline-none transition-colors"
              >
                <option value="recent">Recently Updated</option>
                <option value="alphabetical">Title (A–Z)</option>
                {activeTab === 'history' && <option value="progress">Highest Progress</option>}
              </select>
              <ArrowUpDown className="w-3 h-3 text-gray-500 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* TAB CONTENT: IN PROGRESS (CONTINUE WATCHING) */}
      {activeTab === 'history' && (
        <div>
          {filteredHistory.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#13131c] border border-[#232333] flex items-center justify-center text-gray-500 mb-1 shadow-inner">
                <Clock className="w-7 h-7 text-[#ba68c8]/60" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery ? 'No matching titles in progress' : 'No watch history yet'}
              </h3>
              <p className="text-gray-400 text-xs max-w-sm">
                {searchQuery 
                  ? 'Try a different keyword or clear your filter.' 
                  : 'Start watching any episode to automatically track your timestamps and continue anytime.'}
              </p>
              {!searchQuery && (
                <Link href="/">
                  <button className="mt-3 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-[0_2px_12px_rgba(123,31,162,0.35)] hover:scale-105 active:scale-95 transition-all">
                    Explore Anime
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filteredHistory.map((item) => {
                  const watchUrl = `/watch/${encodeURIComponent(item.episodeId || item.slug)}?t=${Math.floor(item.playbackTimestamp || 0)}`;
                  const pct = Math.round(item.completionPercentage || 0);

                  return (
                    <motion.div
                      key={item.episodeId || item.slug}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group bg-[#0e0e13] border border-[#1b1b26] hover:border-[#7b1fa2]/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_6px_25px_rgba(123,31,162,0.18)]"
                    >
                      {/* 16:9 Thumbnail Header */}
                      <div className="relative aspect-video bg-[#14141c] overflow-hidden">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Episode Badge */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white tracking-tight">
                          S{item.seasonNumber || 1} • E{item.episodeNumber}
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => handleRemoveHistoryItem(item.slug)}
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-gray-400 hover:text-red-400 hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Centered Play Trigger */}
                        <Link href={watchUrl}>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <div className="w-11 h-11 rounded-full bg-[#7b1fa2] text-white flex items-center justify-center shadow-[0_0_20px_rgba(123,31,162,0.6)] transform group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </Link>

                        {/* Bottom Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#1f1f2e]">
                          <div
                            className="h-full bg-gradient-to-r from-[#7b1fa2] to-[#c084fc] transition-all duration-300"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                            <span className="font-medium text-[#c084fc]">
                              {formatPlaybackTimestamp(item.playbackTimestamp || 0)}
                            </span>
                            <span className="font-semibold text-gray-400">
                              {pct}% watched
                            </span>
                          </div>
                          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#c084fc] transition-colors">
                            {item.title}
                          </h3>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#181822]">
                          <Link href={`/details/${encodeURIComponent(item.animeId || item.slug)}`}>
                            <button className="text-[11px] font-semibold text-gray-400 hover:text-white transition-colors">
                              Series Details
                            </button>
                          </Link>
                          <Link href={watchUrl}>
                            <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#7b1fa2]/20 hover:bg-[#7b1fa2] text-[#c084fc] hover:text-white text-xs font-bold transition-all border border-[#7b1fa2]/30 active:scale-95">
                              Resume <Play className="w-3 h-3 fill-current" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div>
          {filteredWatchlist.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#13131c] border border-[#232333] flex items-center justify-center text-gray-500 mb-1 shadow-inner">
                <Bookmark className="w-7 h-7 text-[#ba68c8]/60" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery ? 'No matching titles in watchlist' : 'Your watchlist is empty'}
              </h3>
              <p className="text-gray-400 text-xs max-w-sm">
                {searchQuery 
                  ? 'Try a different filter term.' 
                  : 'Save anime you want to watch next by clicking "Add to List" on any anime page.'}
              </p>
              {!searchQuery && (
                <Link href="/">
                  <button className="mt-3 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-[0_2px_12px_rgba(123,31,162,0.35)] hover:scale-105 active:scale-95 transition-all">
                    Browse Anime
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredWatchlist.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-[#0e0e13] border border-[#1b1b26] hover:border-[#7b1fa2]/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_6px_25px_rgba(123,31,162,0.15)] relative"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[3/4] bg-[#14141c] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Top Action Pills */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-gray-300 hover:text-rose-400 flex items-center justify-center transition-colors"
                          title="Add to Favorites"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveLibraryItem(item.id, 'watchlist')}
                          className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-gray-300 hover:text-red-400 flex items-center justify-center transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Play Trigger */}
                      <Link href={`/details/${encodeURIComponent(item.id)}`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                          <div className="w-10 h-10 rounded-full bg-[#7b1fa2] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                      <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-[#c084fc] transition-colors">
                        {item.title}
                      </h3>
                      <Link href={`/details/${encodeURIComponent(item.id)}`}>
                        <button className="w-full py-1.5 rounded-lg bg-[#14141e] hover:bg-[#7b1fa2] text-gray-300 hover:text-white text-[11px] font-semibold transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: COMPLETED */}
      {activeTab === 'completed' && (
        <div>
          {filteredCompleted.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#13131c] border border-[#232333] flex items-center justify-center text-gray-500 mb-1 shadow-inner">
                <CheckCircle2 className="w-7 h-7 text-emerald-400/60" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery ? 'No matching completed anime' : 'No completed anime yet'}
              </h3>
              <p className="text-gray-400 text-xs max-w-sm">
                {searchQuery 
                  ? 'Try a different filter term.' 
                  : 'Mark a series as completed once you finish watching it to catalog your finished anime.'}
              </p>
              {!searchQuery && (
                <Link href="/">
                  <button className="mt-3 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-[0_2px_12px_rgba(123,31,162,0.35)] hover:scale-105 active:scale-95 transition-all">
                    Browse Anime
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredCompleted.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-[#0e0e13] border border-[#1b1b26] hover:border-emerald-500/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_6px_25px_rgba(16,185,129,0.12)] relative"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[3/4] bg-[#14141c] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Completed Ribbon */}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold tracking-tight shadow">
                        COMPLETED
                      </span>

                      {/* Remove Action */}
                      <button
                        onClick={() => handleRemoveLibraryItem(item.id, 'completed')}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-gray-300 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from Completed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Play Trigger */}
                      <Link href={`/details/${encodeURIComponent(item.id)}`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                      <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <Link href={`/details/${encodeURIComponent(item.id)}`}>
                        <button className="w-full py-1.5 rounded-lg bg-[#14141e] hover:bg-emerald-600 text-gray-300 hover:text-white text-[11px] font-semibold transition-colors">
                          Rewatch
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FAVORITES */}
      {activeTab === 'favorites' && (
        <div>
          {filteredFavorites.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#13131c] border border-[#232333] flex items-center justify-center text-gray-500 mb-1 shadow-inner">
                <Heart className="w-7 h-7 text-rose-500/60" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery ? 'No matching favorites' : 'No favorites saved'}
              </h3>
              <p className="text-gray-400 text-xs max-w-sm">
                {searchQuery 
                  ? 'Try a different keyword.' 
                  : 'Heart the series you love most on any details page to add them here.'}
              </p>
              {!searchQuery && (
                <Link href="/">
                  <button className="mt-3 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-[0_2px_12px_rgba(123,31,162,0.35)] hover:scale-105 active:scale-95 transition-all">
                    Discover Anime
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredFavorites.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-[#0e0e13] border border-[#1b1b26] hover:border-rose-500/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_6px_25px_rgba(244,63,94,0.12)] relative"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[3/4] bg-[#14141c] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Favorite Badge */}
                      <div className="absolute top-2 left-2 p-1 rounded-md bg-rose-500/90 text-white shadow">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </div>

                      {/* Remove Action */}
                      <button
                        onClick={() => handleRemoveLibraryItem(item.id, 'favorites')}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-gray-300 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from Favorites"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Play Trigger */}
                      <Link href={`/details/${encodeURIComponent(item.id)}`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                      <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-rose-400 transition-colors">
                        {item.title}
                      </h3>
                      <Link href={`/details/${encodeURIComponent(item.id)}`}>
                        <button className="w-full py-1.5 rounded-lg bg-[#14141e] hover:bg-rose-600 text-gray-300 hover:text-white text-[11px] font-semibold transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SEARCH HISTORY */}
      {activeTab === 'search' && (
        <div className="max-w-2xl mx-auto">
          {searchHistory.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#13131c] border border-[#232333] flex items-center justify-center text-gray-500 mb-1 shadow-inner">
                <SearchIcon className="w-7 h-7 text-[#ba68c8]/60" />
              </div>
              <h3 className="text-base font-bold text-white">No search history</h3>
              <p className="text-gray-400 text-xs max-w-sm">
                Your recent searches will appear here for fast re-querying.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {searchHistory.map((query) => (
                  <motion.div
                    key={query}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#0e0e13] border border-[#1b1b26] hover:border-[#7b1fa2]/50 p-3.5 rounded-xl flex items-center justify-between group transition-colors"
                  >
                    <Link href={`/search?keyword=${encodeURIComponent(query)}`}>
                      <div className="flex items-center gap-3 cursor-pointer">
                        <SearchIcon className="w-4 h-4 text-[#c084fc] group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-white text-sm group-hover:text-[#c084fc] transition-colors">
                          {query}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemoveSearchQuery(query)}
                      className="text-gray-500 hover:text-red-400 p-1.5 transition-colors"
                      title="Remove query"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

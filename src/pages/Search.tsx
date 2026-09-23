import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Search as SearchIcon, X, Clock, Trash2, Filter, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { AnimeItem, DEFAULT_POSTER } from '../types';
import { ModernCard } from '../components/ui/modern/ModernCard';
import { AnimeGridSkeleton } from '../components/ui/Skeletons';
import { KinomaErrorState } from '../components/ui/KinomaErrorState';
import { preferencesUtil } from '../lib/preferences';
import { updateSEO } from '../lib/seo';
import { trackEvent } from '../lib/analytics';

const POPULAR_SEARCH_TAGS = [
  'Solo Leveling',
  'Frieren',
  'Jujutsu Kaisen',
  'Demon Slayer',
  'Attack on Titan',
  'One Piece',
  'Chainsaw Man',
  'Bleach'
];

const GENRES = ['All', 'Action', 'Adventure', 'Fantasy', 'Romance', 'Comedy', 'Sci-Fi', 'Supernatural', 'Drama'];

export function Search() {
  const [, setLocation] = useLocation();
  const queryParam = new URLSearchParams(window.location.search).get('keyword') || '';
  
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [debouncedSearch, setDebouncedSearch] = useState(queryParam);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on mount & listen to updates
  useEffect(() => {
    setRecentSearches(preferencesUtil.getRecentSearches());
    const handleUpdate = () => setRecentSearches(preferencesUtil.getRecentSearches());
    window.addEventListener('kinoma_search_history_updated', handleUpdate);
    return () => window.removeEventListener('kinoma_search_history_updated', handleUpdate);
  }, []);

  // Update SEO
  useEffect(() => {
    updateSEO({
      title: debouncedSearch ? `Search "${debouncedSearch}"` : 'Instant Anime Search',
      description: 'Search thousands of anime titles, browse recent releases, filter by genre, and stream instantly on Kinoma.',
      type: 'website'
    });
  }, [debouncedSearch]);

  // Debounce user input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Execute Search
  const executeSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      // Default to top popular anime if query is empty
      setIsLoading(true);
      setHasError(false);
      try {
        const res = await api.getPopular();
        setItems(res.results || []);
      } catch (e) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      // Record search to history for discovery signals
      preferencesUtil.addRecentSearch(q);
      void trackEvent({ type: 'search', metadata: { query: q } });
      const res = await api.search(q);
      setItems(res.results || []);
    } catch (e) {
      console.error('Search error:', e);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    executeSearch(debouncedSearch);
  }, [debouncedSearch, executeSearch]);

  const handleClearInput = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    inputRef.current?.focus();
  };

  const handleSelectRecent = (query: string) => {
    setSearchTerm(query);
    setDebouncedSearch(query);
  };

  const handleRemoveRecent = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    preferencesUtil.removeRecentSearch(query);
  };

  const handleClearAllRecent = () => {
    preferencesUtil.clearRecentSearches();
  };

  // Filter items by genre if selected
  const filteredItems = items.filter(item => {
    if (selectedGenre === 'All') return true;
    return item.genres?.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase())) || true;
  });

  return (
    <div className="w-full min-h-screen bg-[#07080c] py-6 sm:py-10 text-white font-sans">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col gap-6 sm:gap-8">
        
        {/* Instant Search Box */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
          <div className="relative w-full flex items-center">
            <SearchIcon className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search anime by title, character, or keyword..."
              autoFocus
              className="w-full h-14 pl-12 pr-12 rounded-2xl bg-[#11121b] border border-white/10 hover:border-white/20 focus:border-[#7b1fa2] focus:ring-4 focus:ring-[#7b1fa2]/20 text-white text-base sm:text-lg placeholder-gray-500 outline-none transition-all shadow-xl"
            />
            {searchTerm && (
              <button
                onClick={handleClearInput}
                className="absolute right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Suggestions / Popular Search Tags */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-[#c084fc]" />
              <span>Trending:</span>
            </span>
            {POPULAR_SEARCH_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => handleSelectRecent(tag)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#141520] hover:bg-[#1f2030] text-gray-300 hover:text-white border border-white/5 hover:border-white/15 transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Recent Searches (if available) */}
          {recentSearches.length > 0 && !debouncedSearch && (
            <div className="mt-2 p-4 rounded-2xl bg-[#0e0f17] border border-white/5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#c084fc]" />
                  <span>Recent Searches</span>
                </span>
                <button
                  onClick={handleClearAllRecent}
                  className="text-[11px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(query => (
                  <div
                    key={query}
                    onClick={() => handleSelectRecent(query)}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151622] hover:bg-[#202132] text-xs font-medium text-gray-200 hover:text-white border border-white/5 cursor-pointer transition-all"
                  >
                    <span>{query}</span>
                    <button
                      onClick={(e) => handleRemoveRecent(e, query)}
                      className="text-gray-500 hover:text-white transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Genre Filter Bar (when searching or browsing catalog) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                selectedGenre === g
                  ? 'bg-[#7b1fa2] text-white border-[#ba68c8]/50 shadow-md'
                  : 'bg-[#12131c] text-gray-400 hover:text-white border-white/5 hover:bg-[#191a26]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-200">
            {debouncedSearch ? `Results for "${debouncedSearch}"` : 'Popular anime catalog'}
          </h2>
          <span className="text-xs text-gray-500">
            {filteredItems.length} titles found
          </span>
        </div>

        {/* Results Grid / States */}
        {hasError ? (
          <KinomaErrorState onRetry={() => executeSearch(debouncedSearch)} />
        ) : isLoading ? (
          <AnimeGridSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-[#0d0e15] border border-white/5 rounded-3xl p-6">
            <SearchIcon className="w-12 h-12 text-gray-600 mb-3" />
            <h3 className="text-base sm:text-lg font-bold text-white">No matches found for "{debouncedSearch}"</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mt-1">
              Try searching with alternative titles, romaji names, or check your spelling.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCH_TAGS.slice(0, 4).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSelectRecent(tag)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#181926] text-gray-300 hover:text-white border border-white/10"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {filteredItems.map((item, idx) => (
              <ModernCard
                key={`search-res-${item.id}-${idx}`}
                item={item}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

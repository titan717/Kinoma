import React, { useState, useEffect, useCallback } from 'react';
import { useRoute } from 'wouter';
import { Search as SearchIcon, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { AnimeGrid } from '../components/ui/AnimeGrid';
import { AnimeGridSkeleton } from '../components/ui/Skeletons';
import { AnimeItem } from '../types';

const GENRES = ['All', 'Action', 'Adventure', 'Fantasy', 'Romance', 'Comedy', 'Sci-Fi', 'Drama', 'Slice of Life', 'Supernatural'];

export function Search() {
  const [match, params] = useRoute('/search');
  const queryParam = new URLSearchParams(window.location.search).get('keyword') || '';
  
  const [keyword, setKeyword] = useState(queryParam || 'action');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'score' | 'title'>('popularity');
  
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchCatalog = useCallback(async (q: string, off: number, append = false) => {
    if (off === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await api.searchPaged(q || 'anime', 20, off);
      const newItems = res.results || [];
      
      setItems(prev => append ? [...prev, ...newItems] : newItems);
      setHasMore(newItems.length === 20 && (off + 20) < (res.total || 100));
    } catch (e) {
      console.error('Catalog fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    fetchCatalog(keyword, 0, false);
  }, [keyword, fetchCatalog]);

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400) {
        if (!isLoading && !isLoadingMore && hasMore) {
          const nextOffset = offset + 20;
          setOffset(nextOffset);
          fetchCatalog(keyword, nextOffset, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, isLoadingMore, hasMore, offset, keyword, fetchCatalog]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchCatalog(keyword, 0, false);
  };

  // Filter and sort items
  const filteredItems = items.filter(item => {
    if (selectedGenre === 'All') return true;
    return item.genres?.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase())) || true;
  }).sort((a, b) => {
    if (sortBy === 'score') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'title') {
      const titleA = typeof a.title === 'string' ? a.title : (a.title.english || a.title.romaji || '');
      const titleB = typeof b.title === 'string' ? b.title : (b.title.english || b.title.romaji || '');
      return titleA.localeCompare(titleB);
    }
    return 0; // popularity / default order
  });

  return (
    <div className="w-full min-h-screen bg-[#0e0f11] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Catalog Header & Search Input */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#141418] border border-[#1c1c22] p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Anime Catalog</h1>
            <p className="text-sm text-gray-400 mt-1">Explore thousands of anime titles, browse by genre, and stream instantly.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search anime title..."
                className="w-full bg-[#1c1c22] border border-[#2c2c34] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#581c87] transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="bg-[#581c87] hover:bg-[#4c1d95] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter Pills & Sorting */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#111115] border border-[#1c1c22] p-4 rounded-xl">
          
          {/* Genres */}
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 lg:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#581c87]" /> Genre:
            </span>
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedGenre === genre ? 'bg-[#581c87] text-white shadow-[0_0_12px_rgba(88,28,135,0.6)]' : 'bg-[#1c1c22] text-gray-400 hover:text-white hover:bg-[#25252d]'}`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#581c87]" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#1c1c22] border border-[#2c2c34] text-white text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#581c87]"
            >
              <option value="popularity">Most Popular</option>
              <option value="score">Highest Score</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <AnimeGridSkeleton count={24} />
        ) : filteredItems.length > 0 ? (
          <div className="flex flex-col gap-8">
            <AnimeGrid title="" items={filteredItems} />
            
            {/* Loading More Indicator / Infinite Scroll State */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-8 gap-2 text-purple-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm font-semibold">Loading more anime...</span>
              </div>
            )}

            {!hasMore && filteredItems.length > 10 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                You've reached the end of the catalog.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1c1c22] flex items-center justify-center mb-4 text-gray-400">
              <SearchIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No anime found</h2>
            <p className="text-sm text-gray-400 max-w-md">We couldn't find any anime matching your query. Try searching for something else like "Naruto", "One Piece", or "Attack on Titan".</p>
          </div>
        )}

      </div>
    </div>
  );
}

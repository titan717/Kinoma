import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { api } from '../lib/api';
import { Hero } from '../components/ui/Hero';
import { InfoBanner } from '../components/ui/InfoBanner';
import { SidebarCard } from '../components/ui/SidebarCard';
import { AnimeGrid } from '../components/ui/AnimeGrid';
import { HeroSkeleton, AnimeGridSkeleton, SidebarSkeleton } from '../components/ui/Skeletons';
import { Schedule } from '../components/ui/Schedule';
import { ContinueWatching } from '../components/ui/ContinueWatching';
import { AnimeItem } from '../types';
import { Loader2 } from 'lucide-react';

export function Home() {
  const { data: trendingData, isLoading: loadingTrending } = useSWR('trending', api.getTrending);
  const { data: popularData, isLoading: loadingPopular } = useSWR('popular', api.getPopular);
  const [topPeriod, setTopPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'sub' | 'dub' | 'trending' | 'random'>('all');

  // Infinite scroll catalog state
  const [catalogItems, setCatalogItems] = useState<AnimeItem[]>([]);
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [hasMoreCatalog, setHasMoreCatalog] = useState(true);
  const [isLoadingMoreCatalog, setIsLoadingMoreCatalog] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const trending = trendingData?.results || [];
  const popular = popularData?.results || [];
  
  const allAnime = [...trending, ...popular];
  const peakKeywords = ['attack on titan', 'one piece', 'slime', 'tensura', 'fullmetal', 'naruto', 'demon slayer', 'jujutsu kaisen', 'chainsaw'];
  const peakItems = allAnime.filter(item => {
    const titleStr = (typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || '').toLowerCase();
    return peakKeywords.some(kw => titleStr.includes(kw));
  });

  const heroItems = peakItems.length > 0 ? peakItems.slice(0, 6) : (popular.length > 0 ? popular.slice(0, 6) : trending.slice(0, 6));
  
  const isLoading = loadingTrending || loadingPopular;

  // Initial catalog load
  useEffect(() => {
    async function loadInitialCatalog() {
      setIsLoadingMoreCatalog(true);
      try {
        const queryMap = {
          all: 'anime',
          sub: 'action',
          dub: 'adventure',
          trending: 'attack on titan',
          random: 'one piece'
        };
        const query = queryMap[catalogFilter] || 'anime';
        const res = await api.searchPaged(query, 20, 0);
        const mapped = res.results || [];
        const seen = new Set();
        const unique = mapped.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setCatalogItems(unique);
        setCatalogOffset(20);
        setHasMoreCatalog(unique.length === 20);
      } catch (e) {
        console.error('Catalog initial load error:', e);
      } finally {
        setIsLoadingMoreCatalog(false);
      }
    }
    loadInitialCatalog();
  }, [catalogFilter]);

  // Load more function for see more button
  const loadMoreCatalog = useCallback(async () => {
    if (isLoadingMoreCatalog || !hasMoreCatalog) return;
    setIsLoadingMoreCatalog(true);
    try {
      const queryMap = {
        all: 'fantasy',
        sub: 'drama',
        dub: 'romance',
        trending: 'naruto',
        random: 'bleach'
      };
      const query = queryMap[catalogFilter] || 'anime';
      const res = await api.searchPaged(query, 20, catalogOffset);
      const newResults = res.results || [];
      
      setCatalogItems(prev => {
        const combined = [...prev, ...newResults];
        const seen = new Set();
        return combined.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
      setCatalogOffset(prev => prev + 20);
      setHasMoreCatalog(newResults.length === 20);
    } catch (e) {
      console.error('Load more catalog error:', e);
    } finally {
      setIsLoadingMoreCatalog(false);
    }
  }, [catalogOffset, catalogFilter, isLoadingMoreCatalog, hasMoreCatalog]);

  const displayedSidebarItems = [...popular].sort((a, b) => {
    const scoreA = Number(a.rating) || 0;
    const scoreB = Number(b.rating) || 0;
    return scoreB - scoreA;
  }).slice(0, 10);

  return (
    <div className="w-full flex flex-col min-h-screen">
      {isLoading ? <HeroSkeleton /> : (heroItems.length > 0 && <Hero items={heroItems} />)}
      
      <InfoBanner />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-10 min-w-0">
          <ContinueWatching />
          
          {isLoading ? (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Recently Updated</h2>
                <AnimeGridSkeleton count={12} />
              </div>
            </>
          ) : (
            <>
              <AnimeGrid title="Recently Updated" items={trending.slice(0, 12)} />
              
              {/* Optimized Catalog with Filter Tabs & See More Button */}
              <div className="w-full flex flex-col gap-6 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c1c22] pb-4">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Latest Episode Catalog</h2>
                  
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-[#141418] p-1 rounded-lg border border-[#1c1c22] text-xs font-semibold overflow-x-auto">
                    {(['all', 'sub', 'dub', 'trending', 'random'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCatalogFilter(tab)}
                        className={`px-3 py-1.5 rounded uppercase tracking-wider transition-colors whitespace-nowrap ${catalogFilter === tab ? 'bg-[#581c87] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1c1c22]'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimeGrid title="" items={catalogItems} />

                {/* See More Button */}
                <div className="w-full py-6 flex items-center justify-center">
                  {hasMoreCatalog ? (
                    <button
                      onClick={loadMoreCatalog}
                      disabled={isLoadingMoreCatalog}
                      className="bg-[#581c87] hover:bg-[#4c1d95] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoadingMoreCatalog && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>See More Anime</span>
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500 uppercase tracking-widest">You have reached the end of the catalog</p>
                  )}
                </div>
              </div>
            </>
          )}
          
          <Schedule />
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[320px] shrink-0">
          <div className="bg-[#111115] border border-[#1c1c22] rounded-lg p-5 sticky top-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Top anime</h3>
              <div className="flex items-center bg-[#1c1c22] rounded overflow-hidden text-[10px] font-bold">
                <button 
                  onClick={() => setTopPeriod('day')}
                  className={`px-3 py-1.5 transition-colors ${topPeriod === 'day' ? 'bg-[#581c87] text-white' : 'text-gray-400 hover:bg-[#2c2c34]'}`}
                >
                  Day
                </button>
                <button 
                  onClick={() => setTopPeriod('week')}
                  className={`px-3 py-1.5 transition-colors ${topPeriod === 'week' ? 'bg-[#581c87] text-white' : 'text-gray-400 hover:bg-[#2c2c34]'}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setTopPeriod('month')}
                  className={`px-3 py-1.5 transition-colors ${topPeriod === 'month' ? 'bg-[#581c87] text-white' : 'text-gray-400 hover:bg-[#2c2c34]'}`}
                >
                  Month
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              {isLoading ? (
                <SidebarSkeleton />
              ) : (
                displayedSidebarItems.map((item: AnimeItem, idx: number) => (
                  <div key={`sidebar-${topPeriod}-${item.id}-${idx}`}>
                    <SidebarCard item={item} rank={idx + 1} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

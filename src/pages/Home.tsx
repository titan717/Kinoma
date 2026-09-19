import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '../lib/api';
import { Hero } from '../components/ui/Hero';
import { InfoBanner } from '../components/ui/InfoBanner';
import { SidebarCard } from '../components/ui/SidebarCard';
import { HeroSkeleton, SidebarSkeleton } from '../components/ui/Skeletons';
import { Schedule } from '../components/ui/Schedule';
import { ContinueWatching } from '../components/ui/ContinueWatching';
import { AnimeGrid } from '../components/ui/AnimeGrid';
import { AnimeItem } from '../types';
import { Compass, Sparkles, TrendingUp, Flame } from 'lucide-react';
import { useAppearance } from '../lib/AppearanceContext';
import { ModernHero } from '../components/ui/modern/ModernHero';
import { ModernCarousel, ModernCarouselSlot } from '../components/ui/modern/ModernCarousel';
import { ModernCard } from '../components/ui/modern/ModernCard';
import { ModernContinueWatching } from '../components/ui/modern/ModernContinueWatching';
import { ModernGenrePills } from '../components/ui/modern/ModernGenrePills';

const CATEGORIES = ['All', 'Action', 'Adventure', 'Fantasy', 'Romance', 'Comedy', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Mystery'];

export function Home() {
  const { resolvedTheme } = useAppearance();
  const [activeCategory, setActiveCategory] = useState('All Genres');
  const [catalogLimit, setCatalogLimit] = useState(24);

  // Smart caching with SWR
  const { data: trendingData, isLoading: loadingTrending } = useSWR('trending', api.getTrending, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  });
  
  const { data: popularData, isLoading: loadingPopular } = useSWR('popular', api.getPopular, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  });

  // Dynamic catalog fetch based on activeCategory
  const isAllGenres = activeCategory.toLowerCase() === 'all genres' || activeCategory.toLowerCase() === 'all';
  const { data: catalogData, isLoading: loadingCatalog } = useSWR(
    `catalog-${activeCategory}-${catalogLimit}`,
    () => isAllGenres ? api.getTrending() : api.searchPaged(activeCategory.toLowerCase(), catalogLimit, 0),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  );

  const [topPeriod, setTopPeriod] = useState<'day' | 'week' | 'month'>('day');

  const trending = trendingData?.results || [];
  const popular = popularData?.results || [];
  const catalogItems = catalogData?.results || [];
  
  const allAnime = useMemo(() => [...trending, ...popular], [trending, popular]);
  
  // Prioritize top cinematic high-profile titles for hero (e.g. Frieren, Jujutsu Kaisen, etc.)
  const peakKeywords = useMemo(() => ['frieren', 'attack on titan', 'one piece', 'slime', 'tensura', 'jujutsu kaisen', 'demon slayer', 'chainsaw', 'naruto', 'solo leveling', 'kaiju'], []);
  
  const peakItems = useMemo(() => allAnime.filter(item => {
    const titleStr = (typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || '').toLowerCase();
    return peakKeywords.some(kw => titleStr.includes(kw));
  }), [allAnime, peakKeywords]);

  const heroItems = peakItems.length > 0 ? peakItems.slice(0, 8) : (popular.length > 0 ? popular.slice(0, 8) : trending.slice(0, 8));
  
  const isLoading = loadingTrending || loadingPopular;

  const displayedSidebarItems = useMemo(() => [...popular].sort((a, b) => {
    const scoreA = Number(a.rating) || 0;
    const scoreB = Number(b.rating) || 0;
    return scoreB - scoreA;
  }).slice(0, 10), [popular]);

  // ================= MODERN MODE RENDER (Matching Reference Image) =================
  if (resolvedTheme === 'modern') {
    return (
      <div className="w-full flex flex-col min-h-screen bg-[#121318] pb-24 text-white font-sans selection:bg-[#7b1fa2] selection:text-white">
        
        {/* 1. Large Cinematic Hero with Responsive Focal Cropping */}
        {isLoading ? (
          <HeroSkeleton />
        ) : (
          heroItems.length > 0 && <ModernHero items={heroItems} />
        )}

        {/* 2. Structured Sections Matching Reference Image */}
        <div className="w-full flex flex-col gap-8 sm:gap-10 md:gap-12 mt-4 sm:mt-6">
          
          {/* SECTION A: Trending Now Carousel */}
          <ModernCarousel 
            title="Trending Now" 
            subtitle="The most-watched series across Kinoma this week"
          >
            {trending.map((item, idx) => (
              <ModernCarouselSlot key={`modern-trending-${item.id}-${idx}`}>
                <ModernCard 
                  item={item} 
                  badgeText={idx < 5 ? (item.status === 'RELEASING' ? 'New Season' : `Top ${idx + 1}`) : (item.status === 'RELEASING' ? 'New Season' : undefined)}
                />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>

          {/* SECTION B: Genre Filters Strip (Reference Exact Layout) */}
          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <ModernGenrePills
              selectedGenre={activeCategory}
              onSelectGenre={(genre) => {
                setActiveCategory(genre);
                setCatalogLimit(24);
              }}
            />
          </div>

          {/* DYNAMIC CATALOG GRID: If user chooses a specific genre (e.g. Action, Fantasy) */}
          {!isAllGenres && (
            <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#c084fc]" />
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeCategory} Anime
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {catalogItems.length} titles
                </span>
              </div>

              {loadingCatalog && catalogItems.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {catalogItems.map((item, idx) => (
                    <ModernCard key={`cat-grid-${item.id}-${idx}`} item={item} />
                  ))}
                </div>
              )}

              {catalogItems.length >= catalogLimit && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setCatalogLimit(prev => prev + 12)}
                    className="px-7 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
                  >
                    Load More {activeCategory}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION C: Continue Watching for You (Cards with Red Progress Bar) */}
          <ModernContinueWatching fallbackItems={popular} />

          {/* SECTION D: Recommended For You Carousel */}
          <ModernCarousel 
            title="Recommended For You" 
            subtitle="Tailored anime stories based on your preferences"
          >
            {popular.map((item, idx) => (
              <ModernCarouselSlot key={`modern-popular-${item.id}-${idx}`}>
                <ModernCard 
                  item={item} 
                  badgeText={item.status === 'RELEASING' ? 'New Season' : undefined}
                />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>

          {/* SECTION E: New Season & Simulcasts */}
          <ModernCarousel 
            title="New Season & Airing" 
            subtitle="Brand-new simulcasts premiering this season"
          >
            {displayedSidebarItems.map((item, idx) => (
              <ModernCarouselSlot key={`modern-new-season-${item.id}-${idx}`}>
                <ModernCard 
                  item={item} 
                  badgeText="New Season" 
                />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>

        </div>
      </div>
    );
  }

  // ================= PRESERVED CLASSIC MODE RENDER =================
  return (
    <div className="w-full flex flex-col min-h-screen">
      {isLoading ? <HeroSkeleton /> : (heroItems.length > 0 && <Hero items={heroItems} />)}
      
      <InfoBanner />

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(280px,22vw,360px)] gap-8">
        {/* Main Content Area */}
        <div className="flex flex-col gap-10 min-w-0">
          <ContinueWatching />

          {/* HOMEPAGE CATALOG SECTION */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212126] pb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-[#4a148c]" />
                <h2 className="text-2xl font-black text-white tracking-tight">Explore Catalog</h2>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setCatalogLimit(24); }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#4a148c] text-white shadow-[0_0_12px_rgba(74,20,140,0.4)]' : 'bg-[#18181d] text-gray-400 hover:text-white hover:bg-[#22222a] border border-[#212126]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {loadingCatalog && catalogItems.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-[#18181d] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <AnimeGrid title="" items={catalogItems} />
            )}

            {catalogItems.length >= catalogLimit && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setCatalogLimit(prev => prev + 12)}
                  className="px-6 py-2.5 bg-[#18181d] hover:bg-[#25252d] border border-[#2c2c34] text-white text-xs font-bold rounded-lg transition-all shadow-md"
                >
                  Load More Anime
                </button>
              </div>
            )}
          </div>
          
          <Schedule />
        </div>

        {/* Right Sidebar */}
        <div className="w-full shrink-0">
          <div className="bg-[#111115] border border-[#1c1c22] rounded-lg p-5 sticky top-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                Top Anime
              </h3>
              <div className="flex items-center bg-[#1c1c22] rounded overflow-hidden text-[10px] font-bold">
                <button 
                  onClick={() => setTopPeriod('day')}
                  className={`px-3 py-1.5 transition-colors ${topPeriod === 'day' ? 'bg-[#4a148c] text-white' : 'text-gray-400 hover:bg-[#2c2c34]'}`}
                >
                  Day
                </button>
                <button 
                  onClick={() => setTopPeriod('week')}
                  className={`px-3 py-1.5 transition-colors ${topPeriod === 'week' ? 'bg-[#4a148c] text-white' : 'text-gray-400 hover:bg-[#2c2c34]'}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setTopPeriod('month')}
                  className={`px-3 py-1.5 transition-colors ${topPeriod === 'month' ? 'bg-[#4a148c] text-white' : 'text-gray-400 hover:bg-[#2c2c34]'}`}
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

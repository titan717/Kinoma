import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '../lib/api';
import { AnimeItem } from '../types';
import { HeroSkeleton } from '../components/ui/Skeletons';
import { ModernHero } from '../components/ui/modern/ModernHero';
import { ModernCarousel, ModernCarouselSlot } from '../components/ui/modern/ModernCarousel';
import { ModernCard } from '../components/ui/modern/ModernCard';
import { ModernContinueWatching } from '../components/ui/modern/ModernContinueWatching';
import { KinomaErrorState } from '../components/ui/KinomaErrorState';
import { historyUtil, HistoryItem } from '../lib/history';
import { preferencesUtil } from '../lib/preferences';
import { updateSEO } from '../lib/seo';

export function Home() {
  useEffect(() => {
    updateSEO({
      title: 'Stream Anime Free in HD',
      description: 'Stream trending, popular, and currently airing anime with multi-season support, remote-first TV playback, and instant resume on Kinoma.',
      type: 'website'
    });
  }, []);

  // 1. Core API calls: Trending & Popular
  const { data: trendingData, isLoading: loadingTrending, error: trendingError, mutate: retryTrending } = useSWR(
    'home_trending',
    api.getTrending,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: popularData, isLoading: loadingPopular, error: popularError, mutate: retryPopular } = useSWR(
    'home_popular',
    api.getPopular,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // 2. Airing Today from real Vercel Schedule
  const { data: airingData } = useSWR(
    'home_airing_today',
    api.getAiringToday,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // 3. User Personalization Signals (Watch History, Top Genres, Search History)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);

  useEffect(() => {
    const updateUserData = () => {
      setHistoryItems(historyUtil.getHistory());
      setTopGenres(preferencesUtil.getTopUserGenres(2));
    };
    updateUserData();
    window.addEventListener('kinoma_progress_update', updateUserData);
    window.addEventListener('kinoma_search_history_updated', updateUserData);
    return () => {
      window.removeEventListener('kinoma_progress_update', updateUserData);
      window.removeEventListener('kinoma_search_history_updated', updateUserData);
    };
  }, []);

  const lastWatchedItem = historyItems[0] || null;

  // 4. Dynamic "Because You Watched [Anime]" row
  const { data: recsData } = useSWR(
    lastWatchedItem ? `home_recs_${lastWatchedItem.slug || lastWatchedItem.animeId}` : null,
    () => api.getRecommendations(lastWatchedItem.slug || lastWatchedItem.animeId),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  // 5. Dynamic Genre rows based on user interaction or diverse genres
  const primaryGenre = topGenres[0] || 'Action';
  const secondaryGenre = topGenres[1] || 'Fantasy';

  const { data: primaryGenreData } = useSWR(
    `home_genre_${primaryGenre}`,
    () => api.getGenreAnime(primaryGenre.toLowerCase(), 18),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: secondaryGenreData } = useSWR(
    `home_genre_${secondaryGenre}`,
    () => api.getGenreAnime(secondaryGenre.toLowerCase(), 18),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Data unwrapping
  const trending = useMemo(() => trendingData?.results || [], [trendingData]);
  const popular = useMemo(() => popularData?.results || [], [popularData]);
  const airingToday = useMemo(() => airingData?.results || [], [airingData]);
  const becauseYouWatched = useMemo(() => recsData?.results || [], [recsData]);
  const primaryGenreItems = useMemo(() => primaryGenreData?.results || [], [primaryGenreData]);
  const secondaryGenreItems = useMemo(() => secondaryGenreData?.results || [], [secondaryGenreData]);

  // Hero Selection: High profile cinematic items
  const heroItems = useMemo(() => {
    const pool = [...trending, ...popular];
    if (pool.length === 0) return [];
    return pool.slice(0, 8);
  }, [trending, popular]);

  const isLoading = (loadingTrending || loadingPopular) && heroItems.length === 0;
  const hasError = (trendingError && popularError) && heroItems.length === 0;

  const handleRetryAll = () => {
    retryTrending();
    retryPopular();
  };

  if (hasError) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-12">
        <KinomaErrorState onRetry={handleRetryAll} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#07080c] pb-24 text-white font-sans selection:bg-[#7b1fa2] selection:text-white">
      
      {/* 1. Cinematic Hero Banner */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        heroItems.length > 0 && <ModernHero items={heroItems} />
      )}

      {/* 2. Structured Dynamic Rows */}
      <div className="w-full flex flex-col gap-8 sm:gap-10 md:gap-12 mt-4 sm:mt-6">

        {/* ROW 1: Continue Watching (Only renders when user has real history) */}
        <ModernContinueWatching />

        {/* ROW 2: Because You Watched [Anime] (Only renders when meaningful recommendation data exists) */}
        {lastWatchedItem && becauseYouWatched.length > 0 && (
          <ModernCarousel
            title={`Because You Watched ${lastWatchedItem.title}`}
            subtitle="Recommended series and continuations tailored to your taste"
          >
            {becauseYouWatched.map((item, idx) => (
              <ModernCarouselSlot key={`byw-${item.id}-${idx}`}>
                <ModernCard item={item} />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 3: Popular Right Now */}
        {popular.length > 0 && (
          <ModernCarousel
            title="Popular This Week"
            subtitle="Fan favorites and global anime phenomenons"
          >
            {popular.map((item, idx) => (
              <ModernCarouselSlot key={`pop-${item.id}-${idx}`}>
                <ModernCard
                  item={item}
                  badgeText={idx < 5 ? `Top ${idx + 1}` : undefined}
                />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 4: Top Airing / Released Today */}
        {airingToday.length > 0 && (
          <ModernCarousel
            title="Top Airing Anime"
            subtitle="Fresh weekly broadcasts updated today"
          >
            {airingToday.map((item, idx) => (
              <ModernCarouselSlot key={`airing-${item.id}-${idx}`}>
                <ModernCard
                  item={item}
                  badgeText="Airing"
                />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 5: Trending Anime */}
        {trending.length > 0 && (
          <ModernCarousel
            title="Trending Now"
            subtitle="High-speed surge in viewership across Kinoma"
          >
            {trending.map((item, idx) => (
              <ModernCarouselSlot key={`trend-${item.id}-${idx}`}>
                <ModernCard
                  item={item}
                  badgeText={item.status === 'RELEASING' ? 'New Season' : undefined}
                />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 6: Personalized / Dynamic Genre 1 */}
        {primaryGenreItems.length > 0 && (
          <ModernCarousel
            title={`Top ${primaryGenre} Releases`}
            subtitle={`Explore high-energy ${primaryGenre.toLowerCase()} anime storylines`}
          >
            {primaryGenreItems.map((item, idx) => (
              <ModernCarouselSlot key={`genre1-${item.id}-${idx}`}>
                <ModernCard item={item} />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 7: Dynamic Genre 2 (e.g. Fantasy / Supernatural) */}
        {secondaryGenreItems.length > 0 && (
          <ModernCarousel
            title={`Discover ${secondaryGenre}`}
            subtitle={`Immersive ${secondaryGenre.toLowerCase()} worlds and journeys`}
          >
            {secondaryGenreItems.map((item, idx) => (
              <ModernCarouselSlot key={`genre2-${item.id}-${idx}`}>
                <ModernCard item={item} />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

      </div>
    </div>
  );
}

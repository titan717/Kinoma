import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '../lib/api';
import { AnimeItem } from '../types';
import { HeroSkeleton, RowSkeleton } from '../components/ui/Skeletons';
import { ModernHero } from '../components/ui/modern/ModernHero';
import { ModernCarousel, ModernCarouselSlot } from '../components/ui/modern/ModernCarousel';
import { ModernCard } from '../components/ui/modern/ModernCard';
import { ModernContinueWatching } from '../components/ui/modern/ModernContinueWatching';
import { KinomaErrorState } from '../components/ui/KinomaErrorState';
import { historyUtil, HistoryItem } from '../lib/history';
import { preferencesUtil } from '../lib/preferences';
import { updateSEO } from '../lib/seo';

/**
 * Filter items to prioritize novel content while preserving row depth
 */
function deduplicateAcrossRows(items: AnimeItem[], seenIds: Set<string>, minItems = 5): AnimeItem[] {
  const fresh = items.filter(item => !seenIds.has(item.id));
  if (fresh.length >= minItems) {
    fresh.forEach(item => seenIds.add(item.id));
    return fresh;
  }
  // If too few fresh items, include all items to keep carousel rich
  items.forEach(item => seenIds.add(item.id));
  return items;
}

export function Home() {
  useEffect(() => {
    updateSEO({
      title: 'Kinoma — Premium Anime Streaming',
      description: 'Stream trending, popular, and currently airing anime with multi-season support, remote-first TV playback, and instant resume on Kinoma.',
      type: 'website'
    });
  }, []);

  // 1. Core live catalog data from Vercel API
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: trendingError, 
    mutate: retryTrending 
  } = useSWR('home_trending', api.getTrending, { 
    revalidateOnFocus: false, 
    dedupingInterval: 60000 
  });

  const { 
    data: popularData, 
    isLoading: loadingPopular, 
    error: popularError, 
    mutate: retryPopular 
  } = useSWR('home_popular', api.getPopular, { 
    revalidateOnFocus: false, 
    dedupingInterval: 60000 
  });

  // 2. Airing Today from live schedule
  const { data: airingData } = useSWR('home_airing_today', api.getAiringToday, { 
    revalidateOnFocus: false, 
    dedupingInterval: 60000 
  });

  // 3. User personalization signals (Watch History, Top Genres, Search Activity)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);

  useEffect(() => {
    const updateUserData = () => {
      setHistoryItems(historyUtil.getHistory());
      setTopGenres(preferencesUtil.getTopUserGenres(3));
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
  const secondWatchedItem = historyItems.length > 1 ? historyItems[1] : null;

  // 4. Dynamic "Because You Watched [Anime]" recommendations
  const { data: recsData1 } = useSWR(
    lastWatchedItem ? `home_recs_${lastWatchedItem.slug || lastWatchedItem.animeId}` : null,
    () => api.getRecommendations(lastWatchedItem.slug || lastWatchedItem.animeId),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  // 5. Dynamic "More Like [Second Anime]" recommendations (if user has watched multiple anime)
  const { data: recsData2 } = useSWR(
    secondWatchedItem && secondWatchedItem.slug !== lastWatchedItem?.slug
      ? `home_recs_${secondWatchedItem.slug || secondWatchedItem.animeId}` 
      : null,
    () => api.getRecommendations(secondWatchedItem.slug || secondWatchedItem.animeId),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  // 6. Dynamic Genre rows derived from user interaction signals or diverse fallbacks
  const primaryGenre = topGenres[0] || 'Action';
  const secondaryGenre = topGenres[1] || 'Fantasy';
  const tertiaryGenre = topGenres[2] || (topGenres[0] === 'Sci-Fi' ? 'Adventure' : 'Sci-Fi');

  const { data: primaryGenreData } = useSWR(
    `home_genre_${primaryGenre}`,
    () => api.getGenreAnime(primaryGenre.toLowerCase(), 20),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: secondaryGenreData } = useSWR(
    `home_genre_${secondaryGenre}`,
    () => api.getGenreAnime(secondaryGenre.toLowerCase(), 20),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Raw data lists
  const trendingRaw = useMemo(() => trendingData?.results || [], [trendingData]);
  const popularRaw = useMemo(() => popularData?.results || [], [popularData]);
  const airingTodayRaw = useMemo(() => airingData?.results || [], [airingData]);
  const becauseYouWatchedRaw1 = useMemo(() => recsData1?.results || [], [recsData1]);
  const becauseYouWatchedRaw2 = useMemo(() => recsData2?.results || [], [recsData2]);
  const primaryGenreRaw = useMemo(() => primaryGenreData?.results || [], [primaryGenreData]);
  const secondaryGenreRaw = useMemo(() => secondaryGenreData?.results || [], [secondaryGenreData]);

  // Hero Selection: Popular series released after 2024 (excluding movies)
  const heroItems = useMemo(() => {
    const pool = [...popularRaw, ...trendingRaw];
    if (pool.length === 0) return [];
    const filtered = pool.filter(item => {
      const format = (item.format || '').toUpperCase();
      const isMovie = format === 'MOVIE' || format === 'Movie' || format === 'OVA' || format === 'SPECIAL';
      const year = item.season_year || (item.releaseDate ? parseInt(String(item.releaseDate).slice(0, 4)) : 2024);
      return !isMovie && year >= 2024;
    });
    const candidates = filtered.length > 0 ? filtered : pool;
    // Pick exactly five strong candidates, then shuffle their order for a fresh hero.
    // The actual catalog remains live/API-backed; this only changes presentation order.
    return [...candidates]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
  }, [popularRaw, trendingRaw]);

  // Smart Discovery Pipeline with cross-row novelty deduplication
  const {
    airingToday,
    becauseYouWatched1,
    becauseYouWatched2,
    popular,
    trending,
    primaryGenreItems,
    secondaryGenreItems
  } = useMemo(() => {
    const seen = new Set<string>();

    // Mark continue watching items as seen so recommendations prioritize new titles
    historyItems.forEach(h => {
      if (h.animeId) seen.add(h.animeId);
      if (h.slug) seen.add(h.slug);
    });

    const byw1 = deduplicateAcrossRows(becauseYouWatchedRaw1, seen, 4);
    const byw2 = deduplicateAcrossRows(becauseYouWatchedRaw2, seen, 4);
    const airing = deduplicateAcrossRows(airingTodayRaw, seen, 4);
    const pop = deduplicateAcrossRows(popularRaw, seen, 6);
    const trend = deduplicateAcrossRows(trendingRaw, seen, 6);
    const genre1 = deduplicateAcrossRows(primaryGenreRaw, seen, 5);
    const genre2 = deduplicateAcrossRows(secondaryGenreRaw, seen, 5);

    return {
      airingToday: airing,
      becauseYouWatched1: byw1,
      becauseYouWatched2: byw2,
      popular: pop,
      trending: trend,
      primaryGenreItems: genre1,
      secondaryGenreItems: genre2
    };
  }, [
    historyItems,
    becauseYouWatchedRaw1,
    becauseYouWatchedRaw2,
    airingTodayRaw,
    popularRaw,
    trendingRaw,
    primaryGenreRaw,
    secondaryGenreRaw
  ]);

  const isLoading = (loadingTrending || loadingPopular) && heroItems.length === 0;
  const hasError = trendingError && popularError && heroItems.length === 0;

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
    <div className="w-full flex flex-col min-h-screen bg-[#08090d] pb-24 text-white font-sans selection:bg-purple-600 selection:text-white">
      
      {/* 1. Cinematic Hero Banner */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        heroItems.length > 0 && <ModernHero items={heroItems} />
      )}

      {/* 2. Structured Dynamic Discovery Rows */}
      <div className="w-full flex flex-col gap-8 sm:gap-10 md:gap-12 mt-4 sm:mt-6">

        {/* ROW 1: Continue Watching (Only renders when user has real history) */}
        <ModernContinueWatching />

        {/* ROW 2: Primary Personalized Row: Because You Watched [Anime 1] */}
        {lastWatchedItem && becauseYouWatched1.length > 0 && (
          <ModernCarousel
            title={`Because You Watched ${lastWatchedItem.title}`}
            subtitle="Recommended series and continuations tailored to your taste"
          >
            {becauseYouWatched1.map((item, idx) => (
              <ModernCarouselSlot key={`byw1-${item.id}-${idx}`}>
                <ModernCard item={item} />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 3: Secondary Personalized Row: More Like [Anime 2] */}
        {secondWatchedItem && becauseYouWatched2.length > 0 && (
          <ModernCarousel
            title={`More Like ${secondWatchedItem.title}`}
            subtitle="Explore complementary worlds and themes"
          >
            {becauseYouWatched2.map((item, idx) => (
              <ModernCarouselSlot key={`byw2-${item.id}-${idx}`}>
                <ModernCard item={item} />
              </ModernCarouselSlot>
            ))}
          </ModernCarousel>
        )}

        {/* ROW 4: Top Airing Anime (Live weekly broadcasts from schedule) */}
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

        {/* ROW 5: Popular This Week */}
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

        {/* ROW 6: Trending Now */}
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

        {/* ROW 7: Primary Dynamic Genre Row */}
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

        {/* ROW 8: Secondary Dynamic Genre Row */}
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

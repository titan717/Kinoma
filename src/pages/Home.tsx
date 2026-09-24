import React, { useEffect } from 'react';
import useSWR from 'swr';
import { Link } from 'wouter';
import { ChevronRight, Flame, Radio, Sparkles, Film } from 'lucide-react';
import { api } from '../lib/api';
import { ModernHero } from '../components/ui/modern/ModernHero';
import { ModernContinueWatching } from '../components/ui/modern/ModernContinueWatching';
import { ModernCarousel, ModernCarouselSlot } from '../components/ui/modern/ModernCarousel';
import { ModernCard } from '../components/ui/modern/ModernCard';
import { Footer } from '../components/ui/Footer';
import { AnimeItem } from '../types';
import { updateSEO } from '../lib/seo';

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="w-full my-8 sm:my-10 md:my-12">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="h-7 w-48 rounded-lg bg-white/5 animate-pulse mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="shrink-0 w-[42vw] sm:w-[28vw] md:w-[22vw] lg:w-[18%] xl:w-[15.2%] min-w-[130px] max-w-[220px]"
            >
              <div className="aspect-[2/3] rounded-2xl bg-white/[0.045] animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-white/[0.045] mt-3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeSection({
  title,
  subtitle,
  items,
  icon,
  href = '/search',
  badge,
}: {
  title: string;
  subtitle?: string;
  items: AnimeItem[];
  icon?: React.ReactNode;
  href?: string;
  badge?: string;
}) {
  if (!items.length) return null;

  return (
    <ModernCarousel
      title={title}
      subtitle={subtitle}
      actionText="View all"
      onAction={() => { window.location.href = href; }}
    >
      {items.slice(0, 18).map((item, index) => (
        <ModernCarouselSlot key={`${title}-${item.id}-${index}`}>
          <ModernCard item={item} badgeText={badge} />
        </ModernCarouselSlot>
      ))}
    </ModernCarousel>
  );
}

export function Home() {
  useEffect(() => {
    updateSEO({
      title: 'Home',
      description: 'Stream anime, discover new series, continue watching, and explore popular and airing titles on Kinoma.',
      type: 'website',
    });
  }, []);

  const { data: trendingData, isLoading: loadingTrending } = useSWR(
    'home_trending',
    () => api.getTrending(),
    { dedupingInterval: 60000 }
  );

  const { data: popularData, isLoading: loadingPopular } = useSWR(
    'home_popular',
    () => api.getPopular(),
    { dedupingInterval: 60000 }
  );

  const { data: airingData, isLoading: loadingAiring } = useSWR(
    'home_airing',
    () => api.getAiringToday(),
    { dedupingInterval: 60000 }
  );

  const { data: moviesData, isLoading: loadingMovies } = useSWR(
    'home_movies',
    () => api.getMovies(24),
    { dedupingInterval: 60000 }
  );

  const { data: actionData, isLoading: loadingAction } = useSWR(
    'home_action',
    () => api.getGenreAnime('action', 24),
    { dedupingInterval: 60000 }
  );

  const trending = trendingData?.results || [];
  const popular = popularData?.results || [];
  const airing = airingData?.results || [];
  const movies = moviesData?.results || [];
  const action = actionData?.results || [];

  const heroItems = trending.length ? trending.slice(0, 5) : popular.slice(0, 5);

  return (
    <main className="w-full flex-1 bg-[var(--kinoma-bg)] text-white">
      {/* Hero */}
      <section aria-label="Featured anime" className="w-full">
        {heroItems.length ? (
          <ModernHero items={heroItems} />
        ) : loadingTrending || loadingPopular ? (
          <div className="h-[52vh] sm:h-[66vh] md:h-[76vh] lg:h-[84vh] min-h-[460px] max-h-[880px] bg-[#08090d] animate-pulse" />
        ) : (
          <div className="min-h-[420px] flex items-center justify-center bg-[#08090d]">
            <div className="text-center px-6">
              <Sparkles className="mx-auto h-8 w-8 text-white/30 mb-4" />
              <p className="text-sm text-white/50">The catalog is taking a moment to load.</p>
            </div>
          </div>
        )}
      </section>

      {/* Content */}
      <div className="relative z-10 -mt-2 pb-8 sm:pb-12">
        <ModernContinueWatching />

        {(loadingPopular && !popular.length) ? (
          <SectionSkeleton title="Popular Anime" />
        ) : (
          <HomeSection
            title="Popular Anime"
            subtitle="What everyone is watching"
            items={popular}
            icon={<Flame className="h-4 w-4" />}
            href="/search"
          />
        )}

        {(loadingAiring && !airing.length) ? (
          <SectionSkeleton title="Airing Today" />
        ) : (
          <HomeSection
            title="Airing Today"
            subtitle={airingData?.day ? `Fresh episodes · ${airingData.day}` : 'Fresh episodes from today'}
            items={airing}
            icon={<Radio className="h-4 w-4" />}
            href="/whats-new"
            badge="Airing"
          />
        )}

        {(loadingMovies && !movies.length) ? (
          <SectionSkeleton title="Anime Movies" />
        ) : (
          <HomeSection
            title="Anime Movies"
            subtitle="Feature-length stories to watch next"
            items={movies}
            icon={<Film className="h-4 w-4" />}
            href="/search"
            badge="Movie"
          />
        )}

        {(loadingTrending && !trending.length) ? (
          <SectionSkeleton title="Trending Now" />
        ) : (
          <HomeSection
            title="Trending Now"
            subtitle="Popular picks from the Kinoma catalog"
            items={trending}
            icon={<Sparkles className="h-4 w-4" />}
            href="/search"
          />
        )}

        {(loadingAction && !action.length) ? (
          <SectionSkeleton title="Action Anime" />
        ) : (
          <HomeSection
            title="Action Anime"
            subtitle="Fast-paced worlds, battles, and big moments"
            items={action}
            href="/search?genre=action"
          />
        )}

        {/* Browse CTA */}
        <section className="max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-10 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#17131b] via-[#121116] to-[#0c0d11] px-6 py-10 sm:px-10 sm:py-14">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-white/40 mb-3">Keep exploring</p>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">There is always another story.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                Browse the full Kinoma catalog, find something new, and build your own watchlist.
              </p>
              <Link
                href="/search"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-bold hover:bg-white/90 transition-colors kinoma-focus"
              >
                Explore anime
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

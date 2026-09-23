import React, { useMemo } from 'react';
import useSWR from 'swr';
import { Link } from 'wouter';
import { ArrowRight, ChevronDown, Play, Search, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { AnimeItem } from '../types';
import { KinomaLogo } from '../components/ui/KinomaLogo';
import { useAuth } from '../lib/AuthContext';
import { useAppearance } from '../lib/AppearanceContext';

function titleOf(item?: AnimeItem | null) {
  if (!item) return 'Kinoma';
  return typeof item.title === 'string'
    ? item.title
    : item.title?.english || item.title?.romaji || item.title?.native || 'Untitled';
}

function cleanText(value?: string) {
  return (value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatOf(item: AnimeItem) {
  const format = String(item.format || '').toUpperCase();
  if (format === 'MOVIE') return 'MOVIE';
  if (format === 'TV') return 'SERIES';
  if (format === 'ONA') return 'ONA';
  if (format === 'OVA') return 'OVA';
  if (format === 'SPECIAL') return 'SPECIAL';
  return format || 'FEATURE';
}

function yearOf(item: AnimeItem) {
  return item.season_year || (item.releaseDate ? String(item.releaseDate).slice(0, 4) : '');
}

function MovieCard({ item, index }: { item: AnimeItem; index: number }) {
  const title = titleOf(item);
  const image = item.banner || item.cover || item.image;
  const rating = item.rating ? Number(item.rating) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: Math.min(index * 0.035, 0.18), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group min-w-0"
    >
      <Link href={`/details/${encodeURIComponent(item.id)}`}>
        <div className="relative aspect-[1.72/1] overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#111318] shadow-[0_18px_50px_rgba(0,0,0,.24)] transition duration-500 group-hover:-translate-y-1 group-hover:border-white/[0.18] group-hover:shadow-[0_26px_70px_rgba(0,0,0,.42)]">
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/[0.02]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-90" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
              <span>{formatOf(item)}</span>
              {yearOf(item) && <span className="text-white/35">•</span>}
              {yearOf(item) && <span>{yearOf(item)}</span>}
              {rating > 0 && (
                <>
                  <span className="text-white/35">•</span>
                  <span className="inline-flex items-center gap-1 text-white/75">
                    <Star className="h-2.5 w-2.5 fill-current" /> {rating > 10 ? (rating / 10).toFixed(1) : rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
            <h3 className="mt-1.5 line-clamp-1 text-sm font-bold tracking-[-0.015em] text-white sm:text-base">{title}</h3>
          </div>
          <div className="absolute right-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function Landing() {
  const { data: trendingData } = useSWR('landing_trending', api.getTrending, { revalidateOnFocus: false, dedupingInterval: 120000 });
  const { data: popularData } = useSWR('landing_popular', api.getPopular, { revalidateOnFocus: false, dedupingInterval: 120000 });
  const { user, openAuthModal } = useAuth();
  const { resolvedTheme } = useAppearance();

  const catalog = useMemo(() => {
    const merged = [...(trendingData?.results || []), ...(popularData?.results || [])];
    const seen = new Set<string>();
    return merged.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 12);
  }, [trendingData, popularData]);

  const hero = catalog[0];
  const heroTitle = titleOf(hero);
  const heroImage = hero?.banner || hero?.cover || hero?.image;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07080b] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_75%_15%,rgba(125,90,255,.14),transparent_28%),radial-gradient(circle_at_20%_65%,rgba(255,255,255,.035),transparent_25%)]" />

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/">
            <KinomaLogo size="md" variant="full" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#featured" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 transition hover:text-white">Featured</a>
            <a href="#discover" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 transition hover:text-white">Discover</a>
            <a href="#experience" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 transition hover:text-white">Kinoma</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/search" className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/60 transition hover:bg-white/[0.08] hover:text-white sm:flex">
              <Search className="h-4 w-4" />
            </Link>
            {user ? (
              <Link href="/browse" className="rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-black transition hover:bg-white/90">Enter Kinoma</Link>
            ) : (
              <button onClick={() => openAuthModal('signin')} className="rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-black transition hover:bg-white/90">Sign In</button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative flex min-h-[820px] items-end overflow-hidden sm:min-h-screen">
          {heroImage && (
            <motion.img
              initial={{ scale: 1.055, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,9,.98)_0%,rgba(5,6,9,.78)_31%,rgba(5,6,9,.25)_68%,rgba(5,6,9,.5)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,#07080b_0%,rgba(7,8,11,.82)_17%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,transparent_0%,rgba(7,8,11,.08)_40%,rgba(7,8,11,.7)_100%)]" />

          <div className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-40 sm:px-8 lg:px-12 lg:pb-28">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .8, delay: .15, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[700px]"
            >
              <div className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
                <Sparkles className="h-3.5 w-3.5" />
                Anime • Movies • Series
              </div>
              <h1 className="font-['Manrope'] text-[clamp(4rem,9vw,8.7rem)] font-extrabold leading-[.84] tracking-[-0.075em] text-white">
                STORIES<br />WORTH<br /><span className="text-white/38">STAYING FOR.</span>
              </h1>
              <p className="mt-8 max-w-[520px] text-sm leading-7 text-white/58 sm:text-base">
                A cinematic home for anime, movies and series. Discover something new, pick up where you left off, and let every title feel like an event.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/browse" className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-black transition hover:-translate-y-0.5">
                  Explore the library
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                {hero && (
                  <Link href={`/details/${encodeURIComponent(hero.id)}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/85 backdrop-blur-md transition hover:bg-white/10">
                    View featured
                  </Link>
                )}
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30 md:flex">
            <ChevronDown className="h-3.5 w-3.5" /> Scroll to discover
          </div>
        </section>

        <section id="featured" className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/35">The collection</p>
              <h2 className="mt-2 font-['Manrope'] text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">Featured stories</h2>
            </div>
            <Link href="/browse" className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 transition hover:text-white sm:flex">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.slice(0, 6).map((item, index) => <MovieCard key={item.id} item={item} index={index} />)}
          </div>
        </section>

        <section id="discover" className="border-y border-white/[0.06] bg-white/[0.018]">
          <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
            <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/35">Built for everything you watch</p>
                <h2 className="mt-3 max-w-[520px] font-['Manrope'] text-4xl font-extrabold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                  Not just anime.<br /><span className="text-white/35">Your whole screen.</span>
                </h2>
                <p className="mt-6 max-w-[470px] text-sm leading-7 text-white/45">
                  Kinoma's visual language is built around the title, not the medium. Landscape artwork, restrained metadata and cinematic hierarchy work just as naturally for a film as they do for a series.
                </p>
                <Link href="/browse" className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/75 transition hover:bg-white hover:text-black">
                  Discover everything <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {catalog.slice(6, 10).map((item, index) => <MovieCard key={item.id} item={item} index={index} />)}
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(145,100,255,.12),transparent_35%)]" />
          <div className="relative mx-auto max-w-[1000px] text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">The Kinoma experience</p>
            <h2 className="mt-4 font-['Manrope'] text-5xl font-extrabold leading-[.92] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              PRESS PLAY.<br /><span className="text-white/30">LOSE YOURSELF.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-[570px] text-sm leading-7 text-white/45">
              Smooth discovery, intelligent continuation, beautiful artwork and a player designed to get out of your way.
            </p>
            <Link href="/browse" className="mt-9 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.1em] text-black transition hover:-translate-y-0.5">
              Enter Kinoma <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <KinomaLogo size="sm" variant="full" />
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">© Kinoma • Stories worth staying for.</p>
          <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
            <Link href="/browse" className="hover:text-white">Browse</Link>
            <Link href="/search" className="hover:text-white">Search</Link>
            {resolvedTheme === 'modern' && <span className="text-white/15">Modern</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}

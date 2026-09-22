import React, { useEffect, useMemo, useState } from 'react';
import { Play, Plus, Check, Info, Star, ChevronDown } from 'lucide-react';
import { AnimeItem, DEFAULT_BANNER, DEFAULT_POSTER } from '../../types';
import { libraryManager } from '../../lib/library';
import { historyUtil } from '../../lib/history';

interface TVHeroProps {
  item: AnimeItem | null;
  isFocused: boolean;
  focusedButtonIndex: number;
  onPlay: (item: AnimeItem) => void;
  onMoreInfo: (item: AnimeItem) => void;
  onToggleList?: (item: AnimeItem) => void;
}

export function TVHero({ item, isFocused, focusedButtonIndex, onPlay, onMoreInfo, onToggleList }: TVHeroProps) {
  const [isInList, setIsInList] = useState(false);

  useEffect(() => {
    setIsInList(item ? libraryManager.isInWatchlist(item.id) : false);
  }, [item]);

  const resume = useMemo(() => {
    if (!item) return null;
    const title = typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || '';
    return historyUtil.getHistory().find(h =>
      h.animeId === item.id ||
      h.slug === item.id ||
      h.title.toLowerCase() === title.toLowerCase()
    ) || null;
  }, [item]);

  if (!item) {
    return (
      <div className="h-[68vh] min-h-[520px] bg-[#0B0C10] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
      </div>
    );
  }

  const titleString = typeof item.title === 'string'
    ? item.title
    : item.title?.english || item.title?.romaji || 'Featured Anime';

  const backdropImage = item.banner || item.cover || item.image || DEFAULT_BANNER;
  const cleanDescription = item.description?.replace(/<[^>]*>?/gm, '').trim();
  const description = cleanDescription
    ? cleanDescription.slice(0, 260) + (cleanDescription.length > 260 ? '…' : '')
    : 'Discover this anime on Kinoma.';

  const primaryLabel = resume
    ? `Continue S${resume.seasonNumber || 1}:E${resume.episodeNumber}`
    : 'Watch Now';

  const handleToggleList = () => {
    const updated = libraryManager.toggleWatchlist({
      id: item.id,
      title: titleString,
      image: item.image || DEFAULT_POSTER
    });
    setIsInList(updated);
    onToggleList?.(item);
  };

  return (
    <section className="relative h-[68vh] min-h-[520px] max-h-[820px] w-full overflow-hidden bg-[#0B0C10]">
      <div className="absolute inset-0">
        <img
          src={backdropImage}
          alt={titleString}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center scale-[1.03] brightness-[0.76] saturate-[0.72] transition-transform duration-[1200ms] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/78 via-40% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/72 via-24% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex h-full max-w-5xl flex-col justify-end px-8 pb-14 lg:px-14">
        <div className="absolute right-10 bottom-14 hidden xl:block h-[290px] w-[194px] overflow-hidden rounded-[24px] border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,.5)] rotate-[1.5deg]"><img src={item.image || item.cover || DEFAULT_POSTER} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" /><div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" /></div>\n\n        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          {item.rating !== undefined && item.rating !== null && (
            <span className="flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.08] px-2.5 py-1 text-xs font-black text-white/80">
              <Star className="h-3 w-3 fill-current" />
              {typeof item.rating === 'number' ? `${Math.round(item.rating)}% Match` : item.rating}
            </span>
          )}
          {item.releaseDate && <span className="text-xs font-semibold text-white/75">{item.releaseDate}</span>}
          {item.totalEpisodes ? <span className="text-xs font-semibold text-white/60">• {item.totalEpisodes} Episodes</span> : null}
          {item.genres?.length ? <span className="hidden text-xs font-semibold text-white/55 sm:inline">• {item.genres.slice(0, 3).join(' • ')}</span> : null}
        </div>

        <h1 className="mb-3 max-w-3xl line-clamp-2 font-['Outfit'] text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_5px_20px_rgba(0,0,0,.75)] sm:text-5xl lg:text-6xl">
          {titleString}
        </h1>

        <p className="mb-7 max-w-2xl line-clamp-3 text-sm leading-relaxed text-white/82 sm:text-base">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onPlay(item)}
            className={`flex items-center gap-3 rounded-2xl bg-white text-black px-7 py-4 text-sm font-black text-[#071014] transition-all outline-none sm:text-base ${
              isFocused && focusedButtonIndex === 0
                ? 'scale-[1.05] ring-2 ring-white shadow-[0_10px_30px_rgba(0,0,0,.28)]'
                : 'shadow-[0_8px_24px_rgba(0,0,0,.28)]'
            }`}
          >
            <Play className="h-5 w-5 fill-current" />
            {primaryLabel}
          </button>

          <button
            type="button"
            onClick={handleToggleList}
            className={`flex items-center gap-2.5 rounded-2xl border px-6 py-4 text-sm font-black text-white backdrop-blur-md transition-all outline-none sm:text-base ${
              isFocused && focusedButtonIndex === 1
                ? 'scale-[1.05] border-white/35 bg-white/10 ring-2 ring-white/30'
                : 'border-white/15 bg-black/30'
            }`}
          >
            {isInList ? <Check className="h-5 w-5 text-white/80" /> : <Plus className="h-5 w-5" />}
            {isInList ? 'In My List' : 'Add to My List'}
          </button>

          <button
            type="button"
            onClick={() => onMoreInfo(item)}
            className={`flex items-center gap-2.5 rounded-2xl border px-6 py-4 text-sm font-black text-white backdrop-blur-md transition-all outline-none ${
              isFocused && focusedButtonIndex === 2
                ? 'scale-[1.05] border-white/35 bg-white/10 ring-2 ring-white/30'
                : 'border-white/15 bg-black/30'
            }`}
          >
            <Info className="h-5 w-5" />
            More Details
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
          <ChevronDown className="h-3.5 w-3.5" />
          Down: browse episodes
        </div>
      </div>
    </section>
  );
}

import React, { useEffect } from 'react';
import { Play, Star } from 'lucide-react';
import { AnimeItem, DEFAULT_POSTER } from '../../types';
import { HistoryItem, formatPlaybackTimestamp } from '../../lib/history';

export interface TVCardProps {
  key?: React.Key;
  item?: AnimeItem;
  historyItem?: HistoryItem;
  isContinueWatching?: boolean;
  isFocused: boolean;
  onSelect: () => void;
  index: number;
}

// Global cache for prefetched images to avoid redundant browser requests
const prefetchedUrls = new Set<string>();

export function prefetchImage(url?: string) {
  if (!url || prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);
  const img = new Image();
  img.src = url;
}

export const TVCard = React.memo(function TVCard({
  item,
  historyItem,
  isContinueWatching = false,
  isFocused,
  onSelect
}: TVCardProps) {

  // Prefetch high-res artwork when card becomes focused
  useEffect(() => {
    if (isFocused) {
      if (item) {
        if (item.cover) prefetchImage(item.cover);
        if (item.image) prefetchImage(item.image);
      } else if (historyItem) {
        if (historyItem.image) prefetchImage(historyItem.image);
      }
    }
  }, [isFocused, item, historyItem]);

  if (isContinueWatching && historyItem) {
    const progressPct = Math.min(100, Math.max(5, historyItem.completionPercentage || Math.round((historyItem.playbackTimestamp / (historyItem.duration || 1440)) * 100) || 10));
    const remainingSeconds = Math.max(0, (historyItem.duration || 1440) - historyItem.playbackTimestamp);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    return (
      <div
        onClick={onSelect}
        className={`relative shrink-0 w-64 sm:w-72 flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer outline-none select-none ${
          isFocused
            ? 'scale-[1.06] z-20 ring-3 ring-white shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_24px_rgba(255,255,255,0.35)]'
            : 'scale-100 opacity-90 hover:opacity-100'
        } bg-[#11121a] border border-[#212230]`}
      >
        {/* Thumbnail with overlay & progress bar */}
        <div className="relative aspect-video w-full bg-[#0a0b12] overflow-hidden">
          <img
            src={historyItem.image || DEFAULT_POSTER}
            alt={historyItem.title}
            loading={isFocused ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.95] group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Quick Play Indicator Badge */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isFocused ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl scale-105">
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </div>
          </div>

          {/* Episode Tag in bottom left of thumbnail */}
          <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wide bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md backdrop-blur-md">
              Ep {historyItem.episodeNumber}
            </span>
            {remainingMinutes > 0 && (
              <span className="text-[10px] font-semibold text-gray-300 bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-md">
                {remainingMinutes}m left
              </span>
            )}
          </div>

          {/* High-visibility Watch Progress Bar [██████████░░░] */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-[#9c27b0] to-[#e040fb] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Text Details Area */}
        <div className="p-3.5 flex flex-col gap-1 bg-[#0f1017]">
          <h3 className={`text-sm font-black tracking-wide truncate ${
            isFocused ? 'text-white' : 'text-gray-200'
          }`}>
            {historyItem.title}
          </h3>
          <p className="text-xs text-gray-400 flex items-center justify-between">
            <span>Resume from {formatPlaybackTimestamp(historyItem.playbackTimestamp)}</span>
            <span className="text-purple-400 font-bold">{progressPct}%</span>
          </p>
        </div>
      </div>
    );
  }

  // Standard Anime Card
  if (!item) return null;

  const titleString = typeof item.title === 'string'
    ? item.title
    : item.title?.english || item.title?.romaji || 'Anime Title';

  const posterImage = item.image || DEFAULT_POSTER;

  return (
    <div
      onClick={onSelect}
      className={`relative shrink-0 w-44 sm:w-52 flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer outline-none select-none ${
        isFocused
          ? 'scale-[1.06] z-20 ring-3 ring-white shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_24px_rgba(255,255,255,0.35)]'
          : 'scale-100 opacity-90 hover:opacity-100'
      } bg-[#11121a] border border-[#212230]`}
    >
      {/* 2:3 Vertical Poster */}
      <div className="relative aspect-[2/3] w-full bg-[#0a0b12] overflow-hidden">
        <img
          src={posterImage}
          alt={titleString}
          loading={isFocused ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.95]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1017] via-transparent to-black/30" />

        {/* Badges on poster */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {item.rating && (
            <div className="flex items-center gap-0.5 bg-black/75 backdrop-blur-md border border-white/10 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-amber-300">
              <Star className="w-2.5 h-2.5 fill-amber-300" />
              <span>{Math.round(Number(item.rating))}%</span>
            </div>
          )}
        </div>

        {/* Hover/Focus Play Icon */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl scale-105">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="p-3 bg-[#0f1017] flex flex-col gap-1">
        <h3 className={`text-xs sm:text-sm font-bold truncate leading-snug ${
          isFocused ? 'text-white' : 'text-gray-300'
        }`}>
          {titleString}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>{item.type || 'TV'}</span>
          {item.releaseDate && <span>{item.releaseDate}</span>}
          {item.totalEpisodes ? <span>{item.totalEpisodes} eps</span> : null}
        </div>
      </div>
    </div>
  );
});


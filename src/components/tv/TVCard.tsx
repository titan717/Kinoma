import React from 'react';
import { Star } from 'lucide-react';
import { AnimeItem, DEFAULT_POSTER } from '../../types';
import { HistoryItem, formatPlaybackTimestamp } from '../../lib/history';

const prefetchedUrls = new Set<string>();

export function prefetchImage(url?: string) {
  if (!url || prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);
  const img = new Image();
  img.src = url;
}

export interface TVCardProps {
  key?: React.Key;
  item?: AnimeItem;
  historyItem?: HistoryItem;
  isContinueWatching?: boolean;
  isFocused: boolean;
  onSelect: () => void;
  index: number;
}

export function TVCard({ item, historyItem, isContinueWatching = false, isFocused, onSelect }: TVCardProps) {
  if (isContinueWatching && historyItem) {
    const progressPct = Math.min(100, Math.max(0, historyItem.completionPercentage || Math.round((historyItem.playbackTimestamp / Math.max(1, historyItem.duration || 1440)) * 100)));
    const remainingSeconds = Math.max(0, (historyItem.duration || 1440) - historyItem.playbackTimestamp);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    return (
      <button
        type="button"
        onClick={onSelect}
        className={`group relative shrink-0 w-64 sm:w-72 overflow-hidden rounded-2xl border bg-[#11141b] text-left outline-none transition-all duration-200 ${
          isFocused
            ? 'z-20 scale-[1.05] border-[#00F0FF] shadow-[0_14px_40px_rgba(0,0,0,.7),0_0_28px_rgba(0,240,255,.18)] ring-2 ring-[#00F0FF]/70'
            : 'border-white/[0.08] opacity-90'
        }`}
      >
        <div className="relative aspect-video overflow-hidden bg-black">
          <img
            src={historyItem.image || DEFAULT_POSTER}
            alt={historyItem.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-focus:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15">
            <div className="h-full bg-gradient-to-r from-[#00F0FF] to-[#FF0055]" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/85">
            S{historyItem.seasonNumber || 1}:E{historyItem.episodeNumber}
          </span>
          {remainingMinutes > 0 && (
            <span className="absolute bottom-3 right-3 rounded-md bg-black/65 px-2 py-1 text-[10px] font-bold text-white/80">
              {remainingMinutes}m left
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className={`truncate text-sm font-black ${isFocused ? 'text-white' : 'text-white/85'}`}>{historyItem.title}</h3>
          <p className="mt-1 text-xs text-white/45">
            Resume from {formatPlaybackTimestamp(historyItem.playbackTimestamp)}
          </p>
        </div>
      </button>
    );
  }

  if (!item) return null;

  const titleString = typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || 'Anime';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative shrink-0 w-48 sm:w-56 overflow-hidden rounded-2xl border bg-[#11141b] text-left outline-none transition-all duration-200 ${
        isFocused
          ? 'z-20 scale-[1.06] border-[#00F0FF] shadow-[0_14px_40px_rgba(0,0,0,.7),0_0_28px_rgba(0,240,255,.18)] ring-2 ring-[#00F0FF]/70'
          : 'border-white/[0.08] opacity-90'
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-black">
        <img
          src={item.image || DEFAULT_POSTER}
          alt={titleString}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-300 group-focus:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#11141b] via-transparent to-black/20" />
        {item.rating !== undefined && item.rating !== null && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[10px] font-black text-white">
            <Star className="h-3 w-3 fill-[#00F0FF] text-[#00F0FF]" />
            {typeof item.rating === 'number' ? Math.round(item.rating) : item.rating}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className={`truncate text-sm font-black ${isFocused ? 'text-white' : 'text-white/82'}`}>{titleString}</h3>
        <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-white/40">
          <span>{item.type || 'TV'}</span>
          {item.releaseDate && <span>{item.releaseDate}</span>}
        </div>
      </div>
    </button>
  );
}

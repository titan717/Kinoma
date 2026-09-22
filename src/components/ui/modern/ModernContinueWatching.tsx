import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Play, X, Clock } from 'lucide-react';
import { historyUtil, HistoryItem, formatPlaybackTimestamp } from '../../../lib/history';
import { ModernCarousel, ModernCarouselSlot } from './ModernCarousel';
import { DEFAULT_POSTER } from '../../../types';

export function ModernContinueWatching() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [, setLocation] = useLocation();

  const loadHistory = () => {
    setHistory(historyUtil.getHistory());
  };

  useEffect(() => {
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener('kinoma_progress_update', handleUpdate);
    return () => window.removeEventListener('kinoma_progress_update', handleUpdate);
  }, []);

  // Strict Rule: Never show mock data or fake demo placeholders!
  // Only render when the user has real continue watching history.
  if (history.length === 0) {
    return null;
  }

  const handleRemove = (e: React.MouseEvent, item: HistoryItem) => {
    e.preventDefault();
    e.stopPropagation();
    historyUtil.removeFromHistory(item.animeId || item.slug);
    loadHistory();
  };

  return (
    <ModernCarousel 
      title="Continue Watching" 
      subtitle="Resume right where you left off"
    >
      {history.map((item) => {
        const curTime = item.playbackTimestamp ?? item.progress ?? 0;
        const dur = item.duration || 1440;
        const progressPercent = Math.min(100, Math.max(5, (curTime / dur) * 100));
        const remainingSeconds = Math.max(0, dur - curTime);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);

        const watchUrl = item.episodeId 
          ? `/watch/${encodeURIComponent(item.episodeId)}?t=${Math.floor(curTime)}`
          : `/watch/${encodeURIComponent(item.slug)}?t=${Math.floor(curTime)}`;

        return (
          <ModernCarouselSlot key={`cw-${item.animeId || item.slug}-${item.episodeNumber}`}>
            <div className="group relative flex flex-col w-full select-none">
              
              {/* Card Poster with Click-to-Play Direct Link */}
              <Link href={watchUrl} className="kinoma-focus rounded-2xl block outline-none">
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0e1017] border border-white/5 group-hover:border-purple-500/40 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer">
                  <img
                    src={item.image || DEFAULT_POSTER}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />

                  {/* Dismiss / Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, item)}
                    title="Remove from Continue Watching"
                    aria-label="Remove from Continue Watching"
                    className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-md cursor-pointer kinoma-focus"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Episode Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2.5 py-0.5 bg-black/70 backdrop-blur-md text-purple-300 border border-white/10 rounded-full text-[10px] font-bold">
                      EP {item.episodeNumber}
                    </span>
                  </div>

                  {/* Center Play Button Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-[0_4px_24px_rgba(147,51,234,0.6)] transform scale-85 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70 z-10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </Link>

              {/* Title */}
              <div className="mt-2.5 px-0.5 flex flex-col">
                <Link href={`/details/${item.slug || item.animeId}`}>
                  <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors duration-200 line-clamp-1 leading-snug cursor-pointer">
                    {item.title}
                  </h3>
                </Link>
              </div>

            </div>
          </ModernCarouselSlot>
        );
      })}
    </ModernCarousel>
  );
}

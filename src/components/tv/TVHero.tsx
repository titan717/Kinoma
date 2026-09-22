import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { AnimeItem, DEFAULT_BANNER, DEFAULT_POSTER } from '../../types';
import { libraryManager } from '../../lib/library';

interface TVHeroProps {
  item: AnimeItem | null;
  isFocused: boolean;
  focusedButtonIndex: number; // 0: Play, 1: My List, 2: More Info
  onPlay: (item: AnimeItem) => void;
  onMoreInfo: (item: AnimeItem) => void;
  onToggleList?: (item: AnimeItem) => void;
}

export function TVHero({
  item,
  isFocused,
  focusedButtonIndex,
  onPlay,
  onMoreInfo,
  onToggleList
}: TVHeroProps) {
  const [isInList, setIsInList] = useState(false);

  useEffect(() => {
    if (item) {
      setIsInList(libraryManager.isInWatchlist(item.id));
    }
  }, [item]);

  if (!item) {
    return (
      <div className="w-full h-[65vh] min-h-[480px] bg-[#090a10] flex items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const titleString = typeof item.title === 'string' 
    ? item.title 
    : item.title?.english || item.title?.romaji || 'Featured Title';

  const backdropImage = item.cover || item.image || DEFAULT_BANNER;

  const handleToggleList = () => {
    const updated = libraryManager.toggleWatchlist({
      id: item.id,
      title: titleString,
      image: item.image || DEFAULT_POSTER
    });
    setIsInList(updated);
    if (onToggleList) onToggleList(item);
  };

  const cleanDescription = item.description 
    ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 240) + '...'
    : 'Stream the full series now on Kinoma with 4K HDR playback and complete episode guide.';

  return (
    <div className="relative w-full h-[68vh] min-h-[560px] max-h-[820px] overflow-hidden select-none">
      {/* 1. Massive Cinematic Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={backdropImage}
          alt={titleString}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08] transition-transform duration-700 ease-out scale-[1.02]"
        />
        {/* Cinematic Scrims: Multi-layer gradients ensuring readability from any distance */}
        {/* Left deep scrim for typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/88 via-42% to-transparent" />
        {/* Bottom deep scrim for seamless transition to content rows */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/78 via-24% to-transparent" />
        {/* Subtle top vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080d]/60 via-transparent to-transparent" />
      </div>

      {/* 2. TV Hero Information Panel */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-12 px-8 lg:px-14 max-w-4xl">
        {/* Metadata badges */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="px-2.5 py-0.5 rounded-md bg-white/15 border border-white/20 text-white font-black text-xs uppercase tracking-wider backdrop-blur-md">
            Ultra HD
          </span>
          {item.rating && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#4ade80] font-bold text-xs">
              <Star className="w-3 h-3 fill-current" />
              <span>{Math.round(Number(item.rating))}% Match</span>
            </span>
          )}
          {item.releaseDate && (
            <span className="text-gray-300 font-medium text-xs">
              {item.releaseDate}
            </span>
          )}
          {item.totalEpisodes ? (
            <span className="text-gray-400 text-xs">
              • {item.totalEpisodes} Episodes
            </span>
          ) : null}
          {item.genres && item.genres.length > 0 && (
            <span className="text-gray-400 text-xs hidden sm:inline">
              • {item.genres.slice(0, 2).join(', ')}
            </span>
          )}
        </div>

        {/* Anime Title: Large, High-Contrast TV Typography */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-['Outfit'] mb-3 max-w-3xl line-clamp-2">
          {titleString}
        </h1>

        {/* Short, Readable Synopsis */}
        <p className="text-sm sm:text-base text-gray-200/90 leading-relaxed font-normal max-w-2xl drop-shadow-md mb-6 line-clamp-3">
          {cleanDescription}
        </p>

        {/* 3. Hero Remote Controls: ▶ Play, ＋ My List, ⓘ More Info */}
        <div className="flex items-center gap-4 pt-1">
          {/* ▶ Play Button */}
          <button
            onClick={() => onPlay(item)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-base transition-all duration-200 cursor-pointer outline-none ${
              isFocused && focusedButtonIndex === 0
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#FF0055] text-black scale-105 shadow-[0_0_32px_rgba(0,240,255,0.35)] ring-2 ring-[#00F0FF]'
                : 'bg-gradient-to-r from-[#00F0FF] to-[#FF0055] text-black shadow-lg'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play</span>
          </button>

          {/* ＋ My List Button */}
          <button
            onClick={handleToggleList}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 cursor-pointer outline-none backdrop-blur-md ${
              isFocused && focusedButtonIndex === 1
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#FF0055] text-black scale-105 shadow-[0_0_32px_rgba(0,240,255,0.35)] ring-2 ring-[#00F0FF]'
                : 'bg-white/[0.06] hover:bg-white/10 border border-white/15 text-white'
            }`}
          >
            {isInList ? (
              <>
                <Check className={`w-5 h-5 ${isFocused && focusedButtonIndex === 1 ? 'text-black' : 'text-[#4ade80]'}`} />
                <span>In My List</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>My List</span>
              </>
            )}
          </button>

          {/* ⓘ More Info Button */}
          <button
            onClick={() => onMoreInfo(item)}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 cursor-pointer outline-none backdrop-blur-md ${
              isFocused && focusedButtonIndex === 2
                ? 'bg-white text-black scale-105 shadow-[0_0_30px_rgba(255,255,255,0.55)] ring-3 ring-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            }`}
          >
            <Info className="w-5 h-5" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}

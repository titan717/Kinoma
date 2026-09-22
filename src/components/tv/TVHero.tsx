import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export const TVHero = React.memo(function TVHero({
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

  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    const banner = item?.cover && item.cover !== DEFAULT_BANNER ? item.cover : '';
    const poster = item?.image || DEFAULT_BANNER;
    setImgSrc(banner || poster);
  }, [item?.id, item?.cover, item?.image]);

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
    <div className="TVHero relative w-full h-[68vh] min-h-[500px] max-h-[720px] overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* 1. Massive Cinematic Backdrop Image */}
          <div className="absolute inset-0">
            <img
              src={imgSrc || item.image || DEFAULT_BANNER}
              alt={titleString}
              referrerPolicy="no-referrer"
              onError={() => {
                if (item.image && imgSrc !== item.image) {
                  setImgSrc(item.image);
                } else {
                  setImgSrc(DEFAULT_BANNER);
                }
              }}
              className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08] transform scale-[1.02]"
            />
            {/* Cinematic Scrims: Multi-layer gradients ensuring readability from any distance */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/85 via-45% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/70 via-20% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#07080d]/60 via-transparent to-transparent" />
          </div>

          {/* 2. TV Hero Information Panel */}
          <div className="relative z-10 h-full flex flex-col justify-end pb-12 px-8 lg:px-14 max-w-4xl">
            {/* Anime Title: Large, High-Contrast TV Typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-['Outfit'] mb-3 max-w-3xl line-clamp-2">
              {titleString}
            </h1>

            {/* TV Metadata Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4 text-xs font-bold text-gray-200">
              <span className="px-2.5 py-1 rounded-md bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40">98% Match</span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">2026</span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">16+</span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">4 Seasons</span>
              <span className="px-2 py-0.5 rounded bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/40">4K Ultra HD</span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">5.1</span>
            </div>

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
                    ? 'bg-white text-black scale-105 shadow-[0_0_30px_rgba(255,255,255,0.55)] ring-3 ring-white'
                    : 'bg-white/90 hover:bg-white text-black shadow-lg'
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
                    ? 'bg-white text-black scale-105 shadow-[0_0_30px_rgba(255,255,255,0.55)] ring-3 ring-white'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
});


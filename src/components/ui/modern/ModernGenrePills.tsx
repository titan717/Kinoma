import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernGenrePillsProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

const GENRES = [
  'All Genres',
  'Action',
  'Fantasy',
  'Slice of Life',
  'Adventure',
  'Comedy',
  'Romance',
  'School',
  'Time Travel',
  'Comic Adaptation',
  'Sci-Fi',
  'Supernatural',
  'Mystery',
  'Drama',
  'Sports'
];

export function ModernGenrePills({ selectedGenre, onSelectGenre }: ModernGenrePillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full my-6 sm:my-8 group/pills">
      {/* Optional Left Scroll Arrow on Desktop */}
      <button
        onClick={() => handleScroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 border border-white/10 items-center justify-center text-white opacity-0 group-hover/pills:opacity-100 transition-opacity backdrop-blur-md shadow-lg"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontally Scrollable Pills Row */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {GENRES.map((genre) => {
          const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
          return (
            <button
              key={genre}
              onClick={() => onSelectGenre(genre)}
              className={`shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-md scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Optional Right Scroll Arrow on Desktop */}
      <button
        onClick={() => handleScroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 border border-white/10 items-center justify-center text-white opacity-0 group-hover/pills:opacity-100 transition-opacity backdrop-blur-md shadow-lg"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

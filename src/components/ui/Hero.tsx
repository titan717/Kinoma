import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimeItem } from '../../types';

interface HeroProps {
  item?: AnimeItem;
  items?: AnimeItem[];
}

export function Hero({ item, items }: HeroProps) {
  const [shuffledItems, setShuffledItems] = useState<AnimeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const list = items && items.length > 0 ? items : (item ? [item] : []);
    // Shuffle copy of list randomly on mount
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setCurrentIndex(0);
  }, [items, item]);

  const heroList = shuffledItems;

  useEffect(() => {
    if (heroList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroList.length]);

  if (heroList.length === 0) return null;

  const currentItem = heroList[currentIndex] || heroList[0];
  const title = typeof currentItem.title === 'string' 
    ? currentItem.title 
    : currentItem.title?.english || currentItem.title?.romaji || 'Unknown Title';

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + heroList.length) % heroList.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % heroList.length);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0e0f11] pt-6 pb-8 md:pt-10 md:pb-12 px-4 sm:px-6 group">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-6 md:gap-12 items-center relative">
        
        {/* Navigation Arrows */}
        {heroList.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-[#2a2a32] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#581c87]"
              aria-label="Previous Featured Anime"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-[#2a2a32] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#581c87]"
              aria-label="Next Featured Anime"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Left Side: Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentItem.id || currentIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full md:w-[45%] lg:w-[50%] z-10 flex flex-col gap-4"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] text-shadow-sm line-clamp-3">
              {title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 border border-gray-600 rounded-sm text-[10px] font-bold text-gray-300">TV / HD</span>
              <span className="px-1.5 py-0.5 bg-gray-200 text-black rounded-sm text-[10px] font-bold">CC</span>
              {currentItem.totalEpisodes && (
                 <span className="px-1.5 py-0.5 bg-yellow-400 text-black rounded-sm text-[10px] font-bold flex items-center gap-1">
                   🎤 {currentItem.totalEpisodes} Eps
                 </span>
              )}
              {currentItem.rating && (
                <span className="px-1.5 py-0.5 bg-[#581c87]/60 text-purple-200 rounded-sm text-[10px] font-bold">
                  Score: {currentItem.rating}
                </span>
              )}
            </div>
            
            <p 
              className="text-sm text-[#8b8b92] line-clamp-3 leading-relaxed mt-2" 
              dangerouslySetInnerHTML={{ __html: currentItem.description || 'No synopsis available for this title.' }} 
            />
            
            <div className="mt-4 flex items-center gap-3">
              <Link href={`/details/${currentItem.id}`}>
                <button className="flex items-center gap-2 bg-[#581c87] hover:bg-[#4c1d95] text-white px-7 py-3.5 rounded text-sm font-bold transition-all transform active:scale-95 shadow-[0_4px_20px_0_rgba(88,28,135,0.4)]">
                  <Play className="w-4 h-4 fill-white" />
                  PLAY NOW
                </button>
              </Link>
            </div>
            
            {/* Dot Indicators */}
            {heroList.length > 1 && (
              <div className="flex items-center gap-2 mt-6">
                {heroList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-[#581c87] shadow-[0_0_10px_rgba(88,28,135,0.8)]' : 'w-2 bg-[#2a2a32] hover:bg-gray-500'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Right Side: Image/Banner */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`img-${currentItem.id || currentIndex}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full md:w-[55%] lg:w-[50%] h-[220px] sm:h-[300px] md:h-[360px] lg:h-[410px] relative rounded-2xl overflow-hidden shadow-2xl bg-[#15151a]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e0f11] via-transparent to-transparent z-10 md:hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f11] via-transparent to-transparent z-10 md:hidden" />
            
            <img 
              src={currentItem.cover || currentItem.image} 
              alt={title}
              className="w-full h-full object-cover select-none"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

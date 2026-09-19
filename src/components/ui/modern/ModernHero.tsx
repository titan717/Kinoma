import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Play, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimeItem, DEFAULT_BANNER } from '../../../types';
import { libraryManager } from '../../../lib/library';

interface ModernHeroProps {
  items: AnimeItem[];
}

export function ModernHero({ items }: ModernHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate hero every 9 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 6));
    }, 9000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="w-full h-[54vh] sm:h-[68vh] md:h-[76vh] lg:h-[82vh] min-h-[460px] max-h-[860px] bg-[#0c0d12] animate-pulse" />
    );
  }

  const currentItem = items[currentIndex] || items[0];
  const title = typeof currentItem.title === 'string'
    ? currentItem.title
    : currentItem.title?.english || currentItem.title?.romaji || 'Featured Anime';

  const cleanDescription = (currentItem.description || '')
    .replace(/<[^>]*>?/gm, '')
    .trim() || 'An unforgettable anime journey featuring extraordinary worlds, heartfelt bonds, and legendary encounters.';

  return (
    <div className="relative w-full h-[52vh] sm:h-[66vh] md:h-[76vh] lg:h-[84vh] min-h-[460px] max-h-[880px] overflow-hidden bg-[#0a0b10] flex items-end">
      
      {/* Background Cinematic Backdrop Artwork with Breakpoint-Optimized Focal Cropping */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentItem.id || currentIndex}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={currentItem.cover || currentItem.image || DEFAULT_BANNER}
            alt={title}
            className="w-full h-full object-cover object-[center_20%] sm:object-[center_25%] md:object-top opacity-90 brightness-95"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Responsive Gradient Masks (Matching Reference Image) */}
      {/* 1. Mobile vertical scrim: Dark gradient on bottom half protecting text */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#121318] via-[#121318]/90 md:via-[#121318]/50 to-transparent" />
      
      {/* 2. Desktop horizontal scrim: Left-to-right fade for wide desktop text clarity */}
      <div className="hidden md:block absolute inset-0 z-0 bg-gradient-to-r from-[#121318] via-[#121318]/80 to-transparent w-[65%]" />
      
      {/* 3. Top subtle scrim: Protects navigation */}
      <div className="absolute inset-x-0 top-0 z-0 h-32 bg-gradient-to-b from-[#0b0c10]/90 to-transparent" />

      {/* Hero Content Area */}
      <div className="relative z-10 w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pb-10 sm:pb-14 lg:pb-18">
        <AnimatePresence mode="wait">
          <motion.div
            key={`modern-hero-content-${currentItem.id || currentIndex}`}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl flex flex-col gap-2.5 sm:gap-3.5 md:gap-4"
          >
            {/* Title (Matching Reference Image Typography) */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight drop-shadow-lg font-['Outfit']">
              {title}
            </h1>

            {/* Synopsis Description (Clean 2-3 lines of text) */}
            <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl font-normal opacity-90">
              {cleanDescription}
            </p>

            {/* Action Buttons: Solid White Play Pill & Translucent Dark More Info Pill */}
            <div className="flex items-center gap-3 pt-1.5 sm:pt-2">
              
              {/* Play Button (White pill, black play icon & black text) */}
              <Link href={`/watch/${currentItem.id}?ep=1`}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-[0_4px_20px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  <span>Play</span>
                </motion.button>
              </Link>

              {/* More Info Button (Dark translucent pill with white text) */}
              <Link href={`/details/${currentItem.id}`}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <span>More Info</span>
                </motion.button>
              </Link>

            </div>

          </motion.div>
        </AnimatePresence>

        {/* Hero Carousel Navigation Dots (Subtle) */}
        {items.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 mt-6">
            {items.slice(0, 6).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'wouter';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimeItem, DEFAULT_POSTER } from '../../../types';

export interface ModernCardProps {
  key?: React.Key;
  item: AnimeItem;
  badgeText?: string;
  subText?: string;
  progress?: number; // 0-100 percentage for Continue Watching
  currentEpisode?: number;
  layout?: 'standard' | 'wide';
}

export function ModernCard({ 
  item, 
  badgeText, 
  subText, 
  progress,
  currentEpisode
}: ModernCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const title = typeof item.title === 'string'
    ? item.title
    : item.title?.english || item.title?.romaji || 'Unknown Anime';

  const defaultBadge = badgeText || (item.status === 'RELEASING' ? 'New Season' : undefined);

  return (
    <Link href={`/details/${item.id}`}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="group cursor-pointer flex flex-col w-full select-none"
      >
        {/* Poster Container with Rounded 2xl */}
        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#12131a] border border-white/5 group-hover:border-white/20 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] transition-all duration-300">
          
          {/* Skeleton placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#161722] animate-pulse" />
          )}

          <img
            src={item.image || DEFAULT_POSTER}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Top-Right Pill Badge (matching reference screenshot: 'New Season' in translucent pill) */}
          {defaultBadge && (
            <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 z-10">
              <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white/90 border border-white/15 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide shadow-sm">
                {defaultBadge}
              </span>
            </div>
          )}

          {/* Episode or sub/dub count if present */}
          {currentEpisode && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-[#c084fc] border border-white/10 rounded-full text-[10px] font-bold">
                EP {currentEpisode}
              </span>
            </div>
          )}

          {/* Red Progress Bar at the bottom of the poster (for Continue Watching row in reference image) */}
          {typeof progress === 'number' && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 z-10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
              />
            </div>
          )}

          {/* Smooth Play Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.6)] transform scale-80 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        {/* Title Displayed BELOW the Card (Reference screenshot exact style) */}
        <div className="mt-2 sm:mt-2.5 px-0.5 flex flex-col">
          <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors duration-200 line-clamp-2 leading-snug">
            {title}
          </h3>

          {subText && (
            <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
              {subText}
            </p>
          )}
        </div>

      </motion.div>
    </Link>
  );
}

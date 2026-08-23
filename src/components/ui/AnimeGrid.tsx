import React from 'react';
import { Link } from 'wouter';
import { AnimeItem } from '../../types';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export function AnimeGrid({ title, items }: { title: string, items: AnimeItem[] }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5"
      >
        {items.map((item, idx) => {
          const itemTitle = typeof item.title === 'string' 
            ? item.title 
            : item.title?.english || item.title?.romaji || 'Unknown Title';
            
          return (
            <motion.div key={`${title}-${item.id}-${idx}`} variants={itemVariants}>
              <Link href={`/details/${item.id}`}>
                <div className="group cursor-pointer flex flex-col gap-2 h-full">
                  <div className="relative aspect-[3/4] w-full rounded-md overflow-hidden bg-[#1c1c22]">
                    <img 
                      src={item.image} 
                      alt={itemTitle}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                       <span className="px-1.5 py-0.5 bg-yellow-400 text-black rounded-sm text-[10px] font-bold shadow-sm">
                         HD
                       </span>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-gray-200 text-black rounded-sm text-[10px] font-bold shadow-sm">
                        CC {item.totalEpisodes || '?'}
                      </span>
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 group-hover:text-[#4c1d95] transition-colors">
                    {itemTitle}
                  </h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

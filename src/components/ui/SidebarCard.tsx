import React from 'react';
import { Link } from 'wouter';
import { AnimeItem } from '../../types';

interface SidebarCardProps {
  item: AnimeItem;
  rank: number;
}

export function SidebarCard({ item, rank }: SidebarCardProps) {
  const title = typeof item.title === 'string' 
    ? item.title 
    : item.title?.english || item.title?.romaji || 'Unknown Title';

  const isTop3 = rank <= 3;

  return (
    <Link href={`/details/${item.id}`}>
      <div className="group flex items-center gap-4 py-3 border-b border-[#1c1c22] cursor-pointer hover:bg-[#151518] px-2 -mx-2 rounded transition-colors">
        <div className={`w-8 text-center text-2xl font-black ${
          rank === 1 ? 'text-[#4c1d95]' :
          rank === 2 ? 'text-[#502882]' :
          rank === 3 ? 'text-[#3f1f66]' :
          'text-gray-600'
        }`}>
          {rank}
        </div>
        
        <div className="w-12 h-16 shrink-0 rounded overflow-hidden relative">
          <img 
            src={item.image} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <h4 className="text-sm font-semibold text-gray-200 line-clamp-2 group-hover:text-white transition-colors leading-tight">
            {title}
          </h4>
          
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
            <span className="px-1.5 py-0.5 bg-gray-200 text-black rounded-sm flex items-center gap-0.5">
              CC {item.totalEpisodes || 12}
            </span>
            {item.totalEpisodes && (
              <span className="px-1.5 py-0.5 bg-yellow-400 text-black rounded-sm flex items-center gap-0.5">
                🎤 {item.totalEpisodes}
              </span>
            )}
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span>{item.type || 'TV'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

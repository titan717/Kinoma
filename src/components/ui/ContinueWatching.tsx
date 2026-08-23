import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Play, X } from 'lucide-react';
import { historyUtil, HistoryItem } from '../../lib/history';

export function ContinueWatching() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(historyUtil.getHistory());
  }, []);

  const handleRemove = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    historyUtil.removeHistory(slug);
    setHistory(historyUtil.getHistory());
  };

  if (history.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Continue Watching</h2>
      </div>
      
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
        {history.map((item) => {
          const progressPercent = Math.min(100, Math.max(0, (item.progress / item.duration) * 100));
          
          return (
            <Link key={item.slug} href={`/watch/${encodeURIComponent(item.episodeId)}`}>
              <div className="relative w-[280px] shrink-0 group cursor-pointer bg-[#111115] border border-[#1c1c22] hover:border-[#4c1d95] rounded-md overflow-hidden transition-all">
                
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-[#4c1d95]/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleRemove(e, item.slug)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-[10px] font-bold text-white">
                    EP {item.episodeNumber}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-[#2c2c34]">
                  <div 
                    className="h-full bg-[#4c1d95]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {Math.floor(item.progress / 60)}m / {Math.floor(item.duration / 60)}m
                    </span>
                  </div>
                </div>

              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

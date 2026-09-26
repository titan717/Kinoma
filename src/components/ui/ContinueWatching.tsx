import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { historyUtil, HistoryItem, formatPlaybackTimestamp } from '../../lib/history';
import { DEFAULT_POSTER } from '../../types';

export function ContinueWatching() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = () => {
    setHistory(historyUtil.getHistory());
  };

  useEffect(() => {
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener('kinoma_progress_update', handleUpdate);
    return () => window.removeEventListener('kinoma_progress_update', handleUpdate);
  }, []);

  const handleRemove = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    historyUtil.removeHistory(slug);
    loadHistory();
  };

  if (history.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-white tracking-tight">Continue Watching</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        <AnimatePresence mode="popLayout">
          {history.map((item) => {
            const curTime = item.playbackTimestamp ?? item.progress ?? 0;
            const dur = item.duration || 1440;
            const progressPercent = Math.min(100, Math.max(0, (curTime / dur) * 100));
            const seasonNum = item.seasonNumber || 1;
            const timeStr = formatPlaybackTimestamp(curTime);
            
            return (
              <motion.div
                key={item.slug}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="transform-gpu"
              >
                <Link href={`/watch/${encodeURIComponent((item.animeId || item.slug) + '$season}>
                  <div className="relative w-full group cursor-pointer bg-[#121217] border border-[#1f1f27] hover:border-[#9c27b0]/60 hover:shadow-[0_8px_24px_rgba(156,39,176,0.2)] rounded-xl overflow-hidden transition-all duration-300">
                    
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img 
                        src={item.image || DEFAULT_POSTER} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                        <div className="w-11 h-11 rounded-full bg-[#7b1fa2]/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_16px_rgba(123,31,162,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleRemove(e, item.slug)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600/90 text-gray-300 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                        aria-label="Remove from continue watching"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-sm rounded text-[10px] font-bold text-white shadow flex items-center gap-1">
                        <span>S{seasonNum} E{item.episodeNumber}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#c084fc]">{timeStr}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#23232c] overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7b1fa2] to-[#ba68c8] shadow-[0_0_8px_rgba(186,104,200,0.8)] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-[#c084fc] transition-colors duration-200">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400 font-medium">
                          {timeStr} / {formatPlaybackTimestamp(dur)}
                        </span>
                        <span className="text-[11px] font-bold text-[#c084fc]">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
 + seasonNum + '$episode}>
                  <div className="relative w-full group cursor-pointer bg-[#121217] border border-[#1f1f27] hover:border-[#9c27b0]/60 hover:shadow-[0_8px_24px_rgba(156,39,176,0.2)] rounded-xl overflow-hidden transition-all duration-300">
                    
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img 
                        src={item.image || DEFAULT_POSTER} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                        <div className="w-11 h-11 rounded-full bg-[#7b1fa2]/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_16px_rgba(123,31,162,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleRemove(e, item.slug)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600/90 text-gray-300 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                        aria-label="Remove from continue watching"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-sm rounded text-[10px] font-bold text-white shadow flex items-center gap-1">
                        <span>S{seasonNum} E{item.episodeNumber}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#c084fc]">{timeStr}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#23232c] overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7b1fa2] to-[#ba68c8] shadow-[0_0_8px_rgba(186,104,200,0.8)] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-[#c084fc] transition-colors duration-200">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400 font-medium">
                          {timeStr} / {formatPlaybackTimestamp(dur)}
                        </span>
                        <span className="text-[11px] font-bold text-[#c084fc]">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
 + Math.max(1, Number(item.episodeNumber) || 1))}?type=series&t=${Math.floor(curTime)}`}>
                  <div className="relative w-full group cursor-pointer bg-[#121217] border border-[#1f1f27] hover:border-[#9c27b0]/60 hover:shadow-[0_8px_24px_rgba(156,39,176,0.2)] rounded-xl overflow-hidden transition-all duration-300">
                    
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img 
                        src={item.image || DEFAULT_POSTER} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                        <div className="w-11 h-11 rounded-full bg-[#7b1fa2]/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_16px_rgba(123,31,162,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleRemove(e, item.slug)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600/90 text-gray-300 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                        aria-label="Remove from continue watching"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-sm rounded text-[10px] font-bold text-white shadow flex items-center gap-1">
                        <span>S{seasonNum} E{item.episodeNumber}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#c084fc]">{timeStr}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#23232c] overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7b1fa2] to-[#ba68c8] shadow-[0_0_8px_rgba(186,104,200,0.8)] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-[#c084fc] transition-colors duration-200">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400 font-medium">
                          {timeStr} / {formatPlaybackTimestamp(dur)}
                        </span>
                        <span className="text-[11px] font-bold text-[#c084fc]">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

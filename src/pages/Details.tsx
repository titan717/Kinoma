import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import useSWR from 'swr';
import { api } from '../lib/api';
import { Play, Bookmark, Grid, List as ListIcon, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { historyUtil } from '../lib/history';

export function Details() {
  const [isMatch, params] = useRoute<{id: string}>('/details/:id');
  const id = (isMatch && params) ? params.id : '';
  const [epViewMode, setEpViewMode] = useState<'grid' | 'expanded'>('grid');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { data, isLoading } = useSWR(id ? `info-${id}` : null, () => api.getDetails(id));

  useEffect(() => {
    if (data && data._reanimeSlug) {
      historyUtil.saveMeta(data._reanimeSlug, {
        title: data.title.english || data.title.romaji,
        image: data.image,
        animeId: data.id
      });
      
      try {
        const watchlist = JSON.parse(localStorage.getItem('animora_watchlist') || '[]');
        setIsBookmarked(watchlist.some((i: any) => i.id === data.id));
        
        const completedList = JSON.parse(localStorage.getItem('animora_completed') || '[]');
        setIsCompleted(completedList.some((i: any) => i.id === data.id));
      } catch {}
    }
  }, [data]);

  const toggleWatchlist = () => {
    if (!data) return;
    try {
      let watchlist = JSON.parse(localStorage.getItem('animora_watchlist') || '[]');
      if (isBookmarked) {
        watchlist = watchlist.filter((i: any) => i.id !== data.id);
        setIsBookmarked(false);
      } else {
        watchlist.push({ id: data.id, title: data.title.english || data.title.romaji, image: data.image });
        setIsBookmarked(true);
      }
      localStorage.setItem('animora_watchlist', JSON.stringify(watchlist));
    } catch {}
  };

  const toggleCompleted = () => {
    if (!data) return;
    try {
      let completedList = JSON.parse(localStorage.getItem('animora_completed') || '[]');
      if (isCompleted) {
        completedList = completedList.filter((i: any) => i.id !== data.id);
        setIsCompleted(false);
      } else {
        completedList.push({ id: data.id, title: data.title.english || data.title.romaji, image: data.image });
        setIsCompleted(true);
      }
      localStorage.setItem('animora_completed', JSON.stringify(completedList));
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-[200px] shrink-0 mx-auto md:mx-0">
            <Skeleton className="w-full aspect-[3/4] rounded-md" />
            <Skeleton className="w-full h-10 mt-4 rounded" />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-[#111115] border border-[#1c1c22] rounded-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-gray-500">Not found</div>;

  const title = typeof data.title === 'string' 
    ? data.title 
    : data.title?.english || data.title?.romaji || 'Unknown Title';

  const episodes = data.episodes || [];
  const firstEp = episodes[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
    >
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Cover Image & Actions */}
        <div className="w-[220px] shrink-0 mx-auto md:mx-0 flex flex-col gap-3">
          <img src={data.image} alt={title} className="w-full aspect-[3/4] object-cover rounded-xl shadow-2xl border border-[#212126]" />
          
          {firstEp ? (
            <Link href={`/watch/${encodeURIComponent(firstEp.id)}`}>
              <button className="w-full flex items-center justify-center gap-2 bg-[#581c87] hover:bg-[#4c1d95] text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-purple-950/40">
                <Play className="w-4 h-4 fill-white" />
                Play EP 1
              </button>
            </Link>
          ) : (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-[#1c1c22] text-gray-500 cursor-not-allowed py-3 rounded-lg font-bold">
              No Episodes
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={toggleWatchlist}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border transition-all ${isBookmarked ? 'bg-purple-950/60 text-purple-300 border-purple-800' : 'bg-[#141418] text-gray-300 hover:text-white border-[#212126]'}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Saved' : 'Watchlist'}
            </button>

            <button 
              onClick={toggleCompleted}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border transition-all ${isCompleted ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-[#141418] text-gray-300 hover:text-white border-[#212126]'}`}
            >
              {isCompleted ? 'Completed' : 'Mark Done'}
            </button>
          </div>
        </div>

        {/* Info & Synopsis from MAL */}
        <div className="flex-1 flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-xs font-extrabold px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Age Rating: R - 17+ (Violence & Profanity)
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-purple-950/60 text-purple-300 border border-purple-800 rounded-full">
                Score: {data.rating ? `${data.rating}%` : 'N/A'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">{title}</h1>
          </div>

          <div className="bg-[#141418] border border-[#212126] p-5 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">MyAnimeList Synopsis</h3>
            <p className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.description || 'No synopsis available.' }} />
          </div>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#111115] border border-[#212126] rounded-xl">
            <div>
              <span className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">Format</span>
              <span className="text-sm font-semibold text-gray-200">{data.type || 'TV Series'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">Status</span>
              <span className="text-sm font-semibold text-emerald-400">{data.status || 'Finished Airing'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">Total Episodes</span>
              <span className="text-sm font-semibold text-gray-200">{data.totalEpisodes || '?'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">Release Year</span>
              <span className="text-sm font-semibold text-gray-200">{data.releaseDate || 'Unknown'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Episode List with Expanded View Toggle */}
      <div className="mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#212126] pb-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Episodes ({episodes.length})</h2>
          
          <div className="flex items-center gap-1.5 bg-[#141418] p-1 rounded-lg border border-[#212126]">
            <button
              onClick={() => setEpViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${epViewMode === 'grid' ? 'bg-[#581c87] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid className="w-3.5 h-3.5" /> Grid View
            </button>
            <button
              onClick={() => setEpViewMode('expanded')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${epViewMode === 'expanded' ? 'bg-[#581c87] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Expanded List
            </button>
          </div>
        </div>

        {episodes.length > 0 ? (
          epViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {episodes.map((ep: any) => (
                <Link key={ep.id} href={`/watch/${encodeURIComponent(ep.id)}`}>
                  <div className="bg-[#111115] border border-[#212126] hover:bg-[#1c1c22] hover:border-[#581c87] transition-all p-3.5 rounded-xl cursor-pointer text-center group">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-purple-300">EPISODE</span>
                    <span className="text-lg font-black text-white block mt-0.5">{ep.number}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {episodes.map((ep: any) => (
                <div key={ep.id} className="bg-[#111115] border border-[#212126] hover:border-[#581c87] transition-all p-4 rounded-xl flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-24 aspect-video rounded bg-[#1c1c22] overflow-hidden shrink-0 relative">
                      <img src={ep.image || data.image} alt={`EP ${ep.number}`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Episode {ep.number}</span>
                      <h4 className="font-bold text-white text-base mt-0.5 group-hover:text-purple-300 transition-colors">
                        {ep.title || `Episode ${ep.number}`}
                      </h4>
                    </div>
                  </div>
                  <Link href={`/watch/${encodeURIComponent(ep.id)}`}>
                    <button className="flex items-center gap-2 bg-[#581c87] hover:bg-[#4c1d95] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 shadow-lg shadow-purple-950/50">
                      <Play className="w-3.5 h-3.5 fill-current" /> Watch Now
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-gray-500 text-sm py-8 text-center bg-[#111115] rounded-xl border border-[#212126]">
            No episodes available.
          </div>
        )}
      </div>
    </motion.div>
  );
}


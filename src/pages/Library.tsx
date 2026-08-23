import React, { useState } from 'react';
import { Link } from 'wouter';
import { historyUtil } from '../lib/history';
import { Play, Trash2, Bookmark, Clock, CheckCircle, Film, Search as SearchIcon, X } from 'lucide-react';
import { motion } from 'motion/react';

export function Library() {
  const [activeTab, setActiveTab] = useState<'history' | 'watchlist' | 'completed' | 'search'>('history');
  const history = historyUtil.getHistory();
  
  const [watchlist, setWatchlist] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('animora_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedList, setCompletedList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('animora_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('animora_search_history');
      return saved ? JSON.parse(saved) : ['Naruto', 'Attack on Titan', 'One Piece', 'Jujutsu Kaisen', 'Demon Slayer'];
    } catch {
      return ['Naruto', 'Attack on Titan'];
    }
  });

  const clearHistory = () => {
    historyUtil.clearHistory();
    window.location.reload();
  };

  const removeHistoryItem = (slug: string) => {
    historyUtil.removeHistory(slug);
    window.location.reload();
  };

  const removeFromWatchlist = (id: string) => {
    const updated = watchlist.filter(item => item.id !== id);
    setWatchlist(updated);
    try {
      localStorage.setItem('animora_watchlist', JSON.stringify(updated));
    } catch {}
  };

  const removeFromCompleted = (id: string) => {
    const updated = completedList.filter(item => item.id !== id);
    setCompletedList(updated);
    try {
      localStorage.setItem('animora_completed', JSON.stringify(updated));
    } catch {}
  };

  const removeSearchQuery = (query: string) => {
    const updated = searchHistory.filter(q => q !== query);
    setSearchHistory(updated);
    try {
      localStorage.setItem('animora_search_history', JSON.stringify(updated));
    } catch {}
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('animora_search_history');
    } catch {}
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-[80vh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#212126] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-[#581c87]" />
            Your Library & Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your watch history, continue watching progress, watchlist, completed anime, and search history.
          </p>
        </div>

        {activeTab === 'history' && history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 bg-[#1c1c22] hover:bg-red-950/40 text-gray-300 hover:text-red-400 px-4 py-2 rounded text-xs font-semibold transition-colors border border-[#2a2a35]"
          >
            <Trash2 className="w-4 h-4" />
            Clear All History
          </button>
        )}

        {activeTab === 'search' && searchHistory.length > 0 && (
          <button 
            onClick={clearSearchHistory}
            className="flex items-center gap-2 bg-[#1c1c22] hover:bg-red-950/40 text-gray-300 hover:text-red-400 px-4 py-2 rounded text-xs font-semibold transition-colors border border-[#2a2a35]"
          >
            <Trash2 className="w-4 h-4" />
            Clear Search History
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#212126] mb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-[#581c87] text-white bg-[#581c87]/10' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <Clock className="w-4 h-4" />
          Continue Watching ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'watchlist' ? 'border-[#581c87] text-white bg-[#581c87]/10' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <Bookmark className="w-4 h-4" />
          Watchlist ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'completed' ? 'border-[#581c87] text-white bg-[#581c87]/10' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <CheckCircle className="w-4 h-4" />
          Completed ({completedList.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'search' ? 'border-[#581c87] text-white bg-[#581c87]/10' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <SearchIcon className="w-4 h-4" />
          Search History ({searchHistory.length})
        </button>
      </div>

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 bg-[#111115] rounded-xl border border-[#212126]">
              <Film className="w-12 h-12 text-gray-600" />
              <div>
                <h3 className="text-lg font-bold text-white">No watch history yet</h3>
                <p className="text-gray-400 text-sm mt-1">Start watching any anime episode to automatically track your progress.</p>
              </div>
              <Link href="/">
                <button className="mt-2 bg-[#581c87] hover:bg-[#4c1d95] text-white px-6 py-2.5 rounded text-sm font-bold">
                  Explore Anime
                </button>
              </Link>
            </div>
          ) : (
            history.map((item: any, idx: number) => (
              <motion.div 
                key={item.episodeId || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111115] border border-[#212126] rounded-xl overflow-hidden flex flex-col group hover:border-[#581c87] transition-all relative"
              >
                <button 
                  onClick={() => removeHistoryItem(item.slug)}
                  className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/70 text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="relative aspect-video bg-[#18181d] overflow-hidden">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60'} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/watch/${item.episodeId}`}>
                      <button className="w-12 h-12 rounded-full bg-[#581c87] text-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <span className="text-xs text-purple-400 font-bold block mb-1">Episode {item.episodeNumber}</span>
                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1c1c22]">
                    <span className="text-xs text-gray-500">Active Session</span>
                    <Link href={`/watch/${item.episodeId}`}>
                      <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        Resume <Play className="w-3 h-3 fill-current" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watchlist.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 bg-[#111115] rounded-xl border border-[#212126]">
              <Bookmark className="w-12 h-12 text-gray-600" />
              <div>
                <h3 className="text-lg font-bold text-white">Your watchlist is empty</h3>
                <p className="text-gray-400 text-sm mt-1">Bookmark your favorite anime to keep track of what to watch next.</p>
              </div>
              <Link href="/">
                <button className="mt-2 bg-[#581c87] hover:bg-[#4c1d95] text-white px-6 py-2.5 rounded text-sm font-bold">
                  Browse Anime
                </button>
              </Link>
            </div>
          ) : (
            watchlist.map((item: any) => (
              <div key={item.id} className="bg-[#111115] border border-[#212126] rounded-xl overflow-hidden flex flex-col group relative">
                <button 
                  onClick={() => removeFromWatchlist(item.id)}
                  className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/70 text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="relative aspect-[3/4] bg-[#18181d]">
                  <img src={item.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60'} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-bold text-white text-sm line-clamp-1">{item.title}</h3>
                  <Link href={`/details/${item.id}`}>
                    <button className="w-full mt-2 bg-[#1c1c22] hover:bg-[#581c87] text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {completedList.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 bg-[#111115] rounded-xl border border-[#212126]">
              <CheckCircle className="w-12 h-12 text-gray-600" />
              <div>
                <h3 className="text-lg font-bold text-white">No completed anime yet</h3>
                <p className="text-gray-400 text-sm mt-1">Mark anime as completed from the details page once you finish watching.</p>
              </div>
              <Link href="/">
                <button className="mt-2 bg-[#581c87] hover:bg-[#4c1d95] text-white px-6 py-2.5 rounded text-sm font-bold">
                  Browse Anime
                </button>
              </Link>
            </div>
          ) : (
            completedList.map((item: any) => (
              <div key={item.id} className="bg-[#111115] border border-[#212126] rounded-xl overflow-hidden flex flex-col group relative">
                <button 
                  onClick={() => removeFromCompleted(item.id)}
                  className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/70 text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="relative aspect-[3/4] bg-[#18181d]">
                  <img src={item.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60'} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    COMPLETED
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-bold text-white text-sm line-clamp-1">{item.title}</h3>
                  <Link href={`/details/${item.id}`}>
                    <button className="w-full mt-2 bg-[#1c1c22] hover:bg-[#581c87] text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search History Tab */}
      {activeTab === 'search' && (
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {searchHistory.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-[#111115] rounded-xl border border-[#212126]">
              <SearchIcon className="w-12 h-12 text-gray-600" />
              <div>
                <h3 className="text-lg font-bold text-white">No search history</h3>
                <p className="text-gray-400 text-sm mt-1">Your recent search queries will appear here.</p>
              </div>
            </div>
          ) : (
            searchHistory.map((query, idx) => (
              <div key={idx} className="bg-[#111115] border border-[#212126] p-4 rounded-xl flex items-center justify-between group hover:border-[#581c87] transition-all">
                <Link href={`/search?keyword=${encodeURIComponent(query)}`}>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <SearchIcon className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-white text-sm hover:text-purple-300 transition-colors">{query}</span>
                  </div>
                </Link>
                <button 
                  onClick={() => removeSearchQuery(query)}
                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

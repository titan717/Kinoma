import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import useSWR from 'swr';
import { api } from '../lib/api';
import { animeApi } from '../services/animeApi';
import { Play, Server as ServerIcon, ShieldCheck, RefreshCw, ArrowLeft, ArrowRight, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { historyUtil } from '../lib/history';

export function Watch() {
  const [isMatch, params] = useRoute<{id: string}>('/watch/:id');
  const id = (isMatch && params) ? params.id : '';
  const [slug, epNum, anilistId] = id.split('|');

  const [selectedServer, setSelectedServer] = useState<string>('HD-1');
  const [selectedType, setSelectedType] = useState<'sub' | 'dub'>('sub');

  // Fetch servers first for this episode
  const { data: serversData, isLoading: loadingServers, error: serverError } = useSWR(
    id ? `servers-${slug}-${epNum}-${anilistId}` : null,
    () => animeApi.getServers(slug, epNum, anilistId || 0)
  );

  const servers = serversData?.servers || [];
  const currentServerObj = servers.find(s => s.serverName === selectedServer && s.dataType === selectedType) || servers[0];

  // Fetch stream URL
  const { data: streamData, isLoading: loadingStream, error: streamError } = useSWR(
    currentServerObj ? `stream-${slug}-${epNum}-${currentServerObj.serverName}-${currentServerObj.dataType}-${anilistId}` : null,
    () => animeApi.getStream(slug, epNum, currentServerObj.serverName, currentServerObj.dataType || selectedType, anilistId || 0)
  );

  const streamUrl = streamData?.url;

  // Save history
  React.useEffect(() => {
    if (slug && epNum) {
      historyUtil.saveProgress(slug, id, epNum, 10, 100);
    }
  }, [slug, epNum, id]);

  const isLoading = loadingServers || (loadingStream && !streamUrl);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full bg-[#0e0f11] pt-4 min-h-[90vh]"
    >
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 px-4 sm:px-6">
        
        {/* Main Player Area */}
        <div className="flex-1 flex flex-col gap-4 relative">
          
          <div className="flex items-center justify-between mb-1">
            <Link href={`/details/${slug}`}>
              <button className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white bg-[#141418] px-3 py-1.5 rounded border border-[#212126] transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-950 text-purple-300 px-2.5 py-1 rounded font-semibold border border-purple-900/50 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Authorized Stream
              </span>
            </div>
          </div>

          {/* Ambient Glow */}
          <div className="absolute inset-x-4 top-12 aspect-video bg-[#4c1d95]/15 blur-3xl rounded-full z-0 pointer-events-none" />

          {/* Player Container */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative shadow-2xl border border-[#212126] flex items-center justify-center z-10">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111115]">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading streaming servers & player...</p>
              </div>
            ) : serverError || streamError || !streamUrl ? (
              <div className="text-center p-8 max-w-lg bg-[#141418] rounded-xl border border-red-900/30">
                <h2 className="text-xl font-bold text-red-400 mb-2">Stream Server Unavailable</h2>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  The upstream streaming server did not return a valid playback link for this episode. Please switch to another server (HD-1 / HD-2) or language (Sub / Dub) using the control panel on the right.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-[#581c87] hover:bg-[#4c1d95] text-white px-5 py-2 rounded text-xs font-bold transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <iframe 
                src={streamUrl}
                title={`Anime Stream Episode ${epNum}`}
                className="w-full h-full border-0 outline-none relative z-10"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
          
          {/* Episode Info Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111115] border border-[#212126] p-4 rounded-xl z-10 relative"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-[#581c87] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Episode {epNum}
                </span>
                <span className="text-xs text-gray-400 font-mono">ID: {slug}</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Now Playing Episode {epNum} ({selectedType.toUpperCase()})
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const watchlist = JSON.parse(localStorage.getItem('animora_watchlist') || '[]');
                  if (!watchlist.some((i: any) => i.id === slug)) {
                    watchlist.push({ id: slug, title: slug, image: '' });
                    localStorage.setItem('animora_watchlist', JSON.stringify(watchlist));
                    alert('Added to your watchlist library!');
                  } else {
                    alert('Already in your watchlist!');
                  }
                }}
                className="flex items-center gap-1.5 bg-[#1c1c22] hover:bg-[#2c2c34] text-gray-200 px-4 py-2 rounded text-xs font-semibold transition-colors border border-[#2a2a35]"
              >
                <Bookmark className="w-4 h-4 text-purple-400" />
                Add to Library
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Right Sidebar: Server & Sub/Dub Switcher */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0 z-10"
        >
          <div className="bg-[#111115] border border-[#212126] p-5 rounded-xl flex flex-col gap-6 sticky top-20">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <ServerIcon className="w-4 h-4 text-purple-400" />
                Streaming Servers
              </h3>
              <p className="text-xs text-gray-400">
                Select your preferred audio type and server node for seamless playback.
              </p>
            </div>

            {/* Sub / Dub Switcher */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Audio Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedType('sub')}
                  className={`py-2 px-4 rounded text-xs font-bold transition-all ${selectedType === 'sub' ? 'bg-[#581c87] text-white shadow-lg shadow-purple-950/50' : 'bg-[#18181d] text-gray-400 hover:text-white border border-[#212126]'}`}
                >
                  SUBBED
                </button>
                <button
                  onClick={() => setSelectedType('dub')}
                  className={`py-2 px-4 rounded text-xs font-bold transition-all ${selectedType === 'dub' ? 'bg-[#581c87] text-white shadow-lg shadow-purple-950/50' : 'bg-[#18181d] text-gray-400 hover:text-white border border-[#212126]'}`}
                >
                  DUBBED
                </button>
              </div>
            </div>

            {/* Server List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Servers</span>
              <div className="grid grid-cols-2 gap-2">
                {['HD-1', 'HD-2'].map((srv) => {
                  const exists = servers.some(s => s.serverName === srv && s.dataType === selectedType);
                  return (
                    <button
                      key={srv}
                      onClick={() => setSelectedServer(srv)}
                      className={`py-2.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedServer === srv ? 'bg-purple-600/30 text-purple-200 border border-purple-500' : 'bg-[#18181d] text-gray-300 hover:bg-[#212126] border border-[#212126]'}`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {srv}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-[#18181d] rounded-lg border border-[#212126] text-xs text-gray-400 leading-relaxed">
              <p className="font-semibold text-gray-300 mb-1">Playback Notice:</p>
              Streams are securely proxied via authorized embed handoffs from our Railway API backend. If any server fails to load, simply toggle between HD-1 and HD-2.
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

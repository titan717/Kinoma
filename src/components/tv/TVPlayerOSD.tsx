import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Settings,
  X,
  Play,
  Pause,
  ListVideo,
  Volume2,
  MonitorPlay,
  Gauge,
  AudioLines
} from 'lucide-react';

interface TVPlayerOSDProps {
  animeTitle: string;
  episodeNumber: string;
  episodeTitle?: string;
  currentEpisodeIndex: number;
  episodes: any[];
  seasons: any[];
  currentSeason?: number;
  recommendations?: any[];
  isMovie?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onPlayEpisode: (episodeId: string, timestamp?: number) => void;
  selectedType: 'sub' | 'dub';
  onSelectType: (type: 'sub' | 'dub') => void;
  servers: any[];
  selectedServer: string;
  onSelectServer: (server: string) => void;
}

/**
 * Premium 10-foot Kinoma player OSD.
 *
 * The video itself remains the playback surface. There is intentionally
 * no permanent Play/Pause button and no permanent Audio/Subtitles button.
 */
export function TVPlayerOSD({
  animeTitle,
  episodeNumber,
  episodeTitle,
  currentEpisodeIndex,
  episodes,
  seasons,
  currentSeason = 1,
  recommendations = [],
  isMovie = false,
  isOpen,
  onClose,
  onBack,
  onPlayEpisode,
  selectedType,
  onSelectType,
  servers,
  selectedServer,
  onSelectServer
}: TVPlayerOSDProps) {
  const [drawer, setDrawer] = useState<'episodes' | 'settings' | 'more' | null>(null);
  const [settingsFocus, setSettingsFocus] = useState(0);
  const [seasonFocus, setSeasonFocus] = useState(
    Math.max(0, seasons.findIndex((s: any) => s.seasonNumber === currentSeason))
  );
  const [episodeFocus, setEpisodeFocus] = useState(Math.max(0, currentEpisodeIndex));
  const [seekSeconds, setSeekSeconds] = useState(0);
  const [showStatus, setShowStatus] = useState<'play' | 'pause' | null>(null);

  useEffect(() => {
    setEpisodeFocus(Math.max(0, currentEpisodeIndex));
  }, [currentEpisodeIndex]);

  useEffect(() => {
    if (!showStatus) return;
    const t = window.setTimeout(() => setShowStatus(null), 900);
    return () => window.clearTimeout(t);
  }, [showStatus]);

  const season = seasons[seasonFocus];
  const seasonEpisodes = useMemo(() => {
    if (!season) return episodes;
    return Array.isArray(season.episodes) && season.episodes.length ? season.episodes : episodes;
  }, [season, episodes]);

  if (!isOpen) return null;

  const closeDrawer = () => setDrawer(null);

  const moveSeek = (delta: number) => {
    setSeekSeconds(prev => Math.max(0, prev + delta));
  };

  const openEpisodes = () => setDrawer(isMovie ? 'more' : 'episodes');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (drawer === 'settings') setSettingsFocus(prev => Math.max(0, prev - 1));
      else if (drawer === 'episodes') setEpisodeFocus(prev => Math.max(0, prev - 1));
      else if (!drawer) moveSeek(-10);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (drawer === 'settings') setSettingsFocus(prev => Math.min(3, prev + 1));
      else if (drawer === 'episodes') setEpisodeFocus(prev => Math.min(Math.max(0, seasonEpisodes.length - 1), prev + 1));
      else if (!drawer) moveSeek(10);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (drawer === 'episodes') {
        if (seasonFocus > 0) setSeasonFocus(prev => prev - 1);
      } else if (drawer) {
        closeDrawer();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!drawer) {
        openEpisodes();
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      if (drawer) closeDrawer();
      else onClose();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (drawer === 'episodes') {
        const ep = seasonEpisodes[episodeFocus];
        if (ep) onPlayEpisode(ep.id, 0);
      } else if (drawer === 'settings') {
        if (settingsFocus === 0) onSelectType(selectedType === 'sub' ? 'dub' : 'sub');
        if (settingsFocus === 1 && servers.length) {
          const index = Math.max(0, servers.findIndex((s: any) => s.serverName === selectedServer));
          const next = servers[(index + 1) % servers.length];
          if (next) onSelectServer(next.serverName);
        }
      } else {
        // No permanent play/pause control exists in the OSD.
        // OK remains reserved for the underlying video/player surface.
        setShowStatus(prev => prev === 'pause' ? 'play' : 'pause');
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const formatSeek = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />

      <header className="absolute top-0 inset-x-0 px-8 lg:px-14 pt-7 flex items-start justify-between pointer-events-auto">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-xl px-4 py-3 text-white transition-all hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">Back</div>
            <div className="text-sm font-black">{animeTitle}</div>
            <div className="text-xs text-white/65">{episodeNumber}{episodeTitle ? ` • ${episodeTitle}` : ''}</div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-black text-white/75 backdrop-blur-xl">
            4K
          </span>
          <button
            onClick={() => setDrawer('settings')}
            className="rounded-2xl border border-white/10 bg-black/45 p-3 text-white backdrop-blur-xl transition-all hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:scale-105"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {showStatus && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-5 text-white backdrop-blur-xl">
          {showStatus === 'pause' ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 px-8 lg:px-14 pb-7 pointer-events-auto">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/75">
          <span>{formatSeek(seekSeconds)}</span>
          <span>{seekSeconds ? `Preview • ${formatSeek(seekSeconds)}` : 'Live player'}</span>
        </div>

        <div
          className="relative h-3 cursor-pointer rounded-full bg-white/20 focus:outline-none"
          tabIndex={0}
          aria-label="Timeline"
          onClick={() => moveSeek(10)}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#FF0055]" style={{ width: `${Math.min(100, Math.max(2, seekSeconds / 3))}%` }} />
          <div className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(0,240,255,.75)]" style={{ left: `calc(${Math.min(100, Math.max(2, seekSeconds / 3))}% - 10px)` }} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => moveSeek(-10)}
              className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-black text-white/80 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            >
              −10s
            </button>
            <button
              onClick={() => moveSeek(10)}
              className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-black text-white/80 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            >
              +10s
            </button>
          </div>

          <button
            onClick={openEpisodes}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-xs font-black text-white backdrop-blur-xl transition-all hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:scale-105"
          >
            <ListVideo className="w-4 h-4" />
            {isMovie ? 'More Like This' : 'Episodes'}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {drawer === 'episodes' && !isMovie && (
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[#0B0C10]/96 border-t border-white/10 backdrop-blur-2xl pointer-events-auto shadow-[0_-30px_80px_rgba(0,0,0,.75)]">
          <div className="h-full flex">
            <aside className="w-[25%] min-w-[220px] border-r border-white/10 p-7 overflow-y-auto">
              <div className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-white/45">Seasons</div>
              <div className="space-y-2">
                {seasons.map((s: any, idx: number) => (
                  <button
                    key={s.seasonNumber ?? idx}
                    onClick={() => { setSeasonFocus(idx); setEpisodeFocus(0); }}
                    className={`w-full rounded-2xl px-4 py-4 text-left font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#00F0FF] ${seasonFocus === idx ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#FF0055]/20 border border-[#00F0FF]/50 text-white scale-[1.02]' : 'border border-white/5 bg-white/[.03] text-white/60'}`}
                  >
                    {s.title || `Season ${s.seasonNumber}`}
                  </button>
                ))}
              </div>
            </aside>

            <section className="flex-1 overflow-y-auto p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Episodes</div>
                  <div className="text-lg font-black text-white">{season?.title || `Season ${currentSeason}`}</div>
                </div>
                <button onClick={closeDrawer} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00F0FF]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {seasonEpisodes.map((ep: any, idx: number) => {
                  const focused = idx === episodeFocus;
                  const current = String(ep.number) === String(episodeNumber).replace(/^E/i, '');
                  return (
                    <button
                      key={ep.id || idx}
                      onClick={() => onPlayEpisode(ep.id, 0)}
                      className={`w-full flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none ${focused ? 'border-[#00F0FF]/70 bg-gradient-to-r from-[#00F0FF]/15 to-[#FF0055]/10 scale-[1.015] shadow-[0_0_25px_rgba(0,240,255,.12)]' : 'border-white/5 bg-white/[.03]'}`}
                    >
                      <img src={ep.image || ''} alt="" className="h-16 w-28 rounded-xl object-cover bg-black/40" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black uppercase tracking-wider text-white/45">Episode {ep.number}</div>
                        <div className="truncate text-base font-black text-white">{ep.title || `Episode ${ep.number}`}</div>
                        <div className="mt-1 text-xs text-white/45">{ep.duration ? `${Math.round(ep.duration / 60)} min` : ''}</div>
                      </div>
                      {current && <span className="rounded-full bg-[#00F0FF]/15 px-2 py-1 text-[10px] font-black text-[#00F0FF]">NOW</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}

      {drawer === 'more' && (
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[#0B0C10]/96 border-t border-white/10 backdrop-blur-2xl p-7 pointer-events-auto shadow-[0_-30px_80px_rgba(0,0,0,.75)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Discovery</div>
              <div className="text-xl font-black">More Like This</div>
            </div>
            <button onClick={closeDrawer} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto">
            {recommendations.slice(0, 8).map((item: any) => (
              <button key={item.id} onClick={() => onBack()} className="group text-left focus:outline-none">
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[.03] transition-all group-focus:ring-2 group-focus:ring-[#00F0FF] group-focus:scale-[1.04]">
                  <img src={item.image} alt="" className="aspect-[2/3] w-full object-cover" />
                </div>
                <div className="mt-2 truncate text-xs font-bold text-white/80">{typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {drawer === 'settings' && (
        <div className="absolute right-0 top-0 bottom-0 w-[42%] min-w-[420px] bg-[#0B0C10]/98 border-l border-white/10 backdrop-blur-2xl p-8 pointer-events-auto shadow-[-30px_0_80px_rgba(0,0,0,.7)]">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Player</div>
              <div className="text-2xl font-black">Settings</div>
            </div>
            <button onClick={closeDrawer} className="rounded-xl border border-white/10 bg-white/5 p-2 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-3">
            {[
              { icon: AudioLines, label: 'Audio & Subtitles', value: selectedType.toUpperCase() },
              { icon: MonitorPlay, label: 'Video Quality', value: 'Auto' },
              { icon: Gauge, label: 'Playback Speed', value: '1×' },
              { icon: Volume2, label: 'Audio Output', value: 'TV' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (idx === 0) onSelectType(selectedType === 'sub' ? 'dub' : 'sub');
                    if (idx === 1 && servers.length) {
                      const current = servers.findIndex((s: any) => s.serverName === selectedServer);
                      const next = servers[(Math.max(0, current) + 1) % servers.length];
                      if (next) onSelectServer(next.serverName);
                    }
                  }}
                  className={`w-full flex items-center gap-4 rounded-2xl border p-5 text-left transition-all focus:outline-none ${settingsFocus === idx ? 'border-[#00F0FF]/70 bg-gradient-to-r from-[#00F0FF]/15 to-[#FF0055]/10 scale-[1.02]' : 'border-white/5 bg-white/[.03]'}`}
                >
                  <Icon className="w-6 h-6 text-[#00F0FF]" />
                  <div className="flex-1">
                    <div className="font-black">{item.label}</div>
                    <div className="text-xs text-white/45">{item.value}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

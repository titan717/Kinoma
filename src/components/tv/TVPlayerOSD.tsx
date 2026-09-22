import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  ListVideo,
  Volume2,
  MonitorPlay,
  Gauge,
  AudioLines,
  Play,
  Pause
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
  initialDrawer?: 'episodes' | 'settings' | 'more' | null;
  onClose: () => void;
  onBack: () => void;
  onPlayEpisode: (episodeId: string, timestamp?: number) => void;
  selectedType: 'sub' | 'dub';
  onSelectType: (type: 'sub' | 'dub') => void;
  servers: any[];
  selectedServer: string;
  onSelectServer: (server: string) => void;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onSeek?: (time: number) => void;
}

type Drawer = 'episodes' | 'settings' | 'more' | null;
type FocusZone = 'top' | 'timeline' | 'drawer';

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '00:00';
  const total = Math.floor(value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
  initialDrawer = null,
  onClose,
  onBack,
  onPlayEpisode,
  selectedType,
  onSelectType,
  servers,
  selectedServer,
  onSelectServer,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onTogglePlay,
  onSeek
}: TVPlayerOSDProps) {
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [focusZone, setFocusZone] = useState<FocusZone>('top');
  const [topFocus, setTopFocus] = useState(0);
  const [timelineFocus, setTimelineFocus] = useState(0);
  const [seasonFocus, setSeasonFocus] = useState(
    Math.max(0, seasons.findIndex((s: any) => s.seasonNumber === currentSeason))
  );
  const [episodeFocus, setEpisodeFocus] = useState(Math.max(0, currentEpisodeIndex));
  const [settingsFocus, setSettingsFocus] = useState(0);
  const [seekPreview, setSeekPreview] = useState(currentTime);

  const season = seasons[seasonFocus];
  const seasonEpisodes = useMemo(() => {
    if (!season) return episodes;
    return Array.isArray(season.episodes) && season.episodes.length ? season.episodes : episodes;
  }, [season, episodes]);

  useEffect(() => {
    setEpisodeFocus(Math.max(0, currentEpisodeIndex));
  }, [currentEpisodeIndex]);

  useEffect(() => {
    setSeekPreview(currentTime);
  }, [currentTime]);

  useEffect(() => {
    if (!isOpen) return;
    setDrawer(initialDrawer);
    setFocusZone(initialDrawer ? 'drawer' : 'top');
  }, [isOpen, initialDrawer]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009 || e.keyCode === 461) {
        e.preventDefault();
        if (drawer) {
          setDrawer(null);
          setFocusZone('top');
        } else {
          onClose();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (drawer === 'settings') {
          setSettingsFocus(prev => Math.max(0, prev - 1));
        } else if (drawer === 'episodes') {
          setEpisodeFocus(prev => Math.max(0, prev - 1));
        } else if (drawer === 'more') {
          setEpisodeFocus(prev => Math.max(0, prev - 1));
        } else if (focusZone === 'top') {
          setTopFocus(prev => Math.max(0, prev - 1));
        } else {
          const next = Math.max(0, Math.min(duration || Infinity, seekPreview - 10));
          setSeekPreview(next);
          onSeek?.(next);
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (drawer === 'settings') {
          setSettingsFocus(prev => Math.min(3, prev + 1));
        } else if (drawer === 'episodes' || drawer === 'more') {
          setEpisodeFocus(prev => Math.min(Math.max(0, seasonEpisodes.length - 1), prev + 1));
        } else if (focusZone === 'top') {
          setTopFocus(prev => Math.min(1, prev + 1));
        } else {
          const next = Math.max(0, Math.min(duration || Infinity, seekPreview + 10));
          setSeekPreview(next);
          onSeek?.(next);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (drawer === 'episodes') {
          if (seasonFocus > 0) {
            setSeasonFocus(prev => prev - 1);
            setEpisodeFocus(0);
          } else {
            setDrawer(null);
            setFocusZone('top');
          }
        } else if (drawer) {
          setDrawer(null);
          setFocusZone('top');
        } else if (focusZone === 'timeline') {
          setFocusZone('top');
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (drawer === 'episodes') {
          return;
        }
        if (drawer) return;

        if (focusZone === 'top') {
          // Reference behavior: Down from the player opens the season/episode drawer directly.
          setDrawer(isMovie ? 'more' : 'episodes');
          setFocusZone('drawer');
        } else if (focusZone === 'timeline') {
          setDrawer(isMovie ? 'more' : 'episodes');
          setFocusZone('drawer');
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();

        if (drawer === 'episodes') {
          const ep = seasonEpisodes[episodeFocus];
          if (ep) onPlayEpisode(ep.id, 0);
          return;
        }

        if (drawer === 'more') {
          const item = recommendations[episodeFocus];
          if (item?.id) onBack();
          return;
        }

        if (drawer === 'settings') {
          if (settingsFocus === 0) {
            onSelectType(selectedType === 'sub' ? 'dub' : 'sub');
          } else if (settingsFocus === 1 && servers.length) {
            const index = Math.max(0, servers.findIndex((s: any) => s.serverName === selectedServer));
            const next = servers[(index + 1) % servers.length];
            if (next) onSelectServer(next.serverName);
          }
          return;
        }

        if (focusZone === 'top') {
          if (topFocus === 0) onBack();
          else setDrawer('settings');
          return;
        }

        if (focusZone === 'timeline') {
          onTogglePlay?.();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen, drawer, focusZone, topFocus, seasonFocus, episodeFocus, settingsFocus,
    seasonEpisodes, duration, seekPreview, recommendations, isMovie, onSeek,
    onTogglePlay, onBack, onClose, onPlayEpisode, selectedType, selectedServer,
    servers, currentEpisodeIndex
  ]);

  if (!isOpen) return null;

  const progress = duration > 0 ? Math.min(100, Math.max(0, (seekPreview / duration) * 100)) : 0;
  const remaining = duration > 0 ? Math.max(0, duration - seekPreview) : 0;
  const previewImage = seasonEpisodes[episodeFocus]?.image || episodes[currentEpisodeIndex]?.image;

  return (
    <div data-kinoma-osd="true" className="pointer-events-none absolute inset-0 z-50 select-none font-sans">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-start justify-between px-8 pt-7 lg:px-14">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left  outline-none transition-all ${
            focusZone === 'top' && topFocus === 0
              ? 'scale-[1.05] border-white/60 bg-white/10 ring-2 ring-white/30'
              : 'border-white/10 bg-black/45'
          }`}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Back</div>
            <div className="max-w-[55vw] truncate text-base font-black text-white">{animeTitle}</div>
            <div className="max-w-[55vw] truncate text-xs font-semibold text-white/55">
              {episodeNumber}{episodeTitle ? ` • ${episodeTitle}` : ''}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-black text-white/70 ">
            AUTO
          </span>
          <button
            type="button"
            onClick={() => setDrawer('settings')}
            className={`rounded-2xl border p-3 text-white  outline-none transition-all ${
              focusZone === 'top' && topFocus === 1
                ? 'scale-[1.08] border-white/60 bg-white/10 ring-2 ring-white/30'
                : 'border-white/10 bg-black/45'
            }`}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-8 pb-8 lg:px-14">
        {focusZone === 'timeline' && (
          <div className="mb-3 flex items-end gap-4">
            <div className="w-44 overflow-hidden rounded-xl border border-white/10 bg-black/65 shadow-2xl ">
              {previewImage ? (
                <img src={previewImage} alt="" loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video w-full bg-white/[.04]" />
              )}
              <div className="px-3 py-2 text-xs font-black text-white">
                {formatTime(seekPreview)}
              </div>
            </div>
            <div className="pb-2 text-xs font-bold text-white/45">
              {duration > 0 ? 'Left / Right to seek' : 'Seeking preview will activate when the player exposes a seekable timeline'}
            </div>
          </div>
        )}

        <div
          className={`relative h-3 rounded-full bg-white/20 transition-all ${
            focusZone === 'timeline' ? 'h-4 ring-2 ring-[#ffffff]/40' : ''
          }`}
          aria-label="Playback timeline"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white to-[#c084fc]"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.35)]"
            style={{ left: `calc(${progress}% - 10px)` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-bold text-white/70">
          <span>{formatTime(seekPreview)}</span>
          <span>{duration > 0 ? `-${formatTime(remaining)}` : '—'}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
            {isPlaying ? 'Playing' : 'Paused'}
          </div>

          <button
            type="button"
            onClick={() => setDrawer(isMovie ? 'more' : 'episodes')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-xs font-black text-white  outline-none transition-all focus:ring-2 focus:ring-white/40"
          >
            <ListVideo className="h-4 w-4 text-[#ffffff]" />
            {isMovie ? 'More Like This' : 'Episodes'}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {drawer === 'episodes' && !isMovie && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 h-[60%] overflow-hidden border-t border-white/10 bg-[#0B0C10]/97 shadow-[0_-30px_90px_rgba(0,0,0,.8)] ">
          <div className="flex h-full">
            <aside className="w-[25%] min-w-[230px] overflow-y-auto border-r border-white/10 p-7">
              <div className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-white/40">Seasons</div>
              <div className="space-y-2">
                {seasons.map((s: any, idx: number) => (
                  <button
                    type="button"
                    key={s.seasonNumber ?? idx}
                    onClick={() => { setSeasonFocus(idx); setEpisodeFocus(0); }}
                    className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-black outline-none transition-all ${
                      seasonFocus === idx
                        ? 'scale-[1.02] border-white/40 bg-white/10 text-white ring-1 ring-white/20'
                        : 'border-white/[.06] bg-white/[.03] text-white/55'
                    }`}
                  >
                    {s.title || `Season ${s.seasonNumber}`}
                  </button>
                ))}
              </div>
            </aside>

            <section className="flex-1 overflow-y-auto p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">Episodes</div>
                  <div className="text-xl font-black">{season?.title || `Season ${currentSeason}`}</div>
                </div>
                <button type="button" onClick={() => setDrawer(null)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {seasonEpisodes.map((ep: any, idx: number) => {
                  const focused = idx === episodeFocus;
                  const current = String(ep.number) === String(episodeNumber).replace(/^E/i, '');
                  return (
                    <button
                      type="button"
                      key={ep.id || idx}
                      onClick={() => onPlayEpisode(ep.id, 0)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left outline-none transition-all ${
                        focused
                          ? 'scale-[1.015] border-white/40 bg-white/10 ring-1 ring-white/20'
                          : 'border-white/[.06] bg-white/[.03]'
                      }`}
                    >
                      <img src={ep.image || ''} alt="" loading="lazy" decoding="async" className="h-16 w-28 rounded-xl bg-black/40 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-white/40">Episode {ep.number}</div>
                        <div className="truncate text-base font-black text-white">{ep.title || `Episode ${ep.number}`}</div>
                        <div className="mt-1 text-xs font-semibold text-white/40">{ep.duration ? `${Math.round(ep.duration / 60)} min` : ''}</div>
                      </div>
                      {current && <span className="rounded-full bg-[#ffffff]/10 px-2 py-1 text-[10px] font-black text-[#ffffff]">NOW</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}

      {drawer === 'more' && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 h-[60%] overflow-y-auto border-t border-white/10 bg-[#0B0C10]/97 p-7 shadow-[0_-30px_90px_rgba(0,0,0,.8)] ">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">Discovery</div>
              <div className="text-2xl font-black">More Like This</div>
            </div>
            <button type="button" onClick={() => setDrawer(null)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-5 lg:grid-cols-6">
            {recommendations.slice(0, 12).map((item: any, idx: number) => (
              <button
                type="button"
                key={item.id || idx}
                onClick={() => onBack()}
                className={`group text-left outline-none ${episodeFocus === idx ? 'scale-[1.04]' : ''}`}
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition-all group-focus:ring-2 group-focus:ring-white/40">
                  <img src={item.image || ''} alt="" loading="lazy" decoding="async" className="aspect-[2/3] w-full object-cover" />
                </div>
                <div className="mt-2 truncate text-xs font-bold text-white/80">
                  {typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || 'Anime'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {drawer === 'settings' && (
        <div className="pointer-events-auto absolute inset-y-0 right-0 w-[42%] min-w-[430px] border-l border-white/10 bg-[#0B0C10]/98 p-8 shadow-[-30px_0_90px_rgba(0,0,0,.75)] ">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">Player</div>
              <div className="text-2xl font-black">Settings</div>
            </div>
            <button type="button" onClick={() => setDrawer(null)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
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
                  type="button"
                  key={item.label}
                  onClick={() => {
                    if (idx === 0) onSelectType(selectedType === 'sub' ? 'dub' : 'sub');
                    if (idx === 1 && servers.length) {
                      const current = servers.findIndex((s: any) => s.serverName === selectedServer);
                      const next = servers[(Math.max(0, current) + 1) % servers.length];
                      if (next) onSelectServer(next.serverName);
                    }
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left outline-none transition-all ${
                    settingsFocus === idx
                      ? 'scale-[1.02] border-[#ffffff]/70 bg-gradient-to-r from-[#ffffff]/14 to-[#c084fc]/10 ring-1 ring-[#ffffff]/30'
                      : 'border-white/[.06] bg-white/[.03]'
                  }`}
                >
                  <Icon className="h-6 w-6 text-[#ffffff]" />
                  <div className="flex-1">
                    <div className="font-black">{item.label}</div>
                    <div className="text-xs text-white/40">{item.value}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/25" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {focusZone === 'timeline' && drawer === null && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full border border-[#ffffff]/30 bg-black/65 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#8ff7ff] ">
          D-pad Left / Right · Seek
        </div>
      )}

      {focusZone === 'timeline' && drawer === null && duration > 0 && (
        <div className="pointer-events-none absolute bottom-36 left-1/2 -translate-x-1/2 rounded-full bg-black/70 p-2 text-white">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </div>
      )}
    </div>
  );
}

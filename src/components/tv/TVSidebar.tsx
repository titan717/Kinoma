import React from 'react';
import { Home, Search, Bookmark, Film, Sparkles, Compass, Settings as SettingsIcon, Monitor } from 'lucide-react';
import { KinomaLogo } from '../ui/KinomaLogo';

export type TVNavSection =
  | 'home'
  | 'search'
  | 'mylist'
  | 'movies'
  | 'new_season'
  | 'genres'
  | 'settings';

interface TVSidebarProps {
  activeSection: TVNavSection;
  onSelectSection: (section: TVNavSection) => void;
  isFocused: boolean;
  focusedIndex: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onExitTVMode: () => void;
}

export const TV_NAV_ITEMS: { id: TVNavSection; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'new_season', label: 'Anime Series', icon: Sparkles },
  { id: 'movies', label: 'Movies & OVAs', icon: Film },
  { id: 'genres', label: 'Categories & Genres', icon: Compass },
  { id: 'mylist', label: 'My Watchlist', icon: Bookmark },
  { id: 'settings', label: 'Settings & Profiles', icon: SettingsIcon },
];

export function TVSidebar({
  activeSection,
  onSelectSection,
  isFocused,
  focusedIndex,
  isExpanded,
  setIsExpanded,
  onExitTVMode
}: TVSidebarProps) {
  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed inset-y-0 left-0 z-50 flex flex-col select-none border-r border-white/[0.06] transition-[width,background-color,box-shadow] duration-300 ease-out ${
        isExpanded
          ? 'w-[20vw] min-w-[280px] max-w-[360px] bg-[#0B0C10]/95 backdrop-blur-2xl shadow-[18px_0_60px_rgba(0,0,0,.42)]'
          : 'w-[8vw] min-w-[84px] max-w-[112px] bg-[#0B0C10]/72 backdrop-blur-xl'
      }`}
    >
      <div className="h-24 shrink-0 flex items-center px-4">
        {isExpanded ? (
          <div className="flex items-center gap-3">
            <KinomaLogo size="md" variant="full" />
            <span className="rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">
              TV
            </span>
          </div>
        ) : (
          <div className="mx-auto">
            <KinomaLogo size="sm" variant="mark" />
          </div>
        )}
      </div>

      <nav className="flex-1 flex flex-col justify-center gap-2 px-3">
        {TV_NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          const focused = isFocused && focusedIndex === index;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-14 items-center rounded-2xl outline-none transition-all duration-200 ${
                isExpanded ? 'w-full gap-4 px-4' : 'mx-auto w-14 justify-center'
              } ${
                focused
                  ? 'scale-[1.04] border border-[#00F0FF]/70 bg-gradient-to-r from-[#00F0FF]/18 to-[#FF0055]/16 text-white shadow-[0_0_30px_rgba(0,240,255,.14)]'
                  : active
                    ? 'border border-white/10 bg-white/[0.07] text-white'
                    : 'border border-transparent text-white/55 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {active && (
                <span className="absolute left-0 h-7 w-1 rounded-r-full bg-gradient-to-b from-[#00F0FF] to-[#FF0055] shadow-[0_0_12px_rgba(0,240,255,.65)]" />
              )}
              <Icon className={`h-6 w-6 shrink-0 transition-transform ${
                focused || active ? 'text-[#00F0FF] scale-110' : ''
              }`} />
              {isExpanded && (
                <span className="truncate text-[15px] font-bold tracking-wide">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={onExitTVMode}
          className={`flex h-12 items-center rounded-2xl border border-transparent text-white/50 transition-all hover:bg-white/[0.05] hover:text-white outline-none ${
            isFocused && focusedIndex === TV_NAV_ITEMS.length
              ? 'scale-[1.03] border-[#00F0FF]/60 bg-white/[0.07] text-white'
              : ''
          } ${isExpanded ? 'w-full gap-3 px-4' : 'mx-auto w-12 justify-center'}`}
          title="Return to standard Kinoma"
        >
          <Monitor className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="text-sm font-bold">Exit TV Mode</span>}
        </button>
      </div>
    </aside>
  );
}

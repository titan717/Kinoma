import React from 'react';
import { Home, Search, Bookmark, Film, Sparkles, Compass, Settings as SettingsIcon, Monitor } from 'lucide-react';
import { KinomaLogo } from '../ui/KinomaLogo';

export type TVNavSection = 'home' | 'search' | 'mylist' | 'movies' | 'new_season' | 'genres' | 'settings';

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

function TVMonoArtwork({ expanded }: { expanded: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-black/75 transition-all duration-300 ${expanded ? 'h-20' : 'h-10'}`}>
      <svg viewBox="0 0 240 80" className="absolute inset-0 h-full w-full opacity-80" aria-hidden="true">
        <path d="M72 12c18-12 49-9 63 6 11 12 14 30 6 43-9 14-28 21-45 17-17-4-30-18-31-35-1-13 2-24 7-31Z" fill="#bdbdbd"/>
        <path d="M68 27c12-22 45-28 68-10l-6 13c-17-9-34-8-56 11Z" fill="#171717"/>
        <path d="M84 38c7-5 14-5 21 0-6 7-14 8-21 0Zm31 0c7-5 15-4 21 1-7 7-15 6-21-1Z" fill="#0a0a0a"/>
        <path d="M101 55c9 5 18 5 27 0-4 10-22 13-27 0Z" fill="#111"/>
        <path d="M67 28 46 12l8 33 17-10Zm66-12 26-15-12 34-17-8Z" fill="#333"/>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      {expanded && <span className="absolute bottom-1.5 left-3 text-[7px] font-bold tracking-[0.28em] text-white/30">KINOMA TV</span>}
    </div>
  );
}

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
      className={`fixed inset-y-0 left-0 z-50 flex flex-col select-none border-r border-white/[0.07] transition-[width,background-color,border-radius,box-shadow] duration-300 ease-out ${
        isExpanded
          ? 'w-[20vw] min-w-[280px] max-w-[360px] rounded-r-[30px] bg-[#0a0b0e]/97 shadow-[14px_0_45px_rgba(0,0,0,.36)]'
          : 'w-[8vw] min-w-[84px] max-w-[112px] rounded-r-[20px] bg-[#0a0b0e]/92 shadow-[8px_0_28px_rgba(0,0,0,.22)]'
      }`}
    >
      <div className="h-28 shrink-0 flex flex-col justify-center px-4 gap-2">
        <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
          {isExpanded ? <KinomaLogo size="md" variant="full" /> : <KinomaLogo size="sm" variant="mark" />}
          {isExpanded && <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">TV</span>}
        </div>
        <TVMonoArtwork expanded={isExpanded} />
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
                  ? 'scale-[1.03] border border-white/20 bg-white/[0.10] text-white shadow-[0_8px_28px_rgba(0,0,0,.25)]'
                  : active
                    ? 'border border-white/10 bg-white/[0.07] text-white'
                    : 'border border-transparent text-white/55 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {active && <span className="absolute left-0 h-7 w-0.5 rounded-r-full bg-white/75" />}
              <Icon className={`h-6 w-6 shrink-0 transition-transform ${focused || active ? 'text-white scale-105' : 'text-white/55'}`} />
              {isExpanded && <span className="truncate text-[15px] font-bold tracking-wide">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={onExitTVMode}
          className={`flex h-12 items-center rounded-2xl border border-transparent text-white/50 transition-all hover:bg-white/[0.05] hover:text-white outline-none ${
            isFocused && focusedIndex === TV_NAV_ITEMS.length ? 'scale-[1.03] border-white/15 bg-white/[0.07] text-white' : ''
          } ${isExpanded ? 'w-full gap-3 px-4' : 'mx-auto w-12 justify-center'}`}
          title="Return to standard Kinoma"
        >
          <Monitor className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="text-sm font-bold">Exit TV Mode</span>}
        </button>
      </div>
      <div className="pointer-events-none absolute -right-1 top-1/2 h-20 w-2 -translate-y-1/2 rounded-full bg-white/10" />
    </aside>
  );
}

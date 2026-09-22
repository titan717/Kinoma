import React from 'react';
import { 
  Home, 
  Search, 
  Bookmark, 
  Film, 
  Sparkles, 
  Compass, 
  Settings as SettingsIcon,
  Monitor,
  LogOut
} from 'lucide-react';
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
  { id: 'mylist', label: 'My Watchlist', icon: Bookmark },
  { id: 'movies', label: 'Movies & OVAs', icon: Film },
  { id: 'new_season', label: 'Anime Series', icon: Sparkles },
  { id: 'genres', label: 'Categories & Genres', icon: Compass },
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
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between transition-all duration-250 ease-out select-none ${
        isExpanded 
          ? 'w-[20vw] min-w-[280px] max-w-[360px] bg-[#0B0C10]/96 backdrop-blur-2xl shadow-[8px_0_40px_rgba(0,0,0,0.65)] border-r border-white/10' 
          : 'w-[8vw] min-w-[88px] max-w-[116px] bg-[#0B0C10]/78 backdrop-blur-xl'
      }`}
    >
      {/* Top Section: Kinoma Logo */}
      <div className="pt-6 pb-4 px-4 flex items-center h-20 overflow-hidden">
        {isExpanded ? (
          <div className="flex items-center gap-3 pl-1">
            <KinomaLogo size="md" variant="full" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c084fc] bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
              TV
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <KinomaLogo size="sm" variant="mark" />
          </div>
        )}
      </div>

      {/* Center Navigation List */}
      <nav className="flex-1 flex flex-col justify-center gap-1.5 px-3">
        {TV_NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isItemFocused = isFocused && focusedIndex === index;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`group flex items-center h-12 rounded-xl transition-all duration-200 text-left outline-none cursor-pointer ${
                isItemFocused
                  ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#FF0055]/15 text-white border border-[#00F0FF]/70 shadow-[0_0_28px_rgba(0,240,255,0.16)] scale-[1.03] pl-3.5'
                  : isActive
                  ? 'bg-white/[0.07] text-white border border-[#00F0FF]/35'
                  : 'text-white/55 hover:text-white hover:bg-white/5'
              } ${isExpanded ? 'px-3.5 gap-3.5 w-full' : 'w-12 mx-auto justify-center'}`}
            >
              <div className="shrink-0 flex items-center justify-center">
                <Icon 
                  className={`transition-transform duration-200 ${
                    isItemFocused 
                      ? 'w-5 h-5 text-[#00F0FF] stroke-[2.5]' 
                      : isActive 
                      ? 'w-5 h-5 text-[#00F0FF] stroke-[2.2]' 
                      : 'w-5 h-5 group-hover:scale-110'
                  }`} 
                />
              </div>

              {isExpanded && (
                <div className="flex items-center justify-between flex-1 overflow-hidden whitespace-nowrap">
                  <span className={`text-sm font-bold tracking-wide truncate ${
                    isItemFocused ? 'text-black font-extrabold' : isActive ? 'text-white' : 'text-gray-300'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && !isItemFocused && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shrink-0 mr-1 shadow-[0_0_10px_#00F0FF]" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions: Web mode switch & TV info */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-1">
        <button
          onClick={onExitTVMode}
          title="Return to Web / Desktop View"
          className={`flex items-center h-11 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left outline-none cursor-pointer ${
            isExpanded ? 'px-3 gap-3 w-full' : 'w-12 mx-auto justify-center'
          } ${isFocused && focusedIndex === TV_NAV_ITEMS.length ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#FF0055]/15 text-white border border-[#00F0FF]/60 scale-105' : ''}`}
        >
          <Monitor className="w-4 h-4 shrink-0" />
          {isExpanded && (
            <span className="text-xs font-semibold tracking-wide truncate text-gray-300 hover:text-white">
              Exit TV Mode
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

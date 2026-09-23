import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, Settings, Bookmark, User, LogOut, Sparkles, Tv,
  Film, Sliders, X, Menu, Compass
} from 'lucide-react';
import { useAppearance } from '../../../lib/AppearanceContext';
import { useAuth } from '../../../lib/AuthContext';
import { useTVMode } from '../../../lib/TVModeContext';
import { ModernNotifications } from './ModernNotifications';
import { KinomaLogo } from '../KinomaLogo';
import { Button } from '../Button';
import { preferencesUtil } from '../../../lib/preferences';
import { AnimatePresence, motion } from 'motion/react';

interface ModernNavbarProps {
  onSelectCategory?: (category: string) => void;
  onOpenAuth?: () => void;
}

const NAV = [
  { href: '/browse', label: 'Browse', icon: Compass },
  { href: '/search', label: 'Explore', icon: Search },
  { href: '/whats-new', label: "What's New", icon: Sparkles },
  { href: '/library', label: 'My List', icon: Bookmark },
];

export function ModernNavbar({ onSelectCategory, onOpenAuth }: ModernNavbarProps) {
  const [location, setLocation] = useLocation();
  const { resolvedTheme, setThemeMode, openSettingsModal } = useAppearance();
  const { user, profile, logout } = useAuth();
  const { openAndroidTVModal } = useTVMode();
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userOpen, setUserOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    preferencesUtil.addRecentSearch(q);
    setLocation('/search?keyword=' + encodeURIComponent(q));
    setSearchOpen(false);
  };

  const replayIntro = () => window.dispatchEvent(new CustomEvent('kinoma_replay_intro'));
  const toggleTheme = () => setThemeMode(resolvedTheme === 'modern' ? 'classic' : 'modern');

  return (
    <>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => { setExpanded(false); setUserOpen(false); }}
        className={`fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col overflow-hidden border-r border-white/[0.07] bg-[#0a0b0e]/96 shadow-[12px_0_40px_rgba(0,0,0,.28)] transition-[width,border-radius] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${expanded ? 'w-[238px] rounded-r-[30px]' : 'w-[76px] rounded-r-[20px]'}`}
      >
        <div className="px-3 pt-4">
          <Link href="/browse" aria-label="Kinoma home">
            <div className={`flex h-12 items-center transition-all duration-300 ${expanded ? 'gap-3 px-2' : 'justify-center'}`}>
              <KinomaLogo size={expanded ? 'md' : 'sm'} variant={expanded ? 'full' : 'mark'} />
              {expanded && <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">Streaming</span>}
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 pt-7 space-y-1.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href === '/search' && location === '/explore');
            return (
              <Link key={href} href={href}>
                <div className={`group relative flex h-12 items-center rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer kinoma-focus ${expanded ? 'gap-3 px-3' : 'justify-center'} ${active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.055] hover:text-white'}`}>
                  {active && <span className="absolute left-0 top-2.5 h-7 w-0.5 rounded-full bg-white/75" />}
                  <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-white' : 'text-white/50'}`} />
                  {expanded && <span className="truncate">{label}</span>}
                  {!expanded && <span className="pointer-events-none absolute left-[64px] whitespace-nowrap rounded-lg bg-[#15161b] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">{label}</span>}
                </div>
              </Link>
            );
          })}

          <button
            onClick={() => setSearchOpen(v => !v)}
            className={`group relative flex h-12 w-full items-center rounded-2xl text-sm font-semibold text-white/55 hover:bg-white/[0.055] hover:text-white transition-all kinoma-focus ${expanded ? 'gap-3 px-3' : 'justify-center'}`}
          >
            <Search className="h-5 w-5 shrink-0 text-white/50" />
            {expanded && <span>Quick Search</span>}
            {!expanded && <span className="pointer-events-none absolute left-[64px] whitespace-nowrap rounded-lg bg-[#15161b] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">Quick Search</span>}
          </button>

          <AnimatePresence initial={false}>
            {searchOpen && expanded && (
              <motion.form
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                onSubmit={submitSearch}
                className="overflow-hidden px-1 pb-2"
              >
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search titles..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-white/20"
                />
              </motion.form>
            )}
          </AnimatePresence>
        </nav>

        <div className="px-3 pb-3 space-y-1.5">
          <ModernNotifications />
          <button onClick={() => openSettingsModal('appearance')} className={`flex h-11 w-full items-center rounded-2xl text-white/50 hover:bg-white/[0.055] hover:text-white transition-all kinoma-focus ${expanded ? 'gap-3 px-3' : 'justify-center'}`}>
            <Settings className="h-5 w-5 shrink-0" />
            {expanded && <span className="text-sm font-semibold">Settings</span>}
          </button>
          <button onClick={openAndroidTVModal} className={`flex h-11 w-full items-center rounded-2xl text-white/50 hover:bg-white/[0.055] hover:text-white transition-all kinoma-focus ${expanded ? 'gap-3 px-3' : 'justify-center'}`}>
            <Tv className="h-5 w-5 shrink-0" />
            {expanded && <span className="text-sm font-semibold">Android TV</span>}
          </button>
          <button onClick={toggleTheme} className={`flex h-11 w-full items-center rounded-2xl text-white/50 hover:bg-white/[0.055] hover:text-white transition-all kinoma-focus ${expanded ? 'gap-3 px-3' : 'justify-center'}`}>
            <Film className="h-5 w-5 shrink-0" />
            {expanded && <span className="text-sm font-semibold">{resolvedTheme === 'modern' ? 'Classic UI' : 'Modern UI'}</span>}
          </button>

          {!user ? (
            <Button variant="primary" size="sm" onClick={onOpenAuth} className={`mt-1 w-full ${expanded ? '' : 'px-0'}`}>
              {expanded ? 'Sign In' : <User className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="relative">
              <button onClick={() => setUserOpen(v => !v)} className={`flex h-11 w-full items-center rounded-2xl bg-white/[0.035] text-white/70 hover:bg-white/[0.07] transition-all kinoma-focus ${expanded ? 'gap-3 px-2' : 'justify-center'}`}>
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=KinomaAnime&backgroundColor=b6e3f4" alt="Profile" className="h-8 w-8 rounded-xl object-cover" />
                {expanded && <span className="truncate text-xs font-bold">{profile?.username || user.displayName || user.email?.split('@')[0] || 'Profile'}</span>}
              </button>
              <AnimatePresence>
                {userOpen && expanded && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .98 }} className="absolute bottom-12 left-0 right-0 rounded-2xl border border-white/10 bg-[#111217] p-2 shadow-2xl">
                    <Link href="/library"><div className="rounded-xl px-3 py-2 text-xs text-white/70 hover:bg-white/5">My List & History</div></Link>
                    <button onClick={() => openSettingsModal('appearance')} className="w-full rounded-xl px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5">Appearance & Settings</button>
                    <button onClick={replayIntro} className="w-full rounded-xl px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5">Replay Kinoma Intro</button>
                    <button onClick={logout} className="mt-1 flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 pt-3 text-left text-xs text-rose-300"><LogOut className="h-3.5 w-3.5" /> Sign Out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <motion.div animate={{ opacity: expanded ? 1 : .55, x: expanded ? 0 : -2 }} className="pointer-events-none absolute -right-1 top-1/2 h-20 w-2 -translate-y-1/2 rounded-full bg-white/15" />
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#0a0b0e]/92 px-4 backdrop-blur-xl md:hidden">
        <Link href="/browse"><KinomaLogo size="md" variant="full" /></Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(v => !v)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 kinoma-focus" aria-label="Search">
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <ModernNotifications />
          <button onClick={() => setExpanded(v => !v)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 kinoma-focus" aria-label="Menu">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={submitSearch} className="fixed left-3 right-3 top-[70px] z-50 rounded-2xl border border-white/10 bg-[#111217]/98 p-2 shadow-2xl md:hidden">
            <div className="flex items-center gap-2">
              <Search className="ml-2 h-4 w-4 text-white/40" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus placeholder="Search titles..." className="flex-1 bg-transparent px-1 py-3 text-sm text-white outline-none placeholder:text-white/30" />
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/65 md:hidden" onClick={() => setExpanded(false)}>
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[330px] rounded-r-[28px] border-r border-white/10 bg-[#0b0c10] p-4 pt-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4">
                <KinomaLogo size="md" variant="full" />
                <button onClick={() => setExpanded(false)} className="rounded-full bg-white/5 p-2 text-white/60">×</button>
              </div>
              <nav className="mt-6 space-y-1.5">
                {NAV.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setExpanded(false)}>
                    <div className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/65 hover:bg-white/5 hover:text-white">
                      <Icon className="h-5 w-5" />{label}
                    </div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

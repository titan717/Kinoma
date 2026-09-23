import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search,
  Settings,
  Bookmark,
  User,
  LogOut,
  Sparkles,
  Tv,
  X,
  Menu,
  Compass,
} from 'lucide-react';
import { useAppearance } from '../../../lib/AppearanceContext';
import { useAuth } from '../../../lib/AuthContext';
import { useTVMode } from '../../../lib/TVModeContext';
import { preferencesUtil } from '../../../lib/preferences';
import { AnimatePresence, motion } from 'motion/react';

interface ModernNavbarProps {
  onSelectCategory?: (category: string) => void;
  onOpenAuth?: () => void;
}

const NAV = [
  { href: '/home', label: 'Home', icon: Compass },
  { href: '/search', label: 'Explore', icon: Search },
  { href: '/whats-new', label: "What's New", icon: Sparkles },
  { href: '/library', label: 'My List', icon: Bookmark },
];

export function ModernNavbar({ onOpenAuth }: ModernNavbarProps) {
  const [location, setLocation] = useLocation();
  const { openSettingsModal } = useAppearance();
  const { user, profile, logout } = useAuth();
  const { openAndroidTVModal } = useTVMode();

  const [mobileOpen, setMobileOpen] = useState(false);
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
    setMobileOpen(false);
  };

  const isActive = (href: string) =>
    location === href || (href === '/search' && location === '/explore');

  return (
    <>
      <header className="kinoma-header sticky top-0 z-[var(--z-header)] w-full">
        <div className="kinoma-header__inner kinoma-shell">
          <Link
            href="/home"
            aria-label="Kinoma home"
            className="kinoma-header__brand kinoma-focus"
          >
            <img\n              src="https://raw.githubusercontent.com/titan717/Kinoma/5a6e2dc356c4e674cb51193ca083de9dcc3c8947/Kinoma-9-23-2026.png"\n              alt="Kinoma"\n              className="h-8 w-auto max-w-[150px] object-contain md:h-9"\n            />
          </Link>

          <nav className="kinoma-header__nav hidden md:flex" aria-label="Primary navigation">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="kinoma-header__link-wrap">
                <span
                  className={`kinoma-header__link ${isActive(href) ? 'is-active' : ''}`}
                >
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="kinoma-header__actions">
            <form
              onSubmit={submitSearch}
              className={`kinoma-header__search ${searchOpen ? 'is-open' : ''}`}
            >
              <Search className="kinoma-header__search-icon" aria-hidden="true" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search"
                aria-label="Search titles"
                className="kinoma-header__search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="kinoma-header__icon-button"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="kinoma-header__kbd">⌘ K</kbd>
            </form>

            <button
              onClick={() => {
                setSearchOpen((value) => !value);
                if (!searchOpen) setTimeout(() => {
                  document.querySelector<HTMLInputElement>('.kinoma-header__search-input')?.focus();
                }, 0);
              }}
              className="kinoma-header__mobile-icon md:hidden kinoma-focus"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>


            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen((value) => !value)}
                  className="kinoma-header__profile kinoma-focus"
                  aria-label="Open profile menu"
                  aria-expanded={userOpen}
                >
                  <img
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=KinomaAnime&backgroundColor=e8d0c0"
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="hidden lg:block max-w-[100px] truncate text-xs font-semibold">
                    {profile?.username || user.displayName || user.email?.split('@')[0] || 'Profile'}
                  </span>
                </button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="kinoma-header__menu absolute right-0 top-[calc(100%+12px)]"
                    >
                      <Link href="/library" onClick={() => setUserOpen(false)}>
                        <div className="kinoma-header__menu-item">My List & History</div>
                      </Link>
                      <button
                        onClick={() => {
                          setUserOpen(false);
                          openSettingsModal('player');
                        }}
                        className="kinoma-header__menu-item w-full text-left"
                      >
                        Appearance & Settings
                      </button>
                      <button
                        onClick={() => {
                          setUserOpen(false);
                          openAndroidTVModal();
                        }}
                        className="kinoma-header__menu-item w-full text-left"
                      >
                        Android TV
                      </button>
                      <button
                        onClick={logout}
                        className="kinoma-header__menu-item mt-1 w-full border-t border-white/[0.07] pt-3 text-left !text-[#d9958b]"
                      >
                        <LogOut className="mr-2 inline h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="kinoma-header__signin kinoma-focus"
              >
                Sign in
              </button>
            )}

            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="kinoma-header__mobile-icon md:hidden kinoma-focus"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={submitSearch}
              className="kinoma-header__search-mobile md:hidden"
            >
              <Search className="h-4 w-4 text-[#aaa19b]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime, movies, series..."
                aria-label="Search titles"
              />
              <kbd>ESC</kbd>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="kinoma-header__mobile-panel md:hidden"
            >
              <nav aria-label="Mobile navigation">
                {NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`kinoma-header__mobile-link ${isActive(href) ? 'is-active' : ''}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              <div className="kinoma-header__mobile-tools">
                <button onClick={() => openSettingsModal('player')}>
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button onClick={openAndroidTVModal}>
                  <Tv className="h-4 w-4" />
                  Android TV
                </button>
                {!user && (
                  <button onClick={onOpenAuth}>
                    <User className="h-4 w-4" />
                    Sign in
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Search, 
  Settings, 
  Bookmark, 
  User, 
  LogOut, 
  Sparkles, 
  Tv, 
  Film, 
  Sliders, 
  X,
  Menu,
  PlaySquare,
  Globe,
  Compass
} from 'lucide-react';
import { useAppearance } from '../../../lib/AppearanceContext';
import { useAuth } from '../../../lib/AuthContext';
import { ModernNotifications } from './ModernNotifications';
import { KinomaLogo } from '../KinomaLogo';
import { AnimatePresence, motion } from 'motion/react';

interface ModernNavbarProps {
  onSelectCategory?: (category: string) => void;
  onOpenAuth?: () => void;
}

export function ModernNavbar({ onSelectCategory, onOpenAuth }: ModernNavbarProps) {
  const [location, setLocation] = useLocation();
  const { resolvedTheme, setThemeMode, openSettingsModal } = useAppearance();
  const { user, profile, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isMobileSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
      setIsMobileDrawerOpen(false);
    }
  };

  const toggleThemeQuick = () => {
    setThemeMode(resolvedTheme === 'modern' ? 'classic' : 'modern');
  };

  const handleReplayIntro = () => {
    window.dispatchEvent(new CustomEvent('kinoma_replay_intro'));
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      <header 
        className={`sticky md:fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#0b0c10]/95 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl' 
            : 'bg-gradient-to-b from-[#0b0c10]/90 via-[#0b0c10]/40 to-transparent py-3 sm:py-4 md:py-5'
        }`}
      >
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* LEFT: Logo & Primary Desktop Navigation */}
          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            
            {/* Custom Typographic Logo */}
            <Link href="/">
              <div title="Kinoma">
                <KinomaLogo size="md" variant="full" />
              </div>
            </Link>

            {/* Desktop & Laptop Navigation Links (Matching Reference Image) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2.5 text-xs lg:text-sm font-medium">
              <Link href="/">
                <span className={`px-3 py-1.5 rounded-full transition-all cursor-pointer select-none ${
                  location === '/' 
                    ? 'text-white font-bold bg-white/10 shadow-sm' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}>
                  Home
                </span>
              </Link>

              <Link href="/library">
                <span className={`px-3 py-1.5 rounded-full transition-all cursor-pointer select-none ${
                  location === '/library' 
                    ? 'text-white font-bold bg-white/10 shadow-sm' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}>
                  My List
                </span>
              </Link>

              <button
                onClick={() => {
                  if (location !== '/') setLocation('/');
                  if (onSelectCategory) onSelectCategory('Movie');
                }}
                className="px-3 py-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer select-none"
              >
                Movie
              </button>

              <button
                onClick={() => {
                  if (location !== '/') setLocation('/');
                  if (onSelectCategory) onSelectCategory('New Season');
                }}
                className="px-3 py-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer select-none"
              >
                New Season
              </button>

              <button
                onClick={() => {
                  if (location !== '/') setLocation('/');
                  if (onSelectCategory) onSelectCategory('All Genres');
                }}
                className="hidden lg:inline-flex px-3 py-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer select-none"
              >
                Language
              </button>
            </nav>
          </div>

          {/* RIGHT: Search Pill, Notifications, Profile & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Desktop/Tablet Frosted Pill Search Input (Matching Reference Image) */}
            <form 
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex relative items-center"
            >
              <div className="relative flex items-center bg-white/5 hover:bg-white/10 focus-within:bg-white/10 border border-white/10 focus-within:border-[#c084fc]/60 rounded-full transition-all backdrop-blur-md px-3.5 py-1.5 sm:w-44 md:w-56 lg:w-72 shadow-inner">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search here ..."
                  className="w-full bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none tracking-wide pr-6"
                />
                <button type="submit" className="absolute right-3 text-gray-400 hover:text-white transition-colors" aria-label="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Mobile Search Icon Toggle Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all backdrop-blur-md"
              aria-label="Toggle Mobile Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell (Matching Reference Image) */}
            <ModernNotifications />

            {/* User Profile Avatar (Matching Reference Image with Anime Avatar Style) */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  if (user) {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  } else if (onOpenAuth) {
                    onOpenAuth();
                  }
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white/15 hover:ring-[#c084fc] transition-all p-0.5 overflow-hidden flex items-center justify-center bg-[#181922] cursor-pointer"
                title={user ? (profile?.username || user.displayName || 'Profile') : 'Sign In'}
                aria-label="User profile"
              >
                {/* Default or Custom Anime Avatar (matches blue-haired avatar in reference image) */}
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=KinomaAnime&backgroundColor=b6e3f4"
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-52 bg-[#111218]/95 border border-[#242533] backdrop-blur-xl rounded-2xl shadow-2xl p-2 z-50 overflow-hidden text-xs">
                  <div className="px-3 py-2 border-b border-[#1f202c]">
                    <p className="font-bold text-white truncate">{profile?.username || user.displayName || 'Kinoma User'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link href="/library" onClick={() => setIsUserMenuOpen(false)}>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer">
                        <Bookmark className="w-3.5 h-3.5 text-[#c084fc]" />
                        <span>My List & History</span>
                      </div>
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openSettingsModal('appearance');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-left cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#c084fc]" />
                      <span>Appearance & Settings</span>
                    </button>

                    <button
                      onClick={handleReplayIntro}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-left cursor-pointer"
                    >
                      <PlaySquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>Replay Kinoma Intro</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 text-left mt-1 border-t border-[#1f202c] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Drawer Trigger Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all backdrop-blur-md"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Mobile Search Overlay Input */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden px-4 pt-2 pb-1 overflow-hidden"
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime, movies, genres..."
                  className="w-full bg-[#161722] border border-[#2a2b3d] rounded-full px-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#c084fc]"
                />
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute right-3 text-gray-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-[#0e0f14] border-l border-white/10 p-6 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <KinomaLogo size="md" variant="full" />
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="py-6 flex flex-col gap-3 font-medium text-sm">
                  <Link href="/" onClick={() => setIsMobileDrawerOpen(false)}>
                    <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors ${
                      location === '/' ? 'bg-white text-black font-bold' : 'text-gray-300 hover:bg-white/5'
                    }`}>
                      <Compass className="w-5 h-5" />
                      <span>Home</span>
                    </div>
                  </Link>

                  <Link href="/library" onClick={() => setIsMobileDrawerOpen(false)}>
                    <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors ${
                      location === '/library' ? 'bg-white text-black font-bold' : 'text-gray-300 hover:bg-white/5'
                    }`}>
                      <Bookmark className="w-5 h-5" />
                      <span>My List & Bookmarks</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      if (location !== '/') setLocation('/');
                      if (onSelectCategory) onSelectCategory('Movie');
                    }}
                    className="px-4 py-3 rounded-2xl flex items-center gap-3 text-gray-300 hover:bg-white/5 text-left"
                  >
                    <Film className="w-5 h-5 text-[#c084fc]" />
                    <span>Anime Movies</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      if (location !== '/') setLocation('/');
                      if (onSelectCategory) onSelectCategory('New Season');
                    }}
                    className="px-4 py-3 rounded-2xl flex items-center gap-3 text-gray-300 hover:bg-white/5 text-left"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>New Season Releases</span>
                  </button>

                  <button
                    onClick={handleReplayIntro}
                    className="px-4 py-3 rounded-2xl flex items-center gap-3 text-purple-300 hover:bg-purple-950/20 text-left mt-2 border border-purple-500/20"
                  >
                    <PlaySquare className="w-5 h-5" />
                    <span>Replay Kinoma Intro</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    openSettingsModal('appearance');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-semibold text-xs"
                >
                  <Settings className="w-4 h-4" />
                  <span>Appearance & Settings</span>
                </button>

                <div className="flex items-center justify-between text-xs text-gray-400 px-1 pt-2">
                  <span>UI Mode:</span>
                  <button
                    onClick={toggleThemeQuick}
                    className="text-[#c084fc] font-bold hover:underline"
                  >
                    {resolvedTheme === 'modern' ? 'Switch to Classic' : 'Switch to Modern'}
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

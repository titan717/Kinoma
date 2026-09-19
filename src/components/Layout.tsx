import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Bookmark, 
  Home, 
  Search as SearchIcon, 
  Settings as SettingsIcon,
  LogOut, 
  Shuffle, 
  Sliders,
  Tv,
  ArrowRight
} from 'lucide-react';
import { SearchBar } from './ui/SearchBar';
import { Footer } from './ui/Footer';
import { useAuth } from '../lib/AuthContext';
import { useAppearance } from '../lib/AppearanceContext';
import { useTVMode } from '../lib/TVModeContext';
import { ModernNavbar } from './ui/modern/ModernNavbar';
import { KinomaLogo } from './ui/KinomaLogo';
import { AnimatePresence, motion } from 'motion/react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, openAuthModal, signOut } = useAuth();
  const { resolvedTheme, setThemeMode, openSettingsModal } = useAppearance();
  const { openAndroidTVModal } = useTVMode();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleRandom = async () => {
    try {
      const randomQueries = ['naruto', 'one-piece', 'bleach', 'attack-on-titan', 'demon-slayer', 'jujutsu-kaisen', 'chainsaw-man'];
      const query = randomQueries[Math.floor(Math.random() * randomQueries.length)];
      const res = await fetch(`/api/search?q=${query}&limit=10&offset=0`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const randomItem = data.results[Math.floor(Math.random() * data.results.length)];
        setLocation(`/details/${randomItem.anime_id}`);
      } else {
        setLocation('/details/naruto-bjfend');
      }
    } catch {
      setLocation('/details/naruto-bjfend');
    }
  };

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const toggleTheme = () => {
    setThemeMode(resolvedTheme === 'modern' ? 'classic' : 'modern');
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col items-center justify-start relative font-sans selection:bg-[#7b1fa2] selection:text-white w-full overflow-x-hidden">
      
      {/* 
        Responsive Application Shell:
        - Large Desktop & Ultra-wide: Sits in an elegant rounded container matching the reference screenshot (rounded-[32px], subtle border, soft drop-shadow, max width).
        - Tablet & Mobile: Fills viewport seamlessly edge-to-edge (rounded-none, zero outer margins).
      */}
      <div className={`w-full flex-1 flex flex-col ${
        resolvedTheme === 'modern'
          ? 'max-w-[1720px] 2xl:max-w-[1800px] md:my-3 lg:my-6 md:rounded-[28px] lg:rounded-[36px] bg-[#121318] md:ring-1 md:ring-white/5 md:shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden'
          : 'w-full bg-[#0e0f11]'
      }`}>

        {/* Top Navbar: Modern (matching reference image) or Preserved Classic */}
        {resolvedTheme === 'modern' ? (
          <ModernNavbar onOpenAuth={() => openAuthModal('signin')} />
        ) : (
          /* Preserved Classic Top Navbar */
          <header className="sticky top-0 z-40 w-full bg-[#0e0f14]/85 backdrop-blur-xl border-b border-[#1c1c26] transition-all">
            <div className="flex w-full h-[64px] items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto">
              
              {/* Logo with custom font style */}
              <div className="flex items-center gap-6">
                <Link href="/">
                  <KinomaLogo size="md" variant="full" />
                </Link>
              </div>

              {/* Minimalist Centered Search Bar */}
              <div className="hidden md:flex flex-1 max-w-[480px] mx-8">
                <SearchBar />
              </div>

              {/* Actions & User Profile */}
              <div className="flex items-center gap-2 sm:gap-3">
                
                {/* Quick Appearance Switch Pill */}
                <button
                  onClick={toggleTheme}
                  className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-[#14141c] hover:bg-[#1f1f2c] border border-[#232330] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Toggle UI Mode (Modern / Classic)"
                >
                  <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
                  <span>Classic</span>
                </button>

                {/* Settings Modal Button */}
                <button
                  onClick={() => openSettingsModal('appearance')}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#14141c] border border-transparent hover:border-[#232330] transition-all cursor-pointer"
                  title="Settings & Appearance"
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openAndroidTVModal()}
                  className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all bg-[#14141c] hover:bg-[#1d1d28] hover:border-purple-500/50 px-3 py-2 rounded-xl border border-[#232330] active:scale-95 cursor-pointer"
                  title="Add to Android TV / Big Screen App"
                >
                  <Tv className="h-4 w-4 text-[#c084fc]" />
                  <span>Android TV</span>
                </button>

                <Link href="/library">
                  <button className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all bg-[#14141c] hover:bg-[#1d1d28] hover:border-[#7b1fa2]/50 px-3.5 py-2 rounded-xl border border-[#232330] active:scale-95 cursor-pointer">
                    <Bookmark className="h-4 w-4 text-[#c084fc]" />
                    <span>Library</span>
                  </button>
                </Link>

                <button 
                  onClick={handleRandom}
                  className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-all px-3 py-2 rounded-xl hover:bg-white/5 active:scale-95 cursor-pointer"
                  title="Random Anime"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Random</span>
                </button>
                
                {/* User Account / Sign In */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-[#14141c] hover:bg-[#1e1e2b] border border-[#232330] hover:border-[#7b1fa2]/40 transition-all cursor-pointer"
                    >
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7b1fa2] to-[#ab47bc] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                          {getUserInitial()}
                        </div>
                      )}
                      <span className="hidden sm:block text-xs font-semibold text-gray-200 max-w-[100px] truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          className="absolute right-0 mt-2 w-56 bg-[#111117] border border-[#232330] rounded-xl shadow-2xl p-2 z-50 overflow-hidden"
                        >
                          <div className="px-3 py-2.5 border-b border-[#21212c]">
                            <p className="text-xs font-bold text-white truncate">
                              {user.displayName || 'Kinoma User'}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="py-1">
                            <Link href="/library">
                              <button 
                                onClick={() => setShowUserDropdown(false)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
                              >
                                <Bookmark className="w-3.5 h-3.5 text-[#c084fc]" />
                                <span>My Watchlist & Progress</span>
                              </button>
                            </Link>

                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                openSettingsModal('appearance');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5 text-[#c084fc]" />
                              <span>Appearance & Settings</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                openAndroidTVModal();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
                            >
                              <Tv className="w-3.5 h-3.5 text-[#c084fc]" />
                              <span>Add to Android TV</span>
                            </button>

                            <button 
                              onClick={() => {
                                setShowUserDropdown(false);
                                signOut();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left mt-0.5 border-t border-[#1f202c] cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button 
                    onClick={() => openAuthModal('signin')}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#7b1fa2] to-[#9c27b0] hover:from-[#6a1b9a] hover:to-[#ab47bc] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-[0_2px_14px_rgba(123,31,162,0.4)] transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                )}

              </div>
            </div>
          </header>
        )}
        
        {/* Main Content Area */}
        <main className={`flex-1 w-full mx-auto pb-20 md:pb-12 ${resolvedTheme === 'modern' ? 'pt-0' : ''}`}>
          {children}
        </main>

        {/* Minimalist Clean Footer */}
        <Footer />

      </div>

      {/* Mobile Bottom Navigation Bar (Dock) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0d12]/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 flex items-center justify-around safe-area-pb shadow-[0_-4px_25px_rgba(0,0,0,0.7)]">
        <Link href="/">
          <div className={`flex flex-col items-center justify-center w-14 h-11 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${location === '/' ? 'text-[#c084fc] bg-white/10' : 'text-gray-400 hover:text-white'}`}>
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Home</span>
          </div>
        </Link>
        <Link href="/search">
          <div className={`flex flex-col items-center justify-center w-14 h-11 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${location === '/search' ? 'text-[#c084fc] bg-white/10' : 'text-gray-400 hover:text-white'}`}>
            <SearchIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Search</span>
          </div>
        </Link>
        <div onClick={handleRandom} className="flex flex-col items-center justify-center w-14 h-11 rounded-xl text-gray-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer">
          <Shuffle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Random</span>
        </div>
        <Link href="/library">
          <div className={`flex flex-col items-center justify-center w-14 h-11 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${location === '/library' ? 'text-[#c084fc] bg-white/10' : 'text-gray-400 hover:text-white'}`}>
            <Bookmark className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Library</span>
          </div>
        </Link>
        <div 
          onClick={() => openSettingsModal('appearance')} 
          className="flex flex-col items-center justify-center w-14 h-11 rounded-xl text-gray-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer"
        >
          <SettingsIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Settings</span>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Shuffle, ArrowRight, Bookmark, Home, Calendar, Search as SearchIcon, X, Film } from 'lucide-react';
import { SearchBar } from './ui/SearchBar';
import { Footer } from './ui/Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <header className="sticky top-0 z-50 w-full bg-[#111115] border-b border-[#212126]">
        <div className="mx-auto flex h-[60px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-primary transition-colors p-1"
              aria-label="Toggle Menu"
            >
              <Menu className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <Link href="/">
              <div className="flex items-center gap-0.5 cursor-pointer select-none">
                <span className="text-2xl sm:text-3xl font-black tracking-tighter text-white">ani</span>
                <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#4c1d95]">mora</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/search">
              <button className="md:hidden flex items-center justify-center w-9 h-9 bg-[#1c1c22] rounded-lg text-gray-300 hover:text-white border border-[#2a2a35]">
                <SearchIcon className="h-4 w-4 text-purple-400" />
              </button>
            </Link>

            <Link href="/library">
              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-[#1c1c22] px-3 py-1.5 rounded border border-[#2a2a35]">
                <Bookmark className="h-4 w-4 text-purple-400" />
                <span className="hidden sm:inline">Library</span>
              </button>
            </Link>

            <button 
              onClick={handleRandom}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <Shuffle className="h-4 w-4" />
              <span>Random</span>
            </button>
            
            <div className="hidden sm:flex items-center text-xs font-bold rounded overflow-hidden">
              <button className="bg-white text-black px-2 py-1.5">EN</button>
              <button className="bg-[#1c1c22] text-gray-400 px-2 py-1.5 hover:bg-[#2c2c34] transition-colors">JP</button>
            </div>

            <button className="flex items-center gap-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white px-4 py-1.5 rounded-sm text-sm font-semibold transition-colors">
              Sign in
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-80 max-w-full bg-[#111115] border-r border-[#212126] p-6 flex flex-col gap-6 z-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#212126] pb-4">
              <div className="flex items-center gap-0.5">
                <span className="text-2xl font-black tracking-tighter text-white">ani</span>
                <span className="text-2xl font-black tracking-tighter text-[#4c1d95]">mora</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[#1c1c22] transition-colors font-medium">
                  <Home className="w-5 h-5 text-purple-400" />
                  <span>Home</span>
                </div>
              </Link>
              <Link href="/library" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[#1c1c22] transition-colors font-medium">
                  <Bookmark className="w-5 h-5 text-purple-400" />
                  <span>Library & History</span>
                </div>
              </Link>
              <button onClick={() => { setMobileMenuOpen(false); handleRandom(); }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[#1c1c22] transition-colors font-medium w-full text-left">
                <Shuffle className="w-5 h-5 text-purple-400" />
                <span>Random Anime</span>
              </button>
            </div>

            <div className="mt-auto pt-6 border-t border-[#212126]">
              <p className="text-xs text-gray-500 text-center">ANIMORA v2.5 • Powered by Railway API</p>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 w-full mx-auto pb-12">
        {children}
      </main>

      <Footer />
    </div>
  );
}

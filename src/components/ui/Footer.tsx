import React from 'react';
import { Link } from 'wouter';
import { Panda.funLogo } from './Panda.funLogo';

export function Footer() {
  return (
    <footer className="relative w-full mt-12 bg-[#08090d] pt-10 pb-8 border-t border-white/10 overflow-hidden select-none">
      {/* Aesthetic Anime Artwork Background Banner with Gradient Mask */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80"
          alt="Anime Artwork Banner"
          className="w-full h-full object-cover object-center filter blur-[1px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/90 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* Artistic Anime Thumbnail Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
          {[
            "https://images.unsplash.com/photo-1541562232579-512a21360020?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&auto=format&fit=crop&q=80"
          ].map((img, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 shadow-md">
              <img src={img} alt="Anime Thumb" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>

        {/* Brand & Links */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-white/5">
          <div className="flex flex-col gap-3">
            <Panda.funLogo size="md" variant="full" />
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Copyright © Panda.fun. Crafted with passion for anime lovers worldwide.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-400">
            <Link href="#" className="hover:text-purple-300 transition-colors">Help</Link>
            <Link href="#" className="hover:text-purple-300 transition-colors">FAQ</Link>
            <Link href="#" className="hover:text-purple-300 transition-colors">DMCA</Link>
            <Link href="/terms" className="hover:text-[#e8d0c0] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-purple-300 transition-colors">About</Link>
            <Link href="#" className="hover:text-purple-300 transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

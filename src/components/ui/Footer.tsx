import React from 'react';
import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="relative w-full mt-12 bg-[#08090d] pt-10 pb-8 border-t border-white/10 overflow-hidden select-none">
      {/* Aesthetic Anime Artwork Background Banner with Gradient Mask */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <img
          src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YngmKvAsuCy9.jpg"
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
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6Wx3hYSwH1d.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153518-edW9m241v70g.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-s3Kt32mNStjs.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21507-X140uGrcP23T.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx131518-kS23Kq4cW2n6.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-pZZ8Z74w8o63.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21.jpg",
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-suu58D3jZ6YL.jpg"
          ].map((img, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 shadow-md">
              <img src={img} alt="Anime Thumb" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>

        {/* Brand & Links */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-white/5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-0.5 select-none">
              <span className="text-2xl font-black tracking-tighter text-white">Kino</span>
              <span className="text-2xl font-black tracking-tighter text-purple-400">ma</span>
            </div>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Copyright © Kinoma. Crafted with passion for anime lovers worldwide.
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

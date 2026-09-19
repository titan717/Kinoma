import React from 'react';
import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="w-full mt-16 bg-[#0e0f11] py-8 border-t border-[#1c1c22]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Brand & Links */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex flex-col gap-6 max-w-md">
            <div className="flex items-center gap-0.5 select-none">
              <span className="text-3xl font-black tracking-tighter text-white">Kino</span>
              <span className="text-3xl font-black tracking-tighter text-[#7b1fa2]">ma</span>
            </div>
            
            <div className="text-xs text-gray-500 font-medium leading-relaxed flex flex-col gap-1">
              <p>Copyright © Kinoma. All Rights Reserved</p>
              <p>This site does not store any files on its server. All contents are provided by non-affiliated third parties.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap md:justify-end items-center gap-x-6 gap-y-3 text-sm font-semibold text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">Help</Link>
            <Link href="#" className="hover:text-white transition-colors">Main</Link>
            <Link href="#" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="#" className="hover:text-white transition-colors">DMCA</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            <Link href="#" className="hover:text-white transition-colors">Request</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

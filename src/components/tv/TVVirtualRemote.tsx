import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Disc, 
  RotateCcw, 
  Home, 
  Tv, 
  X,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface TVVirtualRemoteProps {
  onDirection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onEnter: () => void;
  onBack: () => void;
  onHome: () => void;
}

export function TVVirtualRemote({ onDirection, onEnter, onBack, onHome }: TVVirtualRemoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Quick Tips Toggle */}
        <button
          onClick={() => setShowTips(!showTips)}
          className="bg-[#181926]/90 hover:bg-[#212235] text-gray-300 hover:text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>Remote Guide</span>
        </button>

        {/* Remote Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(168,85,247,0.4)] flex items-center gap-2.5 text-sm font-black transition-all hover:scale-105 cursor-pointer border border-white/20 animate-bounce"
        >
          <Tv className="w-5 h-5" />
          <span>Android TV Remote</span>
        </button>

        {/* Floating Quick Tips Modal */}
        {showTips && (
          <div className="absolute bottom-16 right-0 w-80 bg-[#11121c] border border-[#26283c] rounded-3xl p-5 shadow-2xl text-white font-sans">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                <Tv className="w-4 h-4" /> TV Remote Controls
              </h4>
              <button 
                onClick={() => setShowTips(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-xs space-y-2 text-gray-300">
              <li className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl">
                <span>Arrow Keys / D-Pad</span>
                <strong className="text-white">Navigate Focus</strong>
              </li>
              <li className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl">
                <span>Enter / OK / Space</span>
                <strong className="text-white">Select / Play</strong>
              </li>
              <li className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl">
                <span>Esc / Backspace</span>
                <strong className="text-white">Back / Expand Sidebar</strong>
              </li>
              <li className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl">
                <span>Click Remote Widget</span>
                <strong className="text-purple-400">Use On-Screen D-Pad</strong>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#0d0e17]/95 border border-[#25273c] rounded-3xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-xl text-white font-sans w-72">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="font-black text-sm tracking-wide">Virtual TV Remote</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* D-Pad Layout */}
      <div className="relative w-48 h-48 mx-auto my-3 bg-[#151722] rounded-full border border-white/10 flex items-center justify-center shadow-inner">
        {/* Up */}
        <button
          onClick={() => onDirection('up')}
          className="absolute top-2 w-14 h-14 rounded-t-2xl bg-[#222536] hover:bg-purple-600 text-gray-200 hover:text-white flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
          aria-label="Up"
        >
          <ChevronUp className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Down */}
        <button
          onClick={() => onDirection('down')}
          className="absolute bottom-2 w-14 h-14 rounded-b-2xl bg-[#222536] hover:bg-purple-600 text-gray-200 hover:text-white flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
          aria-label="Down"
        >
          <ChevronDown className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Left */}
        <button
          onClick={() => onDirection('left')}
          className="absolute left-2 w-14 h-14 rounded-l-2xl bg-[#222536] hover:bg-purple-600 text-gray-200 hover:text-white flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
          aria-label="Left"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Right */}
        <button
          onClick={() => onDirection('right')}
          className="absolute right-2 w-14 h-14 rounded-r-2xl bg-[#222536] hover:bg-purple-600 text-gray-200 hover:text-white flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
          aria-label="Right"
        >
          <ChevronRight className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Center OK Button */}
        <button
          onClick={onEnter}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center transition-all cursor-pointer active:scale-95 border-2 border-white/30"
        >
          OK
        </button>
      </div>

      {/* Auxiliary Remote Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <button
          onClick={onHome}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      <div className="text-[10px] text-center text-gray-500 mt-3">
        Physical Arrow keys and Enter also work anytime.
      </div>
    </div>
  );
}

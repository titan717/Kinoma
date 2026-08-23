import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { api } from '../../lib/api';
import { Skeleton } from './Skeleton';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function Schedule() {
  const [now, setNow] = useState(new Date());
  const [activeDayIdx, setActiveDayIdx] = useState(now.getDay());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDay = DAYS[activeDayIdx];
  const { data, isLoading } = useSWR(`schedule-${activeDay}`, () => api.getSchedule(activeDay));

  const items = data?.results || [];

  const handlePrevDay = () => {
    setActiveDayIdx(prev => (prev - 1 + 7) % 7);
  };

  const handleNextDay = () => {
    setActiveDayIdx(prev => (prev + 1) % 7);
  };

  return (
    <div className="w-full mt-10">
      <div className="bg-[#111115] border border-[#1c1c22] rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#1c1c22]">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Estimated Schedule</h2>
            <span className="text-sm text-gray-500 font-medium hidden sm:block">- Now: {now.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <button className="px-3 py-1 bg-[#4c1d95] text-white text-xs font-bold rounded">SUB</button>
            <button className="px-3 py-1 bg-[#1c1c22] text-gray-400 hover:text-white transition-colors text-xs font-bold rounded">DUB</button>
          </div>

          {/* Day Selector */}
          <div className="flex items-center justify-between relative group">
            <button onClick={handlePrevDay} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-12 flex items-center justify-center text-gray-400 hover:text-white bg-gradient-to-r from-[#111115] to-transparent">
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <div className="w-full flex justify-between items-center px-6 overflow-hidden">
              {/* Show roughly 7 days relative to today visually, or just hardcode the week. Aniwave hardcodes the week with dates. */}
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const dayIdx = date.getDay();
                const isActive = dayIdx === activeDayIdx;
                
                return (
                  <div 
                    key={offset} 
                    onClick={() => setActiveDayIdx(dayIdx)}
                    className={`flex flex-col items-center cursor-pointer transition-colors px-2 sm:px-4 ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-300'}`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`text-xl sm:text-3xl font-black tracking-tighter ${isActive ? 'text-white' : ''}`}>
                      {SHORT_DAYS[dayIdx]}
                    </span>
                    {isActive && (
                      <div className="w-full h-0.5 bg-[#4c1d95] mt-2 rounded-full shadow-[0_0_8px_rgba(76,29,149,0.8)]" />
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={handleNextDay} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-12 flex items-center justify-center text-gray-400 hover:text-white bg-gradient-to-l from-[#111115] to-transparent">
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="flex flex-col min-h-[300px]">
          {isLoading ? (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              {items.slice(0, 8).map((item: any, idx: number) => {
                const title = typeof item.title === 'string' 
                  ? item.title 
                  : item.title?.english || item.title?.romaji;
                
                // Jikan schedule doesn't easily give precise airing times in the default payload sometimes,
                // but we can mock a time or just show release info.
                // We'll mock a time based on index for the visual clone effect since precise sub/dub times need a specialized DB.
                const mockHour = (12 + Math.floor(idx / 2)) % 24;
                const mockMin = idx % 2 === 0 ? '00' : '30';
                const ampm = mockHour >= 12 ? 'PM' : 'AM';
                const hr12 = mockHour % 12 || 12;

                return (
                  <div key={`schedule-${item.id}-${idx}`} className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-[#1c1c22] hover:bg-[#151518] cursor-pointer group transition-colors">
                    <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-400 w-16 shrink-0 group-hover:text-[#4c1d95] transition-colors">
                        {`${hr12}:${mockMin} ${ampm}`}
                      </span>
                      <span className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                        {title}
                      </span>
                    </div>
                    
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c22] border border-[#2c2c34] text-xs font-semibold text-gray-400 group-hover:bg-[#4c1d95] group-hover:text-white group-hover:border-[#4c1d95] transition-all shrink-0">
                      <Play className="w-3 h-3 fill-current" />
                      Episode {item.totalEpisodes || '?'}
                    </button>
                  </div>
                );
              })}
              <button className="w-full py-4 text-xs font-bold text-gray-500 hover:text-white hover:bg-[#151518] transition-colors border-t border-[#1c1c22]">
                Show more
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <span className="text-sm">No shows scheduled for {activeDay}.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

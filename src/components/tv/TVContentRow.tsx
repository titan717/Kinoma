import React, { useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimeItem } from '../../types';
import { HistoryItem } from '../../lib/history';
import { TVCard } from './TVCard';

interface TVContentRowProps {
  key?: React.Key;
  id: string;
  title: string;
  subtitle?: string;
  items?: AnimeItem[];
  historyItems?: HistoryItem[];
  isContinueWatching?: boolean;
  isRowFocused: boolean;
  focusedCardIndex: number;
  onSelectCard: (index: number) => void;
  rowIndex: number;
}

export function TVContentRow({
  title,
  subtitle,
  items = [],
  historyItems = [],
  isContinueWatching = false,
  isRowFocused,
  focusedCardIndex,
  onSelectCard
}: TVContentRowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const count = isContinueWatching ? historyItems.length : items.length;

  // Auto-scroll row so the focused card remains smoothly within viewport
  useEffect(() => {
    if (isRowFocused && cardRefs.current[focusedCardIndex]) {
      const cardEl = cardRefs.current[focusedCardIndex];
      cardEl?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [isRowFocused, focusedCardIndex]);

  if (count === 0) return null;

  return (
    <div className="w-full flex flex-col py-3 select-none">
      {/* Row Header with high-contrast TV-safe typography */}
      <div className="flex items-baseline justify-between px-8 lg:px-14 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm font-['Outfit']">
            {title}
          </h2>
          {subtitle && (
            <span className="text-xs sm:text-sm text-gray-400 font-medium hidden md:inline">
              • {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Cards Scroller */}
      <div 
        ref={containerRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto px-8 lg:px-14 py-4 scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isContinueWatching
          ? historyItems.map((hItem, idx) => {
              const isFocused = isRowFocused && focusedCardIndex === idx;
              return (
                <div
                  key={`tv-history-${hItem.animeId || hItem.slug}-${idx}`}
                  ref={el => (cardRefs.current[idx] = el)}
                >
                  <TVCard
                    historyItem={hItem}
                    isContinueWatching={true}
                    isFocused={isFocused}
                    onSelect={() => onSelectCard(idx)}
                    index={idx}
                  />
                </div>
              );
            })
          : items.map((item, idx) => {
              const isFocused = isRowFocused && focusedCardIndex === idx;
              return (
                <div
                  key={`tv-card-${item.id}-${idx}`}
                  ref={el => (cardRefs.current[idx] = el)}
                >
                  <TVCard
                    item={item}
                    isContinueWatching={false}
                    isFocused={isFocused}
                    onSelect={() => onSelectCard(idx)}
                    index={idx}
                  />
                </div>
              );
            })}
      </div>
    </div>
  );
}

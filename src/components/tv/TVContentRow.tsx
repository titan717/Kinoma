import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Grid, GridImperativeAPI } from 'react-window';
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

export const TVContentRow = React.memo(function TVContentRow({
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
  const gridRef = useRef<GridImperativeAPI | null>(null);

  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.max(300, window.innerWidth - 64) : 1200
  );

  const count = isContinueWatching ? historyItems.length : items.length;

  // Measure container width for responsive virtualized list
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll virtualized grid to center the focused card on D-pad navigation
  useEffect(() => {
    if (isRowFocused && gridRef.current && count > 0) {
      gridRef.current.scrollToColumn({
        index: Math.max(0, Math.min(focusedCardIndex, count - 1)),
        align: 'center',
        behavior: 'smooth'
      });
    }
  }, [isRowFocused, focusedCardIndex, count]);

  const itemSize = isContinueWatching ? 300 : 230;
  const listHeight = isContinueWatching ? 230 : 360;

  const CellComponent = useCallback(
    ({ columnIndex, style }: { columnIndex: number; style: React.CSSProperties }) => {
      const isFocused = isRowFocused && focusedCardIndex === columnIndex;

      if (isContinueWatching) {
        const hItem = historyItems[columnIndex];
        if (!hItem) return null;
        return (
          <div
            style={{
              ...style,
              paddingRight: 20,
              display: 'flex',
              alignItems: 'center'
            }}
            key={`tv-v-history-${columnIndex}`}
          >
            <TVCard
              historyItem={hItem}
              isContinueWatching={true}
              isFocused={isFocused}
              onSelect={() => onSelectCard(columnIndex)}
              index={columnIndex}
            />
          </div>
        );
      }

      const item = items[columnIndex];
      if (!item) return null;

      return (
        <div
          style={{
            ...style,
            paddingRight: 18,
            display: 'flex',
            alignItems: 'center'
          }}
          key={`tv-v-card-${columnIndex}`}
        >
          <TVCard
            item={item}
            isContinueWatching={false}
            isFocused={isFocused}
            onSelect={() => onSelectCard(columnIndex)}
            index={columnIndex}
          />
        </div>
      );
    },
    [isRowFocused, focusedCardIndex, isContinueWatching, historyItems, items, onSelectCard]
  );

  if (count === 0) return null;

  return (
    <div className="w-full flex flex-col py-3 select-none">
      {/* Row Header */}
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

      {/* Virtualized Horizontal Card Carousel using react-window */}
      <div ref={containerRef} className="w-full px-8 lg:px-14">
        <Grid
          gridRef={gridRef}
          columnCount={count}
          columnWidth={itemSize}
          rowCount={1}
          rowHeight={listHeight}
          cellProps={{}}
          style={{ overflowY: 'hidden', width: containerWidth }}
          className="scrollbar-none"
          cellComponent={CellComponent}
        />
      </div>
    </div>
  );
});

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import useSWR from 'swr';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data, isLoading } = useSWR(
    debouncedQuery.length >= 2 ? `search-${debouncedQuery}` : null,
    () => api.search(debouncedQuery)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?keyword=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={ref} className="w-full relative group">
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-gray-300 transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search anime..."
          className="w-full rounded bg-[#1c1c22] border border-[#2c2c34] focus:border-[#4c1d95] hover:border-[#40404a] py-2 pl-10 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-colors"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-auto px-1.5 h-5 rounded bg-[#2a2a32] text-[10px] font-bold text-gray-500 border border-[#3a3a42] pointer-events-none">
          Ctrl K
        </div>
      </form>

      {/* Suggestion Dropdown */}
      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c22] border border-[#2c2c34] rounded-md shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px]">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : data?.results?.length > 0 ? (
            <div className="overflow-y-auto no-scrollbar py-2">
              {data.results.slice(0, 6).map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setLocation(`/details/${item.id}`);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="flex items-center gap-3 p-2 mx-2 rounded hover:bg-[#2c2c34] cursor-pointer transition-colors"
                >
                  <img src={item.image} alt="cover" className="w-10 h-14 object-cover rounded shadow-sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-200 truncate">
                      {typeof item.title === 'string' ? item.title : (item.title?.english || item.title?.romaji)}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      {item.releaseDate && <span>{item.releaseDate}</span>}
                      {item.type && <span className="px-1 bg-[#2a2a32] rounded text-[10px] font-bold">{item.type}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div 
                onClick={handleSubmit}
                className="mt-2 p-3 text-center text-sm font-semibold text-[#4c1d95] hover:text-white cursor-pointer border-t border-[#2c2c34] hover:bg-[#2c2c34] transition-colors"
              >
                View all results
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

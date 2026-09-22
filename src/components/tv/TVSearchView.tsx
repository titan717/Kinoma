import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Delete, CornerDownLeft, Sparkles, Clock, X, Mic, MicOff } from 'lucide-react';
import { api } from '../../lib/api';
import { AnimeItem } from '../../types';
import { TVCard } from './TVCard';
import { libraryManager } from '../../lib/library';

interface TVSearchViewProps {
  onSelectAnime: (anime: AnimeItem) => void;
  onBackToSidebar: () => void;
}

const TV_KEYBOARD_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '1', '2'],
  ['3', '4', '5', '6', '7', '8', '9'],
  ['0', 'SPACE', 'BACKSPACE', 'CLEAR']
];

export function TVSearchView({ onSelectAnime, onBackToSidebar }: TVSearchViewProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kinoma_tv_recents');
      return saved ? JSON.parse(saved) : libraryManager.getSearchHistory().slice(0, 8);
    } catch {
      return libraryManager.getSearchHistory().slice(0, 8);
    }
  });

  // Focus zones: 'voice' | 'keyboard' | 'suggestions' | 'results'
  const [focusZone, setFocusZone] = useState<'voice' | 'keyboard' | 'suggestions' | 'results'>('voice');

  const smartSuggestions = recentSearches.slice(0, 8);

  const startVoiceSearch = () => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      window.alert('Voice search is not supported by this TV browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) setQuery(transcript);
      const last = event.results?.[event.results.length - 1];
      if (last?.isFinal && transcript) applyQuery(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setIsListening(false); recognitionRef.current = null; }
  };
  const [kbRow, setKbRow] = useState(0);
  const [kbCol, setKbCol] = useState(0);
  const [suggIndex, setSuggIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);

  // Debounced API search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchPaged(query.trim(), 16, 0);
        setResults(res.results || []);
      } catch (err) {
        console.error('TV Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyPress = (key: string) => {
    if (key === 'SPACE') {
      setQuery(prev => prev + ' ');
    } else if (key === 'BACKSPACE') {
      setQuery(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setQuery('');
    } else {
      setQuery(prev => prev + key);
    }
  };

  const applyQuery = (text: string) => {
    setQuery(text);
    // save to recents
    const updated = [text, ...recentSearches.filter(s => s.toLowerCase() !== text.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('kinoma_tv_recents', JSON.stringify(updated));
    } catch {}
    libraryManager.addSearchQuery(text);
    setRecentSearches(libraryManager.getSearchHistory().slice(0, 8));
    setFocusZone('results');
    setResultIndex(0);
  };

  // Global D-pad / Keyboard navigation inside TV Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support direct physical typing as well as D-pad
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
        setQuery(prev => prev + e.key.toUpperCase());
        return;
      }
      if (e.key === 'Backspace') {
        setQuery(prev => prev.slice(0, -1));
        return;
      }
      if (e.key === ' ') {
        setQuery(prev => prev + ' ');
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (focusZone === 'keyboard') {
          if (kbCol > 0) {
            setKbCol(prev => prev - 1);
          } else {
            onBackToSidebar();
          }
        } else if (focusZone === 'suggestions') {
          if (suggIndex > 0) setSuggIndex(prev => prev - 1);
          else {
            setFocusZone('keyboard');
            setKbRow(0);
            setKbCol(0);
          }
        } else if (focusZone === 'results') {
          if (resultIndex > 0) {
            setResultIndex(prev => prev - 1);
          } else {
            setFocusZone('keyboard');
            setKbRow(2);
            setKbCol(TV_KEYBOARD_LAYOUT[2].length - 1);
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (focusZone === 'keyboard') {
          const maxCol = TV_KEYBOARD_LAYOUT[kbRow].length - 1;
          if (kbCol < maxCol) {
            setKbCol(prev => prev + 1);
          } else if (results.length > 0) {
            setFocusZone('results');
            setResultIndex(0);
          }
        } else if (focusZone === 'suggestions') {
          if (suggIndex < smartSuggestions.length - 1) setSuggIndex(prev => prev + 1);
        } else if (focusZone === 'results') {
          if (resultIndex < results.length - 1) {
            setResultIndex(prev => prev + 1);
          }
        }
      } else if (e.key === 'ArrowUp') {
        if (focusZone === 'voice') {
          return;
        } else if (focusZone === 'keyboard') {
          if (kbRow > 0) {
            const nextRow = kbRow - 1;
            setKbRow(nextRow);
            setKbCol(prev => Math.min(prev, TV_KEYBOARD_LAYOUT[nextRow].length - 1));
          } else {
            setFocusZone('voice');
          }
        } else if (focusZone === 'results') {
          if (resultIndex >= 4) {
            setResultIndex(prev => prev - 4);
          }
        }
      } else if (e.key === 'ArrowDown') {
        if (focusZone === 'voice') {
          setFocusZone('keyboard');
          setKbRow(0);
          setKbCol(0);
        } else if (focusZone === 'suggestions') {
          setFocusZone('keyboard');
          setKbRow(0);
          setKbCol(0);
        } else if (focusZone === 'keyboard') {
          if (kbRow < TV_KEYBOARD_LAYOUT.length - 1) {
            const nextRow = kbRow + 1;
            setKbRow(nextRow);
            setKbCol(prev => Math.min(prev, TV_KEYBOARD_LAYOUT[nextRow].length - 1));
          } else if (results.length > 0) {
            setFocusZone('results');
            setResultIndex(0);
          }
        } else if (focusZone === 'results') {
          if (resultIndex + 4 < results.length) {
            setResultIndex(prev => prev + 4);
          }
        }
      } else if (e.key === 'Enter') {
        if (focusZone === 'voice') {
          startVoiceSearch();
        } else if (focusZone === 'keyboard') {
          const key = TV_KEYBOARD_LAYOUT[kbRow]?.[kbCol];
          if (key) handleKeyPress(key);
        } else if (focusZone === 'suggestions') {
          applyQuery(smartSuggestions[suggIndex]);
        } else if (focusZone === 'results') {
          if (results[resultIndex]) {
            onSelectAnime(results[resultIndex]);
          }
        }
      } else if (e.key === 'Escape') {
        onBackToSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusZone, kbRow, kbCol, suggIndex, resultIndex, results, recentSearches, onBackToSidebar, onSelectAnime, isListening]);

  return (
    <div className="w-full min-h-screen bg-[#07080d] text-white p-8 lg:p-14 select-none">
      {/* 1. Large High-Contrast Search Bar */}
      <div className="max-w-4xl mb-6">
        <div className="flex items-center gap-4 bg-[#11121c] border-2 border-[#2b2c3d] rounded-2xl px-6 py-4 shadow-xl">
          <SearchIcon className="w-7 h-7 text-[#c084fc] shrink-0" />
          <div className="flex-1 flex items-center">
            <span className="text-2xl font-black tracking-wide text-white font-['Outfit']">
              {query || <span className="text-gray-500 font-normal">Search titles, creators, genres...</span>}
            </span>
            <span className="inline-block w-0.5 h-7 bg-[#c084fc] ml-1 animate-pulse" />
          </div>
          <button
            onClick={startVoiceSearch}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${focusZone === 'voice' ? 'bg-white text-black border-white scale-105' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'}`}
            aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-xs font-black">{isListening ? 'Listening…' : 'Voice'}</span>
          </button>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Suggestions & Recent Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8 max-w-5xl">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" /> Suggestions:
        </span>
        {smartSuggestions.map((item, idx) => {
          const isFocused = focusZone === 'suggestions' && suggIndex === idx;
          return (
            <button
              key={item}
              onClick={() => applyQuery(item)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer outline-none ${
                isFocused
                  ? 'bg-white text-black scale-105 shadow-[0_0_16px_rgba(255,255,255,0.4)]'
                  : 'bg-[#141522] text-gray-300 hover:bg-[#1f2033] border border-white/5'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* 3. Main Split Layout: On-Screen TV Keyboard (Left) & Search Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* On-Screen TV Keyboard Grid */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 max-w-md bg-[#0e0f17] p-5 rounded-3xl border border-[#1e1f2d]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Remote Keyboard (D-Pad Navigable)
          </span>

          {TV_KEYBOARD_LAYOUT.map((row, rIdx) => (
            <div key={`kb-row-${rIdx}`} className="flex items-center gap-2">
              {row.map((key, cIdx) => {
                const isFocused = focusZone === 'keyboard' && kbRow === rIdx && kbCol === cIdx;
                const isActionKey = ['SPACE', 'BACKSPACE', 'CLEAR'].includes(key);

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`flex items-center justify-center rounded-xl text-sm font-black transition-all duration-150 cursor-pointer outline-none ${
                      isActionKey ? 'flex-1 py-3 text-xs' : 'w-11 h-11'
                    } ${
                      isFocused
                        ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.6)] ring-2 ring-white z-10'
                        : 'bg-[#181926] text-gray-200 hover:bg-[#25263a] border border-[#262738]'
                    }`}
                  >
                    {key === 'SPACE' ? 'Space' : key === 'BACKSPACE' ? '⌫' : key === 'CLEAR' ? 'Clear' : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Results Area */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
              {loading ? 'Searching...' : results.length > 0 ? `Results (${results.length})` : 'Search Kinoma Catalog'}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-10 text-gray-400 font-semibold">
              <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <span>Fetching matching titles...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[65vh] overflow-y-auto pr-2">
              {results.map((item, idx) => {
                const isFocused = focusZone === 'results' && resultIndex === idx;
                return (
                  <TVCard
                    key={`tv-search-res-${item.id}-${idx}`}
                    item={item}
                    isFocused={isFocused}
                    onSelect={() => onSelectAnime(item)}
                    index={idx}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400 bg-[#0e0f17]/50 rounded-2xl border border-dashed border-[#222332]">
              <p className="text-base font-bold text-gray-300">
                {query ? 'No matching titles found.' : 'Use the D-pad, keyboard, or microphone to search anime.'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Voice search uses the browser Web Speech API when supported.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

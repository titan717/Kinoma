import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock3, Search as SearchIcon, Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { updateSEO } from '../lib/seo';
import { preferencesUtil } from '../lib/preferences';
import { ContentItem } from '../lib/content';
import { api, MovieApiError } from '../lib/api';

const FALLBACK_TRENDING: ContentItem[] = [
  { id: 'trend-1', title: 'Trending Title', type: 'movie', meta: 'Movie · 2026', tone: 'rose' },
  { id: 'trend-2', title: 'What Everyone Is Watching', type: 'series', meta: 'Series · New', tone: 'violet' },
  { id: 'trend-3', title: 'The Next Big Thing', type: 'anime', meta: 'Anime · Placeholder', tone: 'blue' },
  { id: 'trend-4', title: 'Tonight’s Pick', type: 'movie', meta: 'Movie · Featured', tone: 'amber' },
  { id: 'trend-5', title: 'Popular Right Now', type: 'series', meta: 'Series · Popular', tone: 'slate' },
  { id: 'trend-6', title: 'Fresh & Trending', type: 'anime', meta: 'Anime · Placeholder', tone: 'pink' },
];

const toneClass = (tone?: ContentItem['tone']) => `kinoma-search-card--${tone || 'rose'}`;

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <Link href={item.href || `/details/${item.id}`} className="kinoma-search-card kinoma-focus">
      <div className={`kinoma-search-card__art ${toneClass(item.tone)}`} aria-hidden="true">
        <span className="kinoma-search-card__orb kinoma-search-card__orb--one" />
        <span className="kinoma-search-card__orb kinoma-search-card__orb--two" />
        <span className="kinoma-search-card__shine" />
        <span className="kinoma-search-card__type">{item.type.toUpperCase()}</span>
      </div>
      <div className="kinoma-search-card__copy">
        <h3>{item.title}</h3>
        <p>{item.meta || 'Ready for MovieApi metadata'}</p>
      </div>
    </Link>
  );
}

export function Search() {
  const [, setLocation] = useLocation();
  const initialQuery = useMemo(
    () => new URLSearchParams(window.location.search).get('keyword')?.trim() || '',
    []
  );

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = submittedQuery.length > 0;

  useEffect(() => {
    setRecentSearches(preferencesUtil.getRecentSearches());
    updateSEO({
      title: isSearching ? `Search "${submittedQuery}"` : 'Search',
      description: 'Find movies, TV series and anime on Kinoma.',
      type: 'website'
    });
  }, [isSearching, submittedQuery]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const trending = contentProvider.getTrending();
  const defaultTrending = trending.length ? trending : FALLBACK_TRENDING;

  const results = isSearching ? contentProvider.search(submittedQuery) : defaultTrending;

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault();
    const clean = query.trim();

    if (!clean) {
      setSubmittedQuery('');
      setSearchOpen(false);
      setLocation('/search');
      return;
    }

    preferencesUtil.addRecentSearch(clean);
    setRecentSearches(preferencesUtil.getRecentSearches());
    setSubmittedQuery(clean);
    setSearchOpen(true);
    setLocation(`/search?keyword=${encodeURIComponent(clean)}`);
  };

  const clearSearch = () => {
    setQuery('');
    setSubmittedQuery('');
    setSearchOpen(false);
    setLocation('/search');
  };

  const chooseRecent = (value: string) => {
    setQuery(value);
    setSubmittedQuery(value);
    setSearchOpen(true);
    setLocation(`/search?keyword=${encodeURIComponent(value)}`);
  };

  return (
    <main className="kinoma-search-page">
      <div className="kinoma-search-page__ambient" aria-hidden="true" />

      <div className="kinoma-search-page__inner">
        <header className="kinoma-search-head">
          <div>
            <span className="kinoma-eyebrow">{isSearching ? 'Search results' : 'Discover'}</span>
            <h1>{isSearching ? `Results for “${submittedQuery}”` : 'Find your next watch.'}</h1>
            <p>{isSearching ? 'Movies, series and anime matching your search.' : 'Start with what is trending, or search whenever you have something specific in mind.'}</p>
          </div>

          <form className={`kinoma-search-control ${searchOpen ? 'is-open' : ''}`} onSubmit={submitSearch}>
            {searchOpen ? (
              <>
                <SearchIcon size={18} aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search movies, series or anime"
                  aria-label="Search movies, series or anime"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" className="kinoma-search-control__clear" onClick={() => setQuery('')} aria-label="Clear search">
                    <X size={16} />
                  </button>
                )}
                <button type="submit" className="kinoma-search-control__submit" aria-label="Submit search">
                  Search
                </button>
              </>
            ) : (
              <button type="button" className="kinoma-search-control__open" onClick={() => setSearchOpen(true)}>
                <SearchIcon size={18} />
                <span>Search</span>
              </button>
            )}
          </form>
        </header>

        {!isSearching && recentSearches.length > 0 && (
          <section className="kinoma-search-recent" aria-label="Recent searches">
            <div className="kinoma-search-recent__label"><Clock3 size={14} /> Recent</div>
            <div className="kinoma-search-recent__items">
              {recentSearches.slice(0, 5).map(item => (
                <button key={item} type="button" onClick={() => chooseRecent(item)}>
                  {item}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="kinoma-search-results">
          <div className="kinoma-search-results__heading">
            <div>
              <span className="kinoma-eyebrow">{isSearching ? 'Your search' : 'Live discovery'}</span>
              <h2>{isSearching ? 'Matches' : 'Trending now'}</h2>
            </div>
            {!isSearching && <Sparkles size={18} aria-hidden="true" />}
          </div>

          {loading ? (
            <div className="kinoma-search-empty"><SearchIcon size={28} /><h3>Searching…</h3><p>Finding movies and series from MovieApi.</p></div>
          ) : error ? (
            <div className="kinoma-search-empty"><SearchIcon size={28} /><h3>Search unavailable</h3><p>{error}</p><button type="button" onClick={() => setSubmittedQuery(submittedQuery)}>Try again</button></div>
          ) : results.length ? (
            <div className="kinoma-search-grid">
              {results.map(item => <ContentCard key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="kinoma-search-empty">
              <SearchIcon size={28} />
              <h3>Nothing found yet</h3>
              <p>Try a different title. When MovieApi is connected, this same screen will use its live search results.</p>
              <button type="button" onClick={clearSearch}>Back to trending</button>
            </div>
          )}
        </section>

        <footer className="kinoma-search-foot">
          <span>Kinoma</span>
          <span>One simple search. Everything you want to watch.</span>
        </footer>
      </div>
    </main>
  );
}

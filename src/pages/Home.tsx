import React from 'react';
import { Link } from 'wouter';
import { KinomaLogo } from '../components/ui/KinomaLogo';
import { ArrowRight, Clapperboard, Film, Github, Instagram, Play, Plus, Sparkles, Tv, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, MovieApiMedia, MovieApiError } from '../lib/api';

type RailKind = 'trending' | 'latest' | 'popular' | 'tv' | 'movie' | 'anime';

type RailItem = {
  title: string;
  meta: string;
  tone: string;
  kind: RailKind;
};

const RAILS: Record<RailKind, MovieApiMedia[]> = {
  trending: [], latest: [], popular: [], tv: [], movie: [], anime: [],
};

const toneClass: Record<string, string> = {
  rose: 'is-rose',
  violet: 'is-violet',
  blue: 'is-blue',
  amber: 'is-amber',
  pink: 'is-pink',
  slate: 'is-slate',
};

function KindIcon({ kind }: { kind: RailKind }) {
  if (kind === 'movie') return <Film size={15} strokeWidth={1.8} />;
  if (kind === 'anime') return <Sparkles size={15} strokeWidth={1.8} />;
  return <Tv size={15} strokeWidth={1.8} />;
}

function RailCard({ item }: { item: MovieApiMedia }) {
  const kind = item.type === 'movie' ? 'movie' : 'tv';
  return (
    <Link href={`/details/${encodeURIComponent(item.id)}?type=${kind === 'movie' ? 'movie' : 'series'}`} className="kinoma-rail-card" aria-label={`Open ${item.title}`}>
      <div className="kinoma-rail-card__art" aria-hidden="true">
        {item.poster ? <img src={item.poster} alt="" loading="lazy" /> : <><span className="kinoma-rail-card__orb kinoma-rail-card__orb--one" /><span className="kinoma-rail-card__orb kinoma-rail-card__orb--two" /></>}
        <span className="kinoma-rail-card__shine" />
        <span className="kinoma-rail-card__icon"><KindIcon kind={kind === 'movie' ? 'movie' : 'tv'} /></span>
        <span className="kinoma-rail-card__badge">KINOMA</span>
      </div>
      <div className="kinoma-rail-card__copy">
        <h3>{item.title}</h3>
        <p>{[item.year, item.rating ? `★ ${item.rating}` : null, ...(item.genres || []).slice(0, 1)].filter(Boolean).join(' • ') || 'MovieApi'}</p>
      </div>
    </Link>
  );
}

  const [home, setHome] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    api.getHome().then(data => active && setHome(data)).catch((err: unknown) => active && setError(err instanceof MovieApiError ? err.message : 'MovieApi is unavailable right now.'));
    return () => { active = false; };
  }, []);

  const sections = home?.sections;
  const trending = sections?.trending || [];
  const latest = [...(sections?.latestMovies || []), ...(sections?.latestTv || [])];
  const popular = [...(sections?.popularMovies || []), ...(sections?.popularTv || [])];
\n}
import type { AnimeDetails, AnimeItem, Episode, AnimeSeasonItem } from '../types';

export type MovieApiMedia = {
  id: string;
  type: 'movie' | 'tv' | 'episode';
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  rating?: number | null;
  poster?: string | null;
  backdrop?: string | null;
  overview?: string | null;
  genres?: string[];
  runtime?: number | null;
  releaseDate?: string | null;
  status?: string | null;
  language?: string | null;
  ids?: {
    tmdb?: number | null;
    tvmaze?: number | null;
    imdb?: string | null;
    [key: string]: unknown;
  };
  source?: string;
  [key: string]: unknown;
};

export type MovieApiPage<T = MovieApiMedia> = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
};

export type MovieApiVideo = {
  id: string;
  name: string;
  type: string;
  site: string;
  key: string;
  url: string | null;
  embedUrl: string | null;
  thumbnail: string | null;
  official: boolean;
  publishedAt: string | null;
  language?: string | null;
  country?: string | null;
};

export type MovieApiPlaybackSource = {
  id: string;
  provider: string;
  type: 'embed' | 'hls' | 'dash' | 'file';
  url: string;
  title?: string | null;
  quality?: string | null;
  language?: string | null;
  subtitles?: unknown[];
  expiresAt?: string | null;
  requiresClientPlayback?: boolean;
};

export class MovieApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, status = 500, code?: string, requestId?: string) {
    super(message);
    this.name = 'MovieApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const DEFAULT_BASE_URL = 'https://apikinoma.vercel.app';
const DEFAULT_FALLBACK_URL = 'https://movieapi-3d0v.onrender.com';
const rawBase = String(import.meta.env.VITE_MOVIE_API_URL || DEFAULT_BASE_URL).trim();
export const MOVIE_API_BASE_URL = rawBase.replace(/\/+$/, '');
const rawFallback = String(import.meta.env.VITE_MOVIE_API_FALLBACK_URL || DEFAULT_FALLBACK_URL).trim();
export const MOVIE_API_FALLBACK_URL = rawFallback.replace(/\/+$/, '');

const cache = new Map<string, { expires: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const CACHE_TTL = 60_000;

function unwrap<T>(payload: any): T {
  if (payload?.success === false) {
    const error = payload.error || {};
    throw new MovieApiError(
      error.message || 'MovieApi request failed.',
      Number(error.status) || 500,
      error.code,
      error.requestId
    );
  }
  return (payload?.success === true && 'data' in payload ? payload.data : payload) as T;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
  const url = new URL(
    path.startsWith('http') ? path : `${MOVIE_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    window.location.origin
  );
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  options: RequestInit = {},
  ttl = CACHE_TTL
): Promise<T> {
  const url = buildUrl(path, params);
  const cacheKey = `${options.method || 'GET'}:${url}`;
  const cached = cache.get(cacheKey);
  if (!options.method || options.method === 'GET') {
    if (cached && cached.expires > Date.now()) return cached.value as T;
    const active = inflight.get(cacheKey);
    if (active) return active as Promise<T>;
  }
  const promise = (async () => {
    const bases = [MOVIE_API_BASE_URL];
    if (MOVIE_API_FALLBACK_URL && MOVIE_API_FALLBACK_URL !== MOVIE_API_BASE_URL) bases.push(MOVIE_API_FALLBACK_URL);
    let lastError: unknown = null;
    for (let index = 0; index < bases.length; index += 1) {
      const base = bases[index];
      const targetUrl = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12_000);
      try {
        const response = await fetch(targetUrl, { ...options, signal: options.signal || controller.signal, headers: { Accept: 'application/json', ...(options.headers || {}) } });
        let payload: unknown = null;
        try { payload = await response.json(); } catch { /* handled below */ }
        if (!response.ok) {
          const data: any = payload;
          const error = data?.error || {};
          const apiError = new MovieApiError(error.message || `MovieApi request failed (${response.status}).`, response.status, error.code, error.requestId || response.headers.get('X-Request-ID') || undefined);
          lastError = apiError;
          if (index < bases.length - 1 && (response.status >= 500 || response.status === 429)) continue;
          throw apiError;
        }
        const value = unwrap<T>(payload);
        if (!options.method || options.method === 'GET') cache.set(cacheKey, { expires: Date.now() + ttl, value });
        return value;
      } catch (error) {
        lastError = error;
        const transient = (error instanceof DOMException && error.name === 'AbortError') || !(error instanceof MovieApiError);
        if (index < bases.length - 1 && transient) continue;
        if (error instanceof MovieApiError) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') throw new MovieApiError('MovieApi request timed out.', 504, 'PROVIDER_TIMEOUT');
        throw new MovieApiError(`Unable to connect to MovieApi: ${error instanceof Error ? error.message : String(error)}`, 503, 'API_UNAVAILABLE');
      } finally { window.clearTimeout(timer); }
    }
    throw lastError instanceof Error ? lastError : new MovieApiError('MovieApi unavailable.', 503, 'API_UNAVAILABLE');
  })();
  if (!options.method || options.method === 'GET') {
    inflight.set(cacheKey, promise);
    promise.finally(() => inflight.delete(cacheKey)).catch(() => undefined);
  }
  return promise;
}
type MovieApiMediaRef =
  | { provider: 'tmdb'; type: 'movie' | 'tv'; id: number }
  | { provider: 'tvmaze'; type: 'tv'; id: number };

function mediaFromId(id: string): MovieApiMediaRef | null {
  const tmdb = id.match(/^kinoma_tmdb_(movie|tv)_(\d+)$/);
  if (tmdb) return { provider: 'tmdb', type: tmdb[1] as 'movie' | 'tv', id: Number(tmdb[2]) };

  const tvmaze = id.match(/^kinoma_tvmaze_(\d+)$/);
  if (tvmaze) return { provider: 'tvmaze', type: 'tv', id: Number(tvmaze[1]) };

  return null;
}

function toAnimeItem(item: MovieApiMedia): AnimeItem {
  return {
    id: item.id,
    title: item.title,
    image: item.poster || '',
    cover: item.backdrop || '',
    banner: item.backdrop || '',
    rating: item.rating ?? undefined,
    type: item.type,
    releaseDate: item.releaseDate || undefined,
    description: item.overview || undefined,
    genres: item.genres || [],
    status: item.status || undefined,
    contentType: item.type === 'movie' ? 'movie' : 'series',
  };
}

function toDetails(item: MovieApiMedia): AnimeDetails {
  return {
    ...toAnimeItem(item),
    episodes: [],
    seasons: [],
    description: item.overview || undefined,
    totalEpisodes: 0,
  };
}

function toEpisode(item: any): Episode {
  return {
    id: String(item.id || item.providerId || `episode-${item.season || 1}-${item.number || 1}`),
    number: Number(item.number || 1),
    title: item.title || undefined,
    image: item.image?.original || item.image?.medium || item.image || undefined,
    duration: item.runtime || undefined,
    playable: true,
    seasonNumber: Number(item.season || 1),
  };
}

async function searchAll(query: string, page = 1) {
  const [movies, tv] = await Promise.allSettled([
    request<MovieApiPage>('/api/v1/tmdb/search/movie', { q: query, page }),
    request<MovieApiPage>('/api/v1/tmdb/search/tv', { q: query, page }),
  ]);
  let results = [
    ...(movies.status === 'fulfilled' ? movies.value.results : []),
    ...(tv.status === 'fulfilled' ? tv.value.results : []),
  ];

  // MovieApi v0.7.0 exposes a working TVMaze search even when TMDB is not configured.
  // Keep search useful instead of returning an empty screen in that state.
  if (!results.length) {
    try {
      const fallback = await request<{ query: string; results: MovieApiMedia[] }>(
        '/api/v1/tv/search',
        { q: query }
      );
      results = fallback.results || [];
    } catch {
      // Preserve the original empty-result behavior if both providers are unavailable.
    }
  }

  results = results.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  return { results, total: results.length };
}

export const api = {
  async getHome() {
    return request<{
      featured: MovieApiMedia | null;
      sections: {
        trending: MovieApiMedia[];
        popularMovies: MovieApiMedia[];
        popularTv: MovieApiMedia[];
        latestMovies: MovieApiMedia[];
        latestTv: MovieApiMedia[];
      };
      generatedAt: string;
    }>('/api/v1/home', undefined, undefined, 30_000);
  },

  async getTrending() {
    const data = await request<MovieApiPage>('/api/v1/trending', { window: 'day' }, undefined, 30_000);
    return { results: data.results.map(toAnimeItem) };
  },

  async getPopular() {
    const data = await request<MovieApiPage>('/api/v1/popular/movies');
    return { results: data.results.map(toAnimeItem) };
  },

  async getAiringSchedule() {
    const data = await request<any>('/api/v1/airing/today', { country: 'US' }, undefined, 300_000);
    const results = (data.episodes || []).map((episode: any) => episode.show).filter(Boolean).map(toAnimeItem);
    return { schedule: data.episodes || [], results };
  },

  async getAiringToday() {
    return this.getAiringSchedule();
  },

  async getMovies() {
    const data = await request<MovieApiPage>('/api/v1/popular/movies');
    return { results: data.results.map(toAnimeItem) };
  },

  async getGenreAnime(genre = '', limit?: number) {
    const data = await request<{ type: 'tv' | 'movie'; genreId: number; page: number; totalPages: number; totalResults: number; results: MovieApiMedia[] }>('/api/v1/genres/' + encodeURIComponent(genre), { type: 'tv', page: 1 });
    return { results: data.results.slice(0, limit ?? data.results.length).map(toAnimeItem) };
  },

  async search(query: string) {
    const data = await searchAll(query);
    return { results: data.results.map(toAnimeItem) };
  },

  async searchPaged(query: string, page = 1) {
    const data = await searchAll(query, page);
    return { results: data.results.map(toAnimeItem), total: data.total };
  },

  async getRecommendations(id: string) {
    const media = mediaFromId(id);
    if (!media || media.provider !== 'tmdb') return { results: [] as AnimeItem[] };
    const data = await request<MovieApiPage>(
      `/api/v1/recommendations/${media.id}`,
      { type: media.type }
    );
    return { results: data.results.map(toAnimeItem) };
  },

  async getTrailer(id: string) {
    const media = mediaFromId(id);
    if (!media) return { available: false, trailer: null };

    // TVMaze IDs are accepted by the frontend, but MovieApi video routes use TMDB IDs.
    // Resolve the TVMaze show first so trailers work for both ID formats.
    let videoType: 'movie' | 'tv' = media.type;
    let videoId = media.id;
    if (media.provider === 'tvmaze') {
      const details = await request<MovieApiMedia>(`/api/v1/tv/${media.id}`, undefined, undefined, 300_000);
      const resolvedTmdbId = Number(details.ids?.tmdb || 0);
      if (!resolvedTmdbId) return { available: false, trailer: null };
      videoId = resolvedTmdbId;
      videoType = 'tv';
    }

    const data = await request<{ videos: MovieApiVideo[] }>(
      `/api/v1/${videoType}/${videoId}/videos`,
      undefined,
      undefined,
      300_000
    );
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const trailer = videos.find(video => video.type === 'Trailer' && video.official)
      || videos.find(video => video.type === 'Trailer')
      || null;
    return { available: Boolean(trailer), trailer };
  },

  async getDetails(id: string): Promise<AnimeDetails> {
    const media = mediaFromId(id);
    if (!media) throw new MovieApiError('This title is not a MovieApi media ID.', 400, 'INVALID_MEDIA_ID');

    const path = media.provider === 'tvmaze'
      ? `/api/v1/tv/${media.id}`
      : `/api/v1/tmdb/${media.type === 'movie' ? 'movie' : 'tv'}/${media.id}`;
    const data = await request<MovieApiMedia>(path);
    return toDetails(data);
  },

  async getSeasons(id: string) {
    const media = mediaFromId(id);
    if (!media || media.type !== 'tv') return { seasons: [] as AnimeSeasonItem[] };

    if (media.provider === 'tvmaze') {
      const data = await request<{ seasons: any[] }>(`/api/v1/tv/${media.id}/seasons`);
      return {
        seasons: (data.seasons || []).map((season: any): AnimeSeasonItem => ({
          seasonNumber: Number(season.number || 1),
          animeId: id,
          title: season.name || `Season ${season.number || 1}`,
          episodeCount: Number(season.episodeOrder || 0),
        })),
      };
    }

    const data = await request<MovieApiMedia & { numberOfSeasons?: number }>(`/api/v1/tmdb/tv/${media.id}`);
    const count = Math.max(0, Number(data.numberOfSeasons || 0));
    return { seasons: Array.from({ length: count }, (_, index): AnimeSeasonItem => ({
      seasonNumber: index + 1, animeId: id, title: `Season ${index + 1}`, episodeCount: 0
    })) };
  },

  async getSeasonEpisodes(id: string, seasonNumber: number) {
    const media = mediaFromId(id);
    if (!media || media.type !== 'tv') return { anime_id: id, season_number: seasonNumber, season_anime_id: id, episodes: [] as Episode[] };

    const data = media.provider === 'tvmaze'
      ? await request<{ episodes: any[] }>(`/api/v1/tv/${media.id}/season/${seasonNumber}`)
      : await request<{ episodes: any[] }>(`/api/v1/tmdb/tv/${media.id}/season/${seasonNumber}`);

    return {
      anime_id: id, season_number: seasonNumber, season_anime_id: id,
      episodes: (data.episodes || []).map((ep) => ({
        id: String(ep.id), number: Number(ep.number || 1), title: ep.title || `Episode ${ep.number || 1}`,
        synopsis: ep.synopsis || ep.overview || '', image: ep.image?.original || ep.image?.medium || ep.image || ''
      }))
    };
  },

  async getWatchLink(id: string, season = 1, episode = 1) {
    const media = mediaFromId(id);
    if (!media) throw new MovieApiError('Playback requires a MovieApi media ID.', 400, 'INVALID_MEDIA_ID');

    const path = media.type === 'movie'
      ? `/api/v1/movie/${media.id}/play`
      : `/api/v1/tv/${media.id}/season/${season}/episode/${episode}/play`;
    const data = await request<{ source: MovieApiPlaybackSource | null }>(path, undefined, undefined, 0);
    if (!data.source?.url) throw new MovieApiError('No playback source is currently available.', 503, 'NO_PLAYBACK_SOURCE');
    return { url: data.source.url, source: data.source };
  },

  async getServers(id: string, episode = 1) {
    try {
      const data = await this.getWatchLink(id, 1, episode);
      return { servers: [data.source] };
    } catch {
      return { servers: [] };
    }
  },

  async getStream(id: string, episode = 1) {
    const data = await this.getWatchLink(id, 1, episode);
    return { url: data.url };
  },

  async getSchedule() {
    return this.getAiringSchedule();
  },

  async health() {
    return request('/api/v1/health', undefined, undefined, 10_000);
  },

  clearCache() {
    cache.clear();
  },

  getDetailsMediaId(id: string) {
    return mediaFromId(id);
  },
};

export type KinomaContentApi = typeof api;

import { AnimeDetails, AnimeItem } from '../types';

/**
 * Kinoma content boundary.
 *
 * IMPORTANT:
 * This compatibility layer is intentionally offline right now.
 * It contains NO anime/Jikan/network imports. When MovieApi is ready,
 * replace the implementation behind this boundary instead of coupling
 * pages directly to a provider.
 */

const empty = <T,>(value: T) => Promise.resolve(value);

const placeholder = (id: string): AnimeItem => ({
  id,
  title: id || 'Untitled',
  image: '',
  cover: '',
  banner: '',
  contentType: 'series',
});

export const api = {
  getTrending: async () => ({ results: [] as AnimeItem[] }),
  getPopular: async () => ({ results: [] as AnimeItem[] }),
  getAiringSchedule: async () => ({ schedule: [], results: [] as AnimeItem[] }),
  getAiringToday: async () => ({ results: [] as AnimeItem[], day: 'Today' }),
  getMovies: async () => ({ results: [] as AnimeItem[] }),
  getGenreAnime: async () => ({ results: [] as AnimeItem[] }),
  getSeasons: async () => ({ seasons: [] }),
  search: async () => ({ results: [] as AnimeItem[] }),
  searchPaged: async () => ({ results: [] as AnimeItem[], total: 0 }),
  getRecommendations: async () => ({ results: [] as AnimeItem[] }),
  getTrailer: async () => ({ available: false, trailer: null }),
  getDetails: async (id: string): Promise<AnimeDetails> => ({
    ...placeholder(id),
    episodes: [],
    seasons: [],
    description: 'Content is waiting for the new MovieApi connection.',
    status: 'Unavailable',
    type: 'TV',
    totalEpisodes: 0,
  }),
  getSeasonEpisodes: async (originalAnimeId: string, seasonNumber: number) => ({
    anime_id: originalAnimeId,
    season_number: seasonNumber,
    season_anime_id: originalAnimeId,
    episodes: [],
  }),
  getWatchLink: async () => {
    throw new Error('Playback is disconnected until the new content API is connected.');
  },
  getSchedule: async () => ({ results: [] as AnimeItem[] }),
  getServers: async () => ({ servers: [] }),
  getStream: async () => ({ url: '' }),
};

export type KinomaContentApi = typeof api;

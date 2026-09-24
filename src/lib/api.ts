import { animeApi, AnimeSearchResult } from '../services/animeApi';
import { localCache } from './localCache';
import { AnimeItem, AnimeDetails, DEFAULT_POSTER, DEFAULT_BANNER } from '../types';

// Memory cache to preserve anilist_id and other metadata between views
const itemCache = new Map<string, AnimeItem>();

function isTvSeries(item: any): boolean {
  const format = (item.format || item.type || '').toUpperCase();
  if (format === 'MOVIE' || format === 'Movie' || format === 'OVA' || format === 'SPECIAL' || format === 'MUSIC' || format === 'MANGA') {
    return false;
  }
  const titleStr = (typeof item.title === 'string' ? item.title : item.title?.english || item.title?.romaji || '').toLowerCase();
  if (titleStr.includes('movie') || titleStr.includes('ova') || titleStr.includes('special edition') || titleStr.includes('recaps')) {
    return false;
  }
  return true;
}

function mapItem(item: any): AnimeItem {
  const title = item.title?.english || item.title?.romaji || item.title?.native || 'Unknown';
  const imgUrl = item.cover_image?.large || item.cover_image?.extra_large || item.image || DEFAULT_POSTER;
  const coverUrl = item.cover_image?.extra_large || item.cover_image?.large || item.cover || DEFAULT_BANNER;

  const mapped: AnimeItem = {
    id: item.anime_id || item.id,
    anilist_id: item.anilist_id,
    title: {
      english: item.title?.english || title,
      romaji: item.title?.romaji || title,
      native: item.title?.native || ''
    },
    image: imgUrl && imgUrl.startsWith('http') ? imgUrl : DEFAULT_POSTER,
    cover: coverUrl && coverUrl.startsWith('http') ? coverUrl : DEFAULT_BANNER,
    banner: (item.banner_image?.extra_large || item.banner_image?.large || item.banner || coverUrl || DEFAULT_BANNER),
    rating: item.average_score,
    contentRating: typeof item.rating === 'string' ? item.rating : undefined,
    type: item.format || 'TV',
    releaseDate: item.season_year ? String(item.season_year) : (item.year ? String(item.year) : undefined),
    description: item.description || (item.rating ? `Rating: ${item.rating}` : undefined),
    genres: item.genres || [],
    totalEpisodes: item.episodes || item.episodeCount || 0,
    status: item.status
  };

  // Cache the item to preserve anilist_id for getDetails
  if (mapped.id) {
    itemCache.set(mapped.id, mapped);
  }

  return mapped;
}

function deduplicate<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

function getSeasonTitle(titleStr: string, index: number): string {
  const t = titleStr.toLowerCase();
  if (t.includes('final season part 2')) return 'Final Season Part 2';
  if (t.includes('final season part 1')) return 'Final Season Part 1';
  if (t.includes('final season the final chapters')) return 'The Final Chapters';
  if (t.includes('final season')) return 'Final Season';
  if (t.includes('season 3 part 2')) return 'Season 3 Part 2';
  if (t.includes('season 3')) return 'Season 3';
  if (t.includes('season 2')) return 'Season 2';
  if (t.includes('season 4')) return 'Season 4';
  if (t.includes('ova')) return 'OVA';
  if (t.includes('special')) return 'Special';
  if (t.includes('movie') || t.includes('part i') || t.includes('part ii')) return 'Movie / Side Story';
  return `Season ${index}`;
}

export const api = {
  getTrending: async () => {
    return localCache.getOrFetch('api_trending', async () => {
      const res = await animeApi.search('action', 30, 0);
      const filtered = (res.results || []).filter(isTvSeries);
      const mapped = filtered.map(mapItem);
      const unique = deduplicate(mapped, 'id');
      if (unique.length > 0) return { results: unique };
      return { results: (res.results || []).map(mapItem) };
    }, 1000 * 60 * 30); // 30 mins TTL
  },

  getPopular: async () => {
    return localCache.getOrFetch('api_popular', async () => {
      const res = await animeApi.search('adventure', 30, 0);
      const filtered = (res.results || []).filter(isTvSeries);
      const mapped = filtered.map(mapItem);
      const unique = deduplicate(mapped, 'id');
      if (unique.length > 0) return { results: unique };
      return { results: (res.results || []).map(mapItem) };
    }, 1000 * 60 * 30); // 30 mins TTL
  },

  getAiringSchedule: async (tz = 'Asia/Calcutta', week = 0) => {
    const cleanKey = `api_schedule_${tz}_${week}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.getSchedule(tz, week);
        const allEpisodes: AnimeItem[] = [];
        (res.schedule || []).forEach(day => {
          (day.episodes || []).filter(isTvSeries).forEach(ep => {
            allEpisodes.push(mapItem(ep));
          });
        });
        return {
          schedule: res.schedule || [],
          results: deduplicate(allEpisodes, 'id')
        };
      } catch (e) {
        console.error('Schedule fetch error:', e);
        return { schedule: [], results: [] };
      }
    }, 1000 * 60 * 30);
  },

  getAiringToday: async () => {
    return localCache.getOrFetch('api_airing_today', async () => {
      try {
        const res = await animeApi.getSchedule();
        const firstDay = res.schedule?.[0];
        const eps = (firstDay?.episodes || []).filter(isTvSeries).map(mapItem);
        return { results: deduplicate(eps, 'id'), day: firstDay?.day || 'Today' };
      } catch (e) {
        console.error('Airing today error:', e);
        return { results: [], day: 'Today' };
      }
    }, 1000 * 60 * 20);
  },

  getMovies: async (limit = 24) => {
    return localCache.getOrFetch(`api_movies_${limit}`, async () => {
      try {
        const res = await animeApi.search('movie', limit, 0);
        const mapped = (res.results || []).map(mapItem);
        return { results: deduplicate(mapped, 'id') };
      } catch (e) {
        console.error('Movies fetch error:', e);
        return { results: [] as AnimeItem[] };
      }
    }, 1000 * 60 * 30);
  },

  getGenreAnime: async (genre: string, limit = 25) => {
    const cleanKey = `api_genre_${genre.toLowerCase().trim()}_${limit}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.search(genre, limit, 0);
        const filtered = (res.results || []).filter(isTvSeries);
        const mapped = filtered.map(mapItem);
        return { results: deduplicate(mapped, 'id') };
      } catch (e) {
        console.error(`Genre fetch error for ${genre}:`, e);
        return { results: [] };
      }
    }, 1000 * 60 * 30);
  },

  getSeasons: async (animeId: string) => {
    return animeApi.getSeasons(animeId);
  },

  search: async (query: string) => {
    const cleanKey = `api_search_${query.toLowerCase().trim()}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.search(query, 25, 0);
        const filtered = (res.results || []).filter(isTvSeries);
        const mapped = filtered.map(mapItem);
        return { results: deduplicate(mapped, 'id') };
      } catch (e) {
        console.error('Search error:', e);
        return { results: [] };
      }
    }, 1000 * 60 * 20); // 20 mins TTL
  },

  searchPaged: async (query: string, limit = 25, offset = 0) => {
    const cleanKey = `api_searchpaged_${query.toLowerCase().trim()}_${limit}_${offset}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.search(query, limit, offset);
        const filtered = (res.results || []).filter(isTvSeries);
        const mapped = filtered.map(mapItem);
        return { 
          results: deduplicate(mapped, 'id'),
          total: res.total || 0 
        };
      } catch (e) {
        console.error('Search paged error:', e);
        return { results: [], total: 0 };
      }
    }, 1000 * 60 * 20); // 20 mins TTL
  },

  getRecommendations: async (id: string) => {
    const cleanKey = `api_recs_${id}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.getRecommendations(id);
        const filtered = (res.recommendations || []).filter(isTvSeries);
        const mapped = filtered.map(mapItem);
        return { results: deduplicate(mapped, 'id') as AnimeItem[] };
      } catch (e) {
        console.error('Recommendations error:', e);
        return { results: [] as AnimeItem[] };
      }
    }, 1000 * 60 * 60); // 1 hour TTL
  },

  getTrailer: async (id: string) => {
    const cleanKey = `api_trailer_${id}`;
    return localCache.getOrFetch(cleanKey, async () => {
      // Prefer Kinoma API's curated trailer endpoint.
      try {
        const response: any = await animeApi.getTrailer(id);
        const raw = response?.trailer ?? response?.data?.trailer ?? response?.data ?? response;

        if (raw) {
          const trailerId = raw.id || raw.key || raw.video_id;
          const site = String(raw.site || raw.provider || 'youtube').toLowerCase();
          const url = raw.url || raw.youtube_url || raw.embed_url;

          if (trailerId || url) {
            let normalizedId = trailerId;
            if (!normalizedId && typeof url === 'string') {
              const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
              normalizedId = match?.[1];
            }

            if (normalizedId) {
              return {
                available: true,
                trailer: {
                  id: normalizedId,
                  site: site === 'youtube' || site === 'yt' ? 'youtube' : site,
                  thumbnail: raw.thumbnail || `https://i.ytimg.com/vi/${normalizedId}/hqdefault.jpg`
                }
              };
            }
          }
        }
      } catch (error) {
        console.warn('Kinoma trailer endpoint unavailable; trying AniList fallback:', error);
      }

      // Fallback: AniList exposes official trailer metadata for many titles.
      try {
        const cached = itemCache.get(id);
        const info = await animeApi.getAnimeInfo(id).catch(() => null);
        const anilistId = info?.anilist_id || cached?.anilist_id;

        if (anilistId) {
          const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              query: `query Trailer($id: Int) {
                Media(id: $id, type: ANIME) {
                  trailer { id site thumbnail }
                }
              }`,
              variables: { id: anilistId }
            })
          });

          if (response.ok) {
            const json = await response.json();
            const trailer = json?.data?.Media?.trailer;
            if (trailer?.id) {
              return {
                available: true,
                trailer: {
                  id: trailer.id,
                  site: String(trailer.site || '').toLowerCase(),
                  thumbnail: trailer.thumbnail || `https://i.ytimg.com/vi/${trailer.id}/hqdefault.jpg`
                }
              };
            }
          }
        }
      } catch (error) {
        console.warn('AniList trailer fallback failed:', error);
      }

      return { available: false, trailer: null };
    }, 1000 * 60 * 60 * 24);
  },

  getDetails: async (id: string, initialItem?: AnimeItem): Promise<AnimeDetails> => {
    const cleanKey = `api_details_${id}`;
    return localCache.getOrFetch(cleanKey, async (): Promise<AnimeDetails> => {
      const [info, epsRes, seasonsRes] = await Promise.all([
        animeApi.getAnimeInfo(id),
        animeApi.getEpisodes(id, 2000).catch(() => ({ data: [] })),
        animeApi.getSeasons(id).catch(() => null)
      ]);

      const cachedItem = itemCache.get(id);
      let anilistId = info.anilist_id || initialItem?.anilist_id || cachedItem?.anilist_id || 0;
      let format = info.format || initialItem?.type || cachedItem?.type || 'TV';
      let status = info.status || initialItem?.status || cachedItem?.status || 'Finished';
      let genres = info.genres || initialItem?.genres || cachedItem?.genres || [];
      let description = initialItem?.description || cachedItem?.description || '';
      let rating = info.average_score || initialItem?.rating || cachedItem?.rating;
      let seasonYear = info.season_year || (initialItem?.releaseDate ? parseInt(initialItem.releaseDate) : (cachedItem?.releaseDate ? parseInt(cachedItem.releaseDate) : undefined));
      let studio = '';
      let contentRating = typeof info.rating === 'string' ? info.rating : (typeof initialItem?.contentRating === 'string' ? initialItem.contentRating : (typeof cachedItem?.contentRating === 'string' ? cachedItem.contentRating : undefined));

      const cachedTitle = typeof cachedItem?.title === 'object' ? cachedItem.title.english || cachedItem.title.romaji : cachedItem?.title;
      const initialTitle = typeof initialItem?.title === 'object' ? initialItem.title.english || initialItem.title.romaji : initialItem?.title;
      const rawTitle = info.title?.english || info.title?.romaji || initialTitle || cachedTitle || id;

      if (!anilistId || genres.length === 0) {
        try {
          const searchRes = await animeApi.search(rawTitle, 5, 0);
          const matched = searchRes.results?.find(r => r.anime_id === id) || searchRes.results?.[0];
          if (matched) {
            anilistId = matched.anilist_id || anilistId;
            format = matched.format || format;
            status = matched.status || status;
            genres = matched.genres || genres;
            rating = matched.average_score || rating;
            seasonYear = matched.season_year || seasonYear;
            if (!contentRating && typeof matched.rating === 'string') {
              contentRating = matched.rating;
            }
          }
        } catch (e) {}
      }

      // Fetch rich synopsis & studio from AniList GraphQL API if anilistId is available
      if (anilistId) {
        try {
          const aniRes = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              query: 'query GetMedia($id: Int) { Media(id: $id, type: ANIME) { description(asHtml: true) studios(isMain: true) { nodes { name } } } }',
              variables: { id: anilistId }
            })
          });
          const aniJson = await aniRes.json();
          if (aniJson?.data?.Media) {
            description = aniJson.data.Media.description || '';
            const studiosList = aniJson.data.Media.studios?.nodes;
            if (studiosList && studiosList.length > 0) {
              studio = studiosList[0].name;
            }
          }
        } catch (e) {
          console.warn('AniList description fetch warning:', e);
        }
      }

      // Map seasons from API
      let seasons: { seasonNumber: number; animeId: string; anilistId?: number; title: string; episodeCount: number }[] = [];
      if (seasonsRes && Array.isArray(seasonsRes.seasons) && seasonsRes.seasons.length > 0) {
        seasons = seasonsRes.seasons.map(s => ({
          seasonNumber: s.season_number,
          animeId: s.anime_id,
          anilistId: s.anilist_id || anilistId,
          title: s.title || `Season ${s.season_number}`,
          episodeCount: s.episode_count
        }));
      }

      const rawEpisodes = epsRes.data || [];
      if (seasons.length === 0 && rawEpisodes.length > 0) {
        seasons = [{
          seasonNumber: 1,
          animeId: id,
          anilistId,
          title: 'Season 1',
          episodeCount: rawEpisodes.length
        }];
      }

      const episodes = rawEpisodes.map((ep: any) => ({
        id: `${id}|${ep.episode_number}|${anilistId}`,
        number: ep.episode_number,
        title: ep.title || `Episode ${ep.episode_number}`,
        image: ep.thumbnail || info.cover_image?.large,
        playable: ep.playable ?? true,
        subbed: ep.subbed ?? true,
        dubbed: ep.dubbed ?? false,
        seasonNumber: 1,
        seasonAnimeId: id
      }));

      return {
        id,
        anilist_id: anilistId,
        title: info.title || { english: id, romaji: id },
        image: String(info.cover_image?.large || info.cover_image?.extra_large || info.image || DEFAULT_POSTER),
        cover: String(info.cover_image?.extra_large || info.cover_image?.large || info.cover || DEFAULT_BANNER),
        banner: String(info.banner_image?.extra_large || info.banner_image?.large || info.banner || info.cover_image?.extra_large || info.cover_image?.large || DEFAULT_BANNER),
        description: description || 'No synopsis available for this anime.',
        genres,
        status,
        type: format,
        releaseDate: seasonYear ? String(seasonYear) : 'Unknown',
        totalEpisodes: episodes.length || info.episodes || 0,
        rating,
        contentRating,
        studio: studio || 'Unknown Studio',
        episodes,
        seasons,
        _reanimeSlug: id,
        _reanimeConfigured: true
      };
    }, 1000 * 60 * 60 * 3); // 3 hours TTL for anime details & episodes
  },

  getSeasonEpisodes: async (
    originalAnimeId: string,
    seasonNumber: number,
    fallbackSeasonAnimeId?: string,
    fallbackAnilistId?: number
  ) => {
    const cleanKey = `api_season_eps_${originalAnimeId}_${seasonNumber}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.getSeasonEpisodes(originalAnimeId, seasonNumber);
        const seasonAnimeId = res.season_anime_id || fallbackSeasonAnimeId || originalAnimeId;
        const anilistId = fallbackAnilistId || 0;

        const episodes = (res.episodes || []).map((ep: any) => ({
          id: `${seasonAnimeId}|${ep.episode_number}|${anilistId}`,
          number: ep.episode_number,
          title: ep.title || `Episode ${ep.episode_number}`,
          image: ep.thumbnail,
          playable: ep.playable ?? true,
          subbed: ep.subbed ?? true,
          dubbed: ep.dubbed ?? false,
          seasonNumber,
          seasonAnimeId
        }));

        return {
          anime_id: originalAnimeId,
          season_number: seasonNumber,
          season_anime_id: seasonAnimeId,
          episodes
        };
      } catch (err) {
        console.warn(`Failed to fetch season episodes for ${originalAnimeId} S${seasonNumber}, fallback:`, err);
        const targetId = fallbackSeasonAnimeId || originalAnimeId;
        const epsRes = await animeApi.getEpisodes(targetId, 2000).catch(() => ({ data: [] }));
        const seasonAnimeId = targetId;
        const anilistId = fallbackAnilistId || 0;

        const episodes = (epsRes.data || []).map((ep: any) => ({
          id: `${seasonAnimeId}|${ep.episode_number}|${anilistId}`,
          number: ep.episode_number,
          title: ep.title || `Episode ${ep.episode_number}`,
          image: ep.thumbnail,
          playable: ep.playable ?? true,
          subbed: ep.subbed ?? true,
          dubbed: ep.dubbed ?? false,
          seasonNumber,
          seasonAnimeId
        }));

        return {
          anime_id: originalAnimeId,
          season_number: seasonNumber,
          season_anime_id: seasonAnimeId,
          episodes
        };
      }
    }, 1000 * 60 * 60 * 2);
  },

  getWatchLink: async (episodeCompositeId: string) => {
    try {
      const parts = episodeCompositeId.split('|');
      const animeId = parts[0];
      const episodeNumber = parts[1] || '1';
      const anilistId = parts[2] || '0';

      const serversRes = await animeApi.getServers(animeId, episodeNumber, anilistId);
      const servers = serversRes.servers || [];

      if (servers.length === 0) {
        throw new Error('No streaming servers available');
      }

      const primaryServer = servers.find((s: any) => s.dataType === 'sub') || servers[0];

      const streamRes = await animeApi.getStream(
        animeId,
        episodeNumber,
        primaryServer.serverName,
        primaryServer.dataType || 'sub',
        anilistId,
        primaryServer.dataLink
      );

      const resolvedUrl = streamRes.url || primaryServer.dataLink || '';

      return {
        sources: [
          { url: resolvedUrl, quality: 'auto' }
        ],
        servers,
        activeServer: primaryServer
      };
    } catch (e) {
      console.error('Get watch link error:', e);
      throw e;
    }
  },

  getSchedule: async (day = 'monday') => {
    const cleanKey = `api_schedule_${day.toLowerCase()}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const scheduleData = await animeApi.getSchedule('Asia/Calcutta', 0);
        const targetDay = day.toLowerCase();
        
        const foundDay = (scheduleData.schedule || []).find(d => d.day.toLowerCase() === targetDay);
        const episodes = foundDay?.episodes || [];

        const results = episodes.map(ep => ({
          id: ep.anime_id,
          anilist_id: ep.anilist_id,
          title: ep.title,
          image: ep.cover_image?.large || ep.cover_image?.extra_large || ep.image || DEFAULT_POSTER,
          totalEpisodes: ep.episode_number
        }));

        return { results };
      } catch (e) {
        console.error('Schedule fetch error:', e);
        return { results: [] };
      }
    }, 1000 * 60 * 60); // 1 hour TTL
  }
};

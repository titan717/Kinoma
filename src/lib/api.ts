import { animeApi, AnimeSearchResult } from '../services/animeApi';
import { localCache } from './localCache';
import { AnimeItem, AnimeDetails, DEFAULT_POSTER, DEFAULT_BANNER } from '../types';

function mapItem(item: any): AnimeItem {
  const title = item.title?.english || item.title?.romaji || item.title?.native || 'Unknown';
  return {
    id: item.anime_id || item.id,
    title: {
      english: item.title?.english || title,
      romaji: item.title?.romaji || title,
      native: item.title?.native || ''
    },
    image: item.cover_image?.large || item.cover_image?.extra_large || item.image || DEFAULT_POSTER,
    cover: item.cover_image?.extra_large || item.cover_image?.large || item.cover || DEFAULT_BANNER,
    rating: item.average_score,
    type: item.format,
    releaseDate: item.season_year ? String(item.season_year) : (item.year ? String(item.year) : undefined),
    description: item.rating ? `Rating: ${item.rating}` : undefined,
    genres: item.genres || [],
    totalEpisodes: item.episodes || item.episodeCount || 0,
    status: item.status
  };
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
      try {
        const res = await animeApi.search('action', 20, 0);
        const mapped = (res.results || []).map(mapItem);
        const unique = deduplicate(mapped, 'id');
        if (unique.length > 0) return { results: unique };
        throw new Error('No results');
      } catch (e) {
        console.warn('Trending fetch warning, using fallback:', e);
        try {
          const res2 = await animeApi.search('naruto', 20, 0);
          return { results: deduplicate((res2.results || []).map(mapItem), 'id') };
        } catch {
          return { results: [] };
        }
      }
    }, 1000 * 60 * 30); // 30 mins TTL
  },

  getPopular: async () => {
    return localCache.getOrFetch('api_popular', async () => {
      try {
        const res = await animeApi.search('adventure', 20, 0);
        const mapped = (res.results || []).map(mapItem);
        const unique = deduplicate(mapped, 'id');
        if (unique.length > 0) return { results: unique };
        throw new Error('No results');
      } catch (e) {
        console.warn('Popular fetch warning, using fallback:', e);
        try {
          const res2 = await animeApi.search('one', 20, 0);
          return { results: deduplicate((res2.results || []).map(mapItem), 'id') };
        } catch {
          return { results: [] };
        }
      }
    }, 1000 * 60 * 30); // 30 mins TTL
  },

  search: async (query: string) => {
    const cleanKey = `api_search_${query.toLowerCase().trim()}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.search(query, 20, 0);
        const mapped = (res.results || []).map(mapItem);
        return { results: deduplicate(mapped, 'id') };
      } catch (e) {
        console.error('Search error:', e);
        return { results: [] };
      }
    }, 1000 * 60 * 20); // 20 mins TTL
  },

  searchPaged: async (query: string, limit = 20, offset = 0) => {
    const cleanKey = `api_searchpaged_${query.toLowerCase().trim()}_${limit}_${offset}`;
    return localCache.getOrFetch(cleanKey, async () => {
      try {
        const res = await animeApi.search(query, limit, offset);
        const mapped = (res.results || []).map(mapItem);
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
        const mapped = (res.recommendations || []).map(mapItem);
        return { results: deduplicate(mapped, 'id') as AnimeItem[] };
      } catch (e) {
        console.error('Recommendations error:', e);
        return { results: [] as AnimeItem[] };
      }
    }, 1000 * 60 * 60); // 1 hour TTL
  },

  getDetails: async (id: string): Promise<AnimeDetails> => {
    const cleanKey = `api_details_${id}`;
    return localCache.getOrFetch(cleanKey, async (): Promise<AnimeDetails> => {
      const [info, epsRes] = await Promise.all([
        animeApi.getAnimeInfo(id),
        animeApi.getEpisodes(id, 2000).catch(() => ({ data: [] }))
      ]);

      let anilistId = info.anilist_id || 0;
      let format = info.format || 'TV';
      let status = info.status || 'Finished';
      let genres = info.genres || [];
      let description = '';
      let rating = info.average_score;
      let seasonYear = info.season_year;
      let studio = '';

      const rawTitle = info.title?.english || info.title?.romaji || id;

      if (!anilistId || genres.length === 0 || !description) {
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

      const episodes = (epsRes.data || []).map((ep: any) => ({
        id: `${id}|${ep.episode_number}|${anilistId}`,
        number: ep.episode_number,
        title: ep.title || `Episode ${ep.episode_number}`,
        image: ep.thumbnail || info.cover_image?.large,
        playable: ep.playable ?? true,
        subbed: ep.subbed ?? true,
        dubbed: ep.dubbed ?? false
      }));

      return {
        id,
        anilist_id: anilistId,
        title: info.title || { english: id, romaji: id },
        image: String(info.cover_image?.large || info.cover_image?.extra_large || info.image || DEFAULT_POSTER),
        cover: String(info.cover_image?.extra_large || info.cover_image?.large || info.cover || DEFAULT_BANNER),
        description: description || 'No synopsis available for this anime.',
        genres,
        status,
        type: format,
        releaseDate: seasonYear ? String(seasonYear) : 'Unknown',
        totalEpisodes: episodes.length || info.episodes || 0,
        rating,
        studio: studio || 'Unknown Studio',
        episodes,
        _reanimeSlug: id,
        _reanimeConfigured: true
      };
    }, 1000 * 60 * 60 * 3); // 3 hours TTL for anime details & episodes
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
        anilistId
      );

      return {
        sources: [
          { url: streamRes.url, quality: 'auto' }
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

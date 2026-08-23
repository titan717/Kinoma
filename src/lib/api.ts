import { animeApi, AnimeSearchResult } from '../services/animeApi';

function mapItem(item: AnimeSearchResult) {
  const title = item.title?.english || item.title?.romaji || item.title?.native || 'Unknown';
  return {
    id: item.anime_id,
    anilist_id: item.anilist_id,
    title: {
      english: item.title?.english || title,
      romaji: item.title?.romaji || title,
      native: item.title?.native || ''
    },
    image: item.cover_image?.large || item.cover_image?.extra_large || '',
    cover: item.cover_image?.extra_large || item.cover_image?.large || '',
    rating: item.average_score,
    type: item.format,
    releaseDate: item.season_year ? String(item.season_year) : undefined,
    description: item.rating ? `Rating: ${item.rating}` : undefined,
    genres: item.genres || [],
    totalEpisodes: item.episodes,
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

export const api = {
  getTrending: async () => {
    try {
      const res = await animeApi.search('action', 20, 0);
      const mapped = (res.results || []).map(mapItem);
      const unique = deduplicate(mapped, 'id');
      if (unique.length > 0) return { results: unique };
      throw new Error('No results');
    } catch (e) {
      console.warn('Trending fetch warning, using fallback:', e);
      // Fallback search
      try {
        const res2 = await animeApi.search('naruto', 20, 0);
        return { results: deduplicate((res2.results || []).map(mapItem), 'id') };
      } catch {
        return { results: [] };
      }
    }
  },

  getPopular: async () => {
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
  },

  search: async (query: string) => {
    try {
      const res = await animeApi.search(query, 20, 0);
      const mapped = (res.results || []).map(mapItem);
      return { results: deduplicate(mapped, 'id') };
    } catch (e) {
      console.error('Search error:', e);
      return { results: [] };
    }
  },

  searchPaged: async (query: string, limit = 20, offset = 0) => {
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
  },

  getDetails: async (id: string) => {
    try {
      const [info, epsRes] = await Promise.all([
        animeApi.getAnimeInfo(id),
        animeApi.getEpisodes(id, 2000).catch(() => ({ data: [] }))
      ]);

      let anilistId = info.anilist_id || 0;
      let format = info.format || 'TV';
      let status = info.status || 'Finished';
      let genres = info.genres || [];
      let description = info.description;
      let rating = info.average_score;
      let seasonYear = info.season_year;

      if (!anilistId || genres.length === 0) {
        try {
          const searchRes = await animeApi.search(info.title.english || info.title.romaji || id, 5, 0);
          const matched = searchRes.results?.find(r => r.anime_id === id) || searchRes.results?.[0];
          if (matched) {
            anilistId = matched.anilist_id || anilistId;
            format = matched.format || format;
            status = matched.status || status;
            genres = matched.genres || genres;
            description = description || matched.rating;
            rating = matched.average_score || rating;
            seasonYear = matched.season_year || seasonYear;
          }
        } catch (e) {
          // ignore
        }
      }

      const episodes = (epsRes.data || []).map((ep: any) => ({
        id: `${id}|${ep.episode_number}|${anilistId}`,
        number: ep.episode_number,
        title: ep.title || `Episode ${ep.episode_number}`,
        image: ep.thumbnail,
        playable: ep.playable,
        subbed: ep.subbed,
        dubbed: ep.dubbed
      }));

      return {
        id,
        anilist_id: anilistId,
        title: info.title || { english: id, romaji: id },
        image: info.cover_image?.large || info.cover_image?.extra_large || '',
        cover: info.cover_image?.extra_large || info.cover_image?.large || '',
        description: description || 'No synopsis available.',
        genres,
        status,
        type: format,
        releaseDate: seasonYear ? String(seasonYear) : 'Unknown',
        totalEpisodes: episodes.length || info.episodes || 0,
        rating,
        episodes,
        _reanimeSlug: id,
        _reanimeConfigured: true
      };
    } catch (e) {
      console.error('Get details error:', e);
      throw e;
    }
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
    try {
      const scheduleData = await animeApi.getSchedule('Asia/Calcutta', 0);
      const targetDay = day.toLowerCase();
      
      const foundDay = (scheduleData.schedule || []).find(d => d.day.toLowerCase() === targetDay);
      const episodes = foundDay?.episodes || [];

      const results = episodes.map(ep => ({
        id: ep.anime_id,
        anilist_id: ep.anilist_id,
        title: ep.title,
        image: ep.cover_image?.large || ep.cover_image?.extra_large || '',
        totalEpisodes: ep.episode_number
      }));

      return { results };
    } catch (e) {
      console.error('Schedule fetch error:', e);
      return { results: [] };
    }
  }
};

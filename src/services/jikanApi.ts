const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export interface JikanImageSet {
  jpg?: {
    image_url?: string;
    small_image_url?: string;
    large_image_url?: string;
  };
  webp?: {
    image_url?: string;
    small_image_url?: string;
    large_image_url?: string;
  };
}

export interface JikanTitle {
  type?: string;
  title?: string;
}

export interface JikanAnime {
  mal_id: number;
  url?: string;
  images?: JikanImageSet;
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
    embed_url?: string | null;
    images?: {
      image_url?: string | null;
      large_image_url?: string | null;
      maximum_image_url?: string | null;
    };
  } | null;
  approved?: boolean;
  titles?: JikanTitle[];
  title?: string;
  title_english?: string | null;
  title_japanese?: string | null;
  type?: string | null;
  source?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: {
    from?: string | null;
    to?: string | null;
    string?: string | null;
  };
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  synopsis?: string | null;
  background?: string | null;
  season?: string | null;
  year?: number | null;
  genres?: Array<{ mal_id: number; name: string }>;
  themes?: Array<{ mal_id: number; name: string }>;
  demographics?: Array<{ mal_id: number; name: string }>;
  studios?: Array<{ mal_id: number; name: string }>;
  [key: string]: unknown;
}

export interface JikanSearchResponse {
  data: JikanAnime[];
  pagination?: {
    last_visible_page?: number;
    has_next_page?: boolean;
    current_page?: number;
    items?: {
      count?: number;
      total?: number;
      per_page?: number;
    };
  };
}

export interface JikanFullResponse {
  data: JikanAnime;
}

export interface JikanVideosResponse {
  data?: {
    promo?: Array<{
      title?: string;
      trailer?: {
        youtube_id?: string | null;
        url?: string | null;
        embed_url?: string | null;
        images?: {
          image_url?: string | null;
          large_image_url?: string | null;
          maximum_image_url?: string | null;
        };
      };
    }>;
  };
}

async function jikanFetch<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${JIKAN_BASE_URL}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const jikanApi = {
  search: (query: string, limit = 5) =>
    jikanFetch<JikanSearchResponse>("/anime", {
      q: query,
      page: 1,
      limit,
      sfw: true,
    }),

  getAnime: (malId: number) =>
    jikanFetch<JikanFullResponse>(`/anime/${encodeURIComponent(String(malId))}/full`),

  getVideos: (malId: number) =>
    jikanFetch<JikanVideosResponse>(`/anime/${encodeURIComponent(String(malId))}/videos`),

  async findByTitle(title: string) {
    const response = await this.search(title, 5);
    const normalized = title.trim().toLowerCase();

    const exact = response.data.find((item) => {
      const candidates = [
        item.title,
        item.title_english,
        item.title_japanese,
        ...(item.titles || []).map((entry) => entry.title),
      ].filter(Boolean).map((value) => String(value).trim().toLowerCase());

      return candidates.includes(normalized);
    });

    return exact || response.data[0] || null;
  },

  async getTrailer(malId: number) {
    const full = await this.getAnime(malId);
    const direct = full.data?.trailer;

    if (direct?.youtube_id) {
      return {
        available: true,
        trailer: {
          id: direct.youtube_id,
          site: "youtube",
          thumbnail:
            direct.images?.maximum_image_url ||
            direct.images?.large_image_url ||
            direct.images?.image_url ||
            `https://i.ytimg.com/vi/${direct.youtube_id}/hqdefault.jpg`,
        },
      };
    }

    try {
      const videos = await this.getVideos(malId);
      const promo = videos.data?.promo?.find((item) => item.trailer?.youtube_id);

      if (promo?.trailer?.youtube_id) {
        return {
          available: true,
          trailer: {
            id: promo.trailer.youtube_id,
            site: "youtube",
            thumbnail:
              promo.trailer.images?.maximum_image_url ||
              promo.trailer.images?.large_image_url ||
              promo.trailer.images?.image_url ||
              `https://i.ytimg.com/vi/${promo.trailer.youtube_id}/hqdefault.jpg`,
          },
        };
      }
    } catch {
      // Some MAL entries do not expose promo videos.
    }

    return { available: false, trailer: null };
  },
};

export { JIKAN_BASE_URL };

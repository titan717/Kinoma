const API_BASE_URL =
  (import.meta as any).env?.VITE_ANIME_API_URL ||
  "https://kinomaapi.vercel.app";

export interface AnimeTitle {
  english?: string;
  romaji?: string;
  native?: string;
  user_preferred?: string;
}

export interface AnimeCover {
  color?: string;
  extra_large?: string;
  large?: string;
  medium?: string;
}

export interface AnimeSearchResult {
  anime_id: string;
  anilist_id: number;
  title: AnimeTitle;
  cover_image: AnimeCover;
  format?: string;
  status?: string;
  genres?: string[];
  season?: string;
  season_year?: number;
  episodes?: number;
  duration?: string;
  subbed?: number;
  dubbed?: number;
  average_score?: number;
  popularity?: number;
  rating?: string;
  can_watch?: boolean;
  can_request?: boolean;
}

export interface AnimeSearchResponse {
  limit: number;
  offset: number;
  processing_ms: number;
  query: string;
  results: AnimeSearchResult[];
  total: number;
}

export interface AnimeInfo {
  anime_id: string;
  anilist_id?: number;

  title: AnimeTitle;
  cover_image: AnimeCover;

  format?: string;
  status?: string;
  genres?: string[];

  episodes?: number;
  description?: string;

  season?: string;
  season_year?: number;

  average_score?: number;
  popularity?: number;
  rating?: string;

  [key: string]: unknown;
}

export interface Episode {
  episodeId: string;
  episode_number: number;

  title?: string;
  title_japanese?: string;
  title_romanji?: string;

  duration?: number;

  playable: boolean;
  subbed: boolean;
  dubbed: boolean;

  thumbnail?: string;

  is_filler?: boolean;
  is_recap?: boolean;

  aired?: string;
  url?: string;

  [key: string]: unknown;
}

/*
 * ReAnime's episode endpoint can return slightly different
 * structures depending on the response.
 *
 * Our API service normalizes it into this interface.
 */
export interface EpisodesResponse {
  data: Episode[];

  limit?: number;
  offset?: number;
  total?: number;
  totalPages?: number;

  [key: string]: unknown;
}

export interface Server {
  $id: string;

  serverName: string;

  dataLink: string;

  /*
   * ReAnime currently returns:
   *
   * "sub"
   * "dub"
   */
  dataType: "sub" | "dub" | string;

  continue?: boolean;
  softsub?: boolean;
}

export interface ServersResponse {
  success: boolean;

  anime_id: string;

  anilist_id: number;

  episode: number;

  servers: Server[];
}

export interface StreamResponse {
  success: boolean;

  anime_id: string;

  anilist_id: number;

  episode: number;

  server: string;

  type: string;

  dataType: string;

  url: string;
}

export interface AnimeSeason {
  season_number: number;
  anime_id: string;
  anilist_id?: number;
  title: string;
  episode_count: number;
}

export interface SeasonsResponse {
  anime_id: string;
  seasons: AnimeSeason[];
}

export interface SeasonEpisodesResponse {
  anime_id: string;
  season_number: number;
  season_anime_id: string;
  episodes: Episode[];
}

export interface ScheduleEpisode {
  anime_id: string;
  anilist_id: number;

  title: AnimeTitle;
  cover_image: AnimeCover;

  episode_number: number;

  time: string;

  [key: string]: unknown;
}

export interface ScheduleDay {
  date: string;
  day: string;
  episodes: ScheduleEpisode[];
}

export interface ScheduleResponse {
  schedule: ScheduleDay[];

  timezone: string;

  week: number;

  week_start: string;
  week_end: string;

  year: number;
}


/* =========================================================
   API ERROR
   ========================================================= */

export class AnimeApiError extends Error {
  status: number;
  statusText: string;

  constructor(
    message: string,
    status: number,
    statusText: string
  ) {
    super(message);

    this.name = "AnimeApiError";

    this.status = status;
    this.statusText = statusText;
  }
}


/* =========================================================
   URL HELPER
   ========================================================= */

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>
) {
  const base = API_BASE_URL.replace(/\/+$/, "");

  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = new URL(
    `${base}${cleanPath}`
  );

  if (params) {
    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          url.searchParams.set(
            key,
            String(value)
          );
        }
      }
    );
  }

  return url.toString();
}


/* =========================================================
   FETCH HELPER
   ========================================================= */

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, string | number | undefined | null>
): Promise<T> {
  const url = buildUrl(
    path,
    params
  );

  const controller =
    new AbortController();

  const timeout = window.setTimeout(
    () => controller.abort(),
    30000
  );

  try {
    const response = await fetch(
      url,
      {
        ...options,

        signal:
          options.signal ??
          controller.signal,

        headers: {
          Accept:
            "application/json",

          ...(options.headers || {}),
        },
      }
    );

    if (!response.ok) {
      let message =
        `API Error: ${response.status} ${response.statusText}`;

      try {
        const error =
          await response.json();

        if (
          typeof error?.detail ===
          "string"
        ) {
          message =
            error.detail;
        }
      } catch {
        // Ignore invalid error JSON.
      }

      throw new AnimeApiError(
        message,
        response.status,
        response.statusText
      );
    }

    return await response.json();

  } catch (error) {
    console.error("fetchApi inner error:", error, "URL:", url);
    if (
      error instanceof AnimeApiError
    ) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "Anime API request timed out."
      );
    }

    throw new Error(
      `Unable to connect: ${error instanceof Error ? error.message : String(error)}`
    );

  } finally {
    window.clearTimeout(timeout);
  }
}


/* =========================================================
   API
   ========================================================= */

export const animeApi = {

  /*
   * Health
   */

  health: () =>
    fetchApi<{
      status: string;
      service: string;
      upstream: string;
    }>(
      "/health"
    ),


  /*
   * Search
   *
   * GET /search?q=naruto&limit=20&offset=0
   */

  search: (
    query: string,
    limit = 20,
    offset = 0
  ): Promise<AnimeSearchResponse> => {

    return fetchApi<AnimeSearchResponse>(
      "/search",
      {},
      {
        q: query,
        limit,
        offset,
      }
    );
  },


  /*
   * Anime information
   *
   * GET /info/{anime_id}
   */

  getAnimeInfo: (
    animeId: string
  ): Promise<AnimeInfo> => {

    return fetchApi<AnimeInfo>(
      `/info/${encodeURIComponent(animeId)}`
    );
  },


  getRecommendations: (
    animeId: string
  ): Promise<any> => {
    return fetchApi<any>(
      `/recommendations/${encodeURIComponent(animeId)}`
    );
  },

  /*
   * Episodes
   *
   * GET /episodes/{anime_id}?limit=2000
   */

  getEpisodes: async (
    animeId: string,
    limit = 2000
  ): Promise<EpisodesResponse> => {

    const response =
      await fetchApi<unknown>(
        `/episodes/${encodeURIComponent(animeId)}`,
        {},
        {
          limit,
        }
      );

    /*
     * Depending on the upstream response,
     * episodes may be returned directly as an array
     * or inside "data".
     */

    if (Array.isArray(response)) {
      return {
        data: response as Episode[],
      };
    }

    const object =
      response as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(object.data)
    ) {
      return {
        ...(object as Omit<
          EpisodesResponse,
          "data"
        >),
        data:
          object.data as Episode[],
      };
    }

    if (
      Array.isArray(object.episodes)
    ) {
      return {
        ...(object as Omit<
          EpisodesResponse,
          "data"
        >),
        data:
          object.episodes as Episode[],
      };
    }

    return {
      ...(object as Omit<
        EpisodesResponse,
        "data"
      >),
      data: [],
    };
  },


  /*
   * Servers
   *
   * GET
   * /servers/{anime_id}/{episode}?anilist_id=20
   */

  getServers: (
    animeId: string,
    episode: number | string,
    anilistId: number | string
  ): Promise<ServersResponse> => {

    return fetchApi<ServersResponse>(
      `/servers/${encodeURIComponent(animeId)}/${encodeURIComponent(String(episode))}`,
      {},
      {
        anilist_id: anilistId,
      }
    );
  },


  /*
   * Stream / playback handoff
   *
   * GET
   * /stream/{anime_id}/{episode}
   *
   * The API returns an authorized embed URL.
   */

  getStream: (
    animeId: string,
    episode: number | string,
    server: string,
    type: "sub" | "dub" | string,
    anilistId: number | string
  ): Promise<StreamResponse> => {

    return fetchApi<StreamResponse>(
      `/stream/${encodeURIComponent(animeId)}/${encodeURIComponent(String(episode))}`,
      {},
      {
        server,
        type,
        anilist_id: anilistId,
      }
    );
  },


  /*
   * Schedule
   *
   * GET
   * /schedule?tz=Asia/Calcutta&week=0
   */

  getSchedule: (
    tz = "Asia/Calcutta",
    week = 0
  ): Promise<ScheduleResponse> => {

    return fetchApi<ScheduleResponse>(
      "/schedule",
      {},
      {
        tz,
        week,
      }
    );
  },

  /*
   * Seasons
   *
   * GET
   * /seasons/{anime_id}
   */

  getSeasons: (animeId: string): Promise<SeasonsResponse> => {
    return fetchApi<SeasonsResponse>(
      `/seasons/${encodeURIComponent(animeId)}`
    );
  },

  /*
   * Season Episodes
   *
   * GET
   * /seasons/{anime_id}/{season_number}/episodes
   */

  getSeasonEpisodes: (
    animeId: string,
    seasonNumber: number | string
  ): Promise<SeasonEpisodesResponse> => {
    return fetchApi<SeasonEpisodesResponse>(
      `/seasons/${encodeURIComponent(animeId)}/${encodeURIComponent(String(seasonNumber))}/episodes`
    );
  },

  /*
   * Stream From Link
   *
   * GET
   * /stream/from-link?link=...
   */

  getStreamFromLink: (link: string): Promise<StreamResponse> => {
    return fetchApi<StreamResponse>(
      "/stream/from-link",
      {},
      {
        link,
      }
    );
  },
};


/* =========================================================
   EXPORT API BASE URL
   ========================================================= */

export {
  API_BASE_URL,
};
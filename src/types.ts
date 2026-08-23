export interface AnimeItem {
  id: string;
  title: string | { english?: string; romaji?: string; native?: string };
  image: string;
  cover?: string;
  rating?: number;
  type?: string;
  releaseDate?: string;
  description?: string;
  genres?: string[];
  totalEpisodes?: number;
  status?: string;
}

export interface AnimeDetails extends AnimeItem {
  episodes: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  title?: string;
  image?: string;
}

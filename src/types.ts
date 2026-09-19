export interface Episode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  duration?: number;
  playable?: boolean;
  subbed?: boolean;
  dubbed?: boolean;
}

export interface AnimeItem {
  id: string;
  anilist_id?: number;
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
  studio?: string;
  _reanimeSlug?: string;
  _reanimeConfigured?: boolean;
}

export const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60';
export const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80';



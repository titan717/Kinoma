export type ContentKind = 'movie' | 'series' | 'anime';

export interface ContentItem {
  id: string;
  title: string;
  type: ContentKind;
  meta?: string;
  image?: string;
  backdrop?: string;
  href?: string;
  tone?: 'rose' | 'violet' | 'blue' | 'amber' | 'pink' | 'slate';
}

/**
 * UI-facing content boundary.
 *
 * The Search page never talks to Jikan/AniList/MovieApi directly.
 * Replace these functions with MovieApi-backed implementations later.
 * Keeping the shape stable means the UI does not need another redesign.
 */
const TRENDING: ContentItem[] = [];

export const contentProvider = {
  getTrending: (): ContentItem[] => TRENDING,
  search: (_query: string): ContentItem[] => [],
};

export type KinomaContentProvider = typeof contentProvider;

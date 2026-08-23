export interface HistoryItem {
  animeId: string;
  slug: string;
  episodeId: string;
  episodeNumber: string;
  title: string;
  image: string;
  progress: number;
  duration: number;
  timestamp: number;
}

const HISTORY_KEY = 'animora_history';
const META_KEY = 'animora_meta_cache';

export const historyUtil = {
  getHistory: (): HistoryItem[] => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMeta: (slug: string, meta: { title: string; image: string; animeId: string }) => {
    try {
      const data = localStorage.getItem(META_KEY);
      const metas = data ? JSON.parse(data) : {};
      metas[slug] = meta;
      localStorage.setItem(META_KEY, JSON.stringify(metas));
    } catch (e) {
      console.error('Failed to save meta', e);
    }
  },

  getMeta: (slug: string) => {
    try {
      const data = localStorage.getItem(META_KEY);
      const metas = data ? JSON.parse(data) : {};
      return metas[slug] || null;
    } catch {
      return null;
    }
  },

  saveProgress: (slug: string, episodeId: string, episodeNumber: string, progress: number, duration: number) => {
    if (progress < 1 || duration < 1) return; // Ignore very early progress or missing duration
    
    try {
      const history = historyUtil.getHistory();
      const meta = historyUtil.getMeta(slug);
      if (!meta) return;

      const existingIndex = history.findIndex(h => h.slug === slug);
      
      const newItem: HistoryItem = {
        animeId: meta.animeId,
        slug,
        episodeId,
        episodeNumber,
        title: meta.title,
        image: meta.image,
        progress,
        duration,
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        history[existingIndex] = newItem;
      } else {
        history.push(newItem);
      }

      // Sort descending by timestamp and keep top 20
      history.sort((a, b) => b.timestamp - a.timestamp);
      const limitedHistory = history.slice(0, 20);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  },
  
  removeHistory: (slug: string) => {
    try {
      const history = historyUtil.getHistory();
      const filtered = history.filter(h => h.slug !== slug);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to remove history', e);
    }
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  }
};

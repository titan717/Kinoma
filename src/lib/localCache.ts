/**
 * Kinoma Local Storage & Memory Cache Manager
 * Provides durable client-side caching with TTL, quota management,
 * and instant synchronous rehydration for SWR and API calls.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
  version: number;
}

const CACHE_PREFIX = 'kinoma_cache_';
const CACHE_VERSION = 1;
const DEFAULT_TTL = 1000 * 60 * 30; // 30 minutes

// In-memory hot cache to prevent repeated JSON.parse overhead
const memoryCache = new Map<string, CacheEntry<any>>();

export const localCache = {
  /**
   * Retrieve cached item if valid and not expired
   */
  get: <T>(key: string): T | null => {
    // 1. Check memory cache first (instant)
    const memItem = memoryCache.get(key);
    if (memItem) {
      if (Date.now() - memItem.timestamp < memItem.ttl) {
        return memItem.data as T;
      }
      memoryCache.delete(key);
    }

    // 2. Check localStorage
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      if (!entry || entry.version !== CACHE_VERSION) {
        localStorage.removeItem(storageKey);
        return null;
      }

      // Check TTL expiration
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(storageKey);
        return null;
      }

      // Populate memory cache for subsequent instant lookups
      memoryCache.set(key, entry);
      return entry.data;
    } catch (e) {
      console.warn(`[LocalCache] Failed to read key: ${key}`, e);
      return null;
    }
  },

  /**
   * Save item to both memory and localStorage with TTL
   */
  set: <T>(key: string, data: T, ttl = DEFAULT_TTL): void => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: CACHE_VERSION
    };

    // Save to memory cache
    memoryCache.set(key, entry);

    // Save to localStorage with quota eviction handling
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (e) {
      // Storage quota exceeded: evict old cache entries
      console.warn(`[LocalCache] Storage quota reached, cleaning old cache entries...`);
      localCache.evictOldest(10);
      try {
        const storageKey = `${CACHE_PREFIX}${key}`;
        localStorage.setItem(storageKey, JSON.stringify(entry));
      } catch (retryErr) {
        console.warn(`[LocalCache] Unable to persist key to storage: ${key}`, retryErr);
      }
    }
  },

  /**
   * Has valid non-expired item
   */
  has: (key: string): boolean => {
    return localCache.get(key) !== null;
  },

  /**
   * Remove specific cache entry
   */
  remove: (key: string): void => {
    memoryCache.delete(key);
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch {}
  },

  /**
   * Fetch with cache-first and background revalidation
   */
  getOrFetch: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = DEFAULT_TTL
  ): Promise<T> => {
    const cached = localCache.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== undefined && fresh !== null) {
      localCache.set(key, fresh, ttl);
    }
    return fresh;
  },

  /**
   * Evict the oldest cache entries to free up localStorage space
   */
  evictOldest: (count = 10): void => {
    try {
      const cacheKeys: { key: string; timestamp: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              cacheKeys.push({ key, timestamp: parsed.timestamp || 0 });
            }
          } catch {
            cacheKeys.push({ key, timestamp: 0 });
          }
        }
      }

      // Sort oldest first
      cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = cacheKeys.slice(0, count);
      toRemove.forEach(item => {
        localStorage.removeItem(item.key);
        const memKey = item.key.replace(CACHE_PREFIX, '');
        memoryCache.delete(memKey);
      });
    } catch (e) {
      console.warn('[LocalCache] Eviction error:', e);
    }
  },

  /**
   * Clear all Kinoma API cache entries
   */
  clearAll: (): void => {
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[LocalCache] Clear error:', e);
    }
  },

  /**
   * Provide an SWR cache provider that syncs with localStorage
   */
  getSwrStorageProvider: () => {
    return () => {
      // Rehydrate SWR state from localStorage on init
      const map = new Map<string, any>();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${CACHE_PREFIX}swr_`)) {
            const swrKey = key.replace(`${CACHE_PREFIX}swr_`, '');
            const raw = localStorage.getItem(key);
            if (raw) {
              const entry = JSON.parse(raw);
              if (entry && Date.now() - entry.timestamp < entry.ttl) {
                map.set(swrKey, entry.data);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[LocalCache] SWR rehydration warning:', e);
      }

      // Return a Map-like interface for SWR
      return {
        get: (key: string) => map.get(key),
        set: (key: string, value: any) => {
          map.set(key, value);
          try {
            // Persist SWR cache keys
            const storageKey = `${CACHE_PREFIX}swr_${key}`;
            const entry = {
              data: value,
              timestamp: Date.now(),
              ttl: 1000 * 60 * 60 * 2, // 2 hours default for SWR cache
              version: CACHE_VERSION
            };
            localStorage.setItem(storageKey, JSON.stringify(entry));
          } catch {
            localCache.evictOldest(5);
          }
        },
        delete: (key: string) => {
          map.delete(key);
          try {
            localStorage.removeItem(`${CACHE_PREFIX}swr_${key}`);
          } catch {}
        },
        keys: () => map.keys()
      };
    };
  }
};

import { get, set, del } from 'idb-keyval';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = await get<CacheEntry<T>>(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
    await del(key);
    return null;
  }

  return entry.data;
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  await set(key, {
    data,
    timestamp: Date.now()
  });
}

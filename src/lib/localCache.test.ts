import { describe, expect, it, beforeEach } from 'vitest';
import { localCache } from './localCache';

function createStorage() {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    key(index: number) { return Array.from(data.keys())[index] ?? null; },
    getItem(key: string) { return data.get(key) ?? null; },
    setItem(key: string, value: string) { data.set(key, value); },
    removeItem(key: string) { data.delete(key); },
    clear() { data.clear(); },
  };
}

describe('localCache browser storage boundary', () => {
  beforeEach(() => {
    (globalThis as any).window = { localStorage: createStorage() };
    localCache.clearAll();
  });

  it('persists and restores a cache value without requiring a nested window object', () => {
    localCache.set('startup-test', { ok: true });
    expect(localCache.get<{ ok: boolean }>('startup-test')).toEqual({ ok: true });
    expect((globalThis as any).window.window).toBeUndefined();
  });

  it('creates a usable SWR provider when browser storage is available', () => {
    const provider = localCache.getSwrStorageProvider()();
    provider.set('home', { items: [1, 2] });
    expect(provider.get('home')).toEqual({ items: [1, 2] });
    expect(Array.from(provider.keys())).toContain('home');
    provider.delete('home');
    expect(provider.get('home')).toBeUndefined();
  });
});

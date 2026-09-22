import { AnimeItem } from '../types';

export function groupFranchises(items: AnimeItem[]): AnimeItem[] {
  if (!items || !Array.isArray(items)) return [];
  
  const franchiseMap = new Map<string, AnimeItem>();

  for (const item of items) {
    const rawTitle = typeof item.title === 'string'
      ? item.title
      : item.title?.english || item.title?.romaji || 'Unknown';

    // Normalize franchise name:
    let key = rawTitle
      .toLowerCase()
      .replace(/season\s*\d+/g, '')
      .replace(/\b(1st|2nd|3rd|4th|5th|final|season|part|ova|movie|special|vol\.?|tv)\b/g, '')
      .replace(/[ivxLCDM]+\b/g, '') // roman numerals
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (key.length < 2) {
      key = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    if (!franchiseMap.has(key)) {
      franchiseMap.set(key, item);
    } else {
      const existing = franchiseMap.get(key)!;
      const existingTitle = (typeof existing.title === 'string' ? existing.title : existing.title?.english || '').toLowerCase();
      
      const existingIsSeason = existingTitle.includes('season') || existingTitle.includes('part');
      const currentIsSeason = rawTitle.toLowerCase().includes('season') || rawTitle.toLowerCase().includes('part');

      if (existingIsSeason && !currentIsSeason) {
        franchiseMap.set(key, item);
      } else if (Number(item.rating || 0) > Number(existing.rating || 0)) {
        franchiseMap.set(key, item);
      }
    }
  }

  return Array.from(franchiseMap.values());
}

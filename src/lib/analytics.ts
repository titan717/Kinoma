import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export type AnalyticsEventType =
  | 'page_view'
  | 'watch_start'
  | 'watch_progress'
  | 'watch_complete'
  | 'search'
  | 'anime_open'
  | 'episode_start'
  | 'library_action'
  | 'error';

interface AnalyticsEvent {
  type: AnalyticsEventType;
  path?: string;
  animeId?: string;
  animeTitle?: string;
  episodeId?: string;
  episodeNumber?: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

let lastPageKey = '';

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await addDoc(collection(db, 'analytics_events'), {
      ...event,
      uid: auth.currentUser?.uid || 'anonymous',
      userEmail: auth.currentUser?.email || null,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent.slice(0, 500),
      createdAt: serverTimestamp(),
      clientTimestamp: Date.now()
    });
  } catch (error) {
    // Analytics must never break playback or navigation.
    console.warn('[Kinoma analytics]', error);
  }
}

export function trackPageView(path: string): void {
  if (!path || path === lastPageKey) return;
  lastPageKey = path;
  void trackEvent({ type: 'page_view', path });
}

export function getSessionId(): string {
  const key = 'kinoma_analytics_session';
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return `${Date.now()}`;
  }
}

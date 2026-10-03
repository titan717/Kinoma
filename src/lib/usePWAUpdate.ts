import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

let updateReady: (() => Promise<void>) | null = null;

export function usePWAUpdate() {
  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateReady = async () => {
          try {
            await updateSW(true);
          } finally {
            updateReady = null;
          }
        };
        window.dispatchEvent(new CustomEvent('panda_pwa_update_ready'));
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('panda_pwa_offline_ready'));
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        const refresh = () => registration.update().catch(() => undefined);
        window.setInterval(refresh, 60 * 60 * 1000);
      },
    });

    return () => {
      updateReady = null;
    };
  }, []);
}

export async function applyPWAUpdate() {
  if (updateReady) await updateReady();
}

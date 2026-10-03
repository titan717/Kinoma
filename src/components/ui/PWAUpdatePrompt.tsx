import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { applyPWAUpdate } from '../../lib/usePWAUpdate';

export function PWAUpdatePrompt() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener('panda_pwa_update_ready', show);
    return () => window.removeEventListener('panda_pwa_update_ready', show);
  }, []);

  if (!visible) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-[80] w-[min(420px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#171211]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,.5)] backdrop-blur-xl"
    >
      <button
        type="button"
        aria-label="Dismiss update notification"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c1935f]/20 bg-[#c1935f]/10">
          <RefreshCw className="h-4 w-4 text-[#d8b98f]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f6f2ee]">Panda.fun has been updated</p>
          <p className="mt-1 text-xs leading-5 text-[#aaa19b]">
            Refresh when you're ready. Your current screen won't be interrupted automatically.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={async () => {
          await applyPWAUpdate();
          setVisible(false);
        }}
        className="mt-3 w-full rounded-xl bg-[#e8d0c0] px-4 py-2.5 text-xs font-bold text-[#241714] transition hover:bg-[#f0ddd0]"
      >
        Update Panda.fun
      </button>
    </aside>
  );
}

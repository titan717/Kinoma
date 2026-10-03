import React from 'react';
import { Download, X, Share2 } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';

const DISMISS_KEY = 'panda_pwa_install_dismissed';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isInstalled) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // Storage can be unavailable in private/restricted browsing modes.
    }

    if (isInstallable || isIOS) {
      const timer = window.setTimeout(() => setVisible(true), 2200);
      return () => window.clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS]);

  if (!visible || isInstalled || (!isInstallable && !isIOS)) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore storage failures.
    }
  };

  const handleInstall = async () => {
    if (isIOS) return;
    await install();
    setVisible(false);
  };

  return (
    <aside
      role="dialog"
      aria-label="Install Panda.fun"
      className="fixed bottom-5 left-1/2 z-[80] w-[min(420px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#171211]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,.5)] backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c1935f]/20 bg-[#c1935f]/10">
          <Download className="h-5 w-5 text-[#d8b98f]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f6f2ee]">Take Panda.fun with you</p>
          <p className="mt-1 text-xs leading-5 text-[#aaa19b]">
            Install Panda.fun for a faster, app-like experience.
          </p>
        </div>
      </div>

      {isIOS ? (
        <div className="mt-3 rounded-xl border border-white/6 bg-white/[.035] px-3 py-2.5 text-xs leading-5 text-[#c8c0bb]">
          Tap <Share2 className="mx-1 inline h-3.5 w-3.5 align-[-2px]" /> Share, then choose
          <strong className="ml-1 text-[#f6f2ee]">Add to Home Screen</strong>.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full rounded-xl bg-[#e8d0c0] px-4 py-2.5 text-xs font-bold text-[#241714] transition hover:bg-[#f0ddd0] active:scale-[.99]"
        >
          Install Panda.fun
        </button>
      )}
    </aside>
  );
}

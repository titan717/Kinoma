import React, { useState } from 'react';

export function PandaStreamNotice() {
  const [shared, setShared] = useState(false);

  const sharePanda = async () => {
    const shareData = { title: 'panda.fun', text: '🐼 Enjoying the stream? Check out panda.fun!', url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    } catch {
      // Ignore cancelled native share dialogs.
    }
  };
  return (
    <section className="panda-stream-notice" aria-label="Stream notice and sharing">
      <div className="panda-stream-notice__panda" aria-hidden="true">
        <span className="panda-stream-notice__ear panda-stream-notice__ear--left" />
        <span className="panda-stream-notice__ear panda-stream-notice__ear--right" />
        <span className="panda-stream-notice__face">
          <i className="panda-stream-notice__eye panda-stream-notice__eye--left" />
          <i className="panda-stream-notice__eye panda-stream-notice__eye--right" />
          <b />
        </span>
        <span className="panda-stream-notice__body" />
        <span className="panda-stream-notice__paw panda-stream-notice__paw--left" />
        <span className="panda-stream-notice__paw panda-stream-notice__paw--right" />
      </div>

      <div className="panda-stream-notice__content">
        <div className="panda-stream-notice__caution">
          <span className="panda-stream-notice__icon">⚠️</span>
          <p><strong>Caution:</strong> The embedded player is heavily loaded with ads. It is strongly recommended to use an ad blocker extension or an ad-blocking browser like Brave to prevent intrusive ads and pop-ups.</p>
        </div>
        <div className="panda-stream-notice__share">
          <span className="panda-stream-notice__bamboo" aria-hidden="true">🎋</span>
          <div className="panda-stream-notice__share-copy"><p><strong>🐼 Enjoying the stream?</strong> Share <b>panda.fun</b> with your friends and spread the vibe!</p><button type="button" className="panda-stream-notice__share-button" onClick={sharePanda} aria-label="Share panda.fun">{shared ? '✓ Shared!' : '↗ Share'}</button></div>
        </div>
      </div>
    </section>
  );
}

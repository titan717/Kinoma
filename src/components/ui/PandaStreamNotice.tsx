import React, { useState } from 'react';
import { Copy, Instagram, MessageCircle, Send, X as XIcon } from 'lucide-react';

const SHARE_MESSAGE = `🐼 Hey! You’ve got to check this out! 🍿

I’ve been streaming on panda.fun and thought you’d love it too. Grab your favorite snacks, drop into the lounge, and let’s watch together! 🎋

🐾 Watch here: https://www.panda.fun`;

export function PandaStreamNotice() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard?.writeText(SHARE_MESSAGE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted browsers.
    }
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'panda.fun', text: SHARE_MESSAGE });
        setOpen(false);
      } else {
        await copyMessage();
      }
    } catch {
      // User cancelled the share sheet.
    }
  };

  const shareUrl = encodeURIComponent('https://www.panda.fun');
  const shareText = encodeURIComponent(SHARE_MESSAGE);

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
        <span className="panda-stream-notice__bamboo-stick">🎋</span>
      </div>

      <div className="panda-stream-notice__content">
        <div className="panda-stream-notice__caution">
          <span className="panda-stream-notice__icon">⚠️</span>
          <p><strong>Caution:</strong> The embedded player is heavily loaded with ads. It is strongly recommended to use an ad blocker extension or an ad-blocking browser like Brave to prevent intrusive ads and pop-ups.</p>
        </div>

        <div className="panda-stream-notice__share">
          <span className="panda-stream-notice__bamboo" aria-hidden="true">🎋</span>
          <div className="panda-stream-notice__share-copy">
            <p><strong>🐼 Enjoying the stream?</strong> Share <b>panda.fun</b> with your friends and spread the vibe!</p>
            <button type="button" className="panda-stream-notice__share-button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="dialog">
              {open ? 'Close' : 'Share'}
            </button>
          </div>

          {open && (
            <div className="panda-stream-notice__share-menu" role="dialog" aria-label="Share panda.fun">
              <div className="panda-stream-notice__share-menu-head">
                <strong>🐼 Share the Panda vibe</strong>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close share menu"><XIcon size={14} /></button>
              </div>
              <div className="panda-stream-notice__share-grid">
                <button type="button" className="panda-stream-notice__share-option" onClick={shareNative}><span>📱</span><span>Share</span></button>
                <a className="panda-stream-notice__share-option" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer"><span>💬</span><span>WhatsApp</span></a>
                <a className="panda-stream-notice__share-option" href={`https://x.com/intent/post?text=${shareText}`} target="_blank" rel="noreferrer"><span>𝕏</span><span>X</span></a>
                <a className="panda-stream-notice__share-option" href={`https://www.reddit.com/submit?url=${shareUrl}&title=${encodeURIComponent('🐼 Check out panda.fun!')}`} target="_blank" rel="noreferrer"><span>●</span><span>Reddit</span></a>
                <button type="button" className="panda-stream-notice__share-option" onClick={copyMessage}><Copy size={17} /><span>{copied ? 'Copied!' : 'Copy'}</span></button>
                <a className="panda-stream-notice__share-option" href="https://www.instagram.com/" target="_blank" rel="noreferrer" onClick={() => void copyMessage()}><Instagram size={17} /><span>Instagram</span></a>
                <a className="panda-stream-notice__share-option" href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer"><Send size={17} /><span>Telegram</span></a>
                <button type="button" className="panda-stream-notice__share-option" onClick={shareNative}><MessageCircle size={17} /><span>More apps</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

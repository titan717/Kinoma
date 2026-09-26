import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { updateSEO } from '../lib/seo';

export function Privacy() {
  useEffect(() => {
    updateSEO({ title: 'Privacy Policy', description: 'Read the Panda.fun Privacy Policy.', canonicalUrl: window.location.origin + '/privacy', type: 'website' });
  }, []);

  return (
    <main className="kinoma-simple-page">
      <article className="kinoma-simple-page__document">
        <div className="kinoma-simple-page__icon"><ShieldCheck size={20} /></div>
        <span className="kinoma-eyebrow">LEGAL</span>
        <h1>Privacy Policy</h1>
        <p>Panda.fun is designed to keep the experience focused. This page will contain the complete privacy notice as the account and MovieApi systems are finalised.</p>
        <p>Local preferences such as interface state and watch-list information may be stored by the application to provide the requested features. Third-party services may process information under their own policies.</p>
        <Link href="/home" className="kinoma-simple-page__button"><ArrowLeft size={15} /> Back home</Link>
      </article>
    </main>
  );
}

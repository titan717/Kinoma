import React, { useEffect } from 'react';
import { updateSEO } from '../lib/seo';

export function Home() {
  useEffect(() => {
    updateSEO({
      title: 'Home',
      description: 'Kinoma anime streaming home.',
      type: 'website',
    });
  }, []);

  return <section className="kinoma-empty-home" aria-label="Kinoma home" />;
}

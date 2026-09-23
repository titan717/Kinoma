import React, { useEffect } from 'react';
import { updateSEO } from '../lib/seo';

const HOME_BACKGROUND =
  'https://img.itch.zone/aW1nLzM4OTAwMzIuanBn/original/X6iAYm.jpg';

/** Homepage presentation shell; catalog data returns with the hero layer. */
export function Home() {
  useEffect(() => {
    updateSEO({
      title: 'Kinoma — Anime, Movies & Series',
      description: 'Discover anime, movies and series on Kinoma.',
      type: 'website'
    });
  }, []);

  return (
    <main
      id="kinoma-home"
      className="kinoma-home w-full flex-1 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${HOME_BACKGROUND}")` }}
      aria-label="Kinoma home"
    >
      {/* Cinematic hero/trailer mounts here in the next homepage layer. */}
    </main>
  );
}

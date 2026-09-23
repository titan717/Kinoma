import React from 'react';

const HOME_BACKGROUND =
  'https://img.itch.zone/aW1nLzM4OTAwMzIuanBn/original/X6iAYm.jpg';

export function Home() {
  return (
    <main
      className="w-full flex-1 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${HOME_BACKGROUND}")` }}
      aria-label="Kinoma home"
    />
  );
}

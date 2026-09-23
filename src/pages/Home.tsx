import React from 'react';

const HOME_BACKGROUND =
  'https://img.itch.zone/aW1hZ2UvNzA0MDYxLzM4ODk2OTIuanBn/original/aDdY1w.jpg';

export function Home() {
  return (
    <main
      className="w-full flex-1 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${HOME_BACKGROUND}")` }}
      aria-label="Kinoma home"
    />
  );
}

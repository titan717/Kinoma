import React from 'react';

export function PandaDialogue({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="panda-onboarding__dialogue">
      <span className="panda-onboarding__eyebrow">{eyebrow}</span>
      <h1 id="panda-onboarding-title">{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

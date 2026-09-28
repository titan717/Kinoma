import type { PandaAnimationState, PandaSceneEvent } from './pandaSceneTypes';

export function animationForEvent(event: PandaSceneEvent, reducedMotion = false): PandaAnimationState {
  if (reducedMotion) return event === 'exit' ? 'walk-out' : 'idle';

  switch (event) {
    case 'arrive': return 'walk-in';
    case 'recognize': return 'wave';
    case 'genre-select':
    case 'language-select': return 'react';
    case 'playback-toggle': return 'remote-interaction';
    case 'ready': return 'celebrate';
    case 'exit': return 'walk-out';
  }
}

export function createAnimationController(
  setState: (state: PandaAnimationState) => void,
  reducedMotion = false,
) {
  let current: PandaAnimationState = 'idle';
  return {
    get state() { return current; },
    play(event: PandaSceneEvent) {
      current = animationForEvent(event, reducedMotion);
      setState(current);
    },
  };
}

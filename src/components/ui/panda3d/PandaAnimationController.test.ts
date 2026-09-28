import { describe, expect, it } from 'vitest';
import { animationForEvent } from './PandaAnimationController';

describe('Panda animation mapping', () => {
  it('maps onboarding events to expressive animation states', () => {
    expect(animationForEvent('arrive')).toBe('walk-in');
    expect(animationForEvent('recognize')).toBe('wave');
    expect(animationForEvent('genre-select')).toBe('react');
    expect(animationForEvent('language-select')).toBe('react');
    expect(animationForEvent('playback-toggle')).toBe('remote-interaction');
    expect(animationForEvent('ready')).toBe('celebrate');
    expect(animationForEvent('exit')).toBe('walk-out');
  });

  it('keeps reduced-motion onboarding functional without continuous motion', () => {
    expect(animationForEvent('genre-select', true)).toBe('idle');
    expect(animationForEvent('exit', true)).toBe('walk-out');
  });
});

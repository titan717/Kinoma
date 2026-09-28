export type PandaSceneStage = 'welcome' | 'genres' | 'language' | 'playback' | 'ready' | 'exit';

export type PandaSceneEvent =
  | 'arrive'
  | 'recognize'
  | 'genre-select'
  | 'language-select'
  | 'playback-toggle'
  | 'ready'
  | 'exit';

export type PandaAnimationState =
  | 'idle'
  | 'walk-in'
  | 'recognize'
  | 'wave'
  | 'react'
  | 'remote-interaction'
  | 'celebrate'
  | 'walk-out';

export interface PandaSceneOptions {
  reducedMotion: boolean;
  pixelRatioCap: number;
  onReady: () => void;
  onError: (error: unknown) => void;
}

export interface PandaSceneController {
  play(event: PandaSceneEvent): void;
  dispose(): void;
  isDisposed(): boolean;
}

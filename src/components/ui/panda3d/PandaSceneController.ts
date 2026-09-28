import type { PandaSceneController, PandaSceneEvent, PandaSceneOptions } from './pandaSceneTypes';
import { createAnimationController } from './PandaAnimationController';

export function createPandaSceneController(
  options: PandaSceneOptions,
  setAnimation: (state: ReturnType<typeof createAnimationController>['state']) => void,
): PandaSceneController {
  let disposed = false;
  const animation = createAnimationController(setAnimation, options.reducedMotion);

  return {
    play(event: PandaSceneEvent) {
      if (disposed) return;
      animation.play(event);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
    },
    isDisposed() {
      return disposed;
    },
  };
}

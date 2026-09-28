import React, { useEffect, useRef } from 'react';
import type { PandaSceneEvent } from './pandaSceneTypes';

interface PandaSceneProps {
  event?: PandaSceneEvent;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

export function PandaScene({ event, reducedMotion = false, onReady, onError }: PandaSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<{ play: (event: PandaSceneEvent) => void; dispose: () => void } | null>(null);
  const callbacksRef = useRef({ onReady, onError });
  callbacksRef.current = { onReady, onError };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let runtime: { play: (event: PandaSceneEvent) => void; dispose: () => void } | null = null;

    import('./PandaSceneRuntime')
      .then(({ createPandaSceneRuntime }) => {
        if (disposed) return;
        runtime = createPandaSceneRuntime({
          mount,
          reducedMotion,
          onReady: () => callbacksRef.current.onReady?.(),
          onError: (error) => callbacksRef.current.onError?.(error),
        });
        runtimeRef.current = runtime;
        if (event) runtime.play(event);
      })
      .catch((error) => {
        if (!disposed) callbacksRef.current.onError?.(error);
      });

    return () => {
      disposed = true;
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
      runtime?.dispose();
      runtime = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (event) runtimeRef.current?.play(event);
  }, [event]);

  return <div ref={mountRef} className="panda-3d-scene" aria-hidden="true" />;
}

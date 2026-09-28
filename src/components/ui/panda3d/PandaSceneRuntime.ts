import * as THREE from 'three';
import { createPandaSceneController } from './PandaSceneController';
import { createPandaModel, type PandaRig } from './PandaModel';
import { createPandaEnvironment } from './PandaEnvironment';
import type { PandaAnimationState, PandaSceneEvent } from './pandaSceneTypes';

export interface PandaSceneRuntimeOptions {
  mount: HTMLDivElement;
  event?: PandaSceneEvent;
  reducedMotion: boolean;
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

export interface PandaSceneRuntimeHandle {
  play(event: PandaSceneEvent): void;
  dispose(): void;
}

export function createPandaSceneRuntime(options: PandaSceneRuntimeOptions): PandaSceneRuntimeHandle {
  const { mount, reducedMotion, onReady, onError } = options;
  let renderer: THREE.WebGLRenderer | null = null;
  let frame = 0;
  let disposed = false;
  let running = false;
  let rig: PandaRig | null = null;
  let pageHidden = document.hidden;
  let sceneVisible = true;
  let visibilityObserver: IntersectionObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const pointer = { x: 0, y: 0 };
  let walkOutStartedAt = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.75, 7.2);
  camera.lookAt(0, 1.55, 0);

  const cap = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1.25 : 1.75);

  renderer = new THREE.WebGLRenderer({
    antialias: !reducedMotion,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(cap);
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const environment = createPandaEnvironment(scene, reducedMotion);
  rig = createPandaModel();
  rig.root.position.set(-4.5, -0.45, 0);
  scene.add(rig.root);

  const stateRef = { current: 'idle' as PandaAnimationState };
  const controller = createPandaSceneController(
    { reducedMotion, pixelRatioCap: cap, onReady, onError },
    (next) => {
      stateRef.current = next;
      if (next === 'walk-out') walkOutStartedAt = performance.now();
    },
  );

  const handlePointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
  };

  const handleVisibility = () => {
    pageHidden = document.hidden;
    syncLoop();
  };

  const handleIntersection = ([entry]: IntersectionObserverEntry[]) => {
    sceneVisible = entry?.isIntersecting ?? true;
    syncLoop();
  };

  const resize = () => {
    if (!renderer || disposed) return;
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const animate = () => {
    if (disposed || !renderer || !rig || !running) return;

    const elapsed = performance.now() / 1000;
    const state = stateRef.current;

    if (state === 'walk-out' && elapsed * 1000 - walkOutStartedAt >= 650) {
      rig.root.position.x = 4.8;
    }

    if (!reducedMotion) {
      const targetX = state === 'walk-out' ? 4.8 : 0;
      const xEase = state === 'walk-out' ? 0.11 : state === 'walk-in' ? 0.075 : 0.035;
      rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, targetX, xEase);

      const bob = Math.sin(elapsed * 2.2) * 0.035;
      rig.root.position.y = -0.45 + bob;
      rig.root.rotation.y = state === 'celebrate'
        ? Math.sin(elapsed * 4) * 0.12
        : Math.sin(elapsed * 0.45) * 0.035;

      if (state === 'wave') {
        rig.rightArm.rotation.z = -0.8 + Math.sin(elapsed * 7) * 0.25;
      } else if (state === 'remote-interaction') {
        rig.rightArm.rotation.z = -0.55 + Math.sin(elapsed * 8) * 0.08;
      } else {
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.28, 0.12);
      }

      if (state === 'react') {
        rig.head.rotation.z = Math.sin(elapsed * 4) * 0.08;
        rig.head.rotation.y = Math.sin(elapsed * 2.5) * 0.1;
      } else {
        rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, 0, 0.08);
        rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, 0, 0.08);
      }

      if (state === 'remote-interaction') {
        rig.remote.rotation.z = -0.25 + Math.sin(elapsed * 8) * 0.12;
      } else {
        rig.remote.rotation.z = THREE.MathUtils.lerp(rig.remote.rotation.z, -0.25, 0.12);
      }

      const blinkPhase = elapsed % 3.6;
      const blinking = blinkPhase > 3.35 && blinkPhase < 3.52;
      const eyeScale = blinking ? 0.16 : 1;
      rig.leftEye.scale.y = eyeScale;
      rig.rightEye.scale.y = eyeScale;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * -0.35, 0.025);
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        1.75 + pointer.y * -0.08 + Math.sin(elapsed * 0.22) * 0.025,
        0.025,
      );

      environment.leaves.children.forEach((leaf) => {
        leaf.position.y -= (leaf.userData.speed as number) * 0.003;
        leaf.rotation.z += 0.002;
        if (leaf.position.y < -0.5) leaf.position.y = 4.2;
      });
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };

  function syncLoop() {
    if (disposed) return;
    const shouldRun = !pageHidden && sceneVisible;
    if (shouldRun && !running) {
      running = true;
      frame = requestAnimationFrame(animate);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  try {
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    visibilityObserver = new IntersectionObserver(handleIntersection, { threshold: 0.01 });
    visibilityObserver.observe(mount);
    window.addEventListener('pointermove', handlePointer, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    onReady?.();
    controller.play('arrive');
    if (options.event) controller.play(options.event);
    syncLoop();
  } catch (error) {
    onError?.(error);
  }

  return {
    play(event: PandaSceneEvent) {
      if (disposed) return;
      controller.play(event);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      window.removeEventListener('pointermove', handlePointer);
      document.removeEventListener('visibilitychange', handleVisibility);
      controller.dispose();

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      renderer = null;
      rig = null;
    },
  };
}

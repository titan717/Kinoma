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
  let stateStartedAt = performance.now();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 1.7, 7.5);
  camera.lookAt(0, 1.45, 0);

  const cap = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1.25 : 1.75);
  renderer = new THREE.WebGLRenderer({ antialias: !reducedMotion, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(cap);
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const environment = createPandaEnvironment(scene, reducedMotion);
  rig = createPandaModel();
  rig.root.position.set(-5.8, -0.45, 0);
  rig.root.rotation.y = -0.22;
  rig.root.scale.setScalar(0.94);
  scene.add(rig.root);

  const stateRef = { current: 'idle' as PandaAnimationState };
  const controller = createPandaSceneController(
    { reducedMotion, pixelRatioCap: cap, onReady, onError },
    (next) => {
      stateRef.current = next;
      stateStartedAt = performance.now();
      if (next === 'walk-out') walkOutStartedAt = performance.now();
    },
  );

  const handlePointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
  };

  const handleVisibility = () => { pageHidden = document.hidden; syncLoop(); };
  const handleIntersection = ([entry]: IntersectionObserverEntry[]) => { sceneVisible = entry?.isIntersecting ?? true; syncLoop(); };

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
    const t = (performance.now() - stateStartedAt) / 1000;
    const smooth = (value: number) => THREE.MathUtils.smoothstep(Math.min(Math.max(value, 0), 1), 0, 1);

    if (!reducedMotion) {
      // Cinematic idle: breathing, tiny weight shifts, eye blinks and curious head motion.
      const breath = Math.sin(elapsed * 1.7) * 0.028;
      rig.body.scale.y = 1 + breath;
      rig.root.position.y = -0.45 + Math.sin(elapsed * 2.1) * 0.018;
      rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, pointer.x * 0.08 + Math.sin(elapsed * 0.7) * 0.035, 0.055);
      rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, pointer.y * -0.025, 0.055);

      if (state === 'walk-in') {
        const p = smooth(t / 1.55);
        rig.root.position.x = THREE.MathUtils.lerp(-5.8, -0.05, p);
        rig.root.rotation.y = THREE.MathUtils.lerp(-0.22, 0, p);
        const stride = Math.sin(t * 10) * 0.16 * (1 - p * 0.7);
        rig.leftLeg.rotation.z = stride;
        rig.rightLeg.rotation.z = -stride;
        rig.leftArm.rotation.z = 0.28 - stride * 0.65;
        rig.rightArm.rotation.z = -0.28 + stride * 0.65;
        if (t > 1.52) {
          rig.leftLeg.rotation.z = THREE.MathUtils.lerp(rig.leftLeg.rotation.z, 0, 0.12);
          rig.rightLeg.rotation.z = THREE.MathUtils.lerp(rig.rightLeg.rotation.z, 0, 0.12);
        }
      } else if (state === 'wave') {
        rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, 0, 0.1);
        rig.rightArm.rotation.z = -0.95 + Math.sin(t * 8.5) * 0.3;
        rig.rightArm.rotation.x = Math.sin(t * 4.2) * 0.08;
        rig.head.rotation.z = Math.sin(t * 2.6) * 0.035;
      } else if (state === 'react') {
        rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, 0, 0.08);
        const nod = Math.sin(t * 4.5) * Math.max(0, 1 - t * 0.55);
        rig.head.rotation.x = nod * 0.13;
        rig.leftEar.rotation.z = Math.sin(t * 6) * 0.07;
        rig.rightEar.rotation.z = -Math.sin(t * 6) * 0.07;
      } else if (state === 'remote-interaction') {
        rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, 0, 0.08);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.58, 0.1);
        rig.remote.rotation.z = -0.25 + Math.sin(t * 8) * 0.16;
        rig.remote.rotation.y = Math.sin(t * 5) * 0.12;
        rig.head.rotation.x = Math.sin(t * 3.8) * 0.045;
      } else if (state === 'celebrate') {
        rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, 0, 0.1);
        const hop = Math.abs(Math.sin(t * 4.2)) * 0.13;
        rig.root.position.y = -0.45 + hop;
        rig.leftArm.rotation.z = 0.45 + Math.sin(t * 7) * 0.16;
        rig.rightArm.rotation.z = -0.45 - Math.sin(t * 7) * 0.16;
        rig.head.rotation.z = Math.sin(t * 5) * 0.045;
      } else if (state === 'walk-out') {
        const p = smooth(t / 1.35);
        rig.root.position.x = THREE.MathUtils.lerp(0, 5.9, p);
        rig.root.rotation.y = THREE.MathUtils.lerp(0, 0.24, p);
        const stride = Math.sin(t * 10) * 0.16;
        rig.leftLeg.rotation.z = stride;
        rig.rightLeg.rotation.z = -stride;
        rig.leftArm.rotation.z = 0.28 - stride * 0.65;
        rig.rightArm.rotation.z = -0.28 + stride * 0.65;
        rig.root.rotation.z = Math.sin(t * 5) * 0.018;
        if (t > 1.15) rig.root.scale.setScalar(THREE.MathUtils.lerp(0.94, 0.72, smooth((t - 1.15) / 0.3)));
      } else {
        rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, 0, 0.05);
        rig.root.rotation.y = THREE.MathUtils.lerp(rig.root.rotation.y, 0, 0.06);
        rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.28, 0.06);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.28, 0.06);
        rig.leftLeg.rotation.z = THREE.MathUtils.lerp(rig.leftLeg.rotation.z, 0, 0.08);
        rig.rightLeg.rotation.z = THREE.MathUtils.lerp(rig.rightLeg.rotation.z, 0, 0.08);
      }

      const blinkPhase = elapsed % 4.1;
      const blinking = blinkPhase > 3.72 && blinkPhase < 3.87;
      const eyeScale = blinking ? 0.12 : 1;
      rig.leftEye.scale.y = eyeScale;
      rig.rightEye.scale.y = eyeScale;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * -0.28, 0.025);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7 + pointer.y * -0.06, 0.025);

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
    if (shouldRun && !running) { running = true; frame = requestAnimationFrame(animate); }
    else if (!shouldRun && running) { running = false; cancelAnimationFrame(frame); frame = 0; }
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
    if (options.event && options.event !== 'arrive') controller.play(options.event);
    syncLoop();
  } catch (error) { onError?.(error); }

  return {
    play(event: PandaSceneEvent) { if (!disposed) controller.play(event); },
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

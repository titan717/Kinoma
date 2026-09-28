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
  let stateStartedAt = performance.now();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 1.7, 7.5);
  camera.lookAt(0, 1.45, 0);

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
      if (rig) {
        rig.root.rotation.z = 0;
        rig.root.scale.setScalar(0.94);
      }
    },
  );

  const handlePointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
  };

  const handleVisibility = () => { pageHidden = document.hidden; syncLoop(); };
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

    const now = performance.now();
    const elapsed = now / 1000;
    const state = stateRef.current;
    const t = (now - stateStartedAt) / 1000;
    const smooth = (value: number) => THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(value, 0, 1), 0, 1);

    if (!reducedMotion) {
      const walkCycle = Math.sin(t * 7.0);
      const walkCycleOpposite = Math.sin(t * 7.0 + Math.PI);
      const breath = Math.sin(elapsed * 1.55) * 0.022;

      // Body mechanics stay subtle: breathing and a controlled center-of-mass shift.
      rig.body.scale.y = 1 + breath;
      rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, Math.sin(elapsed * 1.05) * 0.018, 0.045);

      if (state === 'walk-in' || state === 'walk-out') {
        const entering = state === 'walk-in';
        const duration = entering ? 1.85 : 1.65;
        const progress = smooth(t / duration);
        const fromX = entering ? -5.8 : 0;
        const toX = entering ? 0 : 6.1;
        const eased = entering ? progress * progress * (3 - 2 * progress) : progress;

        rig.root.position.x = THREE.MathUtils.lerp(fromX, toX, eased);
        // Keep the feet on the floor: the body rises and falls from a planted contact point,
        // rather than translating the whole character up and down like a floating sprite.
        const strideBounce = Math.abs(Math.sin(t * 3.5)) * 0.012;
        rig.root.position.y = -0.45 + strideBounce;
        rig.root.position.z = Math.sin(progress * Math.PI) * 0.22;
        rig.root.rotation.y = THREE.MathUtils.lerp(entering ? -0.24 : 0, entering ? 0 : 0.3, eased);
        rig.root.rotation.z = Math.sin(t * 4.4) * 0.012;

        // Alternating feet, hips and arms create a readable four-beat walking rhythm.
        const stride = Math.sin(t * 7.0);
        // Hips drive the legs; the ankle/foot follows with a small heel-to-toe roll.
        rig.leftLeg.rotation.z = stride * 0.16;
        rig.rightLeg.rotation.z = -stride * 0.16;
        rig.leftFootPivot.rotation.z = -Math.max(0, stride) * 0.11;
        rig.rightFootPivot.rotation.z = -Math.max(0, -stride) * 0.11;
        rig.leftFoot.rotation.z = 0;
        rig.rightFoot.rotation.z = 0;
        rig.leftArm.rotation.z = 0.20 - stride * 0.13;
        rig.rightArm.rotation.z = -0.20 - stride * 0.13;
        // The head leads the body with a natural look-around and follows the pointer.
        rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, pointer.x * 0.24 + Math.sin(t * 1.4) * 0.045, 0.075);
        rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, pointer.y * -0.07 + Math.sin(t * 1.1) * 0.018, 0.075);

        if (!entering && progress > 0.76) {
          const fadeScale = THREE.MathUtils.lerp(0.94, 0.72, smooth((progress - 0.76) / 0.24));
          rig.root.scale.setScalar(fadeScale);
        }
      } else {
        rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, 0, 0.07);
        rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, -0.45, 0.1);
        rig.root.position.z = THREE.MathUtils.lerp(rig.root.position.z, 0, 0.08);
        rig.root.rotation.y = THREE.MathUtils.lerp(rig.root.rotation.y, 0, 0.07);
        rig.root.rotation.z = THREE.MathUtils.lerp(rig.root.rotation.z, 0, 0.08);

        // The head leads attention while the ears follow a fraction later.
        rig.head.rotation.y = THREE.MathUtils.lerp(
          rig.head.rotation.y,
          pointer.x * 0.24 + Math.sin(elapsed * 0.72) * 0.028,
          0.07,
        );
        rig.head.rotation.x = THREE.MathUtils.lerp(
          rig.head.rotation.x,
          pointer.y * -0.07,
          0.07,
        );
        rig.leftEar.rotation.z = THREE.MathUtils.lerp(
          rig.leftEar.rotation.z,
          -pointer.x * 0.055 + Math.sin(elapsed * 1.2) * 0.018,
          0.045,
        );
        rig.rightEar.rotation.z = THREE.MathUtils.lerp(
          rig.rightEar.rotation.z,
          -pointer.x * 0.055 - Math.sin(elapsed * 1.2) * 0.018,
          0.045,
        );
      }

      if (state === 'wave') {
        const settle = smooth(t / 0.22);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(-0.25, -1.02, settle) + Math.sin(t * 7.5) * 0.12;
        rig.rightArm.rotation.x = Math.sin(t * 3.7) * 0.06;
        rig.head.rotation.z = Math.sin(t * 2.4) * 0.035;
      } else if (state === 'react') {
        const anticipation = smooth(t / 0.18);
        const settle = 1 - smooth(Math.max(t - 0.35, 0) / 0.75);
        rig.head.rotation.x = Math.sin(t * 5.2) * 0.10 * settle * anticipation;
        rig.head.rotation.z = Math.sin(t * 3.1) * 0.025 * settle;
        rig.leftEar.rotation.z = Math.sin(t * 6.2) * 0.075 * settle;
        rig.rightEar.rotation.z = -Math.sin(t * 6.2) * 0.075 * settle;
        rig.body.rotation.z = Math.sin(t * 3.1) * 0.025 * settle;
      } else if (state === 'remote-interaction') {
        const reach = smooth(t / 0.3);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(-0.25, -0.68, reach);
        rig.rightArm.rotation.x = -0.18 * reach;
        rig.remote.rotation.z = -0.25 + Math.sin(t * 8.5) * 0.12;
        rig.remote.rotation.y = Math.sin(t * 5.5) * 0.08;
        rig.head.rotation.x = Math.sin(t * 3.8) * 0.045;
      } else if (state === 'celebrate') {
        const hop = Math.pow(Math.abs(Math.sin(t * 3.7)), 1.8) * 0.14;
        rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, -0.45 + hop, 0.18);
        rig.leftArm.rotation.z = 0.46 + Math.sin(t * 6.8) * 0.18;
        rig.rightArm.rotation.z = -0.46 - Math.sin(t * 6.8) * 0.18;
        rig.leftEar.rotation.z = Math.sin(t * 7) * 0.055;
        rig.rightEar.rotation.z = -Math.sin(t * 7) * 0.055;
        rig.head.rotation.z = Math.sin(t * 4.8) * 0.04;
      }

      // Organic blink timing, with slight pupil movement so the face never feels frozen.
      const blinkPhase = elapsed % 4.3;
      const blinking = blinkPhase > 3.84 && blinkPhase < 3.98;
      const eyeScale = blinking ? 0.08 : 1;
      rig.leftEye.scale.y = THREE.MathUtils.lerp(rig.leftEye.scale.y, eyeScale, 0.55);
      rig.rightEye.scale.y = THREE.MathUtils.lerp(rig.rightEye.scale.y, eyeScale, 0.55);
      const pupilX = pointer.x * 0.035;
      rig.leftEye.position.x = -0.34 + pupilX;
      rig.rightEye.position.x = 0.34 + pupilX;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * -0.25, 0.025);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7 + pointer.y * -0.055, 0.025);

      environment.leaves.children.forEach((leaf) => {
        const data = leaf.userData as { baseRotation?: number; sway?: number; phase?: number };
        const phase = data.phase ?? 0;
        const sway = data.sway ?? 0.014;
        leaf.rotation.z = (data.baseRotation ?? leaf.rotation.z) + Math.sin(elapsed * 1.15 + phase) * sway;
        leaf.position.x += Math.sin(elapsed * 0.22 + phase) * 0.0007;
      });

      environment.mist.children.forEach((cloud) => {
        const data = cloud.userData as { speed?: number; phase?: number };
        cloud.position.x += (data.speed ?? 0.001) * 0.45;
        cloud.position.y += Math.sin(elapsed * 0.35 + (data.phase ?? 0)) * 0.00035;
        if (cloud.position.x > 6.5) cloud.position.x = -6.5;
      });

      environment.particles.children.forEach((particle) => {
        const data = particle.userData as { speed?: number; phase?: number };
        particle.position.y += data.speed ?? 0.0015;
        particle.position.x += Math.sin(elapsed * 0.7 + (data.phase ?? 0)) * 0.0008;
        if (particle.position.y > 4.2) particle.position.y = -0.2;
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
    if (options.event && options.event !== 'arrive') controller.play(options.event);
    syncLoop();
  } catch (error) {
    onError?.(error);
  }

  return {
    play(event: PandaSceneEvent) {
      if (!disposed) controller.play(event);
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

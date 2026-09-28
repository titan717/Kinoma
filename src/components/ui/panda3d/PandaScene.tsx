import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPandaSceneController } from './PandaSceneController';
import { createPandaModel, type PandaRig } from './PandaModel';
import { createPandaEnvironment } from './PandaEnvironment';
import type { PandaAnimationState, PandaSceneEvent } from './pandaSceneTypes';

interface PandaSceneProps {
  event?: PandaSceneEvent;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

export function PandaScene({ event, reducedMotion = false, onReady, onError }: PandaSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createPandaSceneController> | null>(null);
  const stateRef = useRef<PandaAnimationState>('idle');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frame = 0;
    let disposed = false;
    let rig: PandaRig | null = null;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 1.75, 7.2);
      camera.lookAt(0, 1.55, 0);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      const cap = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1.25 : 1.75);
      renderer.setPixelRatio(cap);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const environment = createPandaEnvironment(scene, reducedMotion);
      rig = createPandaModel();
      rig.root.position.set(-4.5, -0.45, 0);
      scene.add(rig.root);

      const resize = () => {
        if (!renderer || !mount) return;
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(mount);

      const controller = createPandaSceneController(
        {
          reducedMotion,
          pixelRatioCap: cap,
          onReady: () => onReady?.(),
          onError: (error) => onError?.(error),
        },
        (next) => { stateRef.current = next; },
      );
      controllerRef.current = controller;
      controller.play('arrive');

      const clock = new THREE.Clock();
      let lastBlink = 0;
      let blinkUntil = 0;

      const animate = () => {
        if (disposed || !renderer || !rig) return;
        const elapsed = clock.getElapsedTime();
        const state = stateRef.current;

        if (!reducedMotion) {
          const targetX = state === 'walk-out' ? 4.8 : 0;
          rig.root.position.x = THREE.MathUtils.lerp(rig.root.position.x, targetX, state === 'walk-out' ? 0.018 : 0.035);

          const bob = Math.sin(elapsed * 2.2) * 0.035;
          rig.root.position.y = -0.45 + bob;
          rig.root.rotation.y = state === 'celebrate'
            ? Math.sin(elapsed * 4) * 0.12
            : Math.sin(elapsed * 0.45) * 0.035;

          if (state === 'wave') {
            rig.rightArm.rotation.z = -0.8 + Math.sin(elapsed * 7) * 0.25;
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
            rig.rightArm.rotation.z = -0.55 + Math.sin(elapsed * 8) * 0.08;
          } else {
            rig.remote.rotation.z = THREE.MathUtils.lerp(rig.remote.rotation.z, -0.25, 0.12);
          }

          if (elapsed - lastBlink > 3.2) {
            lastBlink = elapsed;
            blinkUntil = elapsed + 0.16;
          }
          const blinking = elapsed < blinkUntil;
          const eyeScale = blinking ? 0.16 : 1;
          rig.leftEye.scale.y = eyeScale;
          rig.rightEye.scale.y = eyeScale;

          const mouseX = (mount.clientWidth ? (window.innerWidth / 2 - window.innerWidth * 0.22) / Math.max(window.innerWidth, 1) : 0);
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * -0.55, 0.025);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.75 + Math.sin(elapsed * 0.22) * 0.025, 0.025);

          environment.leaves.children.forEach((leaf) => {
            leaf.position.y -= (leaf.userData.speed as number) * 0.003;
            leaf.rotation.z += 0.002;
            if (leaf.position.y < -0.5) leaf.position.y = 4.2;
          });
        }

        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        controller.dispose();
        controllerRef.current = null;
        scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch (error) {
      onError?.(error);
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    }
  }, [reducedMotion, onError, onReady]);

  useEffect(() => {
    if (event) controllerRef.current?.play(event);
  }, [event]);

  return <div ref={mountRef} className="panda-3d-scene" aria-hidden="true" />;
}

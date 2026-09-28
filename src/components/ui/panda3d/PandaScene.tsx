import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPandaSceneController } from './PandaSceneController';
import type { PandaAnimationState, PandaSceneEvent } from './pandaSceneTypes';

interface PandaSceneProps {
  event?: PandaSceneEvent;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

function makePanda() {
  const root = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x111217, roughness: 0.78, metalness: 0.02 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f1e9, roughness: 0.7 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.35 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x91c96a, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 24), black);
  body.scale.set(1, 1.08, 0.82); body.position.y = 1.25; root.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.83, 32, 24), white);
  belly.scale.set(1, 1.08, 0.38); belly.position.set(0, 1.25, 0.68); root.add(belly);

  const head = new THREE.Group(); head.position.y = 2.55; root.add(head);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), black); headMesh.scale.set(1.05, 0.96, 0.88); head.add(headMesh);

  for (const x of [-0.55, 0.55]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), black);
    ear.position.set(x, 0.72, 0); head.add(ear);
  }

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), white);
  muzzle.scale.set(1.05, 0.78, 0.7); muzzle.position.set(0, -0.1, 0.78); head.add(muzzle);

  for (const x of [-0.34, 0.34]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), white);
    eyeWhite.scale.set(0.82, 1.2, 0.55); eyeWhite.position.set(x, 0.18, 0.82); head.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), eye);
    pupil.position.set(x, 0.18, 1.04); head.add(pupil);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), eye);
  nose.position.set(0, -0.03, 1.22); head.add(nose);

  for (const x of [-0.72, 0.72]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.72, 8, 16), black);
    arm.rotation.z = x < 0 ? 0.28 : -0.28; arm.position.set(x, 1.22, 0.02); root.add(arm);
  }

  for (const x of [-0.48, 0.48]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.72, 8, 16), black);
    leg.position.set(x, 0.2, 0); root.add(leg);
  }

  const remote = new THREE.Group();
  const remoteBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.12), accent);
  remoteBody.position.y = -0.04; remote.add(remoteBody);
  remote.position.set(0.88, 1.02, 0.52); remote.rotation.z = -0.25; root.add(remote);

  root.userData.head = head;
  root.userData.remote = remote;
  root.userData.ears = head.children.filter((child) => child !== muzzle && child.position.y > 0.5);
  return root;
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

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 1.75, 7.2);
      camera.lookAt(0, 1.55, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      const cap = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1.25 : 1.75);
      renderer.setPixelRatio(cap);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xe9f5ff, 0x080a08, 2.1));
      const key = new THREE.DirectionalLight(0xd9f1c5, 2.4); key.position.set(-3, 6, 5); scene.add(key);
      const rim = new THREE.PointLight(0x87b86c, 2.2, 8); rim.position.set(3, 2.5, -1); scene.add(rim);

      const panda = makePanda();
      panda.position.y = -0.45;
      scene.add(panda);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.2, 48),
        new THREE.MeshBasicMaterial({ color: 0x0a0d0b, transparent: true, opacity: 0.55 }),
      );
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.42; floor.scale.set(1.3, 0.55, 1); scene.add(floor);

      const leaves = new THREE.Group();
      const leafMaterial = new THREE.MeshBasicMaterial({ color: 0x9acb72, transparent: true, opacity: 0.42 });
      for (let i = 0; i < 14; i += 1) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.22), leafMaterial);
        leaf.position.set((Math.random() - 0.5) * 7, Math.random() * 4, (Math.random() - 0.5) * 2);
        leaf.rotation.z = Math.random() * Math.PI;
        leaf.userData.speed = 0.15 + Math.random() * 0.25;
        leaves.add(leaf);
      }
      scene.add(leaves);

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
        { reducedMotion, pixelRatioCap: cap, onReady: () => onReady?.(), onError: (error) => onError?.(error) },
        (next) => { stateRef.current = next; },
      );
      controllerRef.current = controller;

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed || !renderer) return;
        const elapsed = clock.getElapsedTime();
        const state = stateRef.current;
        if (!reducedMotion) {
          panda.position.x = state === 'walk-in' ? THREE.MathUtils.lerp(panda.position.x, 0, 0.035) : panda.position.x;
          if (state === 'walk-in' && Math.abs(panda.position.x) < 0.02) panda.position.x = 0;
          const bob = Math.sin(elapsed * 2.2) * 0.035;
          panda.position.y = -0.45 + bob;
          panda.rotation.y = Math.sin(elapsed * 0.45) * 0.035;
          const head = panda.userData.head as THREE.Group;
          head.rotation.z = state === 'recognize' ? Math.sin(elapsed * 2.1) * 0.07 : head.rotation.z * 0.92;
          if (state === 'wave') {
            const arm = panda.children[5] as THREE.Mesh;
            if (arm) arm.rotation.z = -0.8 + Math.sin(elapsed * 7) * 0.25;
          }
          const remote = panda.userData.remote as THREE.Group;
          remote.rotation.z = state === 'remote-interaction' ? -0.25 + Math.sin(elapsed * 8) * 0.12 : -0.25;
          if (state === 'celebrate') panda.rotation.y = Math.sin(elapsed * 4) * 0.12;
          if (state === 'walk-out') panda.position.x = THREE.MathUtils.lerp(panda.position.x, 4.2, 0.018);
          leaves.children.forEach((leaf) => {
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
      return () => { disposed = true; cancelAnimationFrame(frame); renderer?.dispose(); renderer?.domElement.remove(); };
    }
  }, [reducedMotion, onError, onReady]);

  useEffect(() => {
    if (!event) return;
    controllerRef.current?.play(event);
  }, [event]);

  return <div ref={mountRef} className="panda-3d-scene" aria-hidden="true" />;
}

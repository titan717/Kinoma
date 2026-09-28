import * as THREE from 'three';

export function createPandaEnvironment(scene: THREE.Scene, reducedMotion: boolean) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(8, 64),
    new THREE.MeshStandardMaterial({ color: 0x101811, roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.46;
  ground.scale.set(1.35, 0.72, 1);
  scene.add(ground);

  const clearing = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 48),
    new THREE.MeshBasicMaterial({ color: 0x172219, transparent: true, opacity: 0.55 }),
  );
  clearing.rotation.x = -Math.PI / 2;
  clearing.position.y = -0.455;
  clearing.scale.set(1.25, 0.62, 1);
  scene.add(clearing);

  const bamboo = new THREE.Group();
  const stalkMaterial = new THREE.MeshStandardMaterial({ color: 0x263f2d, roughness: 0.94 });
  const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0x385b3e, roughness: 0.9 });
  const stalks = [-4.8, -4.15, -3.55, -2.95, 2.95, 3.55, 4.15, 4.8];

  stalks.forEach((x, index) => {
    const height = 4.2 + (index % 3) * 0.45;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, height, 10), stalkMaterial);
    stalk.position.set(x, height / 2 - 0.46, -1.9 - (index % 2) * 0.35);
    stalk.rotation.z = (index % 2 ? 1 : -1) * (0.035 + (index % 3) * 0.018);
    bamboo.add(stalk);

    for (let node = 0; node < 4; node += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 6, 14), nodeMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(
        x,
        -0.46 + 0.55 + node * (height / 4.4),
        stalk.position.z,
      );
      bamboo.add(ring);
    }
  });
  scene.add(bamboo);

  const foliage = new THREE.Group();
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x4f754c,
    roughness: 0.9,
    transparent: true,
    opacity: 0.76,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 34; i += 1) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.52), leafMaterial);
    const side = i % 2 === 0 ? -1 : 1;
    leaf.position.set(
      side * (2.4 + (i % 7) * 0.42),
      0.2 + (i % 6) * 0.62,
      -1.3 - (i % 5) * 0.45,
    );
    leaf.rotation.set(0.18 * Math.sin(i), side * 0.25, i * 0.47);
    leaf.userData = {
      baseRotation: leaf.rotation.z,
      sway: 0.012 + (i % 4) * 0.004,
      phase: i * 0.43,
      speed: 0.015 + (i % 4) * 0.005,
    };
    foliage.add(leaf);
  }
  scene.add(foliage);

  const mist = new THREE.Group();
  const mistMaterial = new THREE.MeshBasicMaterial({
    color: 0x91aa91,
    transparent: true,
    opacity: reducedMotion ? 0.025 : 0.055,
    depthWrite: false,
  });
  for (let i = 0; i < 7; i += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.55 + (i % 3) * 0.25, 16, 12), mistMaterial);
    cloud.scale.set(2.1, 0.34, 0.8);
    cloud.position.set((i - 3) * 1.65, -0.05 + (i % 2) * 0.45, -2.2 - (i % 3) * 0.35);
    cloud.userData = { speed: 0.0009 + (i % 3) * 0.00025, phase: i * 0.8 };
    mist.add(cloud);
  }
  scene.add(mist);

  const particles = new THREE.Group();
  if (!reducedMotion) {
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xc5d7a7,
      transparent: true,
      opacity: 0.35,
    });
    for (let i = 0; i < 22; i += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (i % 3) * 0.008, 8, 8), particleMaterial);
      particle.position.set(
        (i % 11 - 5) * 0.55,
        0.15 + (i % 8) * 0.43,
        -0.8 - (i % 5) * 0.35,
      );
      particle.userData = { speed: 0.0015 + (i % 4) * 0.0005, phase: i * 0.6 };
      particles.add(particle);
    }
    scene.add(particles);
  }

  scene.add(new THREE.HemisphereLight(0xc9dbc7, 0x080c09, 1.75));

  const key = new THREE.DirectionalLight(0xe4efd9, 2.25);
  key.position.set(-4, 6, 5);
  scene.add(key);

  const rim = new THREE.PointLight(0x7da66d, 1.8, 10);
  rim.position.set(3, 2.8, -2);
  scene.add(rim);

  const warm = new THREE.PointLight(0xb8c88b, 0.8, 7);
  warm.position.set(-2, 1.8, 1);
  scene.add(warm);

  return { floor: ground, bamboo, leaves: foliage, mist, particles };
}

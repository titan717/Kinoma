import * as THREE from 'three';

export function createPandaEnvironment(scene: THREE.Scene, reducedMotion: boolean) {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 40),
    new THREE.MeshBasicMaterial({ color: 0x0a0d0b, transparent: true, opacity: 0.55 }),
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.42; floor.scale.set(1.3, 0.55, 1); scene.add(floor);

  const bamboo = new THREE.Group();
  const stalkMaterial = new THREE.MeshStandardMaterial({ color: 0x31523a, roughness: 0.9 });
  for (const x of [-3.4, -2.9, 3.0, 3.5]) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.6, 8), stalkMaterial);
    stalk.position.set(x, 1.5, -1.4); stalk.rotation.z = x < 0 ? -0.08 : 0.08; bamboo.add(stalk);
  }
  scene.add(bamboo);

  const leaves = new THREE.Group();
  if (!reducedMotion) {
    const material = new THREE.MeshBasicMaterial({ color: 0x9acb72, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
    for (let i = 0; i < 14; i += 1) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.22), material);
      leaf.position.set((i % 7 - 3) * 1.1, 0.8 + (i % 5) * 0.65, -0.3 - (i % 3));
      leaf.rotation.z = i * 0.7;
      leaf.userData.speed = 0.15 + (i % 4) * 0.04;
      leaves.add(leaf);
    }
    scene.add(leaves);
  }

  scene.add(new THREE.HemisphereLight(0xe9f5ff, 0x080a08, 2.1));
  const key = new THREE.DirectionalLight(0xd9f1c5, 2.4); key.position.set(-3, 6, 5); scene.add(key);
  const rim = new THREE.PointLight(0x87b86c, 2.2, 8); rim.position.set(3, 2.5, -1); scene.add(rim);

  return { floor, bamboo, leaves };
}

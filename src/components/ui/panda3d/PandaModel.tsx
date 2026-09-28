import * as THREE from 'three';

export interface PandaRig {
  root: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  remote: THREE.Group;
}

export function createPandaModel(): PandaRig {
  const root = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x111217, roughness: 0.78 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f1e9, roughness: 0.7 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.35 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x91c96a, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.18, 28, 20), black);
  body.scale.set(1, 1.08, 0.82); body.position.y = 1.25; root.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.83, 28, 20), white);
  belly.scale.set(1, 1.08, 0.38); belly.position.set(0, 1.25, 0.68); root.add(belly);

  const head = new THREE.Group(); head.position.y = 2.55; root.add(head);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 20), black);
  headMesh.scale.set(1.05, 0.96, 0.88); head.add(headMesh);

  for (const x of [-0.55, 0.55]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), black);
    ear.position.set(x, 0.72, 0); head.add(ear);
  }

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 14), white);
  muzzle.scale.set(1.05, 0.78, 0.7); muzzle.position.set(0, -0.1, 0.78); head.add(muzzle);

  const eyes: THREE.Mesh[] = [];
  for (const x of [-0.34, 0.34]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), white);
    eyeWhite.scale.set(0.82, 1.2, 0.55); eyeWhite.position.set(x, 0.18, 0.82); head.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), eye);
    pupil.position.set(x, 0.18, 1.04); head.add(pupil); eyes.push(pupil);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), eye);
  nose.position.set(0, -0.03, 1.22); head.add(nose);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.72, 7, 14), black);
  leftArm.rotation.z = 0.28; leftArm.position.set(-0.72, 1.22, 0.02); root.add(leftArm);
  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.72, 7, 14), black);
  rightArm.rotation.z = -0.28; rightArm.position.set(0.72, 1.22, 0.02); root.add(rightArm);

  for (const x of [-0.48, 0.48]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.72, 7, 14), black);
    leg.position.set(x, 0.2, 0); root.add(leg);
  }

  const remote = new THREE.Group();
  const remoteBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.12), accent);
  remoteBody.position.y = -0.04; remote.add(remoteBody);
  remote.position.set(0.88, 1.02, 0.52); remote.rotation.z = -0.25; root.add(remote);

  return { root, head, leftArm, rightArm, leftEye: eyes[0], rightEye: eyes[1], remote };
}

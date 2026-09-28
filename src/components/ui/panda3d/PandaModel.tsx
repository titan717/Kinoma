import * as THREE from 'three';

export interface PandaRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftEar: THREE.Mesh;
  rightEar: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  remote: THREE.Group;
}

export function createPandaModel(): PandaRig {
  const root = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x111217, roughness: 0.68, metalness: 0.02 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f1e8, roughness: 0.62 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.28 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x8fbe67, roughness: 0.48 });

  const body = new THREE.Group();
  body.position.y = 1.28;
  root.add(body);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 24), black);
  torso.scale.set(0.96, 1.08, 0.82);
  body.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.83, 28, 20), white);
  belly.scale.set(1, 1.08, 0.38);
  belly.position.set(0, -0.02, 0.68);
  body.add(belly);

  const head = new THREE.Group();
  head.position.y = 2.55;
  root.add(head);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), black);
  headMesh.scale.set(1.05, 0.96, 0.88);
  head.add(headMesh);

  const ears: THREE.Mesh[] = [];
  for (const x of [-0.56, 0.56]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), black);
    ear.position.set(x, 0.72, 0);
    head.add(ear);
    ears.push(ear);
  }

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), white);
  muzzle.scale.set(1.05, 0.78, 0.7);
  muzzle.position.set(0, -0.1, 0.78);
  head.add(muzzle);

  const eyes: THREE.Mesh[] = [];
  for (const x of [-0.34, 0.34]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), white);
    eyeWhite.scale.set(0.82, 1.2, 0.55);
    eyeWhite.position.set(x, 0.18, 0.82);
    head.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), eye);
    pupil.position.set(x, 0.18, 1.04);
    head.add(pupil);
    eyes.push(pupil);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), eye);
  nose.position.set(0, -0.03, 1.22);
  head.add(nose);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.74, 8, 16), black);
  leftArm.position.set(-0.78, 1.2, 0.02);
  leftArm.rotation.z = 0.28;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.74, 8, 16), black);
  rightArm.position.set(0.78, 1.2, 0.02);
  rightArm.rotation.z = -0.28;
  root.add(rightArm);

  const legs: THREE.Mesh[] = [];
  for (const x of [-0.46, 0.46]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.72, 8, 16), black);
    leg.position.set(x, 0.2, 0);
    root.add(leg);
    legs.push(leg);
  }

  const remote = new THREE.Group();
  const remoteBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.12), accent);
  remoteBody.position.y = -0.04;
  remote.add(remoteBody);
  remote.position.set(0.92, 1.05, 0.55);
  remote.rotation.z = -0.25;
  root.add(remote);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg: legs[0],
    rightLeg: legs[1],
    leftEar: ears[0],
    rightEar: ears[1],
    leftEye: eyes[0],
    rightEye: eyes[1],
    remote,
  };
}

import * as THREE from 'three';

export interface PandaRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  leftFootPivot: THREE.Group;
  rightFootPivot: THREE.Group;
  leftEar: THREE.Mesh;
  rightEar: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftEyePatch: THREE.Mesh;
  rightEyePatch: THREE.Mesh;
  remote: THREE.Group;
}

export function createPandaModel(): PandaRig {
  const root = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x111217, roughness: 0.72, metalness: 0.01 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.58 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x030405, roughness: 0.22 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x8fbe67, roughness: 0.5 });

  const body = new THREE.Group();
  body.position.y = 1.32;
  root.add(body);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.18, 40, 28), black);
  torso.scale.set(0.96, 1.08, 0.82);
  body.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 24), white);
  chest.scale.set(1, 1.12, 0.42);
  chest.position.set(0, 0.02, 0.67);
  body.add(chest);

  const head = new THREE.Group();
  head.position.y = 2.56;
  root.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 28), black);
  headMesh.scale.set(1.05, 0.97, 0.88);
  head.add(headMesh);

  const ears: THREE.Mesh[] = [];
  for (const x of [-0.56, 0.56]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 20), black);
    ear.position.set(x, 0.72, 0);
    head.add(ear);
    ears.push(ear);
  }

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 20), white);
  muzzle.scale.set(1.05, 0.78, 0.7);
  muzzle.position.set(0, -0.1, 0.78);
  head.add(muzzle);

  const eyes: THREE.Mesh[] = [];
  const eyePatches: THREE.Mesh[] = [];
  for (const x of [-0.34, 0.34]) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.29, 24, 18), black);
    patch.scale.set(0.8, 1.16, 0.32);
    patch.rotation.z = x < 0 ? -0.18 : 0.18;
    patch.position.set(x, 0.18, 0.79);
    head.add(patch);
    eyePatches.push(patch);

    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), white);
    eyeWhite.scale.set(0.82, 1.18, 0.5);
    eyeWhite.position.set(x, 0.18, 1.02);
    head.add(eyeWhite);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 14), eye);
    pupil.position.set(x, 0.18, 1.105);
    head.add(pupil);
    eyes.push(pupil);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), eye);
  nose.scale.set(1.15, 0.82, 0.85);
  nose.position.set(0, -0.03, 1.25);
  head.add(nose);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 24, Math.PI), eye);
  mouth.rotation.x = Math.PI;
  mouth.position.set(0, -0.18, 1.235);
  head.add(mouth);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.72, 10, 18), black);
  leftArm.position.set(-0.79, 1.18, 0.03);
  leftArm.rotation.z = 0.28;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.72, 10, 18), black);
  rightArm.position.set(0.79, 1.18, 0.03);
  rightArm.rotation.z = -0.28;
  root.add(rightArm);

  const legs: THREE.Mesh[] = [];
  const feet: THREE.Mesh[] = [];
  const footPivots: THREE.Group[] = [];
  for (const x of [-0.46, 0.46]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.28, 0.03);
    root.add(pivot);
    footPivots.push(pivot);

    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.72, 10, 18), black);
    leg.position.set(0, -0.06, 0);
    pivot.add(leg);
    legs.push(leg);

    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), black);
    foot.scale.set(1.15, 0.62, 1.35);
    foot.position.set(0, -0.46, 0.18);
    pivot.add(foot);
    feet.push(foot);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), white);
  tail.position.set(0, 1.02, -0.78);
  root.add(tail);

  const remote = new THREE.Group();
  const remoteBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.12), accent);
  remoteBody.position.y = -0.04;
  remote.add(remoteBody);
  remote.position.set(0.92, 1.05, 0.55);
  remote.rotation.z = -0.25;
  root.add(remote);

  return {
    root, body, head,
    leftArm, rightArm,
    leftLeg: legs[0], rightLeg: legs[1],
    leftFoot: feet[0], rightFoot: feet[1],
    leftFootPivot: footPivots[0], rightFootPivot: footPivots[1],
    leftEar: ears[0], rightEar: ears[1],
    leftEye: eyes[0], rightEye: eyes[1],
    leftEyePatch: eyePatches[0], rightEyePatch: eyePatches[1],
    remote,
  };
}

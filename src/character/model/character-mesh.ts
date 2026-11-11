import * as THREE from 'three';

export type MovementMode = 'foot' | 'bicycle' | 'motorcycle' | 'car' | 'boat';

export interface CharacterRigs {
  root: THREE.Group;
  container: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shadow: THREE.Mesh;
  vehicles: {
    bicycle: THREE.Group;
    motorcycle: THREE.Group;
    car: THREE.Group;
    boat: THREE.Group;
  };
}

/**
 * Creates an authentic 3D Cartoon / Chibi Explorer Character (Animal Crossing / Fall Guys aesthetic).
 * Uses soft rounded shapes, glossy cartoon eyes, blush cheeks, and cute mountable mini vehicles.
 */
export function createCharacterMesh(): CharacterRigs {
  const root = new THREE.Group();
  root.name = 'character-root';

  const container = new THREE.Group();
  container.name = 'character-container';
  root.add(container);

  // --- Cartoon Palette with Soft Ambient Glow ---
  const skinMaterial = new THREE.MeshLambertMaterial({
    color: 0xffdfba,
    emissive: 0x5a3622,
    emissiveIntensity: 0.25
  });
  const hoodieMaterial = new THREE.MeshLambertMaterial({
    color: 0x06b6d4, // Bright cartoon cyan
    emissive: 0x0891b2,
    emissiveIntensity: 0.35
  });
  const pantsMaterial = new THREE.MeshLambertMaterial({
    color: 0x1e293b, // Cartoon dark denim
    emissive: 0x0f172a,
    emissiveIntensity: 0.2
  });
  const shoesMaterial = new THREE.MeshLambertMaterial({
    color: 0xf97316, // Orange sneakers
    emissive: 0xc2410c,
    emissiveIntensity: 0.3
  });
  const capMaterial = new THREE.MeshLambertMaterial({
    color: 0xf59e0b, // Warm golden yellow
    emissive: 0xd97706,
    emissiveIntensity: 0.35
  });
  const backpackMaterial = new THREE.MeshLambertMaterial({
    color: 0xf43f5e, // Coral pink backpack
    emissive: 0xbe123c,
    emissiveIntensity: 0.35
  });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeGlintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushMaterial = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.7 });
  const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x94a3b8, emissive: 0x475569, emissiveIntensity: 0.2 });
  const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const vehicleBodyRed = new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.35 });
  const vehicleBodyYellow = new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.35 });
  const vehicleBodyCyan = new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 });
  const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // --- Soft Cartoon Ground Shadow ---
  const shadowGeometry = new THREE.CircleGeometry(0.35, 20);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.position.set(0, 0.02, 0);
  container.add(shadow);

  // --- Torso (Rounded Cartoon Body) ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.65, 0);
  container.add(torsoGroup);

  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.50, 16), hoodieMaterial);
  torsoMesh.position.set(0, 0.25, 0);
  torsoGroup.add(torsoMesh);

  // Cute backpack
  const backpackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.16), backpackMaterial);
  backpackMesh.position.set(0, 0.26, -0.18);
  torsoGroup.add(backpackMesh);

  // --- Head Group (Big Cute Cartoon Head) ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.54, 0);
  torsoGroup.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), skinMaterial);
  headMesh.position.set(0, 0.18, 0);
  headGroup.add(headMesh);

  // Cartoon Cap
  const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMaterial);
  capMesh.position.set(0, 0.19, 0);
  headGroup.add(capMesh);

  // Cap Visor
  const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.14), capMaterial);
  visorMesh.position.set(0, 0.24, 0.20);
  headGroup.add(visorMesh);

  // Glossy Cartoon Eyes
  const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.10, 0.18, 0.23);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.10, 0.18, 0.23);
  headGroup.add(leftEye);
  headGroup.add(rightEye);

  // Cute reflection glints
  const glintGeo = new THREE.SphereGeometry(0.016, 6, 6);
  const leftGlint = new THREE.Mesh(glintGeo, eyeGlintMaterial);
  leftGlint.position.set(-0.085, 0.20, 0.26);
  const rightGlint = new THREE.Mesh(glintGeo, eyeGlintMaterial);
  rightGlint.position.set(0.115, 0.20, 0.26);
  headGroup.add(leftGlint);
  headGroup.add(rightGlint);

  // Cute Blush Cheeks
  const blushGeo = new THREE.CircleGeometry(0.04, 12);
  const leftBlush = new THREE.Mesh(blushGeo, blushMaterial);
  leftBlush.position.set(-0.13, 0.12, 0.23);
  leftBlush.rotation.y = -0.3;
  const rightBlush = new THREE.Mesh(blushGeo, blushMaterial);
  rightBlush.position.set(0.13, 0.12, 0.23);
  rightBlush.rotation.y = 0.3;
  headGroup.add(leftBlush);
  headGroup.add(rightBlush);

  // --- Left Arm ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.44, 0);
  torsoGroup.add(leftArm);
  const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.38, 12), hoodieMaterial);
  armMesh.position.set(0, -0.18, 0);
  leftArm.add(armMesh);
  const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMaterial);
  handMesh.position.set(0, -0.36, 0);
  leftArm.add(handMesh);

  // --- Right Arm ---
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.44, 0);
  torsoGroup.add(rightArm);
  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.38, 12), hoodieMaterial);
  rightArmMesh.position.set(0, -0.18, 0);
  rightArm.add(rightArmMesh);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMaterial);
  rightHand.position.set(0, -0.36, 0);
  rightArm.add(rightHand);

  // --- Left Leg ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.65, 0);
  container.add(leftLeg);
  const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.44, 12), pantsMaterial);
  legMesh.position.set(0, -0.22, 0);
  leftLeg.add(legMesh);
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.20), shoesMaterial);
  leftShoe.position.set(0, -0.44, 0.04);
  leftLeg.add(leftShoe);

  // --- Right Leg ---
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.65, 0);
  container.add(rightLeg);
  const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.44, 12), pantsMaterial);
  rightLegMesh.position.set(0, -0.22, 0);
  rightLeg.add(rightLegMesh);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.20), shoesMaterial);
  rightShoe.position.set(0, -0.44, 0.04);
  rightLeg.add(rightShoe);

  // ==========================================
  // --- MINI CARTOON VEHICLES ---
  // ==========================================

  // 1. Mini Bici
  const bicycleGroup = new THREE.Group();
  bicycleGroup.visible = false;
  container.add(bicycleGroup);
  const bikeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.85), vehicleBodyCyan);
  bikeFrame.position.set(0, 0.35, 0);
  bicycleGroup.add(bikeFrame);
  const bikeWheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 14);
  bikeWheelGeo.rotateZ(Math.PI / 2);
  const bWheelF = new THREE.Mesh(bikeWheelGeo, wheelMaterial);
  bWheelF.position.set(0, 0.24, 0.42);
  bicycleGroup.add(bWheelF);
  const bWheelB = new THREE.Mesh(bikeWheelGeo, wheelMaterial);
  bWheelB.position.set(0, 0.24, -0.42);
  bicycleGroup.add(bWheelB);
  const bHandlebar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.06), metalMaterial);
  bHandlebar.position.set(0, 0.60, 0.30);
  bicycleGroup.add(bHandlebar);

  // 2. Mini Moto Vespa
  const motoGroup = new THREE.Group();
  motoGroup.visible = false;
  container.add(motoGroup);
  const motoBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.40, 0.95), vehicleBodyRed);
  motoBody.position.set(0, 0.35, 0);
  motoGroup.add(motoBody);
  const motoSeat = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.12, 0.45), wheelMaterial);
  motoSeat.position.set(0, 0.52, -0.10);
  motoGroup.add(motoSeat);
  const motoWheelGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.10, 14);
  motoWheelGeo.rotateZ(Math.PI / 2);
  const mWheelF = new THREE.Mesh(motoWheelGeo, wheelMaterial);
  mWheelF.position.set(0, 0.20, 0.45);
  motoGroup.add(mWheelF);
  const mWheelB = new THREE.Mesh(motoWheelGeo, wheelMaterial);
  mWheelB.position.set(0, 0.20, -0.45);
  motoGroup.add(mWheelB);
  const mLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), headlightMaterial);
  mLight.position.set(0, 0.54, 0.50);
  motoGroup.add(mLight);
  const mHandle = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.06), metalMaterial);
  mHandle.position.set(0, 0.65, 0.32);
  motoGroup.add(mHandle);

  // 3. Mini Carro Kart
  const carGroup = new THREE.Group();
  carGroup.visible = false;
  container.add(carGroup);
  const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.36, 1.25), vehicleBodyYellow);
  carBody.position.set(0, 0.28, 0);
  carGroup.add(carBody);
  const carShield = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.24, 0.05),
    new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 })
  );
  carShield.position.set(0, 0.54, 0.22);
  carShield.rotation.x = -0.25;
  carGroup.add(carShield);
  const carWheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 14);
  carWheelGeo.rotateZ(Math.PI / 2);
  const cWFL = new THREE.Mesh(carWheelGeo, wheelMaterial);
  cWFL.position.set(-0.42, 0.18, 0.40);
  carGroup.add(cWFL);
  const cWFR = new THREE.Mesh(carWheelGeo, wheelMaterial);
  cWFR.position.set(0.42, 0.18, 0.40);
  carGroup.add(cWFR);
  const cWBL = new THREE.Mesh(carWheelGeo, wheelMaterial);
  cWBL.position.set(-0.42, 0.18, -0.40);
  carGroup.add(cWBL);
  const cWBR = new THREE.Mesh(carWheelGeo, wheelMaterial);
  cWBR.position.set(0.42, 0.18, -0.40);
  carGroup.add(cWBR);

  // 4. Mini Lancha / Barco Motorizado
  const boatGroup = new THREE.Group();
  boatGroup.visible = false;
  container.add(boatGroup);

  const boatHull = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.36, 1.45),
    new THREE.MeshLambertMaterial({ color: 0xf8fafc, emissive: 0x0284c7, emissiveIntensity: 0.25 })
  );
  boatHull.position.set(0, 0.24, 0);
  boatGroup.add(boatHull);

  const boatDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 1.25),
    new THREE.MeshLambertMaterial({ color: 0x1e3a8a, emissive: 0x172554, emissiveIntensity: 0.2 })
  );
  boatDeck.position.set(0, 0.38, -0.05);
  boatGroup.add(boatDeck);

  const redStripe = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.06, 1.47), vehicleBodyRed);
  redStripe.position.set(0, 0.18, 0);
  boatGroup.add(redStripe);

  const boatWindshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.24, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.75 })
  );
  boatWindshield.position.set(0, 0.54, 0.30);
  boatWindshield.rotation.x = -0.3;
  boatGroup.add(boatWindshield);

  const boatMotor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.40, 0.22), wheelMaterial);
  boatMotor.position.set(0, 0.32, -0.80);
  boatGroup.add(boatMotor);

  const buoyGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 16);
  const buoyMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const buoyMesh = new THREE.Mesh(buoyGeo, buoyMat);
  buoyMesh.position.set(0.44, 0.30, 0.10);
  buoyMesh.rotation.y = Math.PI / 2;
  boatGroup.add(buoyMesh);

  // Water Wake Foam
  const wakeGeo = new THREE.RingGeometry(0.40, 0.65, 16);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide
  });
  const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat);
  wakeMesh.position.set(0, 0.01, -0.75);
  boatGroup.add(wakeMesh);

  // Frustum culling disabled
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.frustumCulled = false;
    }
  });

  return {
    root,
    container,
    torso: torsoGroup,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    shadow,
    vehicles: {
      bicycle: bicycleGroup,
      motorcycle: motoGroup,
      car: carGroup,
      boat: boatGroup
    }
  };
}

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
  accessories: {
    phone: THREE.Group;
    coffee: THREE.Group;
    flashlight: THREE.Group;
    skateboard: THREE.Group;
  };
  carWheels: THREE.Mesh[];
  carLights?: THREE.PointLight;
  carBrakeLights?: THREE.Mesh[];
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
  container.scale.set(1.85, 1.85, 1.85); // Roblox Brookhaven style: prominent, clearly visible avatar
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
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMaterial);
  leftHand.position.set(0, -0.36, 0);
  leftArm.add(leftHand);

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
  // --- HAND-HELD ACCESSORIES (ROBLOX HOTBAR) ---
  // ==========================================

  // 1. Smartphone (Right Hand)
  const phoneGroup = new THREE.Group();
  phoneGroup.visible = false;
  rightHand.add(phoneGroup);
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.16, 0.015),
    new THREE.MeshLambertMaterial({ color: 0x0f172a })
  );
  phoneBody.position.set(0.04, -0.02, 0.08);
  phoneBody.rotation.x = -Math.PI / 4;
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  phoneScreen.position.set(0, 0, 0.009);
  phoneBody.add(phoneScreen);
  phoneGroup.add(phoneBody);

  // 2. Coffee Cup (Left Hand)
  const coffeeGroup = new THREE.Group();
  coffeeGroup.visible = false;
  leftHand.add(coffeeGroup);
  const cupGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.14, 12);
  const cupMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const cupMesh = new THREE.Mesh(cupGeo, cupMat);
  cupMesh.position.set(-0.02, -0.06, 0.08);
  const sleeveGeo = new THREE.CylinderGeometry(0.051, 0.045, 0.06, 12);
  const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
  cupMesh.add(sleeveMesh);
  const lidGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.02, 12);
  const lidMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.position.y = 0.075;
  cupMesh.add(lidMesh);
  coffeeGroup.add(cupMesh);

  // 3. Flashlight (Right Hand)
  const flashlightGroup = new THREE.Group();
  flashlightGroup.visible = false;
  rightHand.add(flashlightGroup);
  const torchBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.20, 10),
    new THREE.MeshLambertMaterial({ color: 0x1e293b })
  );
  torchBody.position.set(0.04, -0.04, 0.12);
  torchBody.rotation.x = Math.PI / 2;
  const torchLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.042, 10),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb })
  );
  torchLens.position.set(0, 0.101, 0);
  torchLens.rotation.x = -Math.PI / 2;
  torchBody.add(torchLens);
  flashlightGroup.add(torchBody);

  // 4. Skateboard (Under Feet)
  const skateboardGroup = new THREE.Group();
  skateboardGroup.visible = false;
  container.add(skateboardGroup);
  const deckMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.035, 1.05),
    new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.2 })
  );
  deckMesh.position.set(0, 0.08, 0);
  skateboardGroup.add(deckMesh);
  const sWheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.045, 10);
  sWheelGeo.rotateZ(Math.PI / 2);
  const sWheelMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });
  [[-0.15, 0.045, 0.35], [0.15, 0.045, 0.35], [-0.15, 0.045, -0.35], [0.15, 0.045, -0.35]].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(sWheelGeo, sWheelMat);
    w.position.set(x, y, z);
    skateboardGroup.add(w);
  });

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

  // 3. Convertible Deportivo Estilo Roblox
  const carGroup = new THREE.Group();
  carGroup.visible = false;
  container.add(carGroup);

  const sportsRed = new THREE.MeshLambertMaterial({
    color: 0xef4444, // Bright Ferrari Red
    emissive: 0x991b1b,
    emissiveIntensity: 0.35
  });
  const sportsBlack = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const rimSilver = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
  const tireRubber = new THREE.MeshLambertMaterial({ color: 0x18181b });

  // Aerodynamic main chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 2.05), sportsRed);
  chassis.position.set(0, 0.28, 0);
  carGroup.add(chassis);

  // Black Racing Stripes & Hood Scoop
  const hoodScoop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.65), sportsBlack);
  hoodScoop.position.set(0, 0.45, 0.45);
  carGroup.add(hoodScoop);

  // Front splitter & black bumper
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.12, 0.25), sportsBlack);
  frontBumper.position.set(0, 0.16, 1.02);
  carGroup.add(frontBumper);

  // Curved Tinted Windshield
  const carWindshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.32, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
  );
  carWindshield.position.set(0, 0.56, 0.22);
  carWindshield.rotation.x = -0.38;
  carGroup.add(carWindshield);

  // Dual Racing Bucket Seats
  const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), sportsBlack);
  seatL.position.set(-0.24, 0.38, -0.20);
  carGroup.add(seatL);
  const headrestL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.12), sportsRed);
  headrestL.position.set(-0.24, 0.60, -0.32);
  carGroup.add(headrestL);

  const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), sportsBlack);
  seatR.position.set(0.24, 0.38, -0.20);
  carGroup.add(seatR);
  const headrestR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.12), sportsRed);
  headrestR.position.set(0.24, 0.60, -0.32);
  carGroup.add(headrestR);

  // Sports Steering Wheel
  const wheelTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 8, 16),
    sportsBlack
  );
  wheelTorus.position.set(-0.24, 0.52, 0.08);
  wheelTorus.rotation.x = -0.45;
  carGroup.add(wheelTorus);

  // GT Rear Wing / Spoiler
  const wingDeck = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.26), sportsBlack);
  wingDeck.position.set(0, 0.66, -0.92);
  carGroup.add(wingDeck);
  const wingPostL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.06), sportsBlack);
  wingPostL.position.set(-0.40, 0.52, -0.92);
  carGroup.add(wingPostL);
  const wingPostR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.06), sportsBlack);
  wingPostR.position.set(0.40, 0.52, -0.92);
  carGroup.add(wingPostR);

  // Dual Chrome Exhaust Tailpipes
  const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10);
  pipeGeo.rotateX(Math.PI / 2);
  const pipeL = new THREE.Mesh(pipeGeo, metalMaterial);
  pipeL.position.set(-0.28, 0.20, -1.04);
  carGroup.add(pipeL);
  const pipeR = new THREE.Mesh(pipeGeo, metalMaterial);
  pipeR.position.set(0.28, 0.20, -1.04);
  carGroup.add(pipeR);

  // Projector LED Headlights + PointLight
  const ledGeo = new THREE.BoxGeometry(0.22, 0.10, 0.06);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  const headL = new THREE.Mesh(ledGeo, ledMat);
  headL.position.set(-0.36, 0.32, 1.02);
  carGroup.add(headL);
  const headR = new THREE.Mesh(ledGeo, ledMat);
  headR.position.set(0.36, 0.32, 1.02);
  carGroup.add(headR);

  const carHeadlightsLight = new THREE.PointLight(0xfffbeb, 2.5, 25, 1.2);
  carHeadlightsLight.position.set(0, 0.45, 1.8);
  carGroup.add(carHeadlightsLight);

  // Red LED Taillights (Brake lights)
  const tailGeo = new THREE.BoxGeometry(0.24, 0.08, 0.04);
  const tailMat = new THREE.MeshLambertMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.8
  });
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-0.38, 0.34, -1.03);
  carGroup.add(tailL);
  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(0.38, 0.34, -1.03);
  carGroup.add(tailR);
  const carBrakeLights = [tailL, tailR];

  // 4 Alloy Wheels with Silver Rims & Tires (Stored for real rolling animation)
  const carWheels: THREE.Mesh[] = [];
  const tireGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.165, 8);
  rimGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    [-0.56, 0.24, 0.65],  // Front Left
    [0.56, 0.24, 0.65],   // Front Right
    [-0.56, 0.24, -0.65], // Rear Left
    [0.56, 0.24, -0.65]   // Rear Right
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const tire = new THREE.Mesh(tireGeo, tireRubber);
    tire.position.set(x, y, z);
    const rim = new THREE.Mesh(rimGeo, rimSilver);
    tire.add(rim);
    carGroup.add(tire);
    carWheels.push(tire);
  });

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
    accessories: {
      phone: phoneGroup,
      coffee: coffeeGroup,
      flashlight: flashlightGroup,
      skateboard: skateboardGroup
    },
    carWheels,
    carLights: carHeadlightsLight,
    carBrakeLights,
    vehicles: {
      bicycle: bicycleGroup,
      motorcycle: motoGroup,
      car: carGroup,
      boat: boatGroup
    }
  };
}

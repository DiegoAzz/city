import * as THREE from 'three';

/**
 * Creates high-quality 3D procedural models of Cartagena's real-world monuments,
 * landmarks, and urban culture in authentic Roblox/Brookhaven stylized aesthetic.
 */
export class LandmarkModels {
  // Shared materials for colonial stones, metals, and cartoon finishes
  private static stonePedestal = new THREE.MeshLambertMaterial({ color: 0xd4d4d8 });
  private static bronzeMaterial = new THREE.MeshLambertMaterial({
    color: 0x78350f,
    emissive: 0x451a03,
    emissiveIntensity: 0.25
  });
  private static goldMaterial = new THREE.MeshLambertMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.35
  });
  private static colonialYellow = new THREE.MeshLambertMaterial({
    color: 0xf59e0b,
    emissive: 0x78350f,
    emissiveIntensity: 0.15
  });
  private static whitePlaster = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
  private static castIron = new THREE.MeshLambertMaterial({ color: 0x18181b });

  /**
   * 1. Monumento a la India Catalina (Puerto Duro / Canal del Cabrero)
   */
  public static buildIndiaCatalina(): THREE.Group {
    const group = new THREE.Group();

    // Octagonal fountain basin around pedestal
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.45, 8),
      LandmarkModels.stonePedestal
    );
    basin.position.y = 0.22;
    group.add(basin);

    // Turquoise fountain water with cyan glow
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 3.0, 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
    );
    water.position.y = 0.40;
    group.add(water);

    // Multi-tier stone pedestal
    const pedBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), LandmarkModels.stonePedestal);
    pedBase.position.y = 0.95;
    group.add(pedBase);

    const pedShaft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.2), LandmarkModels.stonePedestal);
    pedShaft.position.y = 2.75;
    group.add(pedShaft);

    // Bronze Commemorative Plaque
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.05),
      LandmarkModels.goldMaterial
    );
    plaque.position.set(0, 2.2, 0.62);
    group.add(plaque);

    // --- India Catalina Bronze Sculpture ---
    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 3.95, 0);

    // Torso & Royal Dress
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 12), LandmarkModels.bronzeMaterial);
    skirt.position.y = 0.55;
    statueGroup.add(skirt);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.7, 10), LandmarkModels.bronzeMaterial);
    torso.position.y = 1.35;
    statueGroup.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 10), LandmarkModels.bronzeMaterial);
    head.position.y = 1.85;
    statueGroup.add(head);

    // Feathers Headdress (Penacho de plumas real)
    const featherFan = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.35, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x059669, emissive: 0x047857, emissiveIntensity: 0.3 })
    );
    featherFan.position.set(0, 2.05, -0.06);
    statueGroup.add(featherFan);

    // Raised Arm with Ceremonial Staff
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), LandmarkModels.bronzeMaterial);
    armR.position.set(0.32, 1.65, 0.15);
    armR.rotation.x = 0.6;
    armR.rotation.z = -0.3;
    statueGroup.add(armR);

    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), LandmarkModels.goldMaterial);
    staff.position.set(0.48, 1.9, 0.40);
    statueGroup.add(staff);

    group.add(statueGroup);

    // Illuminated Spot Lights
    const light = new THREE.PointLight(0xfef08a, 2.8, 16, 1.2);
    light.position.set(0, 5.5, 1.2);
    group.add(light);

    // 3D Title Billboard
    group.add(LandmarkModels.createTitleBillboard('🗿 Monumento a la India Catalina', 'Símbolo histórico de Cartagena de Indias', 7.2));

    return group;
  }

  /**
   * 2. Torre del Reloj Público & Puerta de la Paz (Boca del Puente)
   */
  public static buildTorreDelReloj(): THREE.Group {
    const group = new THREE.Group();

    // Main Gateway Wall (Yellow Ochre)
    const gateWall = new THREE.Mesh(new THREE.BoxGeometry(9.0, 5.0, 3.2), LandmarkModels.colonialYellow);
    gateWall.position.y = 2.5;
    group.add(gateWall);

    // Central Arch Tunnel (Passable roadway)
    const tunnel = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 4.2, 3.3),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    tunnel.position.set(0, 2.1, 0);
    group.add(tunnel);

    // Lateral pedestrian arches
    [-3.2, 3.2].forEach((x) => {
      const pArch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 3.25), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
      pArch.position.set(x, 1.7, 0);
      group.add(pArch);
    });

    // Middle Balcony & Cornice
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.4, 3.5), LandmarkModels.whitePlaster);
    cornice.position.y = 5.2;
    group.add(cornice);

    // Tower Body (Clock Tower)
    const towerBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 3.0), LandmarkModels.colonialYellow);
    towerBody.position.set(0, 7.3, 0);
    group.add(towerBody);

    // 4-Faced Illuminated Clocks
    const clockGeo = new THREE.CircleGeometry(0.75, 16);
    const clockMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const clockHandsMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    [
      { pos: [0, 7.6, 1.52], rot: [0, 0, 0] },
      { pos: [0, 7.6, -1.52], rot: [0, Math.PI, 0] }
    ].forEach((c) => {
      const clock = new THREE.Mesh(clockGeo, clockMat);
      clock.position.set(c.pos[0], c.pos[1], c.pos[2]);
      clock.rotation.set(c.rot[0], c.rot[1], c.rot[2]);

      // Clock Hands
      const handH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.02), clockHandsMat);
      handH.position.set(0, 0.15, 0.02);
      clock.add(handH);
      const handM = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.60, 0.02), clockHandsMat);
      handM.position.set(0.18, 0, 0.02);
      handM.rotation.z = -Math.PI / 3;
      clock.add(handM);

      group.add(clock);
    });

    // Upper Belfry (Campanario) with Bell
    const belfry = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.4), LandmarkModels.colonialYellow);
    belfry.position.set(0, 10.3, 0);
    group.add(belfry);

    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.7, 10), LandmarkModels.goldMaterial);
    bell.position.set(0, 10.2, 0);
    group.add(bell);

    // Octagonal Needle Spire (Aguja barroca)
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.6, 8), LandmarkModels.whitePlaster);
    spire.position.set(0, 13.0, 0);
    group.add(spire);

    // Weather Vane & Cartagena Flag on Top
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), LandmarkModels.castIron);
    flagPole.position.set(0, 15.6, 0);
    group.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.55, 0.02),
      new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.3 })
    );
    flag.position.set(0.48, 16.2, 0);
    group.add(flag);

    // Warm Gate Lantern Lights
    const gateLight = new THREE.PointLight(0xfef08a, 3.0, 24, 1.2);
    gateLight.position.set(0, 8.0, 2.5);
    group.add(gateLight);

    group.add(LandmarkModels.createTitleBillboard('🏰 Torre del Reloj Público', 'Puerta principal de la Ciudad Amurallada', 17.5));

    return group;
  }

  /**
   * 3. Escultura "La Gertrudis" de Fernando Botero (Plaza Santo Domingo)
   */
  public static buildBoteroGertrudis(): THREE.Group {
    const group = new THREE.Group();

    // Marble plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 1.6), LandmarkModels.whitePlaster);
    plinth.position.y = 0.28;
    group.add(plinth);

    // Bronze Sculpture (Voluptuous reclining figure)
    const sculpture = new THREE.Group();
    sculpture.position.y = 0.55;

    // Torso / Reclining body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 10), LandmarkModels.bronzeMaterial);
    body.scale.set(1.4, 0.9, 1.1);
    body.position.set(0, 0.65, 0);
    sculpture.add(body);

    // Voluptuous hips & legs
    const hips = new THREE.Mesh(new THREE.SphereGeometry(0.68, 12, 10), LandmarkModels.bronzeMaterial);
    hips.position.set(-0.7, 0.65, 0);
    sculpture.add(hips);

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 1.2, 10), LandmarkModels.bronzeMaterial);
    legs.rotation.z = Math.PI / 2.8;
    legs.position.set(-1.1, 0.5, 0);
    sculpture.add(legs);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), LandmarkModels.bronzeMaterial);
    head.position.set(0.9, 1.05, 0);
    sculpture.add(head);

    group.add(sculpture);

    // Plaque
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.04), LandmarkModels.goldMaterial);
    plaque.position.set(0, 0.35, 0.82);
    group.add(plaque);

    group.add(LandmarkModels.createTitleBillboard('🗿 "La Gertrudis" de Botero', 'Famosa escultura de bronce en Plaza Santo Domingo', 2.8));

    return group;
  }

  /**
   * 4. Baluarte de Santo Domingo & Cañones Coloniales (Murallas)
   */
  public static buildBaluarteSantoDomingo(): THREE.Group {
    const group = new THREE.Group();

    // Fortified stone rampart wall
    const rampart = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.2, 4.0), LandmarkModels.stonePedestal);
    rampart.position.y = 1.1;
    group.add(rampart);

    // Parapet wall with embrasures
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.9, 0.6), LandmarkModels.stonePedestal);
    parapet.position.set(0, 2.65, 1.7);
    group.add(parapet);

    // Sentry Watchtower (Garita colonial) on corner
    const sentry = new THREE.Group();
    sentry.position.set(3.8, 2.2, 1.6);
    const sentryBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.8, 10), LandmarkModels.stonePedestal);
    sentry.add(sentryBase);
    const sentryDome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 10), LandmarkModels.colonialYellow);
    sentryDome.position.y = 1.1;
    sentry.add(sentryDome);
    group.add(sentry);

    // 2 Cast Iron Cannons mounted on carriages pointing toward the ocean
    [-2.2, 1.2].forEach((x) => {
      const cannonGroup = new THREE.Group();
      cannonGroup.position.set(x, 2.2, 0.8);

      // Wooden carriage
      const carriage = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 1.1),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      carriage.position.y = 0.2;
      cannonGroup.add(carriage);

      // Iron wheels
      const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10);
      wheelGeo.rotateZ(Math.PI / 2);
      [-0.32, 0.32].forEach((wx) => {
        const w1 = new THREE.Mesh(wheelGeo, LandmarkModels.castIron);
        w1.position.set(wx, 0.2, 0.3);
        carriage.add(w1);
        const w2 = new THREE.Mesh(wheelGeo, LandmarkModels.castIron);
        w2.position.set(wx, 0.2, -0.3);
        carriage.add(w2);
      });

      // Heavy Cannon Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 10), LandmarkModels.castIron);
      barrel.position.set(0, 0.42, 0.2);
      barrel.rotation.x = -Math.PI / 2.3;
      cannonGroup.add(barrel);

      group.add(cannonGroup);
    });

    group.add(LandmarkModels.createTitleBillboard('🛡️ Baluarte de Santo Domingo', 'Murallas coloniales y cañones del siglo XVII frente al mar', 4.5));

    return group;
  }

  /**
   * 5. La Chiva Rumbera Tradicional (Autobús rumbero de madera)
   */
  public static buildChivaRumbera(): THREE.Group {
    const group = new THREE.Group();

    // Vibrant Yellow Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.4, 4.6),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b })
    );
    chassis.position.y = 0.65;
    group.add(chassis);

    // Front Engine Hood & Grille
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.65, 1.4),
      new THREE.MeshLambertMaterial({ color: 0xef4444 }) // Red hood
    );
    hood.position.set(0, 1.05, 1.85);
    group.add(hood);

    // Open Wooden Passenger Cabin (Painted stripes: Yellow, Blue, Red)
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.15, 3.4),
      new THREE.MeshLambertMaterial({ color: 0x0284c7 }) // Blue roof
    );
    roof.position.set(0, 2.35, -0.4);
    group.add(roof);

    // Wooden Roof Railing for luggage & musical instruments
    const roofRack = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.25, 3.2),
      LandmarkModels.castIron
    );
    roofRack.position.set(0, 2.55, -0.4);
    group.add(roofRack);

    // Wooden Bench Rows inside
    [-1.4, -0.8, -0.2, 0.4].forEach((z) => {
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.1, 0.35),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      bench.position.set(0, 1.0, z);
      group.add(bench);
    });

    // 4 Heavy Wheels
    const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 12);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    [
      [-1.05, 0.45, 1.3],
      [1.05, 0.45, 1.3],
      [-1.05, 0.45, -1.3],
      [1.05, 0.45, -1.3]
    ].forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(x, y, z);
      group.add(tire);
    });

    // Colorful Party Fairy Lights around roof perimeter
    const partyLight = new THREE.PointLight(0xf43f5e, 2.2, 12, 1.2);
    partyLight.position.set(0, 2.2, -0.4);
    group.add(partyLight);

    group.add(LandmarkModels.createTitleBillboard('🎺 La Chiva Rumbera', 'Autobús típico caribeño de fiesta y música en vivo', 3.6));

    return group;
  }

  /**
   * 6. Puesto de Frutas Tropicales & Palenquera
   */
  public static buildPalenqueraFruitStand(): THREE.Group {
    const group = new THREE.Group();

    // Wooden market cart
    const cart = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.75, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x78350f })
    );
    cart.position.y = 0.55;
    group.add(cart);

    // Striped Sun Umbrella (Sombrilla de frutas)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), LandmarkModels.castIron);
    pole.position.set(0.5, 1.4, 0);
    group.add(pole);

    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 0.5, 10),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.3 })
    );
    umbrella.position.set(0.5, 2.45, 0);
    group.add(umbrella);

    // Sliced Watermelons, Pineapples, and Coconuts
    const watermelon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x10b981 })
    );
    watermelon.position.set(-0.35, 0.98, 0.15);
    group.add(watermelon);

    const pineapple = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.28, 8),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b })
    );
    pineapple.position.set(0.1, 1.05, -0.15);
    group.add(pineapple);

    // Palenquera Figurine beside the cart
    const palenquera = new THREE.Group();
    palenquera.position.set(-0.95, 0, 0);

    const skirt = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 0.85, 10),
      new THREE.MeshLambertMaterial({ color: 0xf43f5e }) // Vibrant pink dress
    );
    skirt.position.y = 0.45;
    palenquera.add(skirt);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.55, 8),
      new THREE.MeshLambertMaterial({ color: 0x0284c7 }) // Blue Caribbean top
    );
    torso.position.y = 1.05;
    palenquera.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x451a03 })
    );
    head.position.y = 1.45;
    palenquera.add(head);

    // Fruit Basin on Head (Ponchera de frutas en la cabeza)
    const ponchera = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.14, 0.12, 10),
      LandmarkModels.whitePlaster
    );
    ponchera.position.y = 1.66;
    palenquera.add(ponchera);

    group.add(palenquera);

    group.add(LandmarkModels.createTitleBillboard('🍍 Palenquera & Frutas Frescas', 'Dulces típicos, cocadas, patilla y limonada de coco', 2.8));

    return group;
  }

  /**
   * Helper to create sharp 3D Title Billboards with glowing accents
   */
  private static createTitleBillboard(title: string, subtitle: string, heightY: number): THREE.Sprite {
    if (typeof document === 'undefined') {
      const dummySprite = new THREE.Sprite();
      dummySprite.position.y = heightY;
      return dummySprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Rounded Card Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 496, 176, 24);
      ctx.fill();

      // Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 75);

      // Subtitle
      ctx.fillStyle = '#fde047';
      ctx.font = '600 22px "Montserrat", sans-serif';
      const cleanSub = subtitle.length > 34 ? subtitle.substring(0, 33) + '…' : subtitle;
      ctx.fillText(cleanSub, 256, 135);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(5.5, 2.1, 1);
    sprite.position.set(0, heightY, 0);
    return sprite;
  }
}

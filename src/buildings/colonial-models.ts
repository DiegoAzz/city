import * as THREE from 'three';

export interface ColonialPalette {
  wallColor: number;
  woodColor: number;
  roofColor: number;
  accentColor: number;
}

export const COLONIAL_PALETTES: Record<string, ColonialPalette> = {
  yellow: { wallColor: 0xf59e0b, woodColor: 0x5b3414, roofColor: 0xb91c1c, accentColor: 0xfef08a },
  pink: { wallColor: 0xec4899, woodColor: 0x451a03, roofColor: 0x991b1b, accentColor: 0xfce7f3 },
  white: { wallColor: 0xf8fafc, woodColor: 0x5c2b09, roofColor: 0xb91c1c, accentColor: 0xd4d4d8 },
  blue: { wallColor: 0x0284c7, woodColor: 0x451a03, roofColor: 0x991b1b, accentColor: 0xbae6fd },
  green: { wallColor: 0x10b981, woodColor: 0x5b3414, roofColor: 0xb91c1c, accentColor: 0xa7f3d0 },
  terracotta: { wallColor: 0xea580c, woodColor: 0x3d1d05, roofColor: 0x7f1d1d, accentColor: 0xfed7aa }
};

export class ColonialModels {
  private static stoneBase = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
  private static warmLantern = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  private static glassPane = new THREE.MeshLambertMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65
  });
  private static flowersBougainvillea = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
  private static goldBrass = new THREE.MeshLambertMaterial({ color: 0xf59e0b });

  /**
   * 1. Casona Colonial Tradicional (2 o 3 plantas con balcones floridos, tejas inclinadas y portón)
   */
  public static buildCasona(
    paletteKey: string = 'yellow',
    floors: number = 2,
    width: number = 7.0,
    depth: number = 6.0
  ): THREE.Group {
    const group = new THREE.Group();
    const pal = COLONIAL_PALETTES[paletteKey] || COLONIAL_PALETTES.yellow;

    const wallMat = new THREE.MeshLambertMaterial({ color: pal.wallColor });
    const woodMat = new THREE.MeshLambertMaterial({ color: pal.woodColor });
    const roofMat = new THREE.MeshLambertMaterial({ color: pal.roofColor });

    const floorHeight = 2.4;
    const totalHeight = floors * floorHeight;

    // Stone base plinth (Zócalo colonial de piedra)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.45, depth + 0.1), ColonialModels.stoneBase);
    plinth.position.y = 0.22;
    group.add(plinth);

    // Main Facade Structure
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(width, totalHeight, depth), wallMat);
    mainBody.position.y = totalHeight / 2 + 0.3;
    group.add(mainBody);

    // Ground Floor: Heavy colonial mahogany entrance with brass knockers
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.2), ColonialModels.stoneBase);
    doorFrame.position.set(0, 1.2, depth / 2 + 0.05);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.8, 0.15), woodMat);
    door.position.set(0, 1.1, depth / 2 + 0.1);
    const knockerL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), ColonialModels.goldBrass);
    knockerL.position.set(-0.35, 1.25, depth / 2 + 0.2);
    const knockerR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), ColonialModels.goldBrass);
    knockerR.position.set(0.35, 1.25, depth / 2 + 0.2);
    group.add(doorFrame, door, knockerL, knockerR);

    // Ground Floor Windows with decorative wooden grilles
    [-2.2, 2.2].forEach((x) => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.15), woodMat);
      winFrame.position.set(x, 1.3, depth / 2 + 0.06);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.05), ColonialModels.glassPane);
      glass.position.set(x, 1.3, depth / 2 + 0.1);
      group.add(winFrame, glass);
    });

    // Upper Floors: Famous cantilevered Cartagena wooden balconies (Balcones floridos)
    for (let f = 1; f < floors; f++) {
      const balconyY = f * floorHeight + 0.5;

      // Balcony cantilevered floor
      const balconyFloor = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.8, 0.16, 1.1),
        woodMat
      );
      balconyFloor.position.set(0, balconyY, depth / 2 + 0.55);
      group.add(balconyFloor);

      // Support wooden brackets (Ménsulas coloniales)
      [-2.4, -0.8, 0.8, 2.4].forEach((bx) => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.6), woodMat);
        bracket.position.set(bx, balconyY - 0.25, depth / 2 + 0.35);
        bracket.rotation.x = -0.35;
        group.add(bracket);
      });

      // Balcony Railing (Baranda de madera tallada)
      const railing = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.8, 0.65, 0.08),
        woodMat
      );
      railing.position.set(0, balconyY + 0.4, depth / 2 + 1.05);
      group.add(railing);

      // Blooming pink bougainvillea flowers hanging from the balcony
      for (let fx = -(width - 1.4) / 2; fx <= (width - 1.4) / 2; fx += 0.7) {
        const flowerCluster = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 6, 5),
          ColonialModels.flowersBougainvillea
        );
        flowerCluster.position.set(fx, balconyY + 0.25, depth / 2 + 1.12);
        group.add(flowerCluster);
      }

      // French windows leading onto balcony
      [-1.8, 0, 1.8].forEach((wx) => {
        const frenchWin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.1), woodMat);
        frenchWin.position.set(wx, balconyY + 0.95, depth / 2 + 0.05);
        const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.05), ColonialModels.glassPane);
        winGlass.position.set(wx, balconyY + 0.95, depth / 2 + 0.08);
        group.add(frenchWin, winGlass);
      });
    }

    // Authentic Pitched Clay Tile Roof (Tejas de barro coloniales a dos aguas)
    const roofY = totalHeight + 0.3;
    const roofSlope = 0.52; // Angle

    // Front roof slope
    const frontRoof = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.6, 0.18, depth / 2 + 0.8),
      roofMat
    );
    frontRoof.position.set(0, roofY + 0.6, (depth / 4) + 0.2);
    frontRoof.rotation.x = roofSlope;

    // Back roof slope
    const backRoof = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.6, 0.18, depth / 2 + 0.8),
      roofMat
    );
    backRoof.position.set(0, roofY + 0.6, -(depth / 4) - 0.2);
    backRoof.rotation.x = -roofSlope;

    // Ridge cap (Caballete de tejas)
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.7, 0.22, 0.35), roofMat);
    ridge.position.set(0, roofY + 1.25, 0);

    // Wooden cornice under eaves (Aleros coloniales)
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.14, depth + 0.4), woodMat);
    cornice.position.set(0, roofY, 0);

    group.add(frontRoof, backRoof, ridge, cornice);

    // Wall-mounted colonial iron lantern with warm night glow
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), ColonialModels.warmLantern);
    lantern.position.set(1.4, 1.9, depth / 2 + 0.25);
    group.add(lantern);

    return group;
  }

  /**
   * 2. Portal Comercial Colonial con Arcadas, Tiendas y Cafés
   */
  public static buildPortalComercial(
    paletteKey: string = 'white',
    _shopName: string = 'Café Colonial'
  ): THREE.Group {
    const group = new THREE.Group();
    const pal = COLONIAL_PALETTES[paletteKey] || COLONIAL_PALETTES.white;

    const wallMat = new THREE.MeshLambertMaterial({ color: pal.wallColor });
    const woodMat = new THREE.MeshLambertMaterial({ color: pal.woodColor });
    const roofMat = new THREE.MeshLambertMaterial({ color: pal.roofColor });

    const width = 8.5;
    const depth = 6.5;
    const height = 5.2;

    // Base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.4, depth + 0.2), ColonialModels.stoneBase);
    plinth.position.y = 0.2;
    group.add(plinth);

    // Upper Floor
    const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(width, 2.6, depth), wallMat);
    upperFloor.position.set(0, 3.8, 0);
    group.add(upperFloor);

    // Ground Floor: Colonnaded Portals / Arcadas (4 stone pillars + arches)
    const pillarPositions = [-3.6, -1.2, 1.2, 3.6];
    pillarPositions.forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.4, 0.55), ColonialModels.stoneBase);
      pillar.position.set(px, 1.4, depth / 2);
      group.add(pillar);
    });

    // Arch lintels over the walkway
    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, 0.6), ColonialModels.stoneBase);
    archLintel.position.set(0, 2.5, depth / 2);
    group.add(archLintel);

    // Recessed Shopfront wall (Pared interior de los locales)
    const shopWall = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, 2.4, 0.2), wallMat);
    shopWall.position.set(0, 1.4, depth / 2 - 1.6);
    group.add(shopWall);

    // Shop Door & Display Windows inside arcade
    const shopDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.1), woodMat);
    shopDoor.position.set(0, 1.15, depth / 2 - 1.5);
    const shopWinL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.1), ColonialModels.glassPane);
    shopWinL.position.set(-2.2, 1.3, depth / 2 - 1.5);
    const shopWinR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.1), ColonialModels.glassPane);
    shopWinR.position.set(2.2, 1.3, depth / 2 - 1.5);
    group.add(shopDoor, shopWinL, shopWinR);

    // Colorful Striped Cafe Awning (Toldo de lona colonial)
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.6, 0.12, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b })
    );
    awning.position.set(0, 2.4, depth / 2 + 0.65);
    awning.rotation.x = 0.22;
    group.add(awning);

    // Sidewalk Cafe Tables & Chairs under the arcade
    [-2.2, 2.2].forEach((tx) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.65, 8), woodMat);
      table.position.set(tx, 0.65, depth / 2 - 0.7);
      const chair1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.28), woodMat);
      chair1.position.set(tx - 0.45, 0.4, depth / 2 - 0.7);
      const chair2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.28), woodMat);
      chair2.position.set(tx + 0.45, 0.4, depth / 2 - 0.7);
      group.add(table, chair1, chair2);
    });

    // Upper Balcony
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(width - 0.8, 0.6, 0.8), woodMat);
    balcony.position.set(0, 3.4, depth / 2 + 0.4);
    group.add(balcony);

    // Pitched Clay Tile Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.3, depth + 0.5), roofMat);
    roof.position.set(0, height + 0.3, 0);
    roof.rotation.x = 0.25;
    group.add(roof);

    return group;
  }

  /**
   * 3. Palacio de la Inquisición (Fachada monumental en piedra, escudo y balcones corridos)
   */
  public static buildPalacioInquisicion(): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xd4d4d8 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x3d1d05 });
    const tileMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });

    const width = 12.0;
    const depth = 8.0;
    const height = 7.5;

    // Ground stone plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.5, depth + 0.3), stoneMat);
    plinth.position.y = 0.25;
    group.add(plinth);

    // Main 3-story palace body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), whiteMat);
    body.position.y = height / 2 + 0.4;
    group.add(body);

    // Monumental Baroque Stone Portal (Portada de piedra barroca)
    const portal = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.0, 0.35), stoneMat);
    portal.position.set(0, 2.7, depth / 2 + 0.15);
    const archDoor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.2), woodMat);
    archDoor.position.set(0, 1.5, depth / 2 + 0.25);
    // Coat of arms crest (Escudo colonial heráldico)
    const crest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.2), ColonialModels.goldBrass);
    crest.position.set(0, 4.2, depth / 2 + 0.3);
    group.add(portal, archDoor, crest);

    // Long continuous wooden balconies on 2nd and 3rd floors
    [3.6, 5.8].forEach((by) => {
      const longBalcony = new THREE.Mesh(new THREE.BoxGeometry(width - 1.2, 0.7, 0.9), woodMat);
      longBalcony.position.set(0, by, depth / 2 + 0.45);
      group.add(longBalcony);
    });

    // Roof: Terracotta roof with decorative stone balustrade
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.6, depth + 0.4), stoneMat);
    balustrade.position.set(0, height + 0.6, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, depth), tileMat);
    roof.position.set(0, height + 0.9, 0);
    group.add(balustrade, roof);

    return group;
  }

  /**
   * 4. Catedral Santa Catalina de Alejandría (Cúpula emblemática y torre campanario)
   */
  public static buildCatedral(): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xd4d4d8 });
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });

    // Main Cathedral Nave
    const nave = new THREE.Mesh(new THREE.BoxGeometry(10.0, 6.5, 14.0), yellowMat);
    nave.position.set(0, 3.5, 0);
    group.add(nave);

    // Portada en piedra con 3 arcos
    const facadePortal = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.5, 0.4), stoneMat);
    facadePortal.position.set(0, 2.5, 7.1);
    group.add(facadePortal);

    // Rose Window
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), stoneMat);
    rose.position.set(0, 5.2, 7.1);
    rose.rotation.x = Math.PI / 2;
    group.add(rose);

    // Iconic Multi-Tiered Bell Tower (Torre campanario de 3 cuerpos)
    const towerX = 4.2;
    const towerZ = 5.8;
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.0, 2.8), yellowMat);
    t1.position.set(towerX, 8.5, towerZ);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 2.2), stoneMat);
    t2.position.set(towerX, 12.0, towerZ);
    const t3 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), yellowMat);
    t3.position.set(towerX, 14.8, towerZ);
    // Tower spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.6, 8), redMat);
    spire.position.set(towerX, 17.3, towerZ);
    group.add(t1, t2, t3, spire);

    // Iconic Dome (Cúpula de la Catedral con gajos amarillos y tejas rojas)
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.4, 12), yellowMat);
    domeBase.position.set(0, 7.5, -3.5);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.3, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    dome.position.set(0, 8.2, -3.5);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8), stoneMat);
    lantern.position.set(0, 10.6, -3.5);
    group.add(domeBase, dome, lantern);

    return group;
  }

  /**
   * 5. Iglesia de Santo Domingo (En plena Plaza Santo Domingo)
   */
  public static buildIglesiaSantoDomingo(): THREE.Group {
    const group = new THREE.Group();
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x3d1d05 });

    // Nave
    const nave = new THREE.Mesh(new THREE.BoxGeometry(8.5, 6.0, 11.0), yellowMat);
    nave.position.set(0, 3.2, 0);
    group.add(nave);

    // Stone facade portal
    const portal = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.8, 0.4), stoneMat);
    portal.position.set(0, 2.6, 5.6);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.2), woodMat);
    door.position.set(0, 1.6, 5.8);
    group.add(portal, door);

    // Bell Tower on left
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.6, 6.5, 2.6), yellowMat);
    tower.position.set(-3.8, 6.5, 4.5);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), stoneMat);
    dome.position.set(-3.8, 9.8, 4.5);
    group.add(tower, dome);

    return group;
  }
}

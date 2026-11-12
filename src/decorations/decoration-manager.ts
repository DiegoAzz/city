import * as THREE from 'three';
import type { EconomyManager } from '../economy/economy-manager';
import type { MultiplayerManager } from '../multiplayer/multiplayer-manager';

export type BuildCategory = 'houses' | 'structures' | 'furniture' | 'luxury';

export interface DecorationItem {
  id: string;
  name: string;
  category: BuildCategory;
  icon: string;
  price: number;
  description: string;
  rentPerMinute?: number;
}

export interface PlacedDecoration {
  instanceId: string;
  itemId: string;
  lng: number;
  lat: number;
  ownerId: string;
  ownerName: string;
  rotationY: number;
  placedAt: number;
}

export const DECORATION_CATALOG: DecorationItem[] = [
  // 1. Casas e Inmuebles Completos
  { id: 'house_colonial', name: 'Casa Colonial', category: 'houses', icon: '🏠', price: 450, description: 'Casa colonial de 2 pisos con balcón y tejas de barro', rentPerMinute: 45 },
  { id: 'house_mansion', name: 'Mansión Moderna', category: 'houses', icon: '🏰', price: 850, description: 'Mansión vanguardista con amplios ventanales y azotea', rentPerMinute: 90 },
  { id: 'house_villa', name: 'Villa Caribeña', category: 'houses', icon: '🏡', price: 700, description: 'Villa tropical con porche, columnas y terraza', rentPerMinute: 70 },
  { id: 'shop_cafe', name: 'Café & Terraza', category: 'houses', icon: '☕', price: 400, description: 'Comercio colonial con toldo a rayas y mostrador', rentPerMinute: 50 },

  // 2. Obras & Estructuras Modulares
  { id: 'wall_plain', name: 'Pared Colonial', category: 'structures', icon: '🧱', price: 30, description: 'Muro blanco resistente con zócalo' },
  { id: 'wall_window', name: 'Pared con Ventana', category: 'structures', icon: '🪟', price: 45, description: 'Muro con ventanal de cristal y reja' },
  { id: 'door_frame', name: 'Puerta Principal', category: 'structures', icon: '🚪', price: 60, description: 'Puerta de madera maciza con marco' },
  { id: 'floor_tile', name: 'Piso de Baldosa', category: 'structures', icon: '🟫', price: 25, description: 'Losa de piso de 4x4m de mármol' },
  { id: 'roof_tile', name: 'Techo Colonial', category: 'structures', icon: '🔺', price: 50, description: 'Tejado a dos aguas de tejas rojas' },
  { id: 'column_stone', name: 'Columna de Piedra', category: 'structures', icon: '🏛️', price: 35, description: 'Columna clásica de cantería' },

  // 3. Muebles de Interior
  { id: 'furniture_sofa', name: 'Sofá Moderno', category: 'furniture', icon: '🛋️', price: 80, description: 'Sofá en L acolchado con cojines' },
  { id: 'furniture_bed', name: 'Cama King Size', category: 'furniture', icon: '🛏️', price: 120, description: 'Cama doble de lujo con sábanas blancas' },
  { id: 'furniture_tv', name: 'Smart TV 75"', category: 'furniture', icon: '📺', price: 140, description: 'Pantalla plana en consola multimedia' },
  { id: 'furniture_table', name: 'Mesa y Sillas', category: 'furniture', icon: '🪑', price: 70, description: 'Mesa de comedor de madera noble y sillas' },
  { id: 'furniture_kitchen', name: 'Cocina Integral', category: 'furniture', icon: '🍳', price: 160, description: 'Mesada con fregadero y estufa moderna' },

  // 4. Lujo, Exteriores & Jardín
  { id: 'outdoor_pool', name: 'Piscina Azul', category: 'luxury', icon: '🏊', price: 300, description: 'Alberca de agua turquesa con escalerilla' },
  { id: 'outdoor_jacuzzi', name: 'Jacuzzi de Lujo', category: 'luxury', icon: '🛁', price: 180, description: 'Tina redonda con agua burbujeante' },
  { id: 'palm_tree', name: 'Palmera Real', category: 'luxury', icon: '🌴', price: 150, description: 'Palmera tropical estilizada con cocos' },
  { id: 'fountain', name: 'Fuente de Plaza', category: 'luxury', icon: '⛲', price: 350, description: 'Fuente de piedra labrada con cascada' },
  { id: 'colonial_bench', name: 'Banco Colonial', category: 'luxury', icon: '🪑', price: 100, description: 'Banco de parque de hierro y caoba' },
  { id: 'street_lamp', name: 'Farol con Luz', category: 'luxury', icon: '💡', price: 120, description: 'Farola colonial que ilumina la calle' },
  { id: 'outdoor_fence', name: 'Cerca de Jardín', category: 'luxury', icon: '🪜', price: 20, description: 'Tramo de valla blanca de estacas' },
  { id: 'flower_pot', name: 'Maceta Floral', category: 'luxury', icon: '🌺', price: 50, description: 'Jardinera con flores tropicales' }
];

const STORAGE_KEY = 'the_fantastic_one_placed_construction_v3';

export class DecorationManager {
  private placedDecorations: Map<string, PlacedDecoration> = new Map();
  private scene: THREE.Scene | null = null;
  private decorationMeshes: Map<string, THREE.Group> = new Map();
  private economy: EconomyManager;
  private multiplayer: MultiplayerManager;

  constructor(economy: EconomyManager, multiplayer: MultiplayerManager) {
    this.economy = economy;
    this.multiplayer = multiplayer;
    this.loadSavedDecorations();
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.rebuildAllMeshes();
  }

  private loadSavedDecorations(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: PlacedDecoration[] = JSON.parse(raw);
          list.forEach((item) => this.placedDecorations.set(item.instanceId, item));
        }
      }
    } catch (e) {
      console.warn('[DecorationManager] Error loading decorations:', e);
    }

    // If no decorations yet, pre-populate Plaza Santo Domingo with living 3D elements inside open cobblestones!
    if (this.placedDecorations.size === 0) {
      this.seedPlazaSantoDomingo();
    }
  }

  private seedPlazaSantoDomingo(): void {
    const defaultOwnerId = 'city_hall';
    const defaultOwnerName = 'Alcaldía de Cartagena';

    // Plaza Santo Domingo Open Center: -75.55196, 10.42431
    // All coordinates strictly inside open square with >4.5m clearance from all building walls
    const initialDecorations: PlacedDecoration[] = [
      // Central Fountain
      {
        instanceId: 'seed_fountain_1',
        itemId: 'fountain',
        lng: -75.55196,
        lat: 10.42431,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0,
        placedAt: Date.now()
      },
      // 4 Caribbean Royal Palms (Northeast, Southeast, Northwest, Southwest)
      {
        instanceId: 'seed_palm_1',
        itemId: 'palm_tree',
        lng: -75.55190,
        lat: 10.42436,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0.5,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_palm_2',
        itemId: 'palm_tree',
        lng: -75.55190,
        lat: 10.42426,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 1.2,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_palm_3',
        itemId: 'palm_tree',
        lng: -75.55202,
        lat: 10.42436,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 2.1,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_palm_4',
        itemId: 'palm_tree',
        lng: -75.55202,
        lat: 10.42426,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 3.0,
        placedAt: Date.now()
      },
      // Colonial Benches facing the central fountain
      {
        instanceId: 'seed_bench_1',
        itemId: 'colonial_bench',
        lng: -75.55196,
        lat: 10.42436,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: Math.PI,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_bench_2',
        itemId: 'colonial_bench',
        lng: -75.55196,
        lat: 10.42426,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0,
        placedAt: Date.now()
      },
      // Warm Street Lamps (East and West)
      {
        instanceId: 'seed_lamp_1',
        itemId: 'street_lamp',
        lng: -75.55188,
        lat: 10.42431,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_lamp_2',
        itemId: 'street_lamp',
        lng: -75.55203,
        lat: 10.42431,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0,
        placedAt: Date.now()
      }
    ];

    initialDecorations.forEach((d) => this.placedDecorations.set(d.instanceId, d));
  }

  private saveDecorations(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const list = Array.from(this.placedDecorations.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('[DecorationManager] Error saving decorations:', e);
    }
  }

  public placeItem(
    itemId: string,
    lng: number,
    lat: number,
    rotationY: number = 0
  ): { success: boolean; reason?: string } {
    const item = DECORATION_CATALOG.find((i) => i.id === itemId);
    if (!item) return { success: false, reason: 'Objeto no encontrado en catálogo' };

    if (!this.economy.canAfford(item.price)) {
      return { success: false, reason: `Requiere $${item.price} monedas.` };
    }

    this.economy.deduct(item.price);

    const instanceId = 'dec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const placed: PlacedDecoration = {
      instanceId,
      itemId,
      lng,
      lat,
      ownerId: this.multiplayer.getMyId(),
      ownerName: this.multiplayer.getPlayerName(),
      rotationY: rotationY || Math.random() * Math.PI * 2,
      placedAt: Date.now()
    };

    this.placedDecorations.set(instanceId, placed);
    this.saveDecorations();

    if (this.scene) {
      this.createMeshForDecoration(placed);
    }

    return { success: true };
  }

  public demolishClosestItem(
    playerLng: number,
    playerLat: number,
    maxDistanceMeters: number = 6.0
  ): { success: boolean; item?: DecorationItem; refund?: number; reason?: string } {
    let closestId: string | null = null;
    let closestDist = Infinity;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);

    for (const [id, dec] of this.placedDecorations.entries()) {
      // Don't delete city hall seed fountain
      if (dec.ownerId === 'city_hall' && dec.itemId === 'fountain') continue;

      const dLng = (dec.lng - playerLng) * metersPerDegLng;
      const dLat = (dec.lat - playerLat) * metersPerDegLat;
      const dist = Math.hypot(dLng, dLat);

      if (dist < maxDistanceMeters && dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }

    if (!closestId) {
      return { success: false, reason: 'No hay ninguna construcción cercana para demoler (acércate a menos de 5m).' };
    }

    const placed = this.placedDecorations.get(closestId)!;
    const itemDef = DECORATION_CATALOG.find((d) => d.id === placed.itemId);
    const refund = itemDef ? Math.round(itemDef.price * 0.8) : 50;

    // Remove mesh from scene
    const mesh = this.decorationMeshes.get(closestId);
    if (mesh && this.scene) {
      this.scene.remove(mesh);
    }
    this.decorationMeshes.delete(closestId);
    this.placedDecorations.delete(closestId);
    this.saveDecorations();

    // Refund coins
    this.economy.add(refund);

    return { success: true, item: itemDef, refund };
  }

  private rebuildAllMeshes(): void {
    if (!this.scene) return;

    for (const mesh of this.decorationMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.decorationMeshes.clear();

    for (const dec of this.placedDecorations.values()) {
      this.createMeshForDecoration(dec);
    }
  }

  private createMeshForDecoration(dec: PlacedDecoration): void {
    if (!this.scene) return;

    const group = new THREE.Group();

    switch (dec.itemId) {
      // -------------------------------------------------------------
      // 1. CASAS E INMUEBLES COMPLETOS
      // -------------------------------------------------------------
      case 'house_colonial': {
        // Main colonial building body (white stucco)
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });
        const plinthMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0xc2410c });
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.0), wallMat);
        body.position.y = 0.8;
        group.add(body);

        // Terracotta plinth trim
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.22, 2.04), plinthMat);
        plinth.position.y = 0.11;
        group.add(plinth);

        // Pitched roof (2 terracotta slabs)
        const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 2.2), roofMat);
        roofLeft.position.set(-0.55, 1.85, 0);
        roofLeft.rotation.z = 0.42;
        const roofRight = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 2.2), roofMat);
        roofRight.position.set(0.55, 1.85, 0);
        roofRight.rotation.z = -0.42;
        group.add(roofLeft, roofRight);

        // Colonial front door
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.06), woodMat);
        door.position.set(0, 0.45, 1.02);
        group.add(door);

        // Ground floor window with iron grill
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), glassMat);
        win.position.set(0.65, 0.65, 1.02);
        group.add(win);

        // 2nd floor wooden balcony
        const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.45), woodMat);
        balconyFloor.position.set(0, 1.15, 1.15);
        const balconyRailing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.28, 0.04), woodMat);
        balconyRailing.position.set(0, 1.30, 1.36);
        group.add(balconyFloor, balconyRailing);
        break;
      }

      case 'house_mansion': {
        // Modern Brookhaven style luxury mansion
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.75 });

        // Ground floor block
        const ground = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 2.2), whiteMat);
        ground.position.y = 0.6;
        group.add(ground);

        // Upper cantilevered wing
        const upper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.8), darkMat);
        upper.position.set(0.2, 1.75, 0);
        group.add(upper);

        // Huge glass panoramic wall
        const glassWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.04), glassMat);
        glassWall.position.set(-0.2, 0.6, 1.12);
        group.add(glassWall);

        // Upper balcony glass railing
        const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.03), glassMat);
        upperGlass.position.set(0.2, 1.5, 0.95);
        group.add(upperGlass);
        break;
      }

      case 'house_villa': {
        // Tropical villa with shaded veranda and white pillars
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xfef3c7 });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

        const main = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.8), wallMat);
        main.position.set(0, 0.7, -0.2);
        group.add(main);

        // Porch floor
        const porch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.8), pillarMat);
        porch.position.set(0, 0.05, 0.9);
        group.add(porch);

        // 4 Porch columns
        for (let i = 0; i < 4; i++) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), pillarMat);
          col.position.set(-0.9 + i * 0.6, 0.7, 1.2);
          group.add(col);
        }

        // Porch roof
        const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.0), roofMat);
        porchRoof.position.set(0, 1.4, 0.9);
        group.add(porchRoof);
        break;
      }

      case 'shop_cafe': {
        // Colonial Café with striped red/white awning
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
        const counterMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const redAwning = new THREE.MeshLambertMaterial({ color: 0xef4444 });
        const whiteAwning = new THREE.MeshLambertMaterial({ color: 0xffffff });

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.8), wallMat);
        body.position.y = 0.75;
        group.add(body);

        // Service counter
        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.3), counterMat);
        counter.position.set(0, 0.4, 0.95);
        group.add(counter);

        // Alternating red/white awning stripes
        for (let i = 0; i < 6; i++) {
          const mat = i % 2 === 0 ? redAwning : whiteAwning;
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.7), mat);
          stripe.position.set(-0.8 + i * 0.32, 1.2, 1.2);
          stripe.rotation.x = 0.3;
          group.add(stripe);
        }
        break;
      }

      // -------------------------------------------------------------
      // 2. OBRAS & ESTRUCTURAS MODULARES
      // -------------------------------------------------------------
      case 'wall_plain': {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 1.6, 0.16),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc })
        );
        wall.position.y = 0.8;
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(1.84, 0.16, 0.20),
          new THREE.MeshLambertMaterial({ color: 0xb45309 })
        );
        plinth.position.y = 0.08;
        group.add(wall, plinth);
        break;
      }

      case 'wall_window': {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 1.6, 0.16),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc })
        );
        wall.position.y = 0.8;
        const windowPane = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.6, 0.22),
          new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
        );
        windowPane.position.y = 0.85;
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(0.66, 0.66, 0.20),
          new THREE.MeshLambertMaterial({ color: 0x78350f })
        );
        frame.position.y = 0.85;
        group.add(wall, frame, windowPane);
        break;
      }

      case 'door_frame': {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.6, 0.2),
          new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
        );
        frame.position.y = 0.8;
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.4, 0.08),
          new THREE.MeshLambertMaterial({ color: 0x78350f })
        );
        door.position.set(0, 0.72, 0.04);
        group.add(frame, door);
        break;
      }

      case 'floor_tile': {
        const floor = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.08, 2.4),
          new THREE.MeshLambertMaterial({ color: 0xd97706 })
        );
        floor.position.y = 0.04;
        group.add(floor);
        break;
      }

      case 'roof_tile': {
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.08, 1.4),
          new THREE.MeshLambertMaterial({ color: 0xc2410c })
        );
        roof.position.y = 1.0;
        roof.rotation.x = 0.45;
        group.add(roof);
        break;
      }

      case 'column_stone': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }));
        base.position.y = 0.06;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 12), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
        col.position.y = 0.85;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }));
        cap.position.y = 1.68;
        group.add(base, col, cap);
        break;
      }

      // -------------------------------------------------------------
      // 3. MUEBLES DE INTERIOR
      // -------------------------------------------------------------
      case 'furniture_sofa': {
        const fabric = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
        const pillow = new THREE.MeshLambertMaterial({ color: 0xfacc15 });

        // Sofa base & cushions
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 0.6), fabric);
        seat.position.y = 0.18;
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.18), fabric);
        back.position.set(0, 0.42, -0.22);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.6), fabric);
        armL.position.set(-0.55, 0.3, 0);
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.6), fabric);
        armR.position.set(0.55, 0.3, 0);

        // Accent pillow
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), pillow);
        p.position.set(-0.35, 0.35, -0.12);
        p.rotation.z = 0.2;
        group.add(seat, back, armL, armR, p);
        break;
      }

      case 'furniture_bed': {
        const wood = new THREE.MeshLambertMaterial({ color: 0x451a03 });
        const sheet = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        const duvet = new THREE.MeshLambertMaterial({ color: 0x0284c7 });

        // Headboard
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.1), wood);
        head.position.set(0, 0.35, -0.65);
        // Mattress
        const mat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 1.2), sheet);
        mat.position.y = 0.2;
        // Quilt
        const quilt = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.1, 0.8), duvet);
        quilt.position.set(0, 0.28, 0.15);
        // Pillows
        const pil1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.25), sheet);
        pil1.position.set(-0.25, 0.32, -0.45);
        const pil2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.25), sheet);
        pil2.position.set(0.25, 0.32, -0.45);

        group.add(head, mat, quilt, pil1, pil2);
        break;
      }

      case 'furniture_tv': {
        // TV Console table & flat-screen
        const stand = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.3, 0.35),
          new THREE.MeshLambertMaterial({ color: 0x334155 })
        );
        stand.position.y = 0.15;

        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.6, 0.05),
          new THREE.MeshLambertMaterial({ color: 0x0f172a })
        );
        tv.position.set(0, 0.65, 0);

        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(0.92, 0.52, 0.02),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        screen.position.set(0, 0.65, 0.03);

        group.add(stand, tv, screen);
        break;
      }

      case 'furniture_table': {
        const wood = new THREE.MeshLambertMaterial({ color: 0x78350f });
        // Table top & 4 legs
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.7), wood);
        top.position.y = 0.6;
        for (let x of [-0.45, 0.45]) {
          for (let z of [-0.25, 0.25]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), wood);
            leg.position.set(x, 0.3, z);
            group.add(leg);
          }
        }
        group.add(top);
        break;
      }

      case 'furniture_kitchen': {
        const counter = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.65, 0.5),
          new THREE.MeshLambertMaterial({ color: 0xf1f5f9 })
        );
        counter.position.y = 0.325;
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(1.34, 0.06, 0.54),
          new THREE.MeshLambertMaterial({ color: 0x334155 })
        );
        top.position.y = 0.66;
        const faucet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6),
          new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
        );
        faucet.position.set(-0.3, 0.75, 0);
        group.add(counter, top, faucet);
        break;
      }

      // -------------------------------------------------------------
      // 4. EXTERIORES, LUJO & JARDÍN
      // -------------------------------------------------------------
      case 'outdoor_pool': {
        // In-ground pool with white marble curb & turquoise water
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.15, 1.6),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc })
        );
        curb.position.y = 0.08;

        const water = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 0.12, 1.3),
          new THREE.MeshLambertMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.3 })
        );
        water.position.y = 0.09;

        // Chrome ladder
        const ladder = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.35, 0.18),
          new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
        );
        ladder.position.set(0.9, 0.22, 0);
        group.add(curb, water, ladder);
        break;
      }

      case 'outdoor_jacuzzi': {
        const tub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.75, 0.75, 0.45, 16),
          new THREE.MeshLambertMaterial({ color: 0x78350f })
        );
        tub.position.y = 0.225;

        const water = new THREE.Mesh(
          new THREE.CylinderGeometry(0.68, 0.68, 0.08, 16),
          new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 })
        );
        water.position.y = 0.35;
        group.add(tub, water);
        break;
      }

      case 'outdoor_fence': {
        const white = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        // 4 pickets & 2 horizontal rails
        for (let i = 0; i < 4; i++) {
          const picket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.03), white);
          picket.position.set(-0.45 + i * 0.3, 0.32, 0);
          group.add(picket);
        }
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.03), white);
        rail1.position.set(0, 0.2, 0);
        const rail2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.03), white);
        rail2.position.set(0, 0.48, 0);
        group.add(rail1, rail2);
        break;
      }

      case 'palm_tree': {
        // Redesigned Caribbean Palm: Curved tapered trunk & lush drooping frond canopy
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const frondMat1 = new THREE.MeshLambertMaterial({ color: 0x15803d });
        const frondMat2 = new THREE.MeshLambertMaterial({ color: 0x22c55e });
        const crownMat = new THREE.MeshLambertMaterial({ color: 0x65a30d });
        const nutMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });

        // Stacked organic curving trunk
        const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.9, 8), trunkMat);
        t1.position.y = 0.45;
        const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.9, 8), trunkMat);
        t2.position.set(0.03, 1.25, 0);
        t2.rotation.z = 0.06;
        const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.8, 8), trunkMat);
        t3.position.set(0.08, 2.05, 0);
        t3.rotation.z = 0.10;
        group.add(t1, t2, t3);

        // Crownshaft
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.35, 8), crownMat);
        crown.position.set(0.10, 2.55, 0);
        group.add(crown);

        // Tiered drooping fronds (8 radial leaves)
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          const isUpper = i % 2 === 0;
          const mat = isUpper ? frondMat1 : frondMat2;

          const frond = new THREE.Group();
          // Stem rising
          const stem = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.7), mat);
          stem.position.set(0, 0.15, 0.35);
          stem.rotation.x = isUpper ? 0.35 : 0.2;
          // Leaf tip drooping down
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 4), mat);
          tip.position.set(0, -0.05, 0.85);
          tip.rotation.x = -0.55;
          tip.rotation.y = Math.PI / 4;
          frond.add(stem, tip);

          frond.position.set(0.10, 2.7, 0);
          frond.rotation.y = angle;
          group.add(frond);
        }

        // 3 Coconuts
        for (let i = 0; i < 3; i++) {
          const nut = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), nutMat);
          nut.position.set(0.10 + Math.cos(i * 2.1) * 0.12, 2.45, Math.sin(i * 2.1) * 0.12);
          group.add(nut);
        }
        break;
      }

      case 'fountain': {
        // Redesigned Tiered Stone Fountain with glowing turquoise water
        const stoneMat = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
        const waterMat = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.45,
          transparent: true,
          opacity: 0.85
        });

        // Lower Basin Rim
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.35, 12), stoneMat);
        base.position.y = 0.175;
        // Water pool
        const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 12), waterMat);
        pool.position.y = 0.30;

        // Center Pillar
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.75, 8), stoneMat);
        col.position.y = 0.65;

        // Upper Basin
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.22, 10), stoneMat);
        upper.position.y = 1.05;
        const upWater = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 10), waterMat);
        upWater.position.y = 1.12;

        // Top finial
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), waterMat);
        top.position.y = 1.25;

        group.add(base, pool, col, upper, upWater, top);
        break;
      }

      case 'colonial_bench': {
        // Detailed park bench with wrought iron arms & mahogany slats
        const ironMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x92400e });

        // Left & right curved iron legs
        for (let x of [-0.55, 0.55]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.4), ironMat);
          leg.position.set(x, 0.18, 0);
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.4), ironMat);
          arm.position.set(x, 0.42, -0.05);
          group.add(leg, arm);
        }

        // 4 Mahogany seat slats
        for (let z of [-0.15, -0.05, 0.05, 0.15]) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.07), woodMat);
          slat.position.set(0, 0.35, z);
          group.add(slat);
        }

        // 2 Backrest slats
        for (let y of [0.50, 0.62]) {
          const backSlat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.03), woodMat);
          backSlat.position.set(0, y, -0.18);
          group.add(backSlat);
        }
        break;
      }

      case 'street_lamp': {
        // Hexagonal colonial street lamp with real light source
        const ironMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const lanternMat = new THREE.MeshLambertMaterial({
          color: 0xfef08a,
          emissive: 0xfde047,
          emissiveIntensity: 0.95
        });

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 8), ironMat);
        pole.position.y = 1.1;

        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.28), lanternMat);
        lantern.position.y = 2.3;

        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 4), ironMat);
        cap.position.y = 2.55;

        // Real PointLight to illuminate the ground
        const light = new THREE.PointLight(0xfef08a, 1.2, 6.0);
        light.position.y = 2.3;

        group.add(pole, lantern, cap, light);
        break;
      }

      case 'flower_pot': {
        const potMat = new THREE.MeshLambertMaterial({ color: 0xc2410c });
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
        const redFlowerMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
        const yellowFlowerMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });

        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.20, 0.35, 8), potMat);
        pot.position.y = 0.175;

        const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), foliageMat);
        foliage.position.y = 0.48;

        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 / 4) * i;
          const mat = i % 2 === 0 ? redFlowerMat : yellowFlowerMat;
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat);
          fl.position.set(Math.cos(angle) * 0.25, 0.52, Math.sin(angle) * 0.25);
          group.add(fl);
        }
        group.add(pot, foliage);
        break;
      }

      default: {
        const defMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
        );
        defMesh.position.y = 0.25;
        group.add(defMesh);
      }
    }

    group.rotation.y = dec.rotationY;
    this.scene.add(group);
    this.decorationMeshes.set(dec.instanceId, group);
  }

  public updatePositions(playerLng: number, playerLat: number): void {
    if (!this.scene) return;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);
    const visualScaleFactor = 3.8;

    for (const dec of this.placedDecorations.values()) {
      const mesh = this.decorationMeshes.get(dec.instanceId);
      if (mesh) {
        const dLng = dec.lng - playerLng;
        const dLat = dec.lat - playerLat;
        const dEastMeters = dLng * metersPerDegLng;
        const dNorthMeters = dLat * metersPerDegLat;

        mesh.position.set(dEastMeters / visualScaleFactor, 0, -dNorthMeters / visualScaleFactor);
      }
    }
  }

  public getPlacedCount(): number {
    return this.placedDecorations.size;
  }
}

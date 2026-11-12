import * as THREE from 'three';
import type { EconomyManager } from '../economy/economy-manager';
import type { MultiplayerManager } from '../multiplayer/multiplayer-manager';

export interface DecorationItem {
  id: string;
  name: string;
  category: 'urban' | 'nature' | 'lighting';
  icon: string;
  price: number;
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
  { id: 'palm_tree', name: 'Palmera Real', category: 'nature', icon: '🌴', price: 150 },
  { id: 'colonial_bench', name: 'Banco Colonial', category: 'urban', icon: '🛋️', price: 100 },
  { id: 'street_lamp', name: 'Farol de Calle', category: 'lighting', icon: '💡', price: 120 },
  { id: 'fountain', name: 'Fuente de Plaza', category: 'urban', icon: '⛲', price: 350 },
  { id: 'flower_pot', name: 'Maceta Floral', category: 'nature', icon: '🌺', price: 60 }
];

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
        const raw = localStorage.getItem('city_world_placed_decorations');
        if (raw) {
          const list = JSON.parse(raw) as PlacedDecoration[];
          list.forEach((d) => this.placedDecorations.set(d.instanceId, d));
        }
      }
    } catch (e) {
      console.warn('[DecorationManager] Error loading decorations:', e);
    }

    // If no decorations yet, pre-populate Plaza Santo Domingo with living 3D elements!
    if (this.placedDecorations.size === 0) {
      this.seedPlazaSantoDomingo();
    }
  }

  private seedPlazaSantoDomingo(): void {
    const defaultOwnerId = 'city_hall';
    const defaultOwnerName = 'Alcaldía de Cartagena';
    const initialDecorations: PlacedDecoration[] = [
      // Central Fountain
      {
        instanceId: 'seed_fountain_1',
        itemId: 'fountain',
        lng: -75.55200,
        lat: 10.42432,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0,
        placedAt: Date.now()
      },
      // 4 Caribbean Royal Palms
      {
        instanceId: 'seed_palm_1',
        itemId: 'palm_tree',
        lng: -75.55214,
        lat: 10.42444,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0.5,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_palm_2',
        itemId: 'palm_tree',
        lng: -75.55186,
        lat: 10.42444,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 1.2,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_palm_3',
        itemId: 'palm_tree',
        lng: -75.55214,
        lat: 10.42420,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 2.1,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_palm_4',
        itemId: 'palm_tree',
        lng: -75.55186,
        lat: 10.42420,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 3.0,
        placedAt: Date.now()
      },
      // Colonial Benches
      {
        instanceId: 'seed_bench_1',
        itemId: 'colonial_bench',
        lng: -75.55208,
        lat: 10.42432,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: Math.PI / 2,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_bench_2',
        itemId: 'colonial_bench',
        lng: -75.55192,
        lat: 10.42432,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: -Math.PI / 2,
        placedAt: Date.now()
      },
      // Warm Street Lamps
      {
        instanceId: 'seed_lamp_1',
        itemId: 'street_lamp',
        lng: -75.55218,
        lat: 10.42432,
        ownerId: defaultOwnerId,
        ownerName: defaultOwnerName,
        rotationY: 0,
        placedAt: Date.now()
      },
      {
        instanceId: 'seed_lamp_2',
        itemId: 'street_lamp',
        lng: -75.55182,
        lat: 10.42432,
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
        localStorage.setItem('city_world_placed_decorations', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('[DecorationManager] Error saving decorations:', e);
    }
  }

  public placeItem(
    itemId: string,
    lng: number,
    lat: number
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
      rotationY: Math.random() * Math.PI * 2,
      placedAt: Date.now()
    };

    this.placedDecorations.set(instanceId, placed);
    this.saveDecorations();

    if (this.scene) {
      this.createMeshForDecoration(placed);
    }

    return { success: true };
  }

  private rebuildAllMeshes(): void {
    if (!this.scene) return;
    this.decorationMeshes.forEach((mesh) => this.scene?.remove(mesh));
    this.decorationMeshes.clear();

    for (const dec of this.placedDecorations.values()) {
      this.createMeshForDecoration(dec);
    }
  }

  private createMeshForDecoration(dec: PlacedDecoration): void {
    if (!this.scene) return;

    const group = new THREE.Group();

    if (dec.itemId === 'palm_tree') {
      // Curved tropical trunk
      const trunkGeo = new THREE.CylinderGeometry(0.22, 0.36, 4.2, 7);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.1;
      trunk.rotation.z = 0.04;
      group.add(trunk);

      // Star of 6 lush Caribbean palm fronds
      const frondGeo = new THREE.BoxGeometry(0.35, 0.04, 1.8);
      const frondMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
      for (let i = 0; i < 6; i++) {
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.y = 4.1;
        frond.rotation.y = (Math.PI * 2 / 6) * i;
        frond.rotation.x = 0.35; // Droop slightly outward
        frond.translateZ(0.8);
        group.add(frond);
      }

      // Coconuts cluster
      const nutGeo = new THREE.SphereGeometry(0.14, 6, 6);
      const nutMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
      for (let i = 0; i < 3; i++) {
        const nut = new THREE.Mesh(nutGeo, nutMat);
        nut.position.set(Math.cos(i * 2.1) * 0.22, 3.95, Math.sin(i * 2.1) * 0.22);
        group.add(nut);
      }
    } else if (dec.itemId === 'colonial_bench') {
      // Wrought iron legs
      const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.55);
      const ironMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const leftLeg = new THREE.Mesh(legGeo, ironMat);
      leftLeg.position.set(-0.7, 0.22, 0);
      const rightLeg = new THREE.Mesh(legGeo, ironMat);
      rightLeg.position.set(0.7, 0.22, 0);
      group.add(leftLeg, rightLeg);

      // Varnished mahogany wooden seat slats
      const seatGeo = new THREE.BoxGeometry(1.6, 0.08, 0.5);
      const woodMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
      const seat = new THREE.Mesh(seatGeo, woodMat);
      seat.position.y = 0.44;
      group.add(seat);

      // Backrest
      const backGeo = new THREE.BoxGeometry(1.6, 0.35, 0.06);
      const back = new THREE.Mesh(backGeo, woodMat);
      back.position.set(0, 0.72, -0.22);
      group.add(back);
    } else if (dec.itemId === 'street_lamp') {
      // Ornate colonial lamp pole
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.2, 6);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.6;
      group.add(pole);

      // Glass lantern casing with warm golden lantern glow
      const lanternGeo = new THREE.BoxGeometry(0.42, 0.55, 0.42);
      const lanternMat = new THREE.MeshLambertMaterial({
        color: 0xfef08a,
        emissive: 0xfde047,
        emissiveIntensity: 0.9
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.y = 3.35;
      group.add(lantern);

      // Cap
      const capGeo = new THREE.ConeGeometry(0.38, 0.25, 4);
      const cap = new THREE.Mesh(capGeo, poleMat);
      cap.position.y = 3.75;
      group.add(cap);

      // Real PointLight to illuminate the plaza
      const light = new THREE.PointLight(0xfef08a, 1.4, 7.5);
      light.position.y = 3.35;
      group.add(light);
    } else {
      // Tiered Colonial Fountain (default / fountain)
      const stoneMat = new THREE.MeshLambertMaterial({ color: 0xcfd8dc });
      const waterMat = new THREE.MeshLambertMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4
      });

      // Lower Basin
      const baseGeo = new THREE.CylinderGeometry(1.7, 1.9, 0.5, 12);
      const base = new THREE.Mesh(baseGeo, stoneMat);
      base.position.y = 0.25;
      group.add(base);

      // Lower Water Pool
      const poolGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 12);
      const pool = new THREE.Mesh(poolGeo, waterMat);
      pool.position.y = 0.42;
      group.add(pool);

      // Center Column
      const colGeo = new THREE.CylinderGeometry(0.32, 0.45, 1.2, 8);
      const col = new THREE.Mesh(colGeo, stoneMat);
      col.position.y = 0.95;
      group.add(col);

      // Upper Basin
      const upperGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.35, 10);
      const upper = new THREE.Mesh(upperGeo, stoneMat);
      upper.position.y = 1.45;
      group.add(upper);

      // Upper Water
      const upWaterGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 10);
      const upWater = new THREE.Mesh(upWaterGeo, waterMat);
      upWater.position.y = 1.55;
      group.add(upWater);

      // Spout topper
      const spoutGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const spout = new THREE.Mesh(spoutGeo, waterMat);
      spout.position.y = 1.8;
      group.add(spout);
    }

    group.rotation.y = dec.rotationY;
    this.scene.add(group);
    this.decorationMeshes.set(dec.instanceId, group);
  }

  /**
   * Updates relative 3D positions of placed decorations relative to player [currentLng, currentLat].
   * Divides meters by 3.8 to match the cartoon visualScale used in ThreeCharacterLayer.
   */
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

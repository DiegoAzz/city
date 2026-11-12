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
      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.0, 6);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.0;
      group.add(trunk);

      // Leaves
      const leavesGeo = new THREE.ConeGeometry(2.2, 1.8, 6);
      const leavesMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.y = 4.2;
      group.add(leaves);
    } else if (dec.itemId === 'colonial_bench') {
      const benchGeo = new THREE.BoxGeometry(1.6, 0.45, 0.6);
      const benchMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.y = 0.25;
      group.add(bench);
    } else if (dec.itemId === 'street_lamp') {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 6);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.6;
      group.add(pole);

      const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.y = 3.2;
      group.add(light);
    } else {
      // Generic fountain / ornament
      const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.6, 8);
      const baseMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.3;
      group.add(base);
    }

    group.rotation.y = dec.rotationY;
    this.scene.add(group);
    this.decorationMeshes.set(dec.instanceId, group);
  }

  /**
   * Updates relative 3D positions of placed decorations relative to player [currentLng, currentLat].
   */
  public updatePositions(playerLng: number, playerLat: number): void {
    if (!this.scene) return;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);

    for (const dec of this.placedDecorations.values()) {
      const mesh = this.decorationMeshes.get(dec.instanceId);
      if (mesh) {
        const dLng = dec.lng - playerLng;
        const dLat = dec.lat - playerLat;
        const dEastMeters = dLng * metersPerDegLng;
        const dNorthMeters = dLat * metersPerDegLat;

        mesh.position.set(dEastMeters, 0, -dNorthMeters);
      }
    }
  }

  public getPlacedCount(): number {
    return this.placedDecorations.size;
  }
}

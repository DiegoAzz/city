import { RemodelPreset, RemodeledBuilding, RemodelPresetId } from './remodel-types';
import type { EconomyManager } from '../economy/economy-manager';
import type { MultiplayerManager } from '../multiplayer/multiplayer-manager';
import { distanceInMeters } from '../map/projection/mercator';

export const REMODEL_PRESETS: RemodelPreset[] = [
  {
    id: 'convention',
    name: 'Centro de Convenciones',
    icon: '🏛️',
    defaultName: 'Centro de Convenciones de Cartagena',
    defaultColor: '#f59e0b',
    rentPerMinute: 150,
    cost: 250,
    description: 'El gran icono arquitectónico para cumbres y eventos frente a la bahía.'
  },
  {
    id: 'hotel',
    name: 'Hotel Boutique 5★',
    icon: '🏨',
    defaultName: 'Hotel Boutique de la Candelaria',
    defaultColor: '#0284c7',
    rentPerMinute: 120,
    cost: 200,
    description: 'Exclusivo hotel boutique con balcones de madera tallada y suites coloniales.'
  },
  {
    id: 'restaurant',
    name: 'Restaurante Gourmet',
    icon: '🍽️',
    defaultName: 'Restaurante El Portal Colonial',
    defaultColor: '#ea580c',
    rentPerMinute: 90,
    cost: 150,
    description: 'Cocina caribeña de autor, mesas al aire libre bajo los faroles coloniales.'
  },
  {
    id: 'mansion',
    name: 'Casona del Marqués',
    icon: '🏰',
    defaultName: 'Casona Señorial Santo Domingo',
    defaultColor: '#10b981',
    rentPerMinute: 75,
    cost: 120,
    description: 'Residencia colonial privada con patio andaluz y portón de caoba.'
  },
  {
    id: 'cafe',
    name: 'Café de la Plaza',
    icon: '☕',
    defaultName: 'Café & Terraza San Alberto',
    defaultColor: '#db2777',
    rentPerMinute: 60,
    cost: 100,
    description: 'Café de especialidad colombiano con vista a la fuente y a los balcones.'
  },
  {
    id: 'custom',
    name: 'Diseño Libre',
    icon: '🎨',
    defaultName: 'Mi Inmueble Cartagena',
    defaultColor: '#f8fafc',
    rentPerMinute: 50,
    cost: 80,
    description: 'Personaliza a tu gusto la fachada y el rótulo de la edificación.'
  }
];

export class RemodelManager {
  private buildings: Map<string, RemodeledBuilding> = new Map();
  private onRemodelCallbacks: Array<(building: RemodeledBuilding) => void> = [];
  private onRentIncomeCallbacks: Array<(totalIncome: number, count: number) => void> = [];
  private rentIntervalTimer: number | null = null;

  constructor(
    private economy?: EconomyManager,
    private multiplayer?: MultiplayerManager
  ) {
    this.loadFromStorage();
    this.startRentPayoutCycle();
  }

  public getPresets(): RemodelPreset[] {
    return REMODEL_PRESETS;
  }

  public getPreset(id: RemodelPresetId): RemodelPreset {
    return REMODEL_PRESETS.find((p) => p.id === id) || REMODEL_PRESETS[0];
  }

  public getAllRemodeled(): RemodeledBuilding[] {
    return Array.from(this.buildings.values());
  }

  public getBuilding(id: string): RemodeledBuilding | undefined {
    return this.buildings.get(id);
  }

  public getClosestBuilding(
    lng: number,
    lat: number,
    radiusMeters: number = 35
  ): RemodeledBuilding | null {
    let closest: RemodeledBuilding | null = null;
    let minDist = radiusMeters;

    for (const b of this.buildings.values()) {
      const d = distanceInMeters([lng, lat], [b.lng, b.lat]);
      if (d < minDist) {
        minDist = d;
        closest = b;
      }
    }
    return closest;
  }

  public remodel(data: {
    id: string;
    name: string;
    presetId: RemodelPresetId;
    color: string;
    lng: number;
    lat: number;
    height?: number;
    polygon?: [number, number][];
  }): { success: boolean; reason?: string; building?: RemodeledBuilding } {
    const preset = this.getPreset(data.presetId);
    const cost = preset.cost;

    if (this.economy && !this.economy.canAfford(cost)) {
      return {
        success: false,
        reason: `Saldo insuficiente. Requiere $${cost} monedas (Tienes $${this.economy.getBalance()}).`
      };
    }

    if (this.economy) {
      this.economy.deduct(cost);
    }

    const myName = this.multiplayer?.getPlayerName() || 'Diego';
    const myId = this.multiplayer?.getMyId() || 'local_player';

    const building: RemodeledBuilding = {
      id: data.id,
      name: data.name || preset.defaultName,
      presetId: data.presetId,
      color: data.color || preset.defaultColor,
      ownerId: myId,
      ownerName: myName,
      rentPerMinute: preset.rentPerMinute,
      cost,
      lng: data.lng,
      lat: data.lat,
      height: data.height || 12,
      polygon: data.polygon,
      timestamp: Date.now()
    };

    this.buildings.set(building.id, building);
    this.saveToStorage();

    // Notify listeners
    this.onRemodelCallbacks.forEach((cb) => cb(building));

    return { success: true, building };
  }

  public onRemodel(callback: (building: RemodeledBuilding) => void): void {
    this.onRemodelCallbacks.push(callback);
  }

  public onRentIncome(callback: (totalIncome: number, count: number) => void): void {
    this.onRentIncomeCallbacks.push(callback);
  }

  private startRentPayoutCycle(): void {
    if (typeof window === 'undefined') return;

    // Every 60 seconds, collect passive rent from all remodeled buildings
    this.rentIntervalTimer = window.setInterval(() => {
      const myId = this.multiplayer?.getMyId() || 'local_player';
      let totalRent = 0;
      let count = 0;

      for (const b of this.buildings.values()) {
        if (b.ownerId === myId && b.rentPerMinute > 0) {
          totalRent += b.rentPerMinute;
          count++;
        }
      }

      if (totalRent > 0 && this.economy) {
        this.economy.add(totalRent);
        this.onRentIncomeCallbacks.forEach((cb) => cb(totalRent, count));
      }
    }, 60000);
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = Array.from(this.buildings.values());
      localStorage.setItem('the_fantastic_one_remodels', JSON.stringify(list));
    } catch (e) {
      console.warn('[RemodelManager] Failed to save remodels:', e);
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('the_fantastic_one_remodels');
      if (raw) {
        const list = JSON.parse(raw) as RemodeledBuilding[];
        list.forEach((b) => this.buildings.set(b.id, b));
      }
    } catch (e) {
      console.warn('[RemodelManager] Failed to load remodels:', e);
    }

    // Seed default landmark if empty: Centro de Convenciones & Casona Santo Domingo
    if (this.buildings.size === 0) {
      const defaultLandmark: RemodeledBuilding = {
        id: 'osm_convention_center_seed',
        name: 'Centro de Convenciones de Cartagena',
        presetId: 'convention',
        color: '#f59e0b',
        ownerId: 'city_architect',
        ownerName: 'Cartagena Colonial',
        rentPerMinute: 150,
        cost: 250,
        lng: -75.55218,
        lat: 10.42435,
        height: 14,
        timestamp: Date.now()
      };
      this.buildings.set(defaultLandmark.id, defaultLandmark);
    }
  }

  public dispose(): void {
    if (this.rentIntervalTimer !== null) {
      clearInterval(this.rentIntervalTimer);
      this.rentIntervalTimer = null;
    }
  }
}

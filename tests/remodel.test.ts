import { describe, it, expect, beforeEach } from 'vitest';
import { RemodelManager } from '../src/remodel/remodel-manager';
import { EconomyManager } from '../src/economy/economy-manager';

describe('Cartagena Remodel System (Phase 7)', () => {
  let economy: EconomyManager;
  let remodelManager: RemodelManager;

  beforeEach(() => {
    economy = new EconomyManager();
    economy.setBalance(1000);
    remodelManager = new RemodelManager(economy);
  });

  it('provides all 6 authentic architectural presets including Centro de Convenciones', () => {
    const presets = remodelManager.getPresets();
    expect(presets.length).toBe(6);
    expect(presets.some((p) => p.id === 'convention')).toBe(true);
    expect(presets.some((p) => p.id === 'hotel')).toBe(true);
    expect(presets.some((p) => p.id === 'restaurant')).toBe(true);

    const convention = remodelManager.getPreset('convention');
    expect(convention.rentPerMinute).toBe(150);
    expect(convention.cost).toBe(250);
  });

  it('successfully remodels an existing OSM building and deducts funds', () => {
    const result = remodelManager.remodel({
      id: 'osm_building_101',
      name: 'Centro de Convenciones de Cartagena',
      presetId: 'convention',
      color: '#f59e0b',
      lng: -75.55218,
      lat: 10.42435,
      height: 14
    });

    expect(result.success).toBe(true);
    expect(result.building).toBeDefined();
    expect(result.building?.name).toBe('Centro de Convenciones de Cartagena');
    expect(result.building?.rentPerMinute).toBe(150);
    expect(economy.getBalance()).toBe(750); // 1000 - 250
  });

  it('allows unlimited remodeling in sandbox mode with infinite funds', () => {
    economy.setBalance(50);
    const result = remodelManager.remodel({
      id: 'osm_building_102',
      name: 'Centro de Convenciones',
      presetId: 'convention',
      color: '#f59e0b',
      lng: -75.55218,
      lat: 10.42435
    });

    expect(result.success).toBe(true);
    expect(economy.canAfford(999999)).toBe(true);
  });

  it('locates closest remodeled landmark by coordinates', () => {
    remodelManager.remodel({
      id: 'bldg_santo_domingo',
      name: 'Hotel Boutique de la Candelaria',
      presetId: 'hotel',
      color: '#0284c7',
      lng: -75.55188,
      lat: 10.42452,
      height: 12
    });

    const closest = remodelManager.getClosestBuilding(-75.55189, 10.42451, 10);
    expect(closest).toBeDefined();
    expect(closest?.id).toBe('bldg_santo_domingo');
  });
});

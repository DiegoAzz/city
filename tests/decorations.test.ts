import { describe, it, expect } from 'vitest';
import { DecorationManager, DECORATION_CATALOG } from '../src/decorations/decoration-manager';
import { EconomyManager } from '../src/economy/economy-manager';

describe('Decoration Manager & 3D Catalog', () => {
  it('contains valid catalog items with reasonable prices', () => {
    expect(DECORATION_CATALOG.length).toBeGreaterThanOrEqual(4);
    const palm = DECORATION_CATALOG.find((d) => d.id === 'palm_tree');
    expect(palm).toBeDefined();
    expect(palm?.price).toBeGreaterThan(0);

    const fountain = DECORATION_CATALOG.find((d) => d.id === 'fountain');
    expect(fountain).toBeDefined();
    expect(fountain?.price).toBe(350);
  });

  it('pre-populates Plaza Santo Domingo with living seed decorations', () => {
    const mockMultiplayer: any = {
      getMyId: () => 'player_test',
      getPlayerName: () => 'Explorador',
      broadcastPropertyUpdate: () => {}
    };

    const economy = new EconomyManager();
    const manager = new DecorationManager(economy, mockMultiplayer);

    expect(manager.getPlacedCount()).toBeGreaterThanOrEqual(5);
  });

  it('deducts coins and places decoration when balance is sufficient', () => {
    const mockMultiplayer: any = {
      getMyId: () => 'player_test',
      getPlayerName: () => 'Explorador',
      broadcastPropertyUpdate: () => {}
    };

    const economy = new EconomyManager();
    economy.setBalance(500);

    const manager = new DecorationManager(economy, mockMultiplayer);
    const initialCount = manager.getPlacedCount();

    const result = manager.placeItem('palm_tree', -75.5520, 10.4243);
    expect(result.success).toBe(true);
    expect(manager.getPlacedCount()).toBe(initialCount + 1);
    expect(economy.getBalance()).toBe(500 - 150);
  });

  it('contains houses, modular structures, and furniture in catalog', () => {
    const colonialHouse = DECORATION_CATALOG.find((d) => d.id === 'house_colonial');
    expect(colonialHouse).toBeDefined();
    expect(colonialHouse?.category).toBe('houses');
    expect(colonialHouse?.rentPerMinute).toBe(45);

    const wall = DECORATION_CATALOG.find((d) => d.id === 'wall_plain');
    expect(wall).toBeDefined();
    expect(wall?.category).toBe('structures');

    const sofa = DECORATION_CATALOG.find((d) => d.id === 'furniture_sofa');
    expect(sofa).toBeDefined();
    expect(sofa?.category).toBe('furniture');
  });

  it('demolishes closest placed object and reimburses 80% to player', () => {
    const mockMultiplayer: any = {
      getMyId: () => 'player_test',
      getPlayerName: () => 'Explorador',
      broadcastPropertyUpdate: () => {}
    };

    const economy = new EconomyManager();
    economy.setBalance(1000);

    const manager = new DecorationManager(economy, mockMultiplayer);
    // Place a colonial house ($450)
    const placeRes = manager.placeItem('house_colonial', -75.55196, 10.42431);
    expect(placeRes.success).toBe(true);
    expect(economy.getBalance()).toBe(1000 - 450); // 550

    // Demolish from 1 meter away
    const demoRes = manager.demolishClosestItem(-75.55196, 10.42431, 5.0);
    expect(demoRes.success).toBe(true);
    expect(demoRes.refund).toBe(Math.round(450 * 0.8)); // 360
    expect(economy.getBalance()).toBe(550 + 360); // 910
  });
});

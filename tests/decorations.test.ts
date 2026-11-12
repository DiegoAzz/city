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

  it('rejects decoration placement when player cannot afford it', () => {
    const mockMultiplayer: any = {
      getMyId: () => 'player_test',
      getPlayerName: () => 'Explorador',
      broadcastPropertyUpdate: () => {}
    };

    const economy = new EconomyManager();
    economy.setBalance(50); // Less than fountain ($350)

    const manager = new DecorationManager(economy, mockMultiplayer);
    const result = manager.placeItem('fountain', -75.5520, 10.4243);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Requiere');
  });
});

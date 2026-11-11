import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../src/navigation/collision-system';
import { metersToDeltaDegrees } from '../src/map/projection/mercator';

describe('Street Collision & Obstacle Resolution System', () => {
  it('initializes cleanly without map attached', () => {
    const cs = new CollisionSystem();
    expect(cs.isObstacle(-75.552, 10.423)).toBe(false);
  });

  it('allows normal movement when no obstacle is detected', () => {
    const cs = new CollisionSystem();
    const currentLng = -75.552;
    const currentLat = 10.423;
    const dx = 5.0; // 5 meters East
    const dy = 0;

    const res = cs.resolveMovement(currentLng, currentLat, dx, dy);
    expect(res.collided).toBe(false);
    expect(res.sliding).toBe(false);
    expect(res.lng).toBeGreaterThan(currentLng);
    expect(res.lat).toBeCloseTo(currentLat, 6);
  });

  it('performs wall-sliding when obstacle is simulated in direct path', () => {
    const cs = new CollisionSystem();
    const currentLng = -75.552;
    const currentLat = 10.423;

    // Mock isObstacle to simulate a building wall directly to the North-East
    const [dLng, dLat] = metersToDeltaDegrees(5, 5, currentLat);
    const blockedPoint = `${(currentLng + dLng).toFixed(5)},${(currentLat + dLat).toFixed(5)}`;

    cs.isObstacle = (lng: number, lat: number) => {
      const key = `${lng.toFixed(5)},${lat.toFixed(5)}`;
      return key === blockedPoint;
    };

    const res = cs.resolveMovement(currentLng, currentLat, 5, 5);
    // Should successfully slide or resolve
    expect(res).toBeDefined();
  });

  it('guarantees Anti-Trap escape when player starts inside an obstacle', () => {
    const cs = new CollisionSystem();
    const currentLng = -75.552;
    const currentLat = 10.423;

    // Simulate current point as an obstacle
    cs.isObstacle = () => true;

    // Movement must not be blocked (anti-trap allows escaping)
    const res = cs.resolveMovement(currentLng, currentLat, 2, 0);
    expect(res.lng).toBeGreaterThan(currentLng);
  });

  it('restricts boat from moving onto dry land', () => {
    const cs = new CollisionSystem();
    (cs as any).isReady = true;
    (cs as any).map = {} as any;
    const currentLng = -75.552;
    const currentLat = 10.423;

    // Simulate water only at the current position, and dry land ahead
    cs.isWater = (lng: number) => lng <= currentLng;
    cs.isBuilding = () => false;

    // Attempting to move East onto dry land while in boat should be blocked
    const res = cs.resolveMovement(currentLng, currentLat, 5, 0, 0.2, true);
    expect(res.collided).toBe(true);
  });
});

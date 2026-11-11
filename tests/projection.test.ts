import { describe, it, expect } from 'vitest';
import {
  getMetersPerDegreeLat,
  getMetersPerDegreeLng,
  metersToDeltaDegrees,
  deltaDegreesToMeters,
  distanceInMeters,
  calculateBearing
} from '../src/map/projection/mercator';
import { isWithinCartagenaBounds, clampToCartagenaBounds } from '../src/map/geodata/cartagena';

describe('Geographic Projection & Metrics', () => {
  const cartagenaLat = 10.4233;

  it('calculates realistic meters per degree', () => {
    const latMeters = getMetersPerDegreeLat();
    const lngMeters = getMetersPerDegreeLng(cartagenaLat);

    // Earth circumference / 360 ~ 111,319 meters
    expect(latMeters).toBeGreaterThan(111000);
    expect(latMeters).toBeLessThan(112000);

    // At ~10.42° N, cos(10.42°) ~ 0.9835, so meters per lng degree is ~ 109,485 m
    expect(lngMeters).toBeGreaterThan(108000);
    expect(lngMeters).toBeLessThan(110500);
  });

  it('preserves distance in roundtrip meter-to-degree conversion', () => {
    const originalDx = 25.5; // 25.5 meters East
    const originalDy = -40.2; // 40.2 meters South

    const [dLng, dLat] = metersToDeltaDegrees(originalDx, originalDy, cartagenaLat);
    const [backDx, backDy] = deltaDegreesToMeters(dLng, dLat, cartagenaLat);

    expect(backDx).toBeCloseTo(originalDx, 4);
    expect(backDy).toBeCloseTo(originalDy, 4);
  });

  it('calculates verified distance between Cartagena landmarks', () => {
    // Plaza de Santo Domingo: [-75.5520, 10.4233]
    // Torre del Reloj: [-75.5489, 10.4225]
    const pSantoDomingo: [number, number] = [-75.5520, 10.4233];
    const pTorreReloj: [number, number] = [-75.5489, 10.4225];

    const dist = distanceInMeters(pSantoDomingo, pTorreReloj);

    // Actual distance is ~350 meters
    expect(dist).toBeGreaterThan(320);
    expect(dist).toBeLessThan(380);
  });

  it('calculates cardinal bearings correctly', () => {
    const center: [number, number] = [-75.5500, 10.4200];
    const north: [number, number] = [-75.5500, 10.4300];
    const east: [number, number] = [-75.5400, 10.4200];
    const south: [number, number] = [-75.5500, 10.4100];
    const west: [number, number] = [-75.5600, 10.4200];

    expect(calculateBearing(center, north)).toBeCloseTo(0, 1);
    expect(calculateBearing(center, east)).toBeCloseTo(90, 1);
    expect(calculateBearing(center, south)).toBeCloseTo(180, 1);
    expect(calculateBearing(center, west)).toBeCloseTo(270, 1);
  });

  it('verifies Cartagena bounding box enforcement', () => {
    // Plaza Santo Domingo inside bounds
    expect(isWithinCartagenaBounds(-75.5520, 10.4233)).toBe(true);

    // Bogota outside bounds
    expect(isWithinCartagenaBounds(-74.0721, 4.7110)).toBe(false);

    // Clamping an out-of-bounds point pulls it to the boundary
    const [cLng, cLat] = clampToCartagenaBounds(-76.0, 11.0);
    expect(cLng).toBe(-75.5680);
    expect(cLat).toBe(10.4480);
  });
});

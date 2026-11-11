import type { Map as MapLibreMap } from 'maplibre-gl';
import { metersToDeltaDegrees } from '../map/projection/mercator';
import { clampToCartagenaBounds } from '../map/geodata/cartagena';

export interface CollisionResult {
  lng: number;
  lat: number;
  collided: boolean;
  sliding: boolean;
  hitWater: boolean;
}

/**
 * Real-time street-only navigation & planar ground building collision system.
 * Uses 2D ground footprints (excluding 3D extruded roofs) so narrow colonial streets are never choked.
 * Features automatic Anti-Trap recovery: if spawned or pushed into a wall, movement is never locked.
 * Supports aquatic navigation for boats and triggers warnings when land vehicles encounter water.
 */
export class CollisionSystem {
  private map: MapLibreMap | null = null;
  private buildingLayers: string[] = ['collision-buildings-ground'];
  private waterLayers: string[] = ['water'];
  private isReady: boolean = false;
  private enabled: boolean = true;
  private onWaterWarningCallbacks: Array<() => void> = [];
  private onLandWarningCallbacks: Array<() => void> = [];
  private lastWaterWarningTime: number = 0;
  private lastLandWarningTime: number = 0;
  private readonly WARNING_COOLDOWN_MS: number = 3200;

  constructor() {}

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public onWaterWarning(cb: () => void): void {
    this.onWaterWarningCallbacks.push(cb);
  }

  public onLandWarning(cb: () => void): void {
    this.onLandWarningCallbacks.push(cb);
  }

  public init(map: MapLibreMap): void {
    this.map = map;
    this.detectLayers();
    this.map.on('styledata', () => this.detectLayers());
  }

  public detectLayers(): void {
    if (!this.map) return;
    try {
      const style = this.map.getStyle();
      if (!style || !style.layers) return;

      this.buildingLayers = style.layers
        .filter((l) => {
          if (l.type !== 'fill') return false;
          const srcLayer = ((l as any)['source-layer'] || '').toLowerCase();
          const id = l.id.toLowerCase();
          return id === 'collision-buildings-ground' || srcLayer === 'building';
        })
        .map((l) => l.id);

      this.waterLayers = style.layers
        .filter((l) => {
          if (l.type !== 'fill') return false;
          const srcLayer = ((l as any)['source-layer'] || '').toLowerCase();
          const id = l.id.toLowerCase();
          return srcLayer === 'water' || id === 'water';
        })
        .map((l) => l.id);

      this.isReady = this.buildingLayers.length > 0 || this.waterLayers.length > 0;
    } catch (e) {
      console.warn('[CollisionSystem] Layer detection notice:', e);
    }
  }

  public isWater(lng: number, lat: number): boolean {
    return this.queryHit(lng, lat, this.waterLayers);
  }

  /**
   * Checks if player is adjacent to or within distance of the sea, bay, or coastline.
   */
  public isNearWater(lng: number, lat: number, searchRadiusMeters: number = 18): boolean {
    if (!this.map || this.waterLayers.length === 0) return false;

    if (this.isWater(lng, lat)) return true;

    // Test 8 cardinal and intercardinal probes around player
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const dx = Math.cos(angle) * searchRadiusMeters;
      const dy = Math.sin(angle) * searchRadiusMeters;
      const [dLng, dLat] = metersToDeltaDegrees(dx, dy, lat);
      if (this.isWater(lng + dLng, lat + dLat)) {
        return true;
      }
    }
    return false;
  }

  public isBuilding(lng: number, lat: number): boolean {
    return this.queryHit(lng, lat, this.buildingLayers);
  }

  public isObstacle(lng: number, lat: number, isBoat: boolean = false): boolean {
    if (!this.enabled || !this.map || !this.isReady) {
      return false;
    }

    if (isBoat) {
      // Boat can ONLY sail in water! Dry land and buildings are impassable obstacles for a boat!
      return this.isBuilding(lng, lat) || !this.isWater(lng, lat);
    } else {
      // Land vehicles cannot cross buildings OR water!
      return this.isBuilding(lng, lat) || this.isWater(lng, lat);
    }
  }

  private queryHit(lng: number, lat: number, layers: string[]): boolean {
    if (!this.map || layers.length === 0) return false;
    try {
      const point = this.map.project([lng, lat]);
      const container = this.map.getContainer();

      if (
        point.x < 0 ||
        point.y < 0 ||
        point.x > container.clientWidth ||
        point.y > container.clientHeight
      ) {
        return false;
      }

      const hits = this.map.queryRenderedFeatures(point, { layers });
      return hits.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Resolves movement against buildings and water with smooth wall sliding and Anti-Trap recovery.
   */
  public resolveMovement(
    currentLng: number,
    currentLat: number,
    dxMeters: number,
    dyMeters: number,
    bumperMarginMeters: number = 0.20,
    isBoat: boolean = false
  ): CollisionResult {
    const moveDist = Math.hypot(dxMeters, dyMeters);
    if (moveDist < 1e-5) {
      return { lng: currentLng, lat: currentLat, collided: false, sliding: false, hitWater: false };
    }

    const [dLng, dLat] = metersToDeltaDegrees(dxMeters, dyMeters, currentLat);

    // --- 0. ANTI-TRAP / UNSTICK GUARANTEE ---
    const isCurrentlyStuck = this.isObstacle(currentLng, currentLat, isBoat);
    if (isCurrentlyStuck) {
      const [escLng, escLat] = clampToCartagenaBounds(currentLng + dLng, currentLat + dLat);
      return { lng: escLng, lat: escLat, collided: false, sliding: false, hitWater: false };
    }

    // Direction vector
    const dirX = dxMeters / moveDist;
    const dirY = dyMeters / moveDist;

    // 1. Direct candidate point
    const candidateLng = currentLng + dLng;
    const candidateLat = currentLat + dLat;

    // Subtle bumper probe ahead in direction of travel
    const probeDx = dxMeters + dirX * bumperMarginMeters;
    const probeDy = dyMeters + dirY * bumperMarginMeters;
    const [probeDLng, probeDLat] = metersToDeltaDegrees(probeDx, probeDy, currentLat);
    const probeLng = currentLng + probeDLng;
    const probeLat = currentLat + probeDLat;

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const hitWaterDirect = !isBoat && (this.isWater(probeLng, probeLat) || this.isWater(candidateLng, candidateLat));
    if (hitWaterDirect && (now - this.lastWaterWarningTime > this.WARNING_COOLDOWN_MS)) {
      this.lastWaterWarningTime = now;
      this.onWaterWarningCallbacks.forEach((cb) => cb());
    }

    const hitLandDirect = isBoat && (!this.isWater(probeLng, probeLat) || !this.isWater(candidateLng, candidateLat));
    if (hitLandDirect && (now - this.lastLandWarningTime > this.WARNING_COOLDOWN_MS)) {
      this.lastLandWarningTime = now;
      this.onLandWarningCallbacks.forEach((cb) => cb());
    }

    // If candidate path itself is free of obstacles: advance smoothly!
    if (!this.isObstacle(candidateLng, candidateLat, isBoat)) {
      const [finalLng, finalLat] = clampToCartagenaBounds(candidateLng, candidateLat);
      return { lng: finalLng, lat: finalLat, collided: false, sliding: false, hitWater: false };
    }

    // --- Path is obstructed by a wall! ---

    // 2. Try smaller step (50% distance) to approach edge without stopping abruptly
    const [halfDLng, halfDLat] = metersToDeltaDegrees(dxMeters * 0.5, dyMeters * 0.5, currentLat);
    const halfCandLng = currentLng + halfDLng;
    const halfCandLat = currentLat + halfDLat;
    if (!this.isObstacle(halfCandLng, halfCandLat, isBoat)) {
      const [finalLng, finalLat] = clampToCartagenaBounds(halfCandLng, halfCandLat);
      return { lng: finalLng, lat: finalLat, collided: true, sliding: false, hitWater: hitWaterDirect };
    }

    // 3. Wall Sliding: Try sliding along Longitude (East-West street slide)
    const [slideXLng, _] = metersToDeltaDegrees(dxMeters, 0, currentLat);
    const candSlideXLng = currentLng + slideXLng;
    if (!this.isObstacle(candSlideXLng, currentLat, isBoat)) {
      const [finalLng, finalLat] = clampToCartagenaBounds(candSlideXLng, currentLat);
      return { lng: finalLng, lat: finalLat, collided: true, sliding: true, hitWater: hitWaterDirect };
    }

    // 4. Wall Sliding: Try sliding along Latitude (North-South street slide)
    const [__, slideYLat] = metersToDeltaDegrees(0, dyMeters, currentLat);
    const candSlideYLat = currentLat + slideYLat;
    if (!this.isObstacle(currentLng, candSlideYLat, isBoat)) {
      const [finalLng, finalLat] = clampToCartagenaBounds(currentLng, candSlideYLat);
      return { lng: finalLng, lat: finalLat, collided: true, sliding: true, hitWater: hitWaterDirect };
    }

    // 5. Diagonal corner micro-slide (half-step slide)
    const [microXLng, ___] = metersToDeltaDegrees(dxMeters * 0.5, 0, currentLat);
    if (!this.isObstacle(currentLng + microXLng, currentLat, isBoat)) {
      const [finalLng, finalLat] = clampToCartagenaBounds(currentLng + microXLng, currentLat);
      return { lng: finalLng, lat: finalLat, collided: true, sliding: true, hitWater: hitWaterDirect };
    }

    const [____, microYLat] = metersToDeltaDegrees(0, dyMeters * 0.5, currentLat);
    if (!this.isObstacle(currentLng, currentLat + microYLat, isBoat)) {
      const [finalLng, finalLat] = clampToCartagenaBounds(currentLng, currentLat + microYLat);
      return { lng: finalLng, lat: finalLat, collided: true, sliding: true, hitWater: hitWaterDirect };
    }

    // 6. Stopped right before obstacle
    return { lng: currentLng, lat: currentLat, collided: true, sliding: false, hitWater: hitWaterDirect };
  }
}

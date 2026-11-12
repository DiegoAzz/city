import type { Map as MapLibreMap } from 'maplibre-gl';
import { CAMERA_CONFIG } from '../app/config';

export type CameraViewMode = 'thirdPerson' | 'isometric' | 'aerial';

export class CameraController {
  private map: MapLibreMap;
  private mode: CameraViewMode = 'thirdPerson';
  private targetLng: number;
  private targetLat: number;
  private currentLng: number;
  private currentLat: number;
  private isCinematic: boolean = false;
  private cinematicAngle: number = 30;

  constructor(map: MapLibreMap, initialLng: number, initialLat: number) {
    this.map = map;
    this.targetLng = initialLng;
    this.targetLat = initialLat;
    this.currentLng = initialLng;
    this.currentLat = initialLat;
  }

  public startCinematic(): void {
    this.isCinematic = true;
    this.cinematicAngle = this.map.getBearing() || 30;
    this.map.easeTo({
      pitch: 74,
      zoom: 19.8,
      duration: 800
    });
  }

  public stopCinematic(): void {
    this.isCinematic = false;
    this.applyModeSettings();
  }

  public updateCinematic(deltaSeconds: number): void {
    if (!this.isCinematic) return;
    this.cinematicAngle = (this.cinematicAngle + deltaSeconds * 5.0) % 360;
    this.map.setBearing(this.cinematicAngle);
  }

  public getIsCinematic(): boolean {
    return this.isCinematic;
  }

  public getMode(): CameraViewMode {
    return this.mode;
  }

  public setMode(mode: CameraViewMode): void {
    this.mode = mode;
    this.applyModeSettings();
  }

  public cycleMode(): CameraViewMode {
    if (this.mode === 'thirdPerson') {
      this.mode = 'isometric';
    } else if (this.mode === 'isometric') {
      this.mode = 'aerial';
    } else {
      this.mode = 'thirdPerson';
    }
    this.applyModeSettings();
    return this.mode;
  }

  public getModeLabel(): string {
    switch (this.mode) {
      case 'thirdPerson':
        return 'TPS';
      case 'isometric':
        return 'ISO';
      case 'aerial':
        return 'TOP';
    }
  }

  public zoomIn(delta: number = 0.4): void {
    const nextZoom = Math.min(22.0, this.map.getZoom() + delta);
    this.map.easeTo({ zoom: nextZoom, duration: 160 });
  }

  public zoomOut(delta: number = 0.4): void {
    const nextZoom = Math.max(15.0, this.map.getZoom() - delta);
    this.map.easeTo({ zoom: nextZoom, duration: 160 });
  }

  public rotateBy(deltaDegrees: number): void {
    const newBearing = (this.map.getBearing() + deltaDegrees + 360) % 360;
    this.map.setBearing(newBearing);
  }

  public tiltBy(deltaPitch: number): void {
    const current = this.map.getPitch();
    const newPitch = Math.max(10, Math.min(84, current + deltaPitch));
    this.map.setPitch(newPitch);
  }

  public setTarget(lng: number, lat: number): void {
    this.targetLng = lng;
    this.targetLat = lat;
  }

  public recenterImmediate(lng: number, lat: number): void {
    this.targetLng = lng;
    this.targetLat = lat;
    this.currentLng = lng;
    this.currentLat = lat;
    this.map.setCenter([lng, lat]);
  }

  /**
   * Smoothly interpolates camera tracking. Adapts follow speed dynamically based on travel velocity
   * and in Third-Person mode smoothly swings the camera behind player movement.
   */
  public update(deltaSeconds: number, speedMps: number = 0, playerBearingDeg?: number): void {
    const baseLerp = 0.14;
    const speedBonus = Math.min(0.22, (speedMps / 40.0) * 0.18);
    const lerpRate = Math.min(0.38, (baseLerp + speedBonus) * (deltaSeconds * 60.0));

    const dLng = this.targetLng - this.currentLng;
    const dLat = this.targetLat - this.currentLat;

    if (Math.abs(dLng) > 1e-7 || Math.abs(dLat) > 1e-7) {
      this.currentLng += dLng * lerpRate;
      this.currentLat += dLat * lerpRate;
      this.map.setCenter([this.currentLng, this.currentLat]);
    }

    // In third-person street mode, smoothly follow behind the avatar when moving
    if (this.mode === 'thirdPerson' && playerBearingDeg !== undefined && speedMps > 1.2 && !this.isCinematic) {
      let diff = playerBearingDeg - this.map.getBearing();
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      const turnLerp = Math.min(0.18, deltaSeconds * 2.2);
      this.map.setBearing((this.map.getBearing() + diff * turnLerp + 360) % 360);
    }
  }

  public getBearing(): number {
    return this.map.getBearing();
  }

  public getPitch(): number {
    return this.map.getPitch();
  }

  public getZoom(): number {
    return this.map.getZoom();
  }

  private applyModeSettings(): void {
    switch (this.mode) {
      case 'thirdPerson':
        // Close-up street action view (Roblox Brookhaven eye-level immersion)
        this.map.easeTo({
          pitch: 76,
          zoom: 20.6,
          duration: 600
        });
        break;

      case 'isometric':
        this.map.easeTo({
          pitch: CAMERA_CONFIG.isometricPitch,
          bearing: CAMERA_CONFIG.isometricBearing,
          zoom: 18.2,
          duration: 600
        });
        break;

      case 'aerial':
        // Top-down overhead map overview
        this.map.easeTo({
          pitch: 0,
          bearing: 0,
          zoom: 16.8,
          duration: 600
        });
        break;
    }
  }
}

import type { Map as MapLibreMap } from 'maplibre-gl';
import { CAMERA_CONFIG } from '../app/config';

export type CameraViewMode = 'isometric' | 'thirdPerson' | 'aerial';

export class CameraController {
  private map: MapLibreMap;
  private mode: CameraViewMode = 'isometric';
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
      pitch: 58,
      zoom: 17.5,
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
    if (this.mode === 'isometric') {
      this.mode = 'thirdPerson';
    } else if (this.mode === 'thirdPerson') {
      this.mode = 'aerial';
    } else {
      this.mode = 'isometric';
    }
    this.applyModeSettings();
    return this.mode;
  }

  public getModeLabel(): string {
    switch (this.mode) {
      case 'isometric':
        return 'ISO';
      case 'thirdPerson':
        return 'TPS';
      case 'aerial':
        return 'TOP';
    }
  }

  public zoomIn(delta: number = 0.4): void {
    const nextZoom = Math.min(20.0, this.map.getZoom() + delta);
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
    const newPitch = Math.max(10, Math.min(70, current + deltaPitch));
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
   * so high-speed vehicles (moto/car) never run off-screen or hitch.
   */
  public update(deltaSeconds: number, speedMps: number = 0): void {
    const baseLerp = 0.12;
    const speedBonus = Math.min(0.20, (speedMps / 40.0) * 0.15);
    const lerpRate = Math.min(0.35, (baseLerp + speedBonus) * (deltaSeconds * 60.0));

    const dLng = this.targetLng - this.currentLng;
    const dLat = this.targetLat - this.currentLat;

    if (Math.abs(dLng) > 1e-7 || Math.abs(dLat) > 1e-7) {
      this.currentLng += dLng * lerpRate;
      this.currentLat += dLat * lerpRate;
      this.map.setCenter([this.currentLng, this.currentLat]);
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
      case 'isometric':
        this.map.easeTo({
          pitch: CAMERA_CONFIG.isometricPitch,
          bearing: CAMERA_CONFIG.isometricBearing,
          zoom: 18.2,
          duration: 600
        });
        break;

      case 'thirdPerson':
        // Close-up street action view - big character, street level immersion
        this.map.easeTo({
          pitch: 65,
          zoom: 19.3,
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

import * as THREE from 'three';
import { RemodeledBuilding } from './remodel-types';

export class RemodelSignRenderer {
  private scene: THREE.Scene | null = null;
  private signGroups: Map<string, THREE.Group> = new Map();

  constructor() {}

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public updateBuildingSigns(buildings: RemodeledBuilding[]): void {
    if (!this.scene) return;

    const currentIds = new Set(buildings.map((b) => b.id));

    // Remove obsolete signs
    for (const [id, group] of this.signGroups.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(group);
        this.signGroups.delete(id);
      }
    }

    // Add or update signs
    buildings.forEach((b) => {
      let group = this.signGroups.get(b.id);
      if (!group) {
        group = this.createSignMesh(b);
        this.scene!.add(group);
        this.signGroups.set(b.id, group);
      }
    });
  }

  private createSignMesh(b: RemodeledBuilding): THREE.Group {
    const group = new THREE.Group();
    group.userData = { id: b.id, lng: b.lng, lat: b.lat, height: b.height || 12 };

    // 1. Wrought iron lamp post / sign pillar
    const postMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const postGeom = new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8);
    const postMesh = new THREE.Mesh(postGeom, postMat);
    postMesh.position.y = 2.1;
    group.add(postMesh);

    // 2. Hanging colonial lantern with warm light
    const lanternGeom = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(0, 4.1, 0);
    group.add(lantern);

    const light = new THREE.PointLight(0xfef08a, 1.8, 18, 1.5);
    light.position.set(0, 4.2, 0);
    group.add(light);

    // 3. Canvas Billboard with Building Name & Owner
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Rounded Card Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      this.drawRoundedRect(ctx, 10, 10, 492, 236, 28);
      ctx.fill();

      // Golden Colonial Border
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#f59e0b';
      this.drawRoundedRect(ctx, 10, 10, 492, 236, 28);
      ctx.stroke();

      // Top Accent strip matching building color
      ctx.fillStyle = b.color || '#f59e0b';
      this.drawRoundedRect(ctx, 14, 14, 484, 18, 9);
      ctx.fill();

      // Landmark Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      const cleanName = b.name.length > 22 ? b.name.substring(0, 21) + '…' : b.name;
      ctx.fillText(cleanName, 256, 95);

      // Subtitle / Preset Badge
      ctx.fillStyle = '#fde047';
      ctx.font = '600 24px "Montserrat", sans-serif';
      ctx.fillText(`👑 Propietario: ${b.ownerName || 'Ciudadano'}`, 256, 150);

      // Income Badge
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 22px "Montserrat", sans-serif';
      ctx.fillText(`💰 Ingresos: +$${b.rentPerMinute}/min · Inmueble Colonial`, 256, 195);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.4, 3.2, 1);
    sprite.position.set(0, 5.8, 0);
    group.add(sprite);

    return group;
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  public updatePositions(playerLng: number, playerLat: number): void {
    if (!this.scene) return;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);
    const visualScaleFactor = 3.8;

    for (const group of this.signGroups.values()) {
      const data = group.userData;
      if (data && typeof data.lng === 'number') {
        const dLng = data.lng - playerLng;
        const dLat = data.lat - playerLat;
        const dEastMeters = dLng * metersPerDegLng;
        const dNorthMeters = dLat * metersPerDegLat;

        group.position.set(
          dEastMeters * visualScaleFactor,
          0,
          -dNorthMeters * visualScaleFactor
        );
      }
    }
  }

  public dispose(): void {
    if (!this.scene) return;
    for (const group of this.signGroups.values()) {
      this.scene.remove(group);
    }
    this.signGroups.clear();
  }
}

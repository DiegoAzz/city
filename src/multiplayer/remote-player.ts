import * as THREE from 'three';
import { CharacterRigs, createCharacterMesh, MovementMode } from '../character/model/character-mesh';
import { CharacterAnimator } from '../character/animation/character-animator';
import { PlayerData } from './types';
import { PlayerBillboard } from './nametag';

export class RemotePlayer {
  public id: string;
  public name: string;
  public currentLng: number;
  public currentLat: number;
  public targetLng: number;
  public targetLat: number;
  public targetBearing: number = 0;
  public currentBearing: number = 0;
  public mode: MovementMode = 'foot';

  public rigs: CharacterRigs;
  public animator: CharacterAnimator;
  public billboard: PlayerBillboard;

  constructor(data: PlayerData, scene: THREE.Scene) {
    this.id = data.id;
    this.name = data.name;
    this.currentLng = data.lng;
    this.currentLat = data.lat;
    this.targetLng = data.lng;
    this.targetLat = data.lat;
    this.targetBearing = data.bearing;
    this.currentBearing = data.bearing;
    this.mode = data.mode;

    this.rigs = createCharacterMesh();
    this.animator = new CharacterAnimator(this.rigs);
    this.animator.setMovementMode(this.mode);

    // Add 3D Nametag & Speech Bubble above head
    this.billboard = new PlayerBillboard(this.name, this.mode);
    this.rigs.container.add(this.billboard.sprite);

    // Accent color customization for remote player
    if (data.color) {
      this.rigs.torso.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).material) {
          ((obj as THREE.Mesh).material as THREE.MeshLambertMaterial).color = new THREE.Color(data.color);
        }
      });
    }

    scene.add(this.rigs.root);
  }

  public updateData(data: PlayerData): void {
    this.targetLng = data.lng;
    this.targetLat = data.lat;
    this.targetBearing = data.bearing;

    if (this.mode !== data.mode) {
      this.mode = data.mode;
      this.animator.setMovementMode(data.mode);
      this.billboard.update(this.name, this.mode);
    }

    if (this.name !== data.name) {
      this.name = data.name;
      this.billboard.update(this.name, this.mode);
    }

    this.animator.setState(data.animState);
  }

  public showChatBubble(text: string): void {
    this.billboard.showSpeechBubble(text);
  }

  public update(deltaSeconds: number): void {
    // Smooth lerp toward target coordinates
    const lerpRate = Math.min(1.0, deltaSeconds * 12.0);
    this.currentLng = THREE.MathUtils.lerp(this.currentLng, this.targetLng, lerpRate);
    this.currentLat = THREE.MathUtils.lerp(this.currentLat, this.targetLat, lerpRate);

    // Smooth rotation lerp
    let diff = this.targetBearing - this.currentBearing;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    this.currentBearing += diff * lerpRate;

    const threeFacingRad = Math.PI - (this.currentBearing * Math.PI) / 180.0;
    this.animator.setFacingAngle(threeFacingRad);

    this.animator.update(deltaSeconds, 1.0, true);
  }

  public dispose(scene: THREE.Scene): void {
    this.billboard.dispose();
    scene.remove(this.rigs.root);
  }
}

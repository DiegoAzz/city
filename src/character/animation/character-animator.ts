import * as THREE from 'three';
import { CharacterRigs, MovementMode } from '../model/character-mesh';

export type CharacterAnimState = 'idle' | 'walk' | 'run' | 'jump' | 'driving';

export class CharacterAnimator {
  private rigs: CharacterRigs;
  private animTime: number = 0;
  private currentState: CharacterAnimState = 'idle';
  private currentMode: MovementMode = 'foot';
  private targetBearing: number = 0;
  private currentBearing: number = 0;

  constructor(rigs: CharacterRigs) {
    this.rigs = rigs;
  }

  public setState(state: CharacterAnimState): void {
    if (this.currentState !== state) {
      this.currentState = state;
    }
  }

  public getState(): CharacterAnimState {
    return this.currentState;
  }

  public setMovementMode(mode: MovementMode): void {
    this.currentMode = mode;
    this.rigs.vehicles.bicycle.visible = mode === 'bicycle';
    this.rigs.vehicles.motorcycle.visible = mode === 'motorcycle';
    this.rigs.vehicles.car.visible = mode === 'car';
    this.rigs.vehicles.boat.visible = mode === 'boat';
  }

  public setFacingAngle(targetRad: number): void {
    this.targetBearing = targetRad;
  }

  public update(deltaSeconds: number, speedMultiplier: number = 1.0, isGrounded: boolean = true): void {
    // 1. Smooth rotation toward target bearing
    this.updateRotation(deltaSeconds);

    // 2. Advance animation time
    let freq = 2.0;
    if (this.currentMode !== 'foot') {
      freq = 12.0 * speedMultiplier;
    } else if (this.currentState === 'walk') {
      freq = 8.5 * speedMultiplier;
    } else if (this.currentState === 'run') {
      freq = 15.0 * speedMultiplier;
    }

    this.animTime += deltaSeconds * freq;
    const t = this.animTime;

    // 3. Jump pose overrides ground animations if not grounded
    if (!isGrounded && this.currentMode === 'foot') {
      this.animateJump();
      return;
    }

    // 4. Vehicle Riding vs Foot locomotion
    if (this.currentMode !== 'foot') {
      this.animateRiding(t, speedMultiplier);
    } else {
      switch (this.currentState) {
        case 'idle':
          this.animateIdle(t, deltaSeconds);
          break;
        case 'walk':
          this.animateWalk(t);
          break;
        case 'run':
          this.animateRun(t);
          break;
      }
    }
  }

  private updateRotation(deltaSeconds: number): void {
    let diff = this.targetBearing - this.currentBearing;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const turnSpeed = 16.0;
    this.currentBearing += diff * Math.min(1.0, deltaSeconds * turnSpeed);
    this.rigs.container.rotation.y = this.currentBearing;
  }

  private animateJump(): void {
    // Both legs tuck upward slightly
    this.rigs.leftLeg.rotation.x = -0.55;
    this.rigs.rightLeg.rotation.x = -0.35;
    // Arms raise slightly in excitement
    this.rigs.leftArm.rotation.x = 0.65;
    this.rigs.rightArm.rotation.x = 0.65;
    this.rigs.head.rotation.x = -0.20;
    this.rigs.container.rotation.x = 0.10;
  }

  private animateRiding(t: number, speedMult: number): void {
    // Sitting / Driving pose:
    // Torso lowered slightly into seat
    const engineVibe = Math.sin(t * 2.0) * 0.015 * (speedMult > 0.05 ? 1.0 : 0.3);
    this.rigs.torso.position.y = 0.62 + engineVibe;

    // Arms forward holding handlebars/wheel
    this.rigs.leftArm.rotation.x = 0.75;
    this.rigs.rightArm.rotation.x = 0.75;

    // Legs seated forward
    this.rigs.leftLeg.rotation.x = -1.10;
    this.rigs.rightLeg.rotation.x = -1.10;

    // Lean slightly into turns or speed
    this.rigs.container.rotation.x = speedMult > 0.1 ? 0.08 : 0.0;
  }

  private animateIdle(t: number, dt: number): void {
    const breath = Math.sin(t);
    this.rigs.torso.position.y = 0.80 + breath * 0.015;
    this.rigs.head.rotation.x = breath * 0.03;
    this.rigs.head.rotation.z = Math.cos(t * 0.5) * 0.02;

    const lerpFactor = Math.min(1.0, dt * 8.0);
    this.rigs.leftLeg.rotation.x = THREE.MathUtils.lerp(this.rigs.leftLeg.rotation.x, 0, lerpFactor);
    this.rigs.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rigs.rightLeg.rotation.x, 0, lerpFactor);
    this.rigs.leftArm.rotation.x = THREE.MathUtils.lerp(this.rigs.leftArm.rotation.x, breath * 0.04, lerpFactor);
    this.rigs.rightArm.rotation.x = THREE.MathUtils.lerp(this.rigs.rightArm.rotation.x, -breath * 0.04, lerpFactor);
    this.rigs.container.rotation.x = THREE.MathUtils.lerp(this.rigs.container.rotation.x, 0, lerpFactor);

    this.rigs.shadow.scale.set(1.0 + breath * 0.03, 1.0 + breath * 0.03, 1.0);
  }

  private animateWalk(t: number): void {
    const legSwing = Math.sin(t) * 0.55;
    const armSwing = Math.sin(t) * 0.48;
    const bounce = Math.abs(Math.sin(t)) * 0.04;

    this.rigs.leftLeg.rotation.x = legSwing;
    this.rigs.rightLeg.rotation.x = -legSwing;
    this.rigs.leftArm.rotation.x = -armSwing;
    this.rigs.rightArm.rotation.x = armSwing;

    this.rigs.torso.position.y = 0.80 + bounce;
    this.rigs.container.rotation.x = 0.06;
    this.rigs.head.rotation.x = -bounce * 0.5;

    const shadowScale = 1.0 - bounce * 2.0;
    this.rigs.shadow.scale.set(shadowScale, shadowScale, 1.0);
  }

  private animateRun(t: number): void {
    const legSwing = Math.sin(t) * 0.90;
    const armSwing = Math.sin(t) * 0.80;
    const bounce = Math.abs(Math.sin(t)) * 0.08;

    this.rigs.leftLeg.rotation.x = legSwing;
    this.rigs.rightLeg.rotation.x = -legSwing;
    this.rigs.leftArm.rotation.x = -armSwing;
    this.rigs.rightArm.rotation.x = armSwing;

    this.rigs.torso.position.y = 0.80 + bounce;
    this.rigs.container.rotation.x = 0.16;

    const shadowScale = 1.0 - bounce * 2.5;
    this.rigs.shadow.scale.set(shadowScale, shadowScale, 1.0);
  }
}

import { CharacterRigs, createCharacterMesh, MovementMode } from '../model/character-mesh';
import { CharacterAnimator, CharacterAnimState } from '../animation/character-animator';
import { metersToDeltaDegrees } from '../../map/projection/mercator';
import { clampToCartagenaBounds } from '../../map/geodata/cartagena';
import type { CollisionSystem } from '../../navigation/collision-system';

export interface CharacterState {
  lng: number;
  lat: number;
  altitude: number;
  bearingDeg: number;
  speedMps: number;
  isRunning: boolean;
  isGrounded: boolean;
  movementMode: MovementMode;
  animState: CharacterAnimState;
}

export const SPEED_PRESETS: Record<MovementMode, { base: number; sprint: number }> = {
  foot: { base: 4.5, sprint: 9.0 },
  bicycle: { base: 8.5, sprint: 14.0 },
  motorcycle: { base: 14.0, sprint: 22.0 },
  car: { base: 16.0, sprint: 25.0 },
  boat: { base: 18.0, sprint: 28.0 }
};

export class CharacterController {
  public rigs: CharacterRigs;
  public animator: CharacterAnimator;

  private lng: number;
  private lat: number;
  private altitude: number = 0;
  private bearingDeg: number = 0;
  private currentSpeedMps: number = 0;
  private isRunning: boolean = false;
  private movementMode: MovementMode = 'foot';
  private collisionSystem: CollisionSystem | null = null;

  // Jump physics
  private verticalPosition: number = 0; // meters
  private verticalVelocity: number = 0; // m/s
  private isGrounded: boolean = true;
  private gravity: number = 22.0; // m/s^2

  constructor(initialLng: number, initialLat: number) {
    this.lng = initialLng;
    this.lat = initialLat;
    this.rigs = createCharacterMesh();
    this.animator = new CharacterAnimator(this.rigs);
    this.setMovementMode('foot');
  }

  public setMovementMode(mode: MovementMode): void {
    this.movementMode = mode;
    this.animator.setMovementMode(mode);
  }

  public setCollisionSystem(collisionSystem: CollisionSystem): void {
    this.collisionSystem = collisionSystem;
  }

  public getMovementMode(): MovementMode {
    return this.movementMode;
  }

  public jump(): boolean {
    if (!this.isGrounded) return false;
    this.verticalVelocity = 7.5; // Jump impulse m/s
    this.isGrounded = false;
    return true;
  }

  public setRunning(run: boolean): void {
    this.isRunning = run;
  }

  public toggleRunning(): boolean {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getPosition(): [number, number] {
    return [this.lng, this.lat];
  }

  public setPosition(lng: number, lat: number): void {
    const [cLng, cLat] = clampToCartagenaBounds(lng, lat);
    this.lng = cLng;
    this.lat = cLat;
  }

  public getState(): CharacterState {
    return {
      lng: this.lng,
      lat: this.lat,
      altitude: this.altitude + this.verticalPosition,
      bearingDeg: this.bearingDeg,
      speedMps: this.currentSpeedMps,
      isRunning: this.isRunning,
      isGrounded: this.isGrounded,
      movementMode: this.movementMode,
      animState: this.animator.getState()
    };
  }

  public update(
    deltaSeconds: number,
    joystickVector: { x: number; y: number },
    cameraBearingDeg: number
  ): void {
    // 1. Vertical Jump & Gravity Physics
    if (!this.isGrounded) {
      this.verticalPosition += this.verticalVelocity * deltaSeconds;
      this.verticalVelocity -= this.gravity * deltaSeconds;

      if (this.verticalPosition <= 0) {
        this.verticalPosition = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
      this.rigs.container.position.y = this.verticalPosition;
    }

    // 2. Horizontal Movement
    const magnitude = Math.hypot(joystickVector.x, joystickVector.y);
    const speedPreset = SPEED_PRESETS[this.movementMode];

    if (magnitude < 0.05) {
      this.currentSpeedMps = 0;
      this.animator.setState('idle');
      this.animator.update(deltaSeconds, 1.0, this.isGrounded);
      return;
    }

    const maxSpeed = this.isRunning ? speedPreset.sprint : speedPreset.base;
    const targetSpeed = magnitude * maxSpeed;
    this.currentSpeedMps = targetSpeed;

    const inputAngleRad = Math.atan2(joystickVector.x, joystickVector.y);
    const cameraBearingRad = (cameraBearingDeg * Math.PI) / 180.0;
    const worldMoveAngleRad = (cameraBearingRad + inputAngleRad + Math.PI * 2) % (Math.PI * 2);

    const threeFacingRad = Math.PI - worldMoveAngleRad;
    this.animator.setFacingAngle(threeFacingRad);
    this.bearingDeg = (worldMoveAngleRad * 180.0) / Math.PI;

    const moveDistMeters = targetSpeed * deltaSeconds;
    const dxMeters = Math.sin(worldMoveAngleRad) * moveDistMeters;
    const dyMeters = Math.cos(worldMoveAngleRad) * moveDistMeters;

    if (this.collisionSystem) {
      const isBoat = this.movementMode === 'boat';
      const bumperMargin = 0.12;
      const res = this.collisionSystem.resolveMovement(
        this.lng,
        this.lat,
        dxMeters,
        dyMeters,
        bumperMargin,
        isBoat
      );
      this.lng = res.lng;
      this.lat = res.lat;
    } else {
      const [deltaLng, deltaLat] = metersToDeltaDegrees(dxMeters, dyMeters, this.lat);
      const [nextLng, nextLat] = clampToCartagenaBounds(this.lng + deltaLng, this.lat + deltaLat);
      this.lng = nextLng;
      this.lat = nextLat;
    }

    const animState: CharacterAnimState = this.isRunning ? 'run' : 'walk';
    this.animator.setState(animState);
    const speedRatio = targetSpeed / speedPreset.base;
    this.animator.update(deltaSeconds, speedRatio, this.isGrounded);
  }
}

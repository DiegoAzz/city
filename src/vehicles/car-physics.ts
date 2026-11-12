export interface VehicleInput {
  throttle: number; // -1 (reverse/brake) to 1 (accelerate)
  steering: number; // -1 (left) to 1 (right)
  handbrake: boolean;
}

export class CarPhysics {
  // Speed in m/s (1 m/s = 3.6 km/h)
  public speed: number = 0;
  public maxForwardSpeed: number = 28.0; // ~100 km/h
  public maxReverseSpeed: number = 10.0; // ~36 km/h
  public acceleration: number = 18.0; // m/s^2
  public brakingDecel: number = 28.0; // m/s^2
  public naturalFriction: number = 7.0; // m/s^2

  // Steering
  public headingRad: number = 0; // Direction car is facing
  public steeringAngle: number = 0;
  public maxSteerAngle: number = 0.55; // radians (~31 degrees)
  public steerSpeed: number = 4.0;
  public returnSpeed: number = 6.0;

  // Drift & Slide
  public driftFactor: number = 0; // 0 = grip, 1 = full drift
  public isDrifting: boolean = false;

  constructor(initialHeadingRad: number = 0) {
    this.headingRad = initialHeadingRad;
  }

  public update(
    delta: number,
    joystickX: number,
    joystickY: number,
    cameraHeadingRad: number
  ): {
    speedMps: number;
    headingRad: number;
    driftFactor: number;
    isBraking: boolean;
  } {
    const magnitude = Math.hypot(joystickX, joystickY);

    if (magnitude < 0.08) {
      // Natural rolling friction deceleration
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.naturalFriction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.naturalFriction * delta);
      }
      this.isDrifting = false;
      this.driftFactor = Math.max(0, this.driftFactor - delta * 3.0);
      return {
        speedMps: this.speed,
        headingRad: this.headingRad,
        driftFactor: this.driftFactor,
        isBraking: false
      };
    }

    // Determine target travel direction based on camera and joystick input
    const inputAngle = Math.atan2(joystickX, joystickY);
    const targetHeadingRad = (cameraHeadingRad + inputAngle + Math.PI * 2) % (Math.PI * 2);

    // Calculate angular difference between current car heading and joystick target
    let angleDiff = targetHeadingRad - this.headingRad;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Throttle & Steer calculation
    const forwardAlignment = Math.cos(angleDiff);
    let isBraking = false;

    if (forwardAlignment >= 0.1) {
      // Accelerating forward
      const targetSpeed = magnitude * this.maxForwardSpeed;
      if (this.speed < targetSpeed) {
        this.speed = Math.min(targetSpeed, this.speed + this.acceleration * delta);
      } else {
        this.speed = Math.max(targetSpeed, this.speed - this.naturalFriction * delta);
      }

      // Turn towards target heading with speed-dependent turning radius
      const turnRate = (2.8 / (1.0 + Math.abs(this.speed) * 0.04)) * delta;
      this.headingRad += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate * Math.abs(angleDiff) * 3.0);

      // Detect drift when turning sharply at high speed
      if (Math.abs(angleDiff) > 0.7 && this.speed > 14.0) {
        this.isDrifting = true;
        this.driftFactor = Math.min(1.0, this.driftFactor + delta * 4.0);
      } else {
        this.isDrifting = false;
        this.driftFactor = Math.max(0, this.driftFactor - delta * 2.0);
      }
    } else {
      // Reversing or braking
      isBraking = this.speed > 3.0;
      if (this.speed > 0) {
        // Brake hard to stop first
        this.speed = Math.max(0, this.speed - this.brakingDecel * delta);
      } else {
        // Reverse
        const targetRev = -magnitude * this.maxReverseSpeed;
        this.speed = Math.max(targetRev, this.speed - this.acceleration * 0.6 * delta);
        const turnRate = 2.0 * delta;
        this.headingRad -= Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);
      }
      this.isDrifting = false;
      this.driftFactor = Math.max(0, this.driftFactor - delta * 2.0);
    }

    // Keep heading normalized
    this.headingRad = (this.headingRad + Math.PI * 2) % (Math.PI * 2);

    return {
      speedMps: this.speed,
      headingRad: this.headingRad,
      driftFactor: this.driftFactor,
      isBraking
    };
  }

  public reset(headingRad: number = 0): void {
    this.speed = 0;
    this.headingRad = headingRad;
    this.isDrifting = false;
    this.driftFactor = 0;
  }
}

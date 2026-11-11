export interface JoystickVector {
  x: number; // -1.0 (Left) to +1.0 (Right)
  y: number; // -1.0 (Down/Backward) to +1.0 (Up/Forward)
}

export class VirtualJoystick {
  private baseElement: HTMLElement;
  private stickElement: HTMLElement;
  private zoneElement: HTMLElement | null = null;
  private activePointerId: number | null = null;

  private baseCenter: { x: number; y: number } = { x: 0, y: 0 };
  private maxRadius: number = 44; // Maximum stick travel in px
  private deadzoneRadius: number = 5; // Ignore micro-jitters
  private currentVector: JoystickVector = { x: 0, y: 0 };

  // Keyboard controls state
  private keysPressed: { [key: string]: boolean } = {};
  private onVectorChangeCallbacks: Array<(vec: JoystickVector) => void> = [];

  constructor(baseElement: HTMLElement, stickElement: HTMLElement) {
    this.baseElement = baseElement;
    this.stickElement = stickElement;
    this.zoneElement = baseElement.closest('.joystick-zone') || baseElement.parentElement;

    this.bindEvents();
    this.bindKeyboard();
  }

  private bindEvents(): void {
    const target = this.zoneElement || this.baseElement;

    // Pointer Events
    target.addEventListener('pointerdown', this.handlePointerDown.bind(this), { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove.bind(this), { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp.bind(this), { passive: false });
    window.addEventListener('pointercancel', this.handlePointerUp.bind(this), { passive: false });

    // Touch Events fallback for older mobile engines
    target.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    window.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        this.keysPressed[key] = true;
        this.updateFromKeyboard();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (this.keysPressed[key]) {
        delete this.keysPressed[key];
        this.updateFromKeyboard();
      }
    });
  }

  private updateFromKeyboard(): void {
    let kx = 0;
    let ky = 0;

    if (this.keysPressed['w'] || this.keysPressed['arrowup']) ky += 1.0;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) ky -= 1.0;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) kx -= 1.0;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) kx += 1.0;

    const mag = Math.hypot(kx, ky);
    if (mag > 0) {
      this.currentVector = {
        x: kx / mag,
        y: ky / mag
      };
      const visualX = (kx / mag) * (this.maxRadius * 0.85);
      const visualY = -(ky / mag) * (this.maxRadius * 0.85);
      this.stickElement.style.transform = `translate(${visualX}px, ${visualY}px)`;
    } else if (this.activePointerId === null) {
      this.resetStick();
    }

    this.notifyVectorChange();
  }

  private calculateCenter(): void {
    const rect = this.baseElement.getBoundingClientRect();
    this.baseCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.activePointerId !== null) return;

    this.calculateCenter();
    this.activePointerId = e.pointerId;

    try {
      this.baseElement.setPointerCapture(e.pointerId);
    } catch (_err) {
      // Ignored if capture unsupported
    }

    this.updateStickPosition(e.clientX, e.clientY);
    e.preventDefault();
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activePointerId !== e.pointerId) return;

    this.updateStickPosition(e.clientX, e.clientY);
    e.preventDefault();
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.activePointerId !== e.pointerId) return;

    try {
      if (this.baseElement.hasPointerCapture(e.pointerId)) {
        this.baseElement.releasePointerCapture(e.pointerId);
      }
    } catch (_err) {
      // Ignored
    }

    this.activePointerId = null;
    this.resetStick();
    e.preventDefault();
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.activePointerId !== null || e.touches.length === 0) return;

    this.calculateCenter();
    const touch = e.touches[0];
    this.activePointerId = touch.identifier;
    this.updateStickPosition(touch.clientX, touch.clientY);
    e.preventDefault();
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.activePointerId === null) return;

    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.activePointerId) {
        this.updateStickPosition(e.touches[i].clientX, e.touches[i].clientY);
        e.preventDefault();
        break;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.activePointerId === null) return;

    let found = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.activePointerId) {
        found = true;
        break;
      }
    }

    if (!found) {
      this.activePointerId = null;
      this.resetStick();
      e.preventDefault();
    }
  }

  private updateStickPosition(clientX: number, clientY: number): void {
    const rawDx = clientX - this.baseCenter.x;
    const rawDy = clientY - this.baseCenter.y;

    const distance = Math.hypot(rawDx, rawDy);

    if (distance < this.deadzoneRadius) {
      this.currentVector = { x: 0, y: 0 };
      this.stickElement.style.transform = `translate(0px, 0px)`;
      this.notifyVectorChange();
      return;
    }

    const clampedDist = Math.min(distance, this.maxRadius);
    const angle = Math.atan2(rawDy, rawDx);

    const visualX = Math.cos(angle) * clampedDist;
    const visualY = Math.sin(angle) * clampedDist;

    this.stickElement.style.transform = `translate(${visualX}px, ${visualY}px)`;

    const normalizedIntensity = (clampedDist - this.deadzoneRadius) / (this.maxRadius - this.deadzoneRadius);
    this.currentVector = {
      x: Math.cos(angle) * normalizedIntensity,
      y: -Math.sin(angle) * normalizedIntensity // Screen Y is inverted: Up is positive
    };

    this.notifyVectorChange();
  }

  private resetStick(): void {
    this.currentVector = { x: 0, y: 0 };
    this.stickElement.style.transform = `translate(0px, 0px)`;
    this.notifyVectorChange();
  }

  public getVector(): JoystickVector {
    return this.currentVector;
  }

  public onVectorChange(callback: (vec: JoystickVector) => void): void {
    this.onVectorChangeCallbacks.push(callback);
  }

  private notifyVectorChange(): void {
    for (const cb of this.onVectorChangeCallbacks) {
      cb(this.currentVector);
    }
  }
}

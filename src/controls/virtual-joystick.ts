export interface JoystickVector {
  x: number; // -1.0 (Left) to +1.0 (Right)
  y: number; // -1.0 (Backward) to +1.0 (Forward)
}

/**
 * Invisible Floating Virtual Joystick.
 * Captures dynamic touch origin on the left half of the screen.
 * Produces proportional analog movement with deadzone, without permanent UI graphics.
 */
export class VirtualJoystick {
  private touchZone: HTMLElement;
  private dynamicCenter: { x: number; y: number } | null = null;
  private activePointerId: number | null = null;

  private maxRadius: number = 52; // Max travel radius in px
  private deadzoneRadius: number = 6; // Ignore micro-jitters
  private currentVector: JoystickVector = { x: 0, y: 0 };

  // Subtle visual feedback ring (optional faint element that follows thumb only during touch)
  private feedbackEl: HTMLElement | null = null;

  // Keyboard controls for desktop
  private keysPressed: { [key: string]: boolean } = {};
  private onVectorChangeCallbacks: Array<(vec: JoystickVector) => void> = [];

  constructor(touchZone: HTMLElement, feedbackElement?: HTMLElement | null) {
    this.touchZone = touchZone;
    this.feedbackEl = feedbackElement || null;

    this.bindPointerEvents();
    this.bindKeyboard();
  }

  private bindPointerEvents(): void {
    this.touchZone.addEventListener('pointerdown', this.handlePointerDown.bind(this), { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove.bind(this), { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp.bind(this), { passive: false });
    window.addEventListener('pointercancel', this.handlePointerUp.bind(this), { passive: false });

    // Touch fallback
    this.touchZone.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
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

  private handlePointerDown(e: PointerEvent): void {
    if (this.activePointerId !== null) return;

    // Ignore if touch hits interactive buttons (HUD, chips, modals)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.hud-chip') || target.closest('.game-dialog-card')) {
      return;
    }

    // Dynamic Origin: Wherever the user touches in the left zone becomes (0,0)
    this.activePointerId = e.pointerId;
    this.dynamicCenter = { x: e.clientX, y: e.clientY };

    try {
      this.touchZone.setPointerCapture(e.pointerId);
    } catch {}

    if (this.feedbackEl) {
      this.feedbackEl.style.left = `${e.clientX}px`;
      this.feedbackEl.style.top = `${e.clientY}px`;
      this.feedbackEl.classList.remove('hidden');
    }

    this.updateVector(e.clientX, e.clientY);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activePointerId !== e.pointerId || !this.dynamicCenter) return;
    this.updateVector(e.clientX, e.clientY);
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.activePointerId !== e.pointerId) return;

    try {
      if (this.touchZone.hasPointerCapture(e.pointerId)) {
        this.touchZone.releasePointerCapture(e.pointerId);
      }
    } catch {}

    this.resetState();
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.activePointerId !== null || e.touches.length === 0) return;
    const touch = e.touches[0];
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.hud-chip') || target.closest('.game-dialog-card')) {
      return;
    }

    this.activePointerId = touch.identifier;
    this.dynamicCenter = { x: touch.clientX, y: touch.clientY };

    if (this.feedbackEl) {
      this.feedbackEl.style.left = `${touch.clientX}px`;
      this.feedbackEl.style.top = `${touch.clientY}px`;
      this.feedbackEl.classList.remove('hidden');
    }

    this.updateVector(touch.clientX, touch.clientY);
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.activePointerId === null || !this.dynamicCenter) return;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.activePointerId) {
        this.updateVector(e.touches[i].clientX, e.touches[i].clientY);
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
      this.resetState();
    }
  }

  private updateVector(clientX: number, clientY: number): void {
    if (!this.dynamicCenter) return;

    const rawDx = clientX - this.dynamicCenter.x;
    const rawDy = clientY - this.dynamicCenter.y;
    const distance = Math.hypot(rawDx, rawDy);

    if (distance < this.deadzoneRadius) {
      this.currentVector = { x: 0, y: 0 };
      this.notifyVectorChange();
      return;
    }

    const clampedDist = Math.min(distance, this.maxRadius);
    const angle = Math.atan2(rawDy, rawDx);

    const normalizedIntensity = (clampedDist - this.deadzoneRadius) / (this.maxRadius - this.deadzoneRadius);
    this.currentVector = {
      x: Math.cos(angle) * normalizedIntensity,
      y: -Math.sin(angle) * normalizedIntensity // Screen Y inverted: Up is positive
    };

    this.notifyVectorChange();
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
    } else if (this.activePointerId === null) {
      this.currentVector = { x: 0, y: 0 };
    }

    this.notifyVectorChange();
  }

  private resetState(): void {
    this.activePointerId = null;
    this.dynamicCenter = null;
    this.currentVector = { x: 0, y: 0 };
    if (this.feedbackEl) {
      this.feedbackEl.classList.add('hidden');
    }
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

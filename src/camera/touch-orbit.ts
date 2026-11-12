import type { CameraController } from './camera-controller';

/**
 * Touch and pointer gesture handler for 360° orbit rotation, pitch tilt, and pinch zoom.
 * Allows player to freely rotate angle and zoom in/out with natural touch gestures.
 */
export class TouchOrbitController {
  private cameraController: CameraController;
  private container: HTMLElement;

  private isDragging: boolean = false;
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private lastPinchDistance: number | null = null;

  private startPointerX: number = 0;
  private startPointerY: number = 0;

  constructor(cameraController: CameraController, containerId: string = 'map-container') {
    this.cameraController = cameraController;
    const el = document.getElementById(containerId);
    this.container = el || document.body;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this), { passive: false });
    window.addEventListener('pointermove', this.onPointerMove.bind(this), { passive: false });
    window.addEventListener('pointerup', this.onPointerUp.bind(this), { passive: false });
    window.addEventListener('pointercancel', this.onPointerUp.bind(this), { passive: false });

    // Wheel zoom on desktop
    this.container.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
          this.cameraController.zoomIn(0.25);
        } else {
          this.cameraController.zoomOut(0.25);
        }
      },
      { passive: false }
    );
  }

  private onPointerDown(e: PointerEvent): void {
    // Ignore if clicking on interactive HUD elements
    const target = e.target as HTMLElement;
    if (
      target.closest('#hud-container button') ||
      target.closest('.gamer-dock-left') ||
      target.closest('.gamer-dock-right') ||
      target.closest('.hud-chip') ||
      target.closest('.chat-system') ||
      target.closest('.game-dialog-card')
    ) {
      return;
    }

    // Left half of screen is reserved for invisible movement joystick (unless 2-finger pinch)
    if (e.clientX < window.innerWidth * 0.48 && this.activePointers.size === 0) {
      return;
    }

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 1) {
      this.isDragging = true;
      this.startPointerX = e.clientX;
      this.startPointerY = e.clientY;
    } else if (this.activePointers.size === 2) {
      this.isDragging = false;
      this.lastPinchDistance = this.calculatePinchDistance();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.activePointers.has(e.pointerId)) return;

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 2-Finger Pinch to Zoom
    if (this.activePointers.size === 2) {
      const currentDistance = this.calculatePinchDistance();
      if (this.lastPinchDistance !== null && currentDistance !== null) {
        const deltaDistance = currentDistance - this.lastPinchDistance;
        if (Math.abs(deltaDistance) > 2) {
          const zoomDelta = (deltaDistance / 140.0);
          if (zoomDelta > 0) {
            this.cameraController.zoomIn(zoomDelta);
          } else {
            this.cameraController.zoomOut(Math.abs(zoomDelta));
          }
          this.lastPinchDistance = currentDistance;
        }
      }
      return;
    }

    // 1-Finger Drag to Orbit Angle & Tilt
    if (this.isDragging && this.activePointers.size === 1) {
      const deltaX = e.clientX - this.startPointerX;
      const deltaY = e.clientY - this.startPointerY;

      this.startPointerX = e.clientX;
      this.startPointerY = e.clientY;

      // Sensitivity tuned for smooth mobile touch
      const rotSensitivity = 0.35;
      const tiltSensitivity = 0.22;

      this.cameraController.rotateBy(deltaX * rotSensitivity);
      this.cameraController.tiltBy(-deltaY * tiltSensitivity);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.lastPinchDistance = null;
    } else if (this.activePointers.size === 1) {
      this.lastPinchDistance = null;
      const remaining = Array.from(this.activePointers.values())[0];
      this.startPointerX = remaining.x;
      this.startPointerY = remaining.y;
      this.isDragging = true;
    }
  }

  private calculatePinchDistance(): number | null {
    if (this.activePointers.size < 2) return null;
    const pts = Array.from(this.activePointers.values());
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }
}

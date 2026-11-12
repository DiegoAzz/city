export class OrientationManager {
  private guardElement: HTMLElement | null = null;
  private btnFullscreen: HTMLElement | null = null;
  private isLandscape: boolean = false;
  private onOrientationCallbacks: Array<(isLandscape: boolean) => void> = [];

  constructor() {
    this.guardElement = document.getElementById('orientation-guard');
    this.btnFullscreen = document.getElementById('btn-request-fullscreen');

    this.checkOrientation();
    this.bindEvents();
    this.tryLockOrientation();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.checkOrientation());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
    });

    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => this.checkOrientation());
    }

    // Attempt fullscreen & landscape lock on user interaction
    this.btnFullscreen?.addEventListener('click', () => {
      this.requestFullscreenAndLock();
    });

    // Also attempt lock on any first user tap on body
    const unlockOnFirstTouch = () => {
      this.tryLockOrientation();
      window.removeEventListener('pointerdown', unlockOnFirstTouch);
    };
    window.addEventListener('pointerdown', unlockOnFirstTouch, { once: true });
  }

  public checkOrientation(): boolean {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isNowLandscape = width >= height;

    this.isLandscape = isNowLandscape;

    if (this.guardElement) {
      if (isNowLandscape) {
        this.guardElement.classList.add('hidden');
      } else {
        this.guardElement.classList.remove('hidden');
      }
    }

    for (const cb of this.onOrientationCallbacks) {
      cb(isNowLandscape);
    }

    return isNowLandscape;
  }

  public async tryLockOrientation(): Promise<void> {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // Browsers often require fullscreen before orientation lock is allowed; silently catch
    }
  }

  public async requestFullscreenAndLock(): Promise<void> {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      }
      await this.tryLockOrientation();
    } catch (e) {
      console.info('[OrientationManager] Fullscreen notice:', e);
    }
    this.checkOrientation();
  }

  public getIsLandscape(): boolean {
    return this.isLandscape;
  }

  public onOrientationChange(callback: (isLandscape: boolean) => void): void {
    this.onOrientationCallbacks.push(callback);
  }
}

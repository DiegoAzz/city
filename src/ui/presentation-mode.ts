export class PresentationMode {
  private isStreamMode: boolean = false;
  private hudContainer: HTMLElement | null = null;
  private exitButton: HTMLElement | null = null;
  private onChangeCallbacks: Array<(enabled: boolean) => void> = [];
  private screenRestoreHandler: ((e: Event) => void) | null = null;

  constructor() {
    this.hudContainer = document.getElementById('hud-container');
    this.exitButton = document.getElementById('btn-exit-stream');

    if (this.exitButton) {
      this.exitButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setStreamMode(false);
      });
    }
  }

  public isEnabled(): boolean {
    return this.isStreamMode;
  }

  public setStreamMode(enabled: boolean): void {
    this.isStreamMode = enabled;

    if (this.hudContainer) {
      if (enabled) {
        this.hudContainer.classList.add('stream-mode');
      } else {
        this.hudContainer.classList.remove('stream-mode');
      }
    }

    if (this.exitButton) {
      if (enabled) {
        this.exitButton.classList.remove('hidden');
      } else {
        this.exitButton.classList.add('hidden');
      }
    }

    // Clean up any existing screen listener
    if (this.screenRestoreHandler) {
      window.removeEventListener('pointerdown', this.screenRestoreHandler);
      this.screenRestoreHandler = null;
    }

    // When stream mode is enabled:
    // ANY tap or touch anywhere on screen after 250ms automatically restores the full HUD!
    if (enabled) {
      setTimeout(() => {
        if (!this.isStreamMode) return;
        this.screenRestoreHandler = () => {
          this.setStreamMode(false);
        };
        window.addEventListener('pointerdown', this.screenRestoreHandler, { once: true });
      }, 250);
    }

    for (const cb of this.onChangeCallbacks) {
      cb(enabled);
    }
  }

  public toggle(): boolean {
    this.setStreamMode(!this.isStreamMode);
    return this.isStreamMode;
  }

  public onChange(callback: (enabled: boolean) => void): void {
    this.onChangeCallbacks.push(callback);
  }
}

export class PerfMonitor {
  private frames: number = 0;
  private fps: number = 0;
  private frameMs: number = 0;
  private sampleTime: number = performance.now();

  private elFps: HTMLElement | null = null;
  private elMs: HTMLElement | null = null;
  private elDpr: HTMLElement | null = null;
  private elCoords: HTMLElement | null = null;
  private elSpeed: HTMLElement | null = null;
  private elTarget: HTMLElement | null = null;

  private onFpsUpdateCallbacks: Array<(fps: number) => void> = [];

  constructor() {
    this.elFps = document.getElementById('stat-fps');
    this.elMs = document.getElementById('stat-ms');
    this.elDpr = document.getElementById('stat-dpr');
    this.elCoords = document.getElementById('stat-coords');
    this.elSpeed = document.getElementById('stat-speed');
    this.elTarget = document.getElementById('stat-target');
  }

  public recordFrame(now: number, deltaMs: number): void {
    this.frames++;
    this.frameMs = deltaMs;

    // Sample every 500ms
    if (now - this.sampleTime >= 500) {
      this.fps = Math.round((this.frames * 1000) / (now - this.sampleTime));
      this.frames = 0;
      this.sampleTime = now;

      if (this.elFps) this.elFps.textContent = `${this.fps}`;
      if (this.elMs) this.elMs.textContent = `${this.frameMs.toFixed(1)}`;

      for (const cb of this.onFpsUpdateCallbacks) {
        cb(this.fps);
      }
    }
  }

  public updateTelemetry(
    coords: [number, number],
    speedMps: number,
    dpr: number,
    targetFps: number
  ): void {
    if (this.elCoords) {
      this.elCoords.textContent = `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
    }
    if (this.elSpeed) {
      this.elSpeed.textContent = `${speedMps.toFixed(1)} m/s`;
    }
    if (this.elDpr) {
      this.elDpr.textContent = `${dpr.toFixed(2)}`;
    }
    if (this.elTarget) {
      this.elTarget.textContent = `${targetFps}`;
    }
  }

  public getFps(): number {
    return this.fps;
  }

  public onFpsSample(callback: (fps: number) => void): void {
    this.onFpsUpdateCallbacks.push(callback);
  }
}

export type QualityProfileName = 'ahorro' | 'equilibrado' | 'alto';

export interface QualityProfile {
  name: QualityProfileName;
  label: string;
  targetFps: number;
  dpr: number;
  minFrameIntervalMs: number;
  enable3DBuildings: boolean;
  description: string;
}

export const QUALITY_PROFILES: Record<QualityProfileName, QualityProfile> = {
  ahorro: {
    name: 'ahorro',
    label: '🔋 30 FPS',
    targetFps: 30,
    dpr: 1.0,
    minFrameIntervalMs: 1000 / 30,
    enable3DBuildings: false,
    description: 'Máxima duración de batería y temperatura baja.'
  },
  equilibrado: {
    name: 'equilibrado',
    label: '⚡ 45 FPS',
    targetFps: 45,
    dpr: 1.25,
    minFrameIntervalMs: 1000 / 45,
    enable3DBuildings: true,
    description: 'Perfil óptimo para Adreno 710 con 3D activo.'
  },
  alto: {
    name: 'alto',
    label: '🚀 60 FPS',
    targetFps: 60,
    dpr: 1.5,
    minFrameIntervalMs: 1000 / 60,
    enable3DBuildings: true,
    description: 'Máxima fluidez y nitidez visual.'
  }
};

export class QualityManager {
  private currentProfile: QualityProfile;
  private onProfileChangeCallbacks: Array<(profile: QualityProfile) => void> = [];
  private consecutiveLowFpsSeconds: number = 0;
  private autoAdaptEnabled: boolean = true;

  constructor(initialProfileName: QualityProfileName = 'equilibrado') {
    this.currentProfile = QUALITY_PROFILES[initialProfileName] || QUALITY_PROFILES.equilibrado;
  }

  public getProfile(): QualityProfile {
    return this.currentProfile;
  }

  public setProfile(name: QualityProfileName): void {
    if (QUALITY_PROFILES[name]) {
      this.currentProfile = QUALITY_PROFILES[name];
      this.consecutiveLowFpsSeconds = 0;
      this.notifyProfileChange();
    }
  }

  public cycleNextProfile(): QualityProfile {
    const order: QualityProfileName[] = ['ahorro', 'equilibrado', 'alto'];
    const currentIndex = order.indexOf(this.currentProfile.name);
    const nextIndex = (currentIndex + 1) % order.length;
    this.setProfile(order[nextIndex]);
    return this.currentProfile;
  }

  /**
   * Evaluates performance and can auto-downscale if sustained low FPS is detected.
   */
  public reportFps(currentFps: number): void {
    if (!this.autoAdaptEnabled) return;

    const threshold = this.currentProfile.targetFps * 0.72; // e.g. < 32 FPS on 45 FPS profile
    if (currentFps < threshold) {
      this.consecutiveLowFpsSeconds += 1.0;
      if (this.consecutiveLowFpsSeconds >= 5.0) {
        this.stepDownProfile();
        this.consecutiveLowFpsSeconds = 0;
      }
    } else {
      this.consecutiveLowFpsSeconds = Math.max(0, this.consecutiveLowFpsSeconds - 0.5);
    }
  }

  private stepDownProfile(): void {
    if (this.currentProfile.name === 'alto') {
      console.info('[QualityManager] Auto-adapting quality: Alto -> Equilibrado');
      this.setProfile('equilibrado');
    } else if (this.currentProfile.name === 'equilibrado') {
      console.info('[QualityManager] Auto-adapting quality: Equilibrado -> Ahorro');
      this.setProfile('ahorro');
    }
  }

  public onProfileChange(callback: (profile: QualityProfile) => void): void {
    this.onProfileChangeCallbacks.push(callback);
  }

  private notifyProfileChange(): void {
    for (const cb of this.onProfileChangeCallbacks) {
      cb(this.currentProfile);
    }
  }
}

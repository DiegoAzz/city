import { QualityProfileName } from '../graphics/quality-manager';
import { CameraViewMode } from '../camera/camera-controller';

export interface SavedPreferences {
  qualityProfile: QualityProfileName;
  cameraMode: CameraViewMode;
  lastPosition?: [number, number]; // [lng, lat]
  streamMode: boolean;
}

const STORAGE_KEY = 'street_explorer_mobile_v1_prefs';

export class LocalStore {
  public static load(): SavedPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Never restore stream mode on reload so controls are always visible
        parsed.streamMode = false;
        return parsed;
      }
    } catch (e) {
      console.warn('[LocalStore] Could not read preferences from localStorage:', e);
    }

    return {
      qualityProfile: 'equilibrado',
      cameraMode: 'isometric',
      streamMode: false
    };
  }

  public static save(prefs: Partial<SavedPreferences>): void {
    try {
      const current = this.load();
      const updated = { ...current, ...prefs, streamMode: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[LocalStore] Could not save preferences to localStorage:', e);
    }
  }
}

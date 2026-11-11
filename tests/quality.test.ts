import { describe, it, expect } from 'vitest';
import { QualityManager } from '../src/graphics/quality-manager';

describe('Quality Manager & Performance Profiles', () => {
  it('initializes with equilibrado profile as default for Adreno 710', () => {
    const qm = new QualityManager();
    const profile = qm.getProfile();

    expect(profile.name).toBe('equilibrado');
    expect(profile.targetFps).toBe(45);
    expect(profile.dpr).toBe(1.25);
    expect(profile.enable3DBuildings).toBe(true);
  });

  it('cycles profiles correctly (ahorro -> equilibrado -> alto)', () => {
    const qm = new QualityManager('ahorro');
    expect(qm.getProfile().name).toBe('ahorro');

    qm.cycleNextProfile();
    expect(qm.getProfile().name).toBe('equilibrado');

    qm.cycleNextProfile();
    expect(qm.getProfile().name).toBe('alto');

    qm.cycleNextProfile();
    expect(qm.getProfile().name).toBe('ahorro');
  });

  it('automatically adapts down profile when sustained low FPS is reported', () => {
    const qm = new QualityManager('alto');
    expect(qm.getProfile().name).toBe('alto');

    // Report sustained low FPS (e.g. 25 FPS when target is 60) for 5 seconds
    for (let i = 0; i < 6; i++) {
      qm.reportFps(25);
    }

    // Should step down to equilibrado
    expect(qm.getProfile().name).toBe('equilibrado');

    // Continue reporting low FPS on equilibrado (e.g. 20 FPS when target is 45) for 5 seconds
    for (let i = 0; i < 6; i++) {
      qm.reportFps(20);
    }

    // Should step down to ahorro
    expect(qm.getProfile().name).toBe('ahorro');
  });
});

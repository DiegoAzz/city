import { MovementMode } from '../character/model/character-mesh';

/**
 * Pure Web Audio API procedural sound synthesizer.
 * Generates responsive vehicle engines, cartoon footsteps, jumps, horns, water splashes,
 * and marine foghorns with zero external asset downloads or latency.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Active engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineMode: MovementMode | null = null;

  private lastFootstepTime: number = 0;
  private lastWarningTime: number = 0;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
    const unlockAudio = () => {
      this.initContext();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
  }

  private initContext(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('[SoundSystem] Web Audio API init notice:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Cartoon footstep pop when walking or sprinting
   */
  public playFootstep(isRunning: boolean = false): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
    const now = performance.now();
    const interval = isRunning ? 220 : 380;
    if (now - this.lastFootstepTime < interval) return;
    this.lastFootstepTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isRunning ? 95 : 75, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch {}
  }

  /**
   * Cartoon spring jump whoosh
   */
  public playJump(): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.18);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.21);
    } catch {}
  }

  /**
   * Alert chime when water blocks land travel
   */
  public playWaterWarning(): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
    const now = performance.now();
    if (now - this.lastWarningTime < 1800) return; // Debounce so it doesn't spam
    this.lastWarningTime = now;

    try {
      const t = this.ctx.currentTime;
      [
        { freq: 520, delay: 0 },
        { freq: 415, delay: 0.12 }
      ].forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, t + note.delay);

        gain.gain.setValueAtTime(0.40, t + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.delay + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + note.delay);
        osc.stop(t + note.delay + 0.30);
      });
    } catch {}
  }

  /**
   * Water splash sound when boarding boat or cutting through water
   */
  public playWaterSplash(): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;

    try {
      // White noise buffer for water surge
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.24);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.40, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      noise.start();
    } catch {}
  }

  /**
   * Horn sound tailored to current vehicle:
   * Bike: ding-ding bell
   * Moto/Car: beep-beep horn
   * Boat: deep maritime foghorn
   */
  public playBuildSuccess(): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 triumph chime
      notes.forEach((freq, idx) => {
        const delay = idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + delay);
        gain.gain.setValueAtTime(0.35, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + delay);
        osc.stop(t + delay + 0.24);
      });
    } catch {}
  }

  public playDemolish(): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.28);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch {}
  }

  public playHorn(mode: MovementMode): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;

    try {
      const t = this.ctx.currentTime;

      if (mode === 'bicycle') {
        // High crisp bell
        [0, 0.09].forEach((delay) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1950, t + delay);
          gain.gain.setValueAtTime(0.45, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.16);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + delay);
          osc.stop(t + delay + 0.18);
        });
      } else if (mode === 'boat') {
        // Deep maritime ship foghorn
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(110, t);
        osc2.frequency.setValueAtTime(112, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.76);
        osc2.stop(t + 0.76);
      } else {
        // Dual-tone auto horn
        [440, 554].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t);
          osc.stop(t + 0.24);
        });
      }
    } catch {}
  }

  /**
   * Continuous engine audio synthesis scaled dynamically by vehicle velocity
   */
  public updateEngine(mode: MovementMode, speedRatio: number): void {
    if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') {
      this.stopEngine();
      return;
    }

    if (mode === 'foot') {
      this.stopEngine();
      if (speedRatio > 0.05) {
        this.playFootstep(speedRatio > 1.2);
      }
      return;
    }

    if (speedRatio < 0.04) {
      this.stopEngine();
      return;
    }

    // Initialize engine nodes if mode changed or not playing
    if (!this.engineOsc || this.engineMode !== mode) {
      this.stopEngine();
      try {
        this.engineMode = mode;
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineFilter = this.ctx.createBiquadFilter();

        if (mode === 'bicycle') {
          this.engineOsc.type = 'triangle';
          this.engineFilter.type = 'bandpass';
          this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
          this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        } else if (mode === 'motorcycle') {
          // 2-stroke Vespa buzz
          this.engineOsc.type = 'sawtooth';
          this.engineFilter.type = 'lowpass';
          this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
          this.engineGain.gain.setValueAtTime(0.20, this.ctx.currentTime);
        } else if (mode === 'car') {
          // Low engine rumble
          this.engineOsc.type = 'sawtooth';
          this.engineFilter.type = 'lowpass';
          this.engineFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
          this.engineGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        } else if (mode === 'boat') {
          // Outboard marine motor + water hum
          this.engineOsc.type = 'sawtooth';
          this.engineFilter.type = 'lowpass';
          this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
          this.engineGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        }

        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain!);
        this.engineOsc.start();
      } catch {
        return;
      }
    }

    // Dynamically modulate frequency with speed ratio
    if (this.engineOsc && this.engineFilter && this.engineGain) {
      const t = this.ctx.currentTime;
      let targetFreq = 50;
      let targetGain = 0.2;

      if (mode === 'bicycle') {
        targetFreq = 30 + speedRatio * 45;
        targetGain = 0.10 * Math.min(1.0, speedRatio);
      } else if (mode === 'motorcycle') {
        targetFreq = 70 + speedRatio * 95;
        targetGain = 0.22 * Math.min(1.0, speedRatio);
        this.engineFilter.frequency.setValueAtTime(220 + speedRatio * 150, t);
      } else if (mode === 'car') {
        targetFreq = 55 + speedRatio * 80;
        targetGain = 0.26 * Math.min(1.0, speedRatio);
        this.engineFilter.frequency.setValueAtTime(160 + speedRatio * 130, t);
      } else if (mode === 'boat') {
        targetFreq = 65 + speedRatio * 85;
        targetGain = 0.28 * Math.min(1.0, speedRatio);
        this.engineFilter.frequency.setValueAtTime(200 + speedRatio * 140, t);
      }

      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
      this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
    }
  }

  public stopEngine(): void {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
      this.engineGain = null;
      this.engineFilter = null;
      this.engineMode = null;
    }
  }
}

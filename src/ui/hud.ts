import { CameraController, CameraViewMode } from '../camera/camera-controller';
import { QualityManager, QualityProfile } from '../graphics/quality-manager';
import { CharacterController } from '../character/controller/character-controller';
import { MovementMode } from '../character/model/character-mesh';
import { PresentationMode } from './presentation-mode';
import { SoundSystem } from '../audio/sound-system';
import { GameDialog, DialogOptions } from './dialog/game-dialog';
import type { DecorationManager } from '../decorations/decoration-manager';
import { DECORATION_CATALOG } from '../decorations/decoration-manager';
import type { EconomyManager } from '../economy/economy-manager';

export class Hud {
  private btnCamera: HTMLElement | null = null;
  private cameraLabel: HTMLElement | null = null;
  private btnZoomIn: HTMLElement | null = null;
  private btnZoomOut: HTMLElement | null = null;
  private btnRotate: HTMLElement | null = null;
  private btnQuality: HTMLElement | null = null;
  private qualityIndicator: HTMLElement | null = null;
  private btnStream: HTMLElement | null = null;
  private btnRun: HTMLElement | null = null;
  private btnJump: HTMLElement | null = null;
  private btnHorn: HTMLElement | null = null;
  private btnSound: HTMLElement | null = null;
  private soundIcon: HTMLElement | null = null;
  private btnRecenter: HTMLElement | null = null;
  private toastEl: HTMLElement | null = null;
  private toastTimer: number | null = null;
  private canUseBoat: boolean = false;
  private boatPill: HTMLButtonElement | null = null;
  private wasNearWater: boolean = false;
  private gameDialog: GameDialog;

  constructor(
    private cameraController: CameraController,
    private qualityManager: QualityManager,
    private characterController: CharacterController,
    private presentationMode: PresentationMode,
    private soundSystem: SoundSystem,
    private decorationManager?: DecorationManager,
    private economy?: EconomyManager
  ) {
    this.gameDialog = new GameDialog();
    this.btnCamera = document.getElementById('btn-camera');
    this.cameraLabel = document.getElementById('camera-label');
    this.btnZoomIn = document.getElementById('btn-zoom-in');
    this.btnZoomOut = document.getElementById('btn-zoom-out');
    this.btnRotate = document.getElementById('btn-rotate');
    this.btnQuality = document.getElementById('btn-quality');
    this.qualityIndicator = document.getElementById('quality-indicator');
    this.btnStream = document.getElementById('btn-stream');
    this.btnRun = document.getElementById('btn-run');
    this.btnJump = document.getElementById('btn-jump');
    this.btnHorn = document.getElementById('btn-horn');
    this.btnSound = document.getElementById('btn-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnRecenter = document.getElementById('btn-recenter');
    this.toastEl = document.getElementById('toast');

    this.bindEvents();
    this.bindModeBar();
    this.updateCameraDisplay(this.cameraController.getMode());
    this.updateQualityDisplay(this.qualityManager.getProfile());
  }

  private bindEvents(): void {
    // Location badge toggles dev telemetry overlay
    const locationBadge = document.querySelector('.location-badge');
    const perfOverlay = document.getElementById('perf-overlay');
    locationBadge?.addEventListener('click', () => {
      perfOverlay?.classList.toggle('hidden');
    });

    // Camera perspective cycle (ISO -> TPS -> TOP)
    this.btnCamera?.addEventListener('click', () => {
      const newMode = this.cameraController.cycleMode();
      this.updateCameraDisplay(newMode);
      const labels: Record<CameraViewMode, string> = {
        isometric: 'Cámara Isométrica (ISO)',
        thirdPerson: 'Tercera Persona (TPS - Vista cercana)',
        aerial: 'Cámara Aérea (TOP - Vista cenital)'
      };
      this.showToast(labels[newMode]);
    });

    // Zoom In (Agrandar)
    this.btnZoomIn?.addEventListener('click', () => {
      this.cameraController.zoomIn(0.5);
      const z = this.cameraController.getZoom().toFixed(1);
      this.showToast(`🔍 Acercar (${z}x)`);
    });

    // Zoom Out (Alejar)
    this.btnZoomOut?.addEventListener('click', () => {
      this.cameraController.zoomOut(0.5);
      const z = this.cameraController.getZoom().toFixed(1);
      this.showToast(`🔍 Alejar (${z}x)`);
    });

    // Rotate Camera Angle (Girar 45°)
    this.btnRotate?.addEventListener('click', () => {
      this.cameraController.rotateBy(45);
      const b = Math.round(this.cameraController.getBearing());
      this.showToast(`🔄 Ángulo: ${b}°`);
    });

    // Quality profile cycle
    this.btnQuality?.addEventListener('click', () => {
      const newProfile = this.qualityManager.cycleNextProfile();
      this.updateQualityDisplay(newProfile);
      this.showToast(`Perfil: ${newProfile.label}`);
    });

    // Presentation / Stream mode toggle
    this.btnStream?.addEventListener('click', () => {
      this.presentationMode.setStreamMode(true);
      this.showToast('📺 Modo Cine: toca cualquier parte de la pantalla para restaurar');
    });

    // Sound Mute Toggle
    this.btnSound?.addEventListener('click', () => {
      const isMuted = this.soundSystem.toggleMute();
      if (this.soundIcon) {
        this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      }
      this.showToast(isMuted ? 'Sonido silenciado 🔇' : 'Sonido activado 🔊');
    });

    // Horn / Bocina button
    this.btnHorn?.addEventListener('click', () => {
      const mode = this.characterController.getMovementMode();
      this.soundSystem.playHorn(mode);
    });

    // Run / Turbo button
    this.btnRun?.addEventListener('click', () => {
      const isRunning = this.characterController.toggleRunning();
      if (this.btnRun) {
        if (isRunning) {
          this.btnRun.classList.add('active');
        } else {
          this.btnRun.classList.remove('active');
        }
      }
      this.showToast(isRunning ? 'Turbo activado ⚡' : 'Velocidad normal');
    });

    // Jump button
    this.btnJump?.addEventListener('click', () => {
      this.triggerJump();
    });

    // Recenter / Rescue button: Centers camera and places explorer in open Plaza Santo Domingo
    this.btnRecenter?.addEventListener('click', () => {
      const defaultLng = -75.55200;
      const defaultLat = 10.42432;
      this.characterController.setPosition(defaultLng, defaultLat);
      this.cameraController.recenterImmediate(defaultLng, defaultLat);
      this.setVehicleMode('foot');
      this.closeDialog();
      document.getElementById('flyout-main-menu')?.classList.add('hidden');
      this.showToast('🎯 ¡Bienvenido a Plaza Santo Domingo!');
    });

    // Space key to Jump
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.triggerJump();
      }
    });

    // Listen to external quality changes
    this.qualityManager.onProfileChange((profile) => {
      this.updateQualityDisplay(profile);
    });

    // Roblox Foldable Docks & Flyouts
    this.bindRobloxFlyouts();
  }

  private bindRobloxFlyouts(): void {
    const btnVehicle = document.getElementById('btn-dock-vehicle');
    const flyoutVehicles = document.getElementById('flyout-vehicles');
    const btnCamera = document.getElementById('btn-dock-camera');
    const flyoutCamera = document.getElementById('flyout-camera');
    const btnMenu = document.getElementById('btn-roblox-menu');
    const flyoutMenu = document.getElementById('flyout-main-menu');
    const btnMenuClose = document.getElementById('btn-menu-close');
    const btnDecor = document.getElementById('btn-dock-decor');
    const flyoutDecorations = document.getElementById('flyout-decorations');

    const toggleFlyout = (el: HTMLElement | null, others: (HTMLElement | null)[]) => {
      if (!el) return;
      const isCurrentlyHidden = el.classList.contains('hidden');
      others.forEach((o) => o?.classList.add('hidden'));
      if (isCurrentlyHidden) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    };

    // Decorate dock button & catalog pills
    btnDecor?.addEventListener('pointerdown', (e) => e.stopPropagation());
    btnDecor?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFlyout(flyoutDecorations, [flyoutVehicles, flyoutCamera, flyoutMenu]);
    });

    const decorPills = document.querySelectorAll<HTMLButtonElement>('.decor-pill');
    decorPills.forEach((pill) => {
      pill.addEventListener('pointerdown', (e) => e.stopPropagation());
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const itemId = pill.getAttribute('data-item');
        if (!itemId) return;

        const [lng, lat] = this.characterController.getPosition();
        if (this.decorationManager) {
          const res = this.decorationManager.placeItem(itemId, lng, lat);
          if (res.success) {
            this.soundSystem.playHorn('bicycle');
            const itemDef = DECORATION_CATALOG.find((d) => d.id === itemId);
            this.showToast(`✨ ¡${itemDef?.name || 'Objeto'} colocado en la ciudad!`);
            if (this.economy) {
              const balanceEl = document.getElementById('player-balance-text');
              if (balanceEl) balanceEl.textContent = `$${this.economy.getBalance().toLocaleString()}`;
            }
            flyoutDecorations?.classList.add('hidden');
          } else {
            this.showToast(`⚠️ ${res.reason || 'Saldo insuficiente'}`);
          }
        }
      });
    });

    // Vehicle dock button
    btnVehicle?.addEventListener('pointerdown', (e) => e.stopPropagation());
    btnVehicle?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFlyout(flyoutVehicles, [flyoutCamera, flyoutMenu, flyoutDecorations]);
    });

    // Camera dock button
    btnCamera?.addEventListener('pointerdown', (e) => e.stopPropagation());
    btnCamera?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFlyout(flyoutCamera, [flyoutVehicles, flyoutMenu, flyoutDecorations]);
    });

    // Main Roblox Menu (☰)
    btnMenu?.addEventListener('pointerdown', (e) => e.stopPropagation());
    btnMenu?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFlyout(flyoutMenu, [flyoutVehicles, flyoutCamera, flyoutDecorations]);
    });

    btnMenuClose?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      flyoutMenu?.classList.add('hidden');
    });

    // Prevent touches inside flyouts from closing them
    [flyoutVehicles, flyoutCamera, flyoutMenu, flyoutDecorations].forEach((f) => {
      f?.addEventListener('pointerdown', (e) => e.stopPropagation());
      f?.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  private triggerJump(): void {
    const jumped = this.characterController.jump();
    if (jumped) {
      this.soundSystem.playJump();
      if (this.btnJump) {
        this.btnJump.classList.add('active');
        setTimeout(() => this.btnJump?.classList.remove('active'), 250);
      }
    }
  }

  private bindModeBar(): void {
    const pills = document.querySelectorAll<HTMLButtonElement>('.mode-pill');
    this.boatPill = document.querySelector<HTMLButtonElement>('.mode-pill[data-mode="boat"]');
    this.setBoatEnabled(false);

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const mode = pill.getAttribute('data-mode') as MovementMode;
        if (!mode) return;
        this.setVehicleMode(mode);
      });
    });
  }

  public setVehicleMode(mode: MovementMode, force: boolean = false): void {
    if (mode === 'boat' && !this.canUseBoat && !force) {
      this.showToast('⚓ El barco se habilita cuando te acercas al mar o la bahía', 3000);
      return;
    }

    const pills = document.querySelectorAll<HTMLButtonElement>('.mode-pill');
    pills.forEach((p) => {
      if (p.getAttribute('data-mode') === mode) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    this.characterController.setMovementMode(mode);
    document.getElementById('flyout-vehicles')?.classList.add('hidden');

    if (mode === 'boat') {
      this.soundSystem.playWaterSplash();
      this.soundSystem.playHorn('boat');
    }

    const labels: Record<MovementMode, string> = {
      foot: '🚶 Modo Explorador a pie',
      bicycle: '🚲 Bicicleta urbana montada',
      motorcycle: '🛵 Moto Vespa clásica montada',
      car: '🚗 Micro Carro convertible montado',
      boat: '🚤 Lancha rápida navegando en el mar'
    };
    this.showToast(labels[mode]);
  }

  public showDialog(options: DialogOptions): void {
    this.gameDialog.show(options);
  }

  public closeDialog(): void {
    this.gameDialog.close();
  }

  public setBoatEnabled(enabled: boolean): void {
    this.canUseBoat = enabled;
    if (this.boatPill) {
      if (enabled) {
        this.boatPill.classList.remove('disabled');
        this.boatPill.classList.add('available');
      } else {
        this.boatPill.classList.add('disabled');
        this.boatPill.classList.remove('available');
      }
    }
  }

  public updateWaterProximity(isNearWater: boolean, currentMode: MovementMode): void {
    if (currentMode === 'boat') {
      this.setBoatEnabled(true);
      return;
    }

    if (isNearWater && !this.wasNearWater) {
      this.setBoatEnabled(true);
      this.showToast('🌊 Orilla del mar: 🚤 Barco habilitado en el menú', 2200);
    } else if (!isNearWater && this.wasNearWater) {
      this.setBoatEnabled(false);
    }
    this.wasNearWater = isNearWater;
  }

  public updateCameraDisplay(_mode: CameraViewMode): void {
    if (this.cameraLabel) {
      this.cameraLabel.textContent = this.cameraController.getModeLabel();
    }
  }

  public updateQualityDisplay(profile: QualityProfile): void {
    if (this.qualityIndicator) {
      this.qualityIndicator.textContent = profile.label;
    }
  }

  public showToast(message: string, durationMs: number = 2400): void {
    if (!this.toastEl) return;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    this.toastEl.textContent = message;
    this.toastEl.classList.remove('hidden');

    this.toastTimer = window.setTimeout(() => {
      this.toastEl?.classList.add('hidden');
      this.toastTimer = null;
    }, durationMs);
  }
}

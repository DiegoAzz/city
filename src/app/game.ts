import { CARTAGENA_CONFIG } from './config';
import { CharacterController, SPEED_PRESETS } from '../character/controller/character-controller';
import { CameraController } from '../camera/camera-controller';
import { MapManager } from '../map/map-engine/map-manager';
import { VirtualJoystick } from '../controls/virtual-joystick';
import { QualityManager } from '../graphics/quality-manager';
import { PerfMonitor } from '../performance/perf-monitor';
import { PresentationMode } from '../ui/presentation-mode';
import { Hud } from '../ui/hud';
import { LocalStore } from '../storage/local-store';
import { isWithinCartagenaBounds } from '../map/geodata/cartagena';
import { CollisionSystem } from '../navigation/collision-system';
import { TouchOrbitController } from '../camera/touch-orbit';
import { SoundSystem } from '../audio/sound-system';
import { MultiplayerManager } from '../multiplayer/multiplayer-manager';
import { ChatUi } from '../ui/chat/chat-ui';

export class Game {
  private character: CharacterController;
  private mapManager: MapManager;
  private camera: CameraController | null = null;
  private joystick: VirtualJoystick | null = null;
  private qualityManager: QualityManager;
  private perfMonitor: PerfMonitor;
  private presentationMode: PresentationMode;
  private hud: Hud | null = null;
  private collisionSystem: CollisionSystem | null = null;
  private touchOrbit: TouchOrbitController | null = null;
  private soundSystem: SoundSystem;
  private multiplayer: MultiplayerManager;
  private chatUi: ChatUi | null = null;

  private isRunning: boolean = false;
  private lastFrameTime: number = performance.now();
  private lastSaveTime: number = performance.now();
  private animationFrameId: number | null = null;

  constructor() {
    // 1. Load preferences
    const prefs = LocalStore.load();

    // 2. Determine initial coordinates: Start cleanly in wide open Plaza Santo Domingo
    let initialLng = CARTAGENA_CONFIG.initialCenter[0];
    let initialLat = CARTAGENA_CONFIG.initialCenter[1];

    if (
      prefs.lastPosition &&
      isWithinCartagenaBounds(prefs.lastPosition[0], prefs.lastPosition[1]) &&
      Math.abs(prefs.lastPosition[1] - 10.4233) > 0.0005 // Discard old buggy coordinate inside building wall
    ) {
      initialLng = prefs.lastPosition[0];
      initialLat = prefs.lastPosition[1];
    }

    // 3. Initialize systems
    this.qualityManager = new QualityManager(prefs.qualityProfile);
    this.character = new CharacterController(initialLng, initialLat);
    this.perfMonitor = new PerfMonitor();
    this.presentationMode = new PresentationMode();
    this.presentationMode.setStreamMode(false); // Always guarantee HUD and controls are visible

    // Initialize Audio & Multiplayer systems
    this.soundSystem = new SoundSystem();
    this.multiplayer = new MultiplayerManager(this.character);
    this.chatUi = new ChatUi(this.multiplayer);

    // 4. Initialize Map
    const initialDpr = this.qualityManager.getProfile().dpr;
    this.mapManager = new MapManager('map-container', this.character, initialDpr);

    // 5. Setup Joystick
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');
    if (joystickBase && joystickStick) {
      this.joystick = new VirtualJoystick(joystickBase, joystickStick);
    }

    // 6. When Map is ready, connect Camera, Collision, and HUD
    this.mapManager.onReady(() => {
      const map = this.mapManager.getMap();
      if (!map) return;

      // Initialize real-time street and building collision system
      this.collisionSystem = new CollisionSystem();
      this.collisionSystem.init(map);
      this.character.setCollisionSystem(this.collisionSystem);

      // Non-intrusive warning when player reaches water edge
      this.collisionSystem.onWaterWarning(() => {
        this.soundSystem.playWaterWarning();
        this.hud?.showToast('🌊 ¡Agua frente a ti! Usa 🚤 Barco para navegar', 2400);
      });

      // Non-intrusive notification when boat reaches shore or dock
      this.collisionSystem.onLandWarning(() => {
        this.hud?.showToast('⚓ ¡Llegaste a la orilla! Toca 🚶 Pie para desembarcar', 2400);
      });

      // Connect multiplayer manager to Three.js custom layer
      this.mapManager.getThreeLayer()?.setMultiplayerManager(this.multiplayer);

      this.camera = new CameraController(map, initialLng, initialLat);
      if (prefs.cameraMode) {
        this.camera.setMode(prefs.cameraMode);
      }

      // Initialize touch gesture orbit & pinch zoom controller
      this.touchOrbit = new TouchOrbitController(this.camera, 'map-container');

      this.hud = new Hud(
        this.camera,
        this.qualityManager,
        this.character,
        this.presentationMode,
        this.soundSystem
      );

      // Announce when another citizen joins the multiplayer room
      this.multiplayer.onPlayerJoined((name) => {
        this.hud?.showToast(`👋 ¡${name} se ha conectado a Cartagena!`, 3200);
      });

      // Connect quality updates to MapLibre
      this.qualityManager.onProfileChange((profile) => {
        this.mapManager.setPixelRatio(profile.dpr);
        this.mapManager.set3DBuildingsVisible(profile.enable3DBuildings);
        LocalStore.save({ qualityProfile: profile.name });
      });

      // Apply initial 3D building setting
      this.mapManager.set3DBuildingsVisible(this.qualityManager.getProfile().enable3DBuildings);
    });

    // 7. Handle visibility changes (battery saving when tab is backgrounded)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    // 8. Save preferences on unload
    window.addEventListener('beforeunload', () => {
      this.saveCurrentState();
    });

    // Start game loop immediately
    this.start();
  }

  public getHud(): Hud | null {
    return this.hud;
  }

  public getTouchOrbit(): TouchOrbitController | null {
    return this.touchOrbit;
  }

  public getCollisionSystem(): CollisionSystem | null {
    return this.collisionSystem;
  }

  public getMultiplayer(): MultiplayerManager {
    return this.multiplayer;
  }

  public getChatUi(): ChatUi | null {
    return this.chatUi;
  }

  public getSoundSystem(): SoundSystem {
    return this.soundSystem;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    const deltaMs = currentTime - this.lastFrameTime;
    const targetIntervalMs = this.qualityManager.getProfile().minFrameIntervalMs;

    // Frame pacing to respect target FPS
    if (deltaMs < targetIntervalMs - 1.0) {
      return;
    }

    this.lastFrameTime = currentTime;
    const deltaSeconds = Math.min(deltaMs / 1000, 0.1);

    // 1. Get Joystick Input
    const joystickVec = this.joystick ? this.joystick.getVector() : { x: 0, y: 0 };
    const cameraBearing = this.camera ? this.camera.getBearing() : CARTAGENA_CONFIG.initialBearing;

    // 2. Update Character Physics & Animation
    this.character.update(deltaSeconds, joystickVec, cameraBearing);

    // 3. Update Camera Tracking
    const [currentLng, currentLat] = this.character.getPosition();
    const charState = this.character.getState();
    if (this.camera) {
      this.camera.setTarget(currentLng, currentLat);
      this.camera.update(deltaSeconds, charState.speedMps);
    }

    // 4. Update Multiplayer & Chat synchronization
    this.multiplayer.update(deltaSeconds);

    // 5. Update Water Proximity & Boat Availability
    if (this.collisionSystem && this.hud) {
      const nearWater = this.collisionSystem.isNearWater(currentLng, currentLat, 18);
      this.hud.updateWaterProximity(nearWater, charState.movementMode);
    }

    // 6. Update Vehicle Engine Sound Dynamics
    const maxSpeed = SPEED_PRESETS[charState.movementMode].base;
    this.soundSystem.updateEngine(charState.movementMode, charState.speedMps / maxSpeed);

    // 7. Update Performance Telemetry
    this.perfMonitor.recordFrame(currentTime, deltaMs);
    const currentProfile = this.qualityManager.getProfile();
    this.perfMonitor.updateTelemetry(
      [charState.lng, charState.lat],
      charState.speedMps,
      currentProfile.dpr,
      currentProfile.targetFps
    );

    // 5. Periodic auto-save (every 5 seconds)
    if (currentTime - this.lastSaveTime >= 5000) {
      this.saveCurrentState();
      this.lastSaveTime = currentTime;
    }
  }

  private saveCurrentState(): void {
    const pos = this.character.getPosition();
    LocalStore.save({
      lastPosition: pos,
      cameraMode: this.camera ? this.camera.getMode() : 'isometric',
      streamMode: this.presentationMode.isEnabled(),
      qualityProfile: this.qualityManager.getProfile().name
    });
  }
}

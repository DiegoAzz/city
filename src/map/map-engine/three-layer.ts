import * as THREE from 'three';
import maplibregl, { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import { CharacterController } from '../../character/controller/character-controller';
import type { MultiplayerManager } from '../../multiplayer/multiplayer-manager';
import type { DecorationManager } from '../../decorations/decoration-manager';
import { AmbientCitizensManager } from '../../citizens/ambient-citizens';
import type { RemodelManager } from '../../remodel/remodel-manager';
import { RemodelSignRenderer } from '../../remodel/remodel-sign-renderer';

export class ThreeCharacterLayer implements CustomLayerInterface {
  public id: string = 'three-character-layer';
  public type: 'custom' = 'custom';
  public renderingMode: '3d' = '3d';

  private map: MapLibreMap | null = null;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer | null = null;
  private characterController: CharacterController;
  private multiplayerManager: MultiplayerManager | null = null;
  private decorationManager: DecorationManager | null = null;
  private remodelManager: RemodelManager | null = null;
  private remodelSignRenderer: RemodelSignRenderer;
  private ambientCitizens: AmbientCitizensManager;
  private lastTime: number = performance.now();

  constructor(characterController: CharacterController) {
    this.characterController = characterController;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.remodelSignRenderer = new RemodelSignRenderer();

    // Vibrant cartoon lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 3.0);
    sunLight.position.set(40, 100, 60);
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x67e8f9, 1.2);
    fillLight.position.set(-40, 30, -50);
    this.scene.add(fillLight);

    // Add character root group to scene
    this.scene.add(this.characterController.rigs.root);

    // Initialize ambient Cartagena citizens (Palenquera, Músico, Policía, Turista)
    this.ambientCitizens = new AmbientCitizensManager();
    this.ambientCitizens.setScene(this.scene);

    // Disable frustum culling on all meshes
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.frustumCulled = false;
      }
    });
  }

  public setMultiplayerManager(multiplayerManager: MultiplayerManager): void {
    this.multiplayerManager = multiplayerManager;
    this.multiplayerManager.setScene(this.scene);
  }

  public setDecorationManager(decorationManager: DecorationManager): void {
    this.decorationManager = decorationManager;
    this.decorationManager.setScene(this.scene);
  }

  public setRemodelManager(remodelManager: RemodelManager): void {
    this.remodelManager = remodelManager;
    this.remodelSignRenderer.setScene(this.scene);
    this.remodelSignRenderer.updateBuildingSigns(this.remodelManager.getAllRemodeled());
    this.remodelManager.onRemodel(() => {
      this.remodelSignRenderer.updateBuildingSigns(this.remodelManager!.getAllRemodeled());
    });
  }

  public onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl as WebGL2RenderingContext,
      antialias: true
    });

    this.renderer.autoClear = false;
  }

  public render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput): void {
    if (!this.map || !this.renderer) return;

    const [lng, lat] = this.characterController.getPosition();
    const altitude = 0;

    // Convert coordinates to Mercator
    const merc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], altitude);
    const scale = merc.meterInMercatorCoordinateUnits();

    // Compact cartoon scale (3.8x) so avatar fits naturally inside street lanes
    const visualScale = scale * 3.8;

    // Rotation to align Three.js Y-up with MapLibre Z-up
    const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

    // Mercator matrix from MapLibre transform
    const mercatorMatrix =
      (this.map as any)?.transform?.mercatorMatrix ||
      (options as any)?.defaultProjectionData?.mainMatrix ||
      (options as any)?.modelViewProjectionMatrix ||
      options;

    const m = new THREE.Matrix4().fromArray(mercatorMatrix as unknown as number[]);
    const l = new THREE.Matrix4()
      .makeTranslation(merc.x, merc.y, merc.z)
      .scale(new THREE.Vector3(visualScale, -visualScale, visualScale))
      .multiply(rotationX);

    this.characterController.rigs.root.position.set(0, 0, 0);

    // Visual scale factor matching Mercator scale * 3.8
    const visualScaleFactor = 3.8;

    // Position remote players relative to local character in Three.js coordinate space
    if (this.multiplayerManager) {
      const latRad = (lat * Math.PI) / 180.0;
      const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
      const metersPerDegLng = 111412.84 * Math.cos(latRad);

      for (const peer of this.multiplayerManager.getRemotePlayers().values()) {
        const dLng = peer.currentLng - lng;
        const dLat = peer.currentLat - lat;
        const dEastMeters = dLng * metersPerDegLng;
        const dNorthMeters = dLat * metersPerDegLat;

        peer.rigs.root.position.set(dEastMeters / visualScaleFactor, 0, -dNorthMeters / visualScaleFactor);
      }
    }

    // Update ambient Cartagena citizens (Palenquera, Músico, Policía, Turista)
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.ambientCitizens.update(delta, lng, lat);

    // Update 3D decoration positions
    this.decorationManager?.updatePositions(lng, lat);

    // Update 3D remodeled building signs
    this.remodelSignRenderer.updatePositions(lng, lat);

    this.camera.projectionMatrix = m.multiply(l);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.renderer.resetState();
    this.map.triggerRepaint();
  }

  public onRemove(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

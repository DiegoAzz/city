import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { CARTAGENA_CONFIG, MAP_STYLES } from '../../app/config';
import { ThreeCharacterLayer } from './three-layer';
import { CharacterController } from '../../character/controller/character-controller';

export class MapManager {
  private map: MapLibreMap | null = null;
  private threeLayer: ThreeCharacterLayer | null = null;
  private isLoaded: boolean = false;
  private onLoadCallbacks: Array<() => void> = [];
  private onErrorCallbacks: Array<(err: Error) => void> = [];

  constructor(
    containerId: string,
    characterController: CharacterController,
    initialQualityDpr: number = 1.25
  ) {
    this.initMap(containerId, characterController, initialQualityDpr);
  }

  private initMap(
    containerId: string,
    characterController: CharacterController,
    initialQualityDpr: number
  ): void {
    const [initialLng, initialLat] = characterController.getPosition();

    try {
      this.map = new maplibregl.Map({
        container: containerId,
        style: MAP_STYLES.vectorStyle,
        center: [initialLng, initialLat],
        zoom: CARTAGENA_CONFIG.initialZoom,
        pitch: CARTAGENA_CONFIG.initialPitch,
        bearing: CARTAGENA_CONFIG.initialBearing,
        maxPitch: 70,
        minZoom: 14,
        maxZoom: 20,
        attributionControl: false,
        dragPan: false,
        dragRotate: false,
        touchPitch: false,
        touchZoomRotate: false,
        pixelRatio: initialQualityDpr
      });

      this.map.on('load', () => {
        this.isLoaded = true;

        try {
          this.setup3DBuildings();
          this.cleanMapClutter();
        } catch (e) {
          console.warn('[MapManager] Notice while setting up 3D buildings:', e);
        }

        try {
          // Add Three.js custom layer
          this.threeLayer = new ThreeCharacterLayer(characterController);
          if (this.map) {
            this.map.addLayer(this.threeLayer);
          }
        } catch (e) {
          console.error('[MapManager] Error adding Three.js custom layer:', e);
        }

        // Notify that map is ready
        this.onLoadCallbacks.forEach((cb) => {
          try {
            cb();
          } catch (e) {
            console.error('[MapManager] Callback error:', e);
          }
        });
      });

      this.map.on('error', (e) => {
        console.warn('[MapManager] MapLibre notice:', e);
        if (e.error && !this.isLoaded) {
          this.loadFallbackStyle();
        }
      });
    } catch (err) {
      console.error('[MapManager] Failed to initialize map:', err);
      this.onErrorCallbacks.forEach((cb) => cb(err as Error));
    }
  }

  private loadFallbackStyle(): void {
    if (!this.map) return;
    console.info('[MapManager] Loading fallback map style...');
    try {
      this.map.setStyle(MAP_STYLES.fallbackStyle);
    } catch (e) {
      console.warn('[MapManager] Fallback style error:', e);
    }
  }

  private setup3DBuildings(): void {
    if (!this.map) return;
    if (this.map.getLayer('3d-buildings')) return;

    try {
      const sourceId = this.map.getSource('openmaptiles') ? 'openmaptiles' : 'osm';
      if (!this.map.getSource(sourceId)) return;

      // 2D Ground footprint collision layer (planar, zero 3D extrusion, perfect for 2D collision check)
      if (!this.map.getLayer('collision-buildings-ground')) {
        this.map.addLayer({
          id: 'collision-buildings-ground',
          source: sourceId,
          'source-layer': 'building',
          type: 'fill',
          minzoom: 13,
          maxzoom: 24,
          paint: {
            'fill-opacity': 0.001
          }
        });
      }

      this.map.addLayer({
        id: '3d-buildings',
        source: sourceId,
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
            0, '#f1f5f9',
            15, '#cbd5e1',
            30, '#94a3b8'
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['coalesce', ['get', 'render_height'], ['get', 'height'], 8]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
          ],
          'fill-extrusion-opacity': 0.85
        }
      });
    } catch (e) {
      console.warn('[MapManager] 3D buildings layer notice:', e);
    }
  }

  public setPixelRatio(dpr: number): void {
    if (this.map) {
      this.map.setPixelRatio(dpr);
    }
  }

  public set3DBuildingsVisible(visible: boolean): void {
    if (!this.map) return;
    if (this.map.getLayer('3d-buildings')) {
      this.map.setLayoutProperty('3d-buildings', 'visibility', visible ? 'visible' : 'none');
    }
  }

  private cleanMapClutter(): void {
    if (!this.map) return;
    try {
      const style = this.map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          const id = layer.id.toLowerCase();
          if (
            id.includes('housenumber') ||
            id.includes('house_num') ||
            id.includes('shield') ||
            id.includes('road-number') ||
            id.includes('highway-shield')
          ) {
            try {
              this.map?.setLayoutProperty(layer.id, 'visibility', 'none');
            } catch {}
          }
        });
      }
    } catch (e) {
      console.warn('[MapManager] Notice cleaning map clutter:', e);
    }
  }

  public getMap(): MapLibreMap | null {
    return this.map;
  }

  public getThreeLayer(): ThreeCharacterLayer | null {
    return this.threeLayer;
  }

  public onReady(callback: () => void): void {
    if (this.isLoaded) {
      callback();
    } else {
      this.onLoadCallbacks.push(callback);
    }
  }

  public onError(callback: (err: Error) => void): void {
    this.onErrorCallbacks.push(callback);
  }
}

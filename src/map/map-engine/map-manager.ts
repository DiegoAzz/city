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
  private onBuildingClickCallbacks: Array<(feature: any, lngLat: { lng: number; lat: number }) => void> = [];

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
            'case',
            // If customized via feature-state (Player remodeling)
            ['boolean', ['feature-state', 'remodeled'], false],
            ['to-color', ['feature-state', 'color']],

            // Highrises in Bocagrande / Modern towers (> 28m)
            ['>', ['coalesce', ['get', 'render_height'], ['get', 'height'], 8], 28],
            '#94a3b8',

            // Vibrant Cartagena Colonial Architectural Palette
            [
              'match',
              [
                '%',
                ['to-number', ['round', ['*', ['coalesce', ['get', 'render_height'], ['get', 'height'], 6], 5]], 0],
                6
              ],
              0, '#f59e0b', // Amarillo Colonial Cartagena (Convento / Plaza)
              1, '#ea580c', // Terracota / Teja Colonial
              2, '#f8fafc', // Blanco Estuco Encalado
              3, '#0284c7', // Azul Celeste Caribeño
              4, '#db2777', // Rosa Colonial Bougainvillea
              5, '#10b981', // Verde Esmeralda Colonial
              '#f59e0b'     // Default cálido
            ]
          ],
          'fill-extrusion-vertical-gradient': true,
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
          'fill-extrusion-opacity': 0.94
        }
      });

      // GeoJSON source and layer for player-remodeled landmarks
      this.map.addSource('remodeled-buildings-geojson', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      this.map.addLayer({
        id: 'remodeled-buildings-layer',
        type: 'fill-extrusion',
        source: 'remodeled-buildings-geojson',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-vertical-gradient': true,
          'fill-extrusion-opacity': 0.98
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

  public onBuildingClick(callback: (feature: any, lngLat: { lng: number; lat: number }) => void): void {
    this.onBuildingClickCallbacks.push(callback);
  }

  public setBuildingColor(featureId: string | number, color: string): void {
    if (!this.map) return;
    try {
      const sourceId = this.map.getSource('openmaptiles') ? 'openmaptiles' : 'osm';
      this.map.setFeatureState(
        { source: sourceId, sourceLayer: 'building', id: featureId },
        { remodeled: true, color }
      );
    } catch (e) {
      console.warn('[MapManager] setFeatureState notice:', e);
    }
  }

  public updateRemodeledGeoJSON(buildings: Array<{ id: string; name: string; color: string; lng: number; lat: number; height: number; polygon?: [number, number][] }>): void {
    if (!this.map) return;
    try {
      const source = this.map.getSource('remodeled-buildings-geojson') as any;
      if (!source) return;

      const features = buildings.map((b) => {
        // If polygon is provided, use it; otherwise create a neat 16x16m rectangular footprint centered at [lng, lat]
        const dLng = 0.00014;
        const dLat = 0.00012;
        const coordinates = b.polygon && b.polygon.length >= 3 ? [b.polygon] : [
          [
            [b.lng - dLng, b.lat - dLat],
            [b.lng + dLng, b.lat - dLat],
            [b.lng + dLng, b.lat + dLat],
            [b.lng - dLng, b.lat + dLat],
            [b.lng - dLng, b.lat - dLat]
          ]
        ];

        return {
          type: 'Feature',
          id: b.id,
          properties: {
            id: b.id,
            name: b.name,
            color: b.color,
            height: b.height || 14
          },
          geometry: {
            type: 'Polygon',
            coordinates
          }
        };
      });

      source.setData({
        type: 'FeatureCollection',
        features
      });
    } catch (e) {
      console.warn('[MapManager] updateRemodeledGeoJSON notice:', e);
    }
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

/**
 * Expanded Cartagena configuration & constants for smooth exploration
 */

export interface CityConfig {
  name: string;
  country: string;
  initialCenter: [number, number];
  initialZoom: number;
  initialPitch: number;
  initialBearing: number;
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
}

export const CARTAGENA_CONFIG: CityConfig = {
  name: 'Cartagena',
  country: 'Colombia',
  // Plaza de Santo Domingo (Open historic plaza, wide outdoor space)
  initialCenter: [-75.55200, 10.42432],
  initialZoom: 18.2,
  initialPitch: 54, // Isometric tilt
  initialBearing: 30,
  bounds: {
    // Generously expanded bounds: covers Historic Center, Av. Santander, El Cabrero, Marbella, Manga, Getsemaní (~8 km²)
    minLng: -75.5680,
    minLat: 10.4020,
    maxLng: -75.5280,
    maxLat: 10.4480
  }
};

export const CAMERA_CONFIG = {
  isometricPitch: 54,
  isometricBearing: 30,
  aerialPitch: 0,
  aerialBearing: 0,
  aerialZoom: 16.8,
  minZoom: 14.5,
  maxZoom: 20.0
};

export const MAP_STYLES = {
  vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
  fallbackStyle: 'https://demotiles.maplibre.org/style.json'
};

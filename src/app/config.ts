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
  initialZoom: 20.6, // Brookhaven style close-up street immersion
  initialPitch: 75, // Eye-level third-person perspective looking ahead
  initialBearing: 30,
  bounds: {
    // Generously expanded bounds: covers Historic Center, Bocagrande, El Laguito, Av. Santander, El Cabrero, Marbella, Manga, Getsemaní, Popa (~25 km²)
    minLng: -75.5800,
    minLat: 10.3800,
    maxLng: -75.5100,
    maxLat: 10.4600
  }
};

export const CAMERA_CONFIG = {
  isometricPitch: 58,
  isometricBearing: 30,
  aerialPitch: 0,
  aerialBearing: 0,
  aerialZoom: 17.0,
  minZoom: 15.0,
  maxZoom: 22.0
};

export const MAP_STYLES = {
  vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
  fallbackStyle: 'https://demotiles.maplibre.org/style.json'
};

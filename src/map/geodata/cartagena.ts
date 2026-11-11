/**
 * Cartagena de Indias verified geographic data and expanded bounds
 */

export interface Landmark {
  id: string;
  name: string;
  category: 'plaza' | 'monumento' | 'iglesia' | 'parque' | 'comercio';
  coordinates: [number, number]; // [lng, lat]
  description: string;
}

export const CARTAGENA_BOUNDS = {
  minLng: -75.5680,
  minLat: 10.4020,
  maxLng: -75.5280,
  maxLat: 10.4480
};

export const CARTAGENA_LANDMARKS: Landmark[] = [
  {
    id: 'plaza-santo-domingo',
    name: 'Plaza de Santo Domingo',
    category: 'plaza',
    coordinates: [-75.5520, 10.4233],
    description: 'Plaza colonial emblemática con restaurantes al aire libre y la escultura Figura Reclinada 92 de Fernando Botero.'
  },
  {
    id: 'torre-reloj',
    name: 'Torre del Reloj & Puerta del Reloj',
    category: 'monumento',
    coordinates: [-75.5489, 10.4225],
    description: 'Entrada principal histórica a la ciudad amurallada de Cartagena.'
  },
  {
    id: 'plaza-san-pedro',
    name: 'Plaza de San Pedro Claver',
    category: 'iglesia',
    coordinates: [-75.5502, 10.4219],
    description: 'Plaza con esculturas de metal y la imponente iglesia jesuita construida en el siglo XVII.'
  },
  {
    id: 'parque-bolivar',
    name: 'Parque de Bolívar',
    category: 'parque',
    coordinates: [-75.5506, 10.4235],
    description: 'Oasis arbolado en el corazón del centro con fuentes y el Palacio de la Inquisición en sus costados.'
  },
  {
    id: 'plaza-aduana',
    name: 'Plaza de la Aduana',
    category: 'plaza',
    coordinates: [-75.5498, 10.4224],
    description: 'La plaza más grande del centro histórico, sitio de la antigua casa de aduanas.'
  }
];

export function isWithinCartagenaBounds(
  lng: number,
  lat: number,
  bounds = CARTAGENA_BOUNDS
): boolean {
  return lng >= bounds.minLng && lng <= bounds.maxLng && lat >= bounds.minLat && lat <= bounds.maxLat;
}

export function clampToCartagenaBounds(
  lng: number,
  lat: number,
  bounds = CARTAGENA_BOUNDS
): [number, number] {
  const clampedLng = Math.max(bounds.minLng, Math.min(bounds.maxLng, lng));
  const clampedLat = Math.max(bounds.minLat, Math.min(bounds.maxLat, lat));
  return [clampedLng, clampedLat];
}

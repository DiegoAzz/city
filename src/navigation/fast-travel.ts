import type { CharacterController } from '../character/controller/character-controller';
import type { CameraController } from '../camera/camera-controller';
import type { SoundSystem } from '../audio/sound-system';

export interface CartagenaDestination {
  id: string;
  name: string;
  tag: string;
  badge: string;
  lng: number;
  lat: number;
  bearing: number;
  pitch: number;
  zoom: number;
  description: string;
  features: string[];
}

export const CARTAGENA_DESTINATIONS: CartagenaDestination[] = [
  {
    id: 'santo_domingo',
    name: 'Plaza Santo Domingo & Fernando Botero',
    tag: 'Centro Histórico',
    badge: '🏛️',
    lng: -75.55200,
    lat: 10.42432,
    bearing: 30,
    pitch: 76,
    zoom: 20.6,
    description: 'Corazón colonial con la escultura "La Gertrudis" de Botero, terrazas de café, Chiva Rumbera y Palenqueras.',
    features: ['🗿 Escultura Botero 3D', '🎺 Chiva Rumbera 3D', '🍍 Palenquera & Frutas']
  },
  {
    id: 'torre_reloj',
    name: 'Torre del Reloj & Plaza de la Paz',
    tag: 'Puerta Monumental',
    badge: '🏰',
    lng: -75.54842,
    lat: 10.42295,
    bearing: 0,
    pitch: 76,
    zoom: 20.6,
    description: 'La gran puerta barroca de entrada a la Ciudad Amurallada con su cúpula y reloj de 4 caras.',
    features: ['🏰 Torre del Reloj 3D', '⚔️ Portal Barroco', '🕊️ Plaza de la Paz']
  },
  {
    id: 'india_catalina',
    name: 'Monumento a la India Catalina',
    tag: 'Símbolo Heroico',
    badge: '🗿',
    lng: -75.54485,
    lat: 10.42628,
    bearing: 120,
    pitch: 76,
    zoom: 20.6,
    description: 'Estatua de bronce de la heroína indígena sobre su pedestal en Puerto Duro y Av. Pedro de Heredia.',
    features: ['🗿 India Catalina 3D', '💧 Fuente Ornamental', '🌴 Bulevar']
  },
  {
    id: 'baluarte_santo_domingo',
    name: 'Baluarte de Santo Domingo & Murallas',
    tag: 'Batería Costera',
    badge: '🛡️',
    lng: -75.55395,
    lat: 10.42485,
    bearing: 180,
    pitch: 76,
    zoom: 20.6,
    description: 'Murallas colosales frente al Mar Caribe con cañones de artillería del siglo XVII.',
    features: ['🛡️ Murallas de Piedra', '💣 Cañones Coloniales 3D', '🌊 Vista al Mar Caribe']
  },
  {
    id: 'castillo_san_felipe',
    name: 'Castillo San Felipe de Barajas',
    tag: 'Fortaleza Militar',
    badge: '🏰',
    lng: -75.53920,
    lat: 10.42250,
    bearing: 85,
    pitch: 76,
    zoom: 20.6,
    description: 'La fortaleza más colosal construida por los españoles en América, sobre el cerro San Lázaro.',
    features: ['🏰 Fortaleza Militar 3D', '🚩 Bandera Colombiana', '💣 Batería Defensiva']
  },
  {
    id: 'zapatos_viejos',
    name: 'Monumento a Los Zapatos Viejos',
    tag: 'Cultura & Poesía',
    badge: '👞',
    lng: -75.53850,
    lat: 10.42200,
    bearing: 60,
    pitch: 76,
    zoom: 20.6,
    description: 'Las famosas botas colosales de bronce en homenaje al poeta cartagenero Luis Carlos López.',
    features: ['👞 Botas Gigantes de Bronce 3D', '📜 Placa Poética', '🌳 Plazoleta']
  },
  {
    id: 'getsemani',
    name: 'Getsemaní & Callejón de las Sombrillas',
    tag: 'Barrio Bohemio',
    badge: '🎨',
    lng: -75.54680,
    lat: 10.42080,
    bearing: 45,
    pitch: 76,
    zoom: 20.6,
    description: 'Cielo techado de sombrillas multicolores flotantes, arte callejero, balcones coloniales y música.',
    features: ['☂️ Cielo de Sombrillas 3D', '🎨 Murales Urbanos', '☕ Cafés y Casonas']
  },
  {
    id: 'muelle_pegasos',
    name: 'Muelle de los Pegasos & Bahía de las Ánimas',
    tag: 'Bahía Marítima',
    badge: '⛵',
    lng: -75.54750,
    lat: 10.42180,
    bearing: 330,
    pitch: 76,
    zoom: 20.6,
    description: 'Paseo costero con las esculturas de Pegasos de mármol, muelle de veleros y vistas a la bahía.',
    features: ['🐎 Esculturas de Pegasos 3D', '⚓ Muelle de Barcos', '🌊 Bahía de las Ánimas']
  },
  {
    id: 'bocagrande',
    name: 'Bocagrande & Playas de El Laguito',
    tag: 'Zona Moderna & Mar',
    badge: '🏖️',
    lng: -75.55850,
    lat: 10.39950,
    bearing: 0,
    pitch: 76,
    zoom: 20.6,
    description: 'Avenida San Martín, rascacielos modernos, playas caribeñas doradas y marina náutica.',
    features: ['🏢 Rascacielos Modernos', '🏖️ Playas de Bocagrande', '🚤 Bahía Náutica']
  },
  {
    id: 'convento_la_popa',
    name: 'Cerro y Convento de la Popa',
    tag: 'Mirador 360°',
    badge: '⛪',
    lng: -75.52550,
    lat: 10.41900,
    bearing: 270,
    pitch: 76,
    zoom: 20.6,
    description: 'El punto más alto de Cartagena (150 msnm) con vista panorámica de toda la bahía y la ciudad.',
    features: ['⛪ Claustro Colonial', '🔭 Mirador 360°', '🌄 Vista a Toda Cartagena']
  }
];

export class FastTravelManager {
  private character: CharacterController;
  private camera: CameraController;
  private soundSystem: SoundSystem;
  private onTravelCallbacks: Array<(dest: CartagenaDestination) => void> = [];

  constructor(character: CharacterController, camera: CameraController, soundSystem: SoundSystem) {
    this.character = character;
    this.camera = camera;
    this.soundSystem = soundSystem;
  }

  public getDestinations(): CartagenaDestination[] {
    return CARTAGENA_DESTINATIONS;
  }

  public getDestinationById(id: string): CartagenaDestination | undefined {
    return CARTAGENA_DESTINATIONS.find((d) => d.id === id);
  }

  public travelTo(destId: string): boolean {
    const dest = this.getDestinationById(destId);
    if (!dest) return false;

    // 1. Teleport character
    this.character.teleport(dest.lng, dest.lat, dest.bearing);

    // 2. Teleport camera with street-level third-person view
    this.camera.teleport(dest.lng, dest.lat, dest.bearing, dest.pitch, dest.zoom);

    // 3. Audio feedback
    this.soundSystem.playHorn('bicycle');

    // 4. Notify listeners
    this.onTravelCallbacks.forEach((cb) => cb(dest));
    return true;
  }

  public onTravel(callback: (dest: CartagenaDestination) => void): void {
    this.onTravelCallbacks.push(callback);
  }
}

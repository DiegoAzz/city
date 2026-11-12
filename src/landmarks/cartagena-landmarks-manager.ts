import * as THREE from 'three';
import { CartagenaLandmarkDef } from './landmark-types';
import { LandmarkModels } from './landmark-models';
import { distanceInMeters } from '../map/projection/mercator';

export const CARTAGENA_LANDMARKS: CartagenaLandmarkDef[] = [
  {
    id: 'botero_gertrudis',
    name: '"La Gertrudis" de Fernando Botero',
    shortTitle: 'La Gertrudis',
    category: 'monument',
    lng: -75.55208,
    lat: 10.42438,
    headingDeg: 90,
    description: 'Famosa escultura monumental de bronce en plena Plaza Santo Domingo.',
    badgeEmoji: '🗿',
    interactionPrompt: 'Toca para tomarte una foto de recuerdo'
  },
  {
    id: 'palenquera_fruits',
    name: 'Palenquera & Puesto de Frutas Frescas',
    shortTitle: 'Puesto Palenquera',
    category: 'vendor',
    lng: -75.55180,
    lat: 10.42422,
    headingDeg: 45,
    description: 'Dulces típicos de coco, patilla fresca y artesanías caribeñas.',
    badgeEmoji: '🍍',
    interactionPrompt: 'Comprar frutas y dulces caribeños'
  },
  {
    id: 'chiva_rumbera',
    name: 'La Chiva Rumbera de Cartagena',
    shortTitle: 'Chiva Rumbera',
    category: 'transport',
    lng: -75.55160,
    lat: 10.42445,
    headingDeg: 270,
    description: 'El tradicional bus de madera con música caribeña y luces de fiesta.',
    badgeEmoji: '🎺',
    interactionPrompt: 'Subir a la chiva y encender la música'
  },
  {
    id: 'baluarte_santo_domingo',
    name: 'Baluarte de Santo Domingo & Cañones',
    shortTitle: 'Baluarte Murallas',
    category: 'fortress',
    lng: -75.55395,
    lat: 10.42485,
    headingDeg: 180,
    description: 'Cañones coloniales del siglo XVII apuntando hacia el Mar Caribe.',
    badgeEmoji: '🛡️',
    interactionPrompt: 'Inspeccionar cañones y vigilar el horizonte marino'
  },
  {
    id: 'torre_reloj',
    name: 'Torre del Reloj & Puerta de la Paz',
    shortTitle: 'Torre del Reloj',
    category: 'monument',
    lng: -75.54842,
    lat: 10.42295,
    headingDeg: 0,
    description: 'La gran puerta barroca de entrada a la Ciudad Amurallada con su reloj de 4 caras.',
    badgeEmoji: '🏰',
    interactionPrompt: 'Cruzar el portal histórico hacia la Plaza de la Paz'
  },
  {
    id: 'india_catalina',
    name: 'Monumento a la India Catalina',
    shortTitle: 'India Catalina',
    category: 'monument',
    lng: -75.54485,
    lat: 10.42628,
    headingDeg: 120,
    description: 'Estatua de bronce de la heroína indígena sobre su pedestal en Puerto Duro.',
    badgeEmoji: '🗿',
    interactionPrompt: 'Admirar el emblema de la valentía e historia de Cartagena'
  },
  {
    id: 'castillo_san_felipe',
    name: 'Castillo San Felipe de Barajas',
    shortTitle: 'Castillo San Felipe',
    category: 'fortress',
    lng: -75.53920,
    lat: 10.42250,
    headingDeg: 90,
    description: 'La colosal fortaleza sobre el cerro San Lázaro, baluartes y cañones coloniales.',
    badgeEmoji: '🏰',
    interactionPrompt: 'Recorrer las murallas del Castillo San Felipe'
  },
  {
    id: 'zapatos_viejos',
    name: 'Monumento a Los Zapatos Viejos',
    shortTitle: 'Zapatos Viejos',
    category: 'monument',
    lng: -75.53850,
    lat: 10.42200,
    headingDeg: 60,
    description: 'Escultura icónica de botas de bronce en honor al poeta Luis Carlos López.',
    badgeEmoji: '👞',
    interactionPrompt: 'Tomarte una foto dentro de las botas gigantes'
  },
  {
    id: 'muelle_pegasos',
    name: 'Muelle de los Pegasos & Bahía de las Ánimas',
    shortTitle: 'Muelle de los Pegasos',
    category: 'monument',
    lng: -75.54750,
    lat: 10.42180,
    headingDeg: 330,
    description: 'Paseo marítimo con los dos corceles alados de mármol frente a la bahía.',
    badgeEmoji: '⛵',
    interactionPrompt: 'Pasear por el muelle y contemplar los veleros'
  },
  {
    id: 'callejon_sombrillas',
    name: 'Getsemaní & Callejón de las Sombrillas',
    shortTitle: 'Callejón Sombrillas',
    category: 'monument',
    lng: -75.54680,
    lat: 10.42080,
    headingDeg: 45,
    description: 'Techo multicolor de sombrillas flotantes, fachadas coloniales y arte bohemio.',
    badgeEmoji: '🎨',
    interactionPrompt: 'Pasear bajo el cielo de sombrillas de colores'
  }
];

export class CartagenaLandmarksManager {
  private scene: THREE.Scene | null = null;
  private landmarkMeshes: Map<string, THREE.Group> = new Map();
  private nearbyLandmark: CartagenaLandmarkDef | null = null;
  private onNearbyCallbacks: Array<(landmark: CartagenaLandmarkDef | null) => void> = [];

  constructor() {}

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.instantiateLandmarks();
  }

  private instantiateLandmarks(): void {
    if (!this.scene) return;

    CARTAGENA_LANDMARKS.forEach((def) => {
      let group: THREE.Group | null = null;

      switch (def.id) {
        case 'india_catalina':
          group = LandmarkModels.buildIndiaCatalina();
          break;
        case 'torre_reloj':
          group = LandmarkModels.buildTorreDelReloj();
          break;
        case 'botero_gertrudis':
          group = LandmarkModels.buildBoteroGertrudis();
          break;
        case 'baluarte_santo_domingo':
          group = LandmarkModels.buildBaluarteSantoDomingo();
          break;
        case 'chiva_rumbera':
          group = LandmarkModels.buildChivaRumbera();
          break;
        case 'palenquera_fruits':
          group = LandmarkModels.buildPalenqueraFruitStand();
          break;
        case 'castillo_san_felipe':
          group = LandmarkModels.buildCastilloSanFelipe();
          break;
        case 'zapatos_viejos':
          group = LandmarkModels.buildZapatosViejos();
          break;
        case 'muelle_pegasos':
          group = LandmarkModels.buildMuellePegasos();
          break;
        case 'callejon_sombrillas':
          group = LandmarkModels.buildCallejonSombrillas();
          break;
      }

      if (group) {
        group.rotation.y = (def.headingDeg * Math.PI) / 180.0;
        this.scene!.add(group);
        this.landmarkMeshes.set(def.id, group);
      }
    });
  }

  public updatePositions(playerLng: number, playerLat: number): void {
    if (!this.scene) return;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);
    const visualScaleFactor = 3.8;

    let closest: CartagenaLandmarkDef | null = null;
    let minDist = 22.0; // 22 meters proximity detection

    for (const def of CARTAGENA_LANDMARKS) {
      const mesh = this.landmarkMeshes.get(def.id);
      if (mesh) {
        const dLng = def.lng - playerLng;
        const dLat = def.lat - playerLat;
        const dEastMeters = dLng * metersPerDegLng;
        const dNorthMeters = dLat * metersPerDegLat;

        // Position relative to player in Three.js coordinate system (/ 3.8 visual scale)
        mesh.position.set(
          dEastMeters / visualScaleFactor,
          0,
          -dNorthMeters / visualScaleFactor
        );

        const dist = distanceInMeters([playerLng, playerLat], [def.lng, def.lat]);
        if (dist < minDist) {
          minDist = dist;
          closest = def;
        }
      }
    }

    if (closest !== this.nearbyLandmark) {
      this.nearbyLandmark = closest;
      this.onNearbyCallbacks.forEach((cb) => cb(closest));
    }
  }

  public onLandmarkNearby(callback: (landmark: CartagenaLandmarkDef | null) => void): void {
    this.onNearbyCallbacks.push(callback);
  }

  public getLandmarks(): CartagenaLandmarkDef[] {
    return CARTAGENA_LANDMARKS;
  }
}

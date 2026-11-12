import * as THREE from 'three';
import { ColonialModels } from './colonial-models';

export interface ColonialBuildingDef {
  id: string;
  name: string;
  type: 'casona' | 'portal' | 'palacio' | 'catedral' | 'iglesia';
  palette: string;
  floors?: number;
  width?: number;
  depth?: number;
  lng: number;
  lat: number;
  headingDeg: number;
}

export const CENTRO_HISTORICO_BUILDINGS: ColonialBuildingDef[] = [
  // 1. Plaza Santo Domingo
  {
    id: 'iglesia_santo_domingo',
    name: 'Iglesia y Convento de Santo Domingo',
    type: 'iglesia',
    palette: 'yellow',
    lng: -75.55240,
    lat: 10.42455,
    headingDeg: 90
  },
  {
    id: 'cafe_santo_domingo',
    name: 'Café & Terraza Santo Domingo',
    type: 'portal',
    palette: 'yellow',
    lng: -75.55190,
    lat: 10.42465,
    headingDeg: 180
  },
  {
    id: 'casona_valdehoyos_plaza',
    name: 'Casona del Marqués de Valdehoyos',
    type: 'palacio',
    palette: 'white',
    lng: -75.55225,
    lat: 10.42405,
    headingDeg: 0
  },
  {
    id: 'hotel_boutique_santo_domingo',
    name: 'Hotel Boutique Colonial Plaza',
    type: 'portal',
    palette: 'pink',
    lng: -75.55160,
    lat: 10.42420,
    headingDeg: 270
  },
  {
    id: 'casona_mostaza_plaza',
    name: 'Casona Colonial Los Balcones',
    type: 'casona',
    palette: 'yellow',
    floors: 3,
    lng: -75.55255,
    lat: 10.42425,
    headingDeg: 90
  },

  // 2. Calle de la Mantilla
  {
    id: 'casona_mantilla_1',
    name: 'Casona de la Mantilla Rosa',
    type: 'casona',
    palette: 'pink',
    floors: 2,
    lng: -75.55260,
    lat: 10.42485,
    headingDeg: 135
  },
  {
    id: 'casona_mantilla_2',
    name: 'Casona Encalada de la Mantilla',
    type: 'casona',
    palette: 'white',
    floors: 3,
    lng: -75.55280,
    lat: 10.42470,
    headingDeg: 315
  },
  {
    id: 'casona_mantilla_3',
    name: 'Residencia Colonial Bougainvillea',
    type: 'casona',
    palette: 'terracotta',
    floors: 2,
    lng: -75.55295,
    lat: 10.42500,
    headingDeg: 135
  },

  // 3. Calle de la Factoría
  {
    id: 'casona_factoria_1',
    name: 'Casona de la Factoría Azul',
    type: 'casona',
    palette: 'blue',
    floors: 2,
    lng: -75.55320,
    lat: 10.42490,
    headingDeg: 135
  },
  {
    id: 'casona_factoria_2',
    name: 'Casona Esmeralda de la Factoría',
    type: 'casona',
    palette: 'green',
    floors: 3,
    lng: -75.55340,
    lat: 10.42510,
    headingDeg: 135
  },
  {
    id: 'casona_factoria_3',
    name: 'Casona Don Pedro Factoría',
    type: 'casona',
    palette: 'terracotta',
    floors: 2,
    lng: -75.55365,
    lat: 10.42535,
    headingDeg: 315
  },

  // 4. Calle Don Sancho
  {
    id: 'casona_don_sancho_1',
    name: 'Mansión Don Sancho',
    type: 'palacio',
    palette: 'yellow',
    lng: -75.55140,
    lat: 10.42495,
    headingDeg: 45
  },
  {
    id: 'casona_don_sancho_2',
    name: 'Hotel Casona Don Sancho',
    type: 'portal',
    palette: 'white',
    lng: -75.55115,
    lat: 10.42525,
    headingDeg: 225
  },
  {
    id: 'casona_don_sancho_3',
    name: 'Casona Caribeña Don Sancho',
    type: 'casona',
    palette: 'blue',
    floors: 2,
    lng: -75.55155,
    lat: 10.42540,
    headingDeg: 45
  },

  // 5. Calle de la Iglesia & Plaza de Bolívar
  {
    id: 'palacio_inquisicion',
    name: 'Palacio de la Inquisición',
    type: 'palacio',
    palette: 'white',
    lng: -75.55100,
    lat: 10.42340,
    headingDeg: 0
  },
  {
    id: 'catedral_santa_catalina',
    name: 'Catedral Santa Catalina de Alejandría',
    type: 'catedral',
    palette: 'yellow',
    lng: -75.55020,
    lat: 10.42370,
    headingDeg: 270
  },
  {
    id: 'gobernacion_bolivar',
    name: 'Palacio de la Gobernación de Bolívar',
    type: 'portal',
    palette: 'yellow',
    lng: -75.55080,
    lat: 10.42390,
    headingDeg: 180
  },
  {
    id: 'museo_oro_zenu',
    name: 'Casona Museo del Oro Zenú',
    type: 'casona',
    palette: 'white',
    floors: 2,
    lng: -75.55045,
    lat: 10.42325,
    headingDeg: 0
  },

  // 6. Calle de los Santos de Piedra
  {
    id: 'casona_santos_piedra_1',
    name: 'Boutique Santos de Piedra',
    type: 'portal',
    palette: 'pink',
    lng: -75.55040,
    lat: 10.42410,
    headingDeg: 90
  },
  {
    id: 'casona_santos_piedra_2',
    name: 'Casona Verde Colonial',
    type: 'casona',
    palette: 'green',
    floors: 3,
    lng: -75.55015,
    lat: 10.42425,
    headingDeg: 270
  },

  // 7. Plaza de los Coches & Portal de los Dulces (Frente a la Torre del Reloj)
  {
    id: 'portal_dulces_1',
    name: 'Portal de los Dulces (Sección Oeste)',
    type: 'portal',
    palette: 'yellow',
    lng: -75.54895,
    lat: 10.42280,
    headingDeg: 90
  },
  {
    id: 'portal_dulces_2',
    name: 'Portal de los Dulces (Sección Este)',
    type: 'portal',
    palette: 'yellow',
    lng: -75.54865,
    lat: 10.42285,
    headingDeg: 90
  },
  {
    id: 'casona_plaza_coches_1',
    name: 'Casona Señorial Plaza de los Coches',
    type: 'palacio',
    palette: 'white',
    lng: -75.54880,
    lat: 10.42315,
    headingDeg: 180
  },
  {
    id: 'casona_plaza_coches_2',
    name: 'Hotel Colonial El Reloj',
    type: 'portal',
    palette: 'terracotta',
    lng: -75.54855,
    lat: 10.42255,
    headingDeg: 0
  },

  // 8. Plaza de San Pedro Claver
  {
    id: 'casona_san_pedro_1',
    name: 'Casona Colonial San Pedro',
    type: 'casona',
    palette: 'yellow',
    floors: 3,
    lng: -75.55000,
    lat: 10.42215,
    headingDeg: 180
  },
  {
    id: 'casona_san_pedro_2',
    name: 'Café & Terraza San Pedro',
    type: 'portal',
    palette: 'white',
    lng: -75.55045,
    lat: 10.42225,
    headingDeg: 270
  },
  {
    id: 'casona_san_pedro_3',
    name: 'Boutique Artesanías Caribeñas',
    type: 'casona',
    palette: 'blue',
    floors: 2,
    lng: -75.55065,
    lat: 10.42195,
    headingDeg: 90
  },

  // 9. Calle de las Damas & Calle Baloco
  {
    id: 'casona_damas_1',
    name: 'Casona de las Damas Dorada',
    type: 'casona',
    palette: 'yellow',
    floors: 2,
    lng: -75.55180,
    lat: 10.42310,
    headingDeg: 45
  },
  {
    id: 'casona_damas_2',
    name: 'Residencia de las Damas Azul',
    type: 'casona',
    palette: 'blue',
    floors: 3,
    lng: -75.55205,
    lat: 10.42290,
    headingDeg: 225
  },
  {
    id: 'casona_baloco_1',
    name: 'Casona Colonial Baloco',
    type: 'casona',
    palette: 'white',
    floors: 2,
    lng: -75.55240,
    lat: 10.42350,
    headingDeg: 135
  },
  {
    id: 'casona_baloco_2',
    name: 'Mansión Baloco Rosa',
    type: 'palacio',
    palette: 'pink',
    lng: -75.55265,
    lat: 10.42330,
    headingDeg: 315
  },

  // 10. Calle del Cuartel & Calle de la Chicharra
  {
    id: 'casona_cuartel_1',
    name: 'Casona del Cuartel',
    type: 'casona',
    palette: 'terracotta',
    floors: 3,
    lng: -75.55085,
    lat: 10.42445,
    headingDeg: 90
  },
  {
    id: 'casona_cuartel_2',
    name: 'Casona Colonial del Cuartel Este',
    type: 'casona',
    palette: 'green',
    floors: 2,
    lng: -75.55060,
    lat: 10.42465,
    headingDeg: 270
  },

  // 11. Baluarte de Santo Domingo & Paseo de las Murallas
  {
    id: 'cafe_del_mar_casona',
    name: 'Casona Mirador de las Murallas',
    type: 'portal',
    palette: 'white',
    lng: -75.55420,
    lat: 10.42470,
    headingDeg: 90
  },
  {
    id: 'casona_muralla_norte',
    name: 'Casona Colonial Vista al Mar',
    type: 'casona',
    palette: 'yellow',
    floors: 2,
    lng: -75.55385,
    lat: 10.42520,
    headingDeg: 180
  },

  // 12. Calle de la Moneda & San Agustín
  {
    id: 'casona_moneda_1',
    name: 'Casona Colonial de la Moneda',
    type: 'casona',
    palette: 'yellow',
    floors: 2,
    lng: -75.54885,
    lat: 10.42405,
    headingDeg: 45
  },
  {
    id: 'casona_moneda_2',
    name: 'Mansión Señorial de la Moneda',
    type: 'palacio',
    palette: 'white',
    lng: -75.54855,
    lat: 10.42435,
    headingDeg: 225
  }
];

export class ColonialDistrictManager {
  private scene: THREE.Scene | null = null;
  private buildingMeshes: Map<string, THREE.Group> = new Map();

  constructor() {}

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.instantiateBuildings();
  }

  private instantiateBuildings(): void {
    if (!this.scene) return;

    CENTRO_HISTORICO_BUILDINGS.forEach((def) => {
      let group: THREE.Group | null = null;

      switch (def.type) {
        case 'casona':
          group = ColonialModels.buildCasona(
            def.palette,
            def.floors || 2,
            def.width || 7.0,
            def.depth || 6.0
          );
          break;
        case 'portal':
          group = ColonialModels.buildPortalComercial(def.palette, def.name);
          break;
        case 'palacio':
          group = ColonialModels.buildPalacioInquisicion();
          break;
        case 'catedral':
          group = ColonialModels.buildCatedral();
          break;
        case 'iglesia':
          group = ColonialModels.buildIglesiaSantoDomingo();
          break;
      }

      if (group) {
        group.rotation.y = (def.headingDeg * Math.PI) / 180.0;
        // Optimization: mark meshes as non-frustum culled for custom matrix rendering
        group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.frustumCulled = false;
          }
        });
        this.scene!.add(group);
        this.buildingMeshes.set(def.id, group);
      }
    });
  }

  public updatePositions(playerLng: number, playerLat: number): void {
    if (!this.scene) return;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);
    const visualScaleFactor = 3.8;

    for (const def of CENTRO_HISTORICO_BUILDINGS) {
      const mesh = this.buildingMeshes.get(def.id);
      if (mesh) {
        const dLng = def.lng - playerLng;
        const dLat = def.lat - playerLat;
        const dEastMeters = dLng * metersPerDegLng;
        const dNorthMeters = dLat * metersPerDegLat;

        // Position relative to player in Three.js coordinate space (/ visualScaleFactor)
        mesh.position.set(
          dEastMeters / visualScaleFactor,
          0,
          -dNorthMeters / visualScaleFactor
        );
      }
    }
  }

  public getBuildings(): ColonialBuildingDef[] {
    return CENTRO_HISTORICO_BUILDINGS;
  }
}

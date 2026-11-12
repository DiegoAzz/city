import { VirtualProperty, FacadeStyle } from './property-types';
import { distanceInMeters } from '../map/projection/mercator';
import type { EconomyManager } from '../economy/economy-manager';
import type { MultiplayerManager } from '../multiplayer/multiplayer-manager';

export const INITIAL_PROPERTIES: VirtualProperty[] = [
  {
    id: 'prop_santo_domingo_north',
    name: 'Casa Colonial Santo Domingo',
    district: 'Centro Histórico (OSM)',
    lng: -75.55182,
    lat: 10.42450,
    price: 500,
    status: 'available',
    ownerId: null,
    ownerName: null,
    color: '#94a3b8',
    facadeStyle: 'colonial'
  },
  {
    id: 'prop_santo_domingo_west',
    name: 'Mansión del Marqués',
    district: 'Plaza Santo Domingo (OSM)',
    lng: -75.55230,
    lat: 10.42435,
    price: 650,
    status: 'available',
    ownerId: null,
    ownerName: null,
    color: '#94a3b8',
    facadeStyle: 'luxury'
  },
  {
    id: 'prop_calle_iglesia',
    name: 'Villa Balcones Coloniales',
    district: 'Calle de la Iglesia (OSM)',
    lng: -75.55150,
    lat: 10.42410,
    price: 450,
    status: 'available',
    ownerId: null,
    ownerName: null,
    color: '#94a3b8',
    facadeStyle: 'colonial'
  },
  {
    id: 'prop_plaza_bolivar',
    name: 'Residencia Parque Bolívar',
    district: 'Parque de Bolívar (OSM)',
    lng: -75.55110,
    lat: 10.42370,
    price: 800,
    status: 'available',
    ownerId: null,
    ownerName: null,
    color: '#94a3b8',
    facadeStyle: 'luxury'
  },
  {
    id: 'prop_calle_inquisicion',
    name: 'Palacete de la Inquisición',
    district: 'Calle de la Inquisición (OSM)',
    lng: -75.55210,
    lat: 10.42360,
    price: 700,
    status: 'available',
    ownerId: null,
    ownerName: null,
    color: '#94a3b8',
    facadeStyle: 'colonial'
  },
  {
    id: 'prop_bocagrande_bay',
    name: 'Penthouse Bahía de Cartagena',
    district: 'Bahía de las Ánimas (OSM)',
    lng: -75.55350,
    lat: 10.42490,
    price: 950,
    status: 'available',
    ownerId: null,
    ownerName: null,
    color: '#94a3b8',
    facadeStyle: 'penthouse'
  }
];

export class PropertyManager {
  private properties: Map<string, VirtualProperty> = new Map();
  private economy: EconomyManager;
  private multiplayer: MultiplayerManager;
  private onPropertiesChangedCallbacks: Array<() => void> = [];
  private onNearbyPropertyChangeCallbacks: Array<(prop: VirtualProperty | null, distanceMeters: number) => void> = [];
  private currentNearbyProperty: VirtualProperty | null = null;

  constructor(economy: EconomyManager, multiplayer: MultiplayerManager) {
    this.economy = economy;
    this.multiplayer = multiplayer;

    // Load initial seed
    INITIAL_PROPERTIES.forEach((p) => {
      this.properties.set(p.id, { ...p });
    });

    this.loadLocalClaimedProperties();
  }

  private loadLocalClaimedProperties(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('city_world_claimed_properties');
        if (raw) {
          const list = JSON.parse(raw) as VirtualProperty[];
          list.forEach((p) => {
            if (this.properties.has(p.id)) {
              this.properties.set(p.id, { ...this.properties.get(p.id)!, ...p });
            }
          });
        }
      }
    } catch (e) {
      console.warn('[PropertyManager] Could not load saved properties:', e);
    }
  }

  private saveLocalClaimedProperties(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const claimed = Array.from(this.properties.values()).filter((p) => p.status === 'claimed');
        localStorage.setItem('city_world_claimed_properties', JSON.stringify(claimed));
      }
    } catch (e) {
      console.warn('[PropertyManager] Could not save properties:', e);
    }
  }

  public getAllProperties(): VirtualProperty[] {
    return Array.from(this.properties.values());
  }

  public getProperty(id: string): VirtualProperty | undefined {
    return this.properties.get(id);
  }

  /**
   * Finds the nearest property within searchRadiusMeters.
   */
  public getNearestProperty(
    lng: number,
    lat: number,
    searchRadiusMeters: number = 24
  ): { property: VirtualProperty; distanceMeters: number } | null {
    let bestMatch: VirtualProperty | null = null;
    let minDistance = Infinity;

    for (const prop of this.properties.values()) {
      const dist = distanceInMeters([lng, lat], [prop.lng, prop.lat]);
      if (dist <= searchRadiusMeters && dist < minDistance) {
        minDistance = dist;
        bestMatch = prop;
      }
    }

    if (bestMatch) {
      return { property: bestMatch, distanceMeters: minDistance };
    }
    return null;
  }

  /**
   * Updates proximity tracking each frame.
   */
  public updateProximity(playerLng: number, playerLat: number): void {
    const match = this.getNearestProperty(playerLng, playerLat, 22);

    if (match) {
      if (this.currentNearbyProperty?.id !== match.property.id) {
        this.currentNearbyProperty = match.property;
        this.onNearbyPropertyChangeCallbacks.forEach((cb) => cb(match.property, match.distanceMeters));
      }
    } else {
      if (this.currentNearbyProperty !== null) {
        this.currentNearbyProperty = null;
        this.onNearbyPropertyChangeCallbacks.forEach((cb) => cb(null, Infinity));
      }
    }
  }

  public onNearbyPropertyChange(
    cb: (prop: VirtualProperty | null, distanceMeters: number) => void
  ): void {
    this.onNearbyPropertyChangeCallbacks.push(cb);
  }

  public onPropertiesChanged(cb: () => void): void {
    this.onPropertiesChangedCallbacks.push(cb);
  }

  /**
   * Claims a property for the local player with virtual economy check and multiplayer broadcast.
   */
  public claimProperty(
    propertyId: string,
    customName?: string,
    color?: string,
    facadeStyle?: FacadeStyle
  ): { success: boolean; reason?: string } {
    const prop = this.properties.get(propertyId);
    if (!prop) {
      return { success: false, reason: 'Propiedad no encontrada' };
    }

    const myPlayerId = this.multiplayer.getMyId();
    const myPlayerName = this.multiplayer.getPlayerName();

    if (prop.status === 'claimed' && prop.ownerId !== myPlayerId) {
      return { success: false, reason: `Esta propiedad ya pertenece a ${prop.ownerName}` };
    }

    // Deduct cost if acquiring for the first time
    if (prop.status !== 'claimed' || prop.ownerId !== myPlayerId) {
      if (!this.economy.canAfford(prop.price)) {
        return { success: false, reason: `Fondos insuficientes. Requiere $${prop.price} monedas.` };
      }
      this.economy.deduct(prop.price);
    }

    // Update property state
    prop.status = 'claimed';
    prop.ownerId = myPlayerId;
    prop.ownerName = myPlayerName;
    if (customName) prop.name = customName;
    if (color) prop.color = color;
    if (facadeStyle) prop.facadeStyle = facadeStyle;
    prop.claimedAt = Date.now();

    this.saveLocalClaimedProperties();

    // Broadcast through multiplayer WebSocket
    this.multiplayer.broadcastPropertyUpdate(prop);

    this.notifyPropertiesChanged();
    return { success: true };
  }

  /**
   * Updates styling/decorations of an already owned property.
   */
  public updatePropertyStyle(
    propertyId: string,
    customName: string,
    color: string,
    facadeStyle: FacadeStyle
  ): boolean {
    const prop = this.properties.get(propertyId);
    if (!prop) return false;

    const myPlayerId = this.multiplayer.getMyId();
    if (prop.ownerId !== myPlayerId) return false;

    prop.name = customName;
    prop.color = color;
    prop.facadeStyle = facadeStyle;

    this.saveLocalClaimedProperties();
    this.multiplayer.broadcastPropertyUpdate(prop);
    this.notifyPropertiesChanged();
    return true;
  }

  /**
   * Ingests remote property update from WebSocket server.
   */
  public handleRemotePropertyUpdate(remoteProp: VirtualProperty): void {
    this.properties.set(remoteProp.id, remoteProp);
    this.saveLocalClaimedProperties();
    this.notifyPropertiesChanged();
  }

  private notifyPropertiesChanged(): void {
    this.onPropertiesChangedCallbacks.forEach((cb) => cb());
  }
}

export type PropertyStatus = 'available' | 'claimed' | 'reserved';
export type FacadeStyle = 'colonial' | 'modern' | 'luxury' | 'penthouse';

export interface VirtualProperty {
  id: string;
  name: string;
  district: string;
  lng: number;
  lat: number;
  price: number;
  status: PropertyStatus;
  ownerId: string | null;
  ownerName: string | null;
  color: string;
  facadeStyle: FacadeStyle;
  claimedAt?: number;
}

export interface ClaimPropertyPayload {
  propertyId: string;
  propertyName: string;
  color: string;
  facadeStyle: FacadeStyle;
}

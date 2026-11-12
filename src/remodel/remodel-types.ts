export type RemodelPresetId =
  | 'convention'
  | 'hotel'
  | 'restaurant'
  | 'mansion'
  | 'cafe'
  | 'custom';

export interface RemodelPreset {
  id: RemodelPresetId;
  name: string;
  icon: string;
  defaultName: string;
  defaultColor: string;
  rentPerMinute: number;
  cost: number;
  description: string;
}

export interface RemodeledBuilding {
  id: string; // Feature ID or spatial key
  name: string;
  presetId: RemodelPresetId;
  color: string;
  ownerId: string;
  ownerName: string;
  rentPerMinute: number;
  cost: number;
  lng: number;
  lat: number;
  height: number;
  polygon?: [number, number][]; // Optional footprint coordinates
  timestamp: number;
}

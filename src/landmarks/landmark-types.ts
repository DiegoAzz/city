export type LandmarkCategory = 'monument' | 'transport' | 'culture' | 'vendor' | 'fortress';

export interface CartagenaLandmarkDef {
  id: string;
  name: string;
  shortTitle: string;
  category: LandmarkCategory;
  lng: number;
  lat: number;
  headingDeg: number;
  description: string;
  badgeEmoji: string;
  interactionPrompt: string;
}

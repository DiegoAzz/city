import { MovementMode } from '../character/model/character-mesh';
import { CharacterAnimState } from '../character/animation/character-animator';

export interface PlayerData {
  id: string;
  name: string;
  color: number;
  lng: number;
  lat: number;
  altitude: number;
  bearing: number;
  speed: number;
  mode: MovementMode;
  animState: CharacterAnimState;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

import * as THREE from 'three';
import { CharacterRigs, createCharacterMesh } from '../character/model/character-mesh';
import { CharacterAnimator } from '../character/animation/character-animator';
import { PlayerBillboard } from '../multiplayer/nametag';

export interface CitizenDef {
  id: string;
  name: string;
  role: string;
  color: number;
  initialLng: number;
  initialLat: number;
  greeting: string;
  patrolRadiusMeters: number;
}

export class AmbientCitizen {
  public def: CitizenDef;
  public rigs: CharacterRigs;
  public animator: CharacterAnimator;
  public billboard: PlayerBillboard;
  public currentLng: number;
  public currentLat: number;
  public angle: number = 0;
  public speed: number = 0.6; // gentle walking pace

  constructor(def: CitizenDef, scene: THREE.Scene) {
    this.def = def;
    this.currentLng = def.initialLng;
    this.currentLat = def.initialLat;

    this.rigs = createCharacterMesh();
    this.animator = new CharacterAnimator(this.rigs);
    this.animator.setMovementMode('foot');

    // Billboard overhead with role
    this.billboard = new PlayerBillboard(`${def.name} [${def.role}]`, 'foot');
    this.rigs.container.add(this.billboard.sprite);

    // Apply distinctive outfit color
    this.rigs.torso.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).material) {
        ((obj as THREE.Mesh).material as THREE.MeshLambertMaterial).color = new THREE.Color(def.color);
      }
    });

    scene.add(this.rigs.root);
  }

  public update(delta: number, playerLng: number, playerLat: number, metersPerDegLng: number, metersPerDegLat: number): void {
    // Gentle circular patrol around initial position
    this.angle += delta * 0.4;
    const offsetEastMeters = Math.sin(this.angle) * this.def.patrolRadiusMeters;
    const offsetNorthMeters = Math.cos(this.angle) * (this.def.patrolRadiusMeters * 0.7);

    this.currentLng = this.def.initialLng + offsetEastMeters / metersPerDegLng;
    this.currentLat = this.def.initialLat + offsetNorthMeters / metersPerDegLat;

    // Face walking direction
    this.rigs.container.rotation.y = this.angle + Math.PI / 2;

    // Update walk animation cycle
    this.animator.setState('walk');
    this.animator.update(delta, 1.2, true);

    // Distance to local player
    const dLng = this.currentLng - playerLng;
    const dLat = this.currentLat - playerLat;
    const dEast = dLng * metersPerDegLng;
    const dNorth = dLat * metersPerDegLat;
    const distMeters = Math.hypot(dEast, dNorth);

    // If player is close, show greeting speech bubble
    if (distMeters < 5.5) {
      this.billboard.showSpeechBubble(this.def.greeting, 3000);
    }

    // Position relative to player in Three.js coordinate system (/ 3.8 visual scale)
    this.rigs.root.position.set(dEast / 3.8, 0, -dNorth / 3.8);
  }
}

export class AmbientCitizensManager {
  private citizens: AmbientCitizen[] = [];
  private scene: THREE.Scene | null = null;

  private citizenDefs: CitizenDef[] = [
    {
      id: 'palenquera_rosa',
      name: 'Doña Rosa',
      role: 'Palenquera 🍉',
      color: 0xf59e0b, // Vibrant tropical yellow
      initialLng: -75.55208,
      initialLat: 10.42438,
      greeting: '¡A la orden las frutas frescas! 🥭🍉',
      patrolRadiusMeters: 4.5
    },
    {
      id: 'musico_chepe',
      name: 'Don Chepe',
      role: 'Juglar 🪗',
      color: 0xef4444, // Festive red
      initialLng: -75.55192,
      initialLat: 10.42428,
      greeting: '¡Bienvenidos a Cartagena! 🪗✨',
      patrolRadiusMeters: 3.2
    },
    {
      id: 'policia_gomez',
      name: 'Agente Gómez',
      role: 'Policía 👮',
      color: 0x1e293b, // Police navy
      initialLng: -75.55218,
      initialLat: 10.42426,
      greeting: '¡Plaza Santo Domingo segura y en paz! 👮',
      patrolRadiusMeters: 6.0
    },
    {
      id: 'turista_mateo',
      name: 'Mateo',
      role: 'Turista 📸',
      color: 0x06b6d4, // Cyan
      initialLng: -75.55184,
      initialLat: 10.42442,
      greeting: '¡Qué arquitectura colonial tan hermosa! 📸',
      patrolRadiusMeters: 5.0
    }
  ];

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.citizens = this.citizenDefs.map((def) => new AmbientCitizen(def, scene));
  }

  public update(delta: number, playerLng: number, playerLat: number): void {
    if (!this.scene || this.citizens.length === 0) return;

    const latRad = (playerLat * Math.PI) / 180.0;
    const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
    const metersPerDegLng = 111412.84 * Math.cos(latRad);

    for (const citizen of this.citizens) {
      citizen.update(delta, playerLng, playerLat, metersPerDegLng, metersPerDegLat);
    }
  }
}

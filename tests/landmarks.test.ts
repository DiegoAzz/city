import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CARTAGENA_LANDMARKS, CartagenaLandmarksManager } from '../src/landmarks/cartagena-landmarks-manager';
import { LandmarkModels } from '../src/landmarks/landmark-models';
import { isWithinCartagenaBounds } from '../src/map/geodata/cartagena';

describe('Cartagena 3D Real Landmarks & Brookhaven World System', () => {
  it('contains all essential iconic Cartagena landmarks', () => {
    expect(CARTAGENA_LANDMARKS.length).toBeGreaterThanOrEqual(6);

    const indiaCatalina = CARTAGENA_LANDMARKS.find((l) => l.id === 'india_catalina');
    expect(indiaCatalina).toBeDefined();
    expect(indiaCatalina?.name).toContain('India Catalina');

    const torreReloj = CARTAGENA_LANDMARKS.find((l) => l.id === 'torre_reloj');
    expect(torreReloj).toBeDefined();
    expect(torreReloj?.name).toContain('Torre del Reloj');

    const botero = CARTAGENA_LANDMARKS.find((l) => l.id === 'botero_gertrudis');
    expect(botero).toBeDefined();
    expect(botero?.name).toContain('Botero');

    const chiva = CARTAGENA_LANDMARKS.find((l) => l.id === 'chiva_rumbera');
    expect(chiva).toBeDefined();
    expect(chiva?.category).toBe('transport');
  });

  it('verifies all landmark coordinates are within Cartagena boundaries', () => {
    CARTAGENA_LANDMARKS.forEach((l) => {
      const isInside = isWithinCartagenaBounds(l.lng, l.lat);
      expect(isInside).toBe(true);
    });
  });

  it('builds 3D procedural meshes for landmarks without errors', () => {
    const catalinaMesh = LandmarkModels.buildIndiaCatalina();
    expect(catalinaMesh).toBeInstanceOf(THREE.Group);
    expect(catalinaMesh.children.length).toBeGreaterThan(0);

    const torreMesh = LandmarkModels.buildTorreDelReloj();
    expect(torreMesh).toBeInstanceOf(THREE.Group);
    expect(torreMesh.children.length).toBeGreaterThan(0);

    const boteroMesh = LandmarkModels.buildBoteroGertrudis();
    expect(boteroMesh).toBeInstanceOf(THREE.Group);

    const chivaMesh = LandmarkModels.buildChivaRumbera();
    expect(chivaMesh).toBeInstanceOf(THREE.Group);
  });

  it('detects proximity when avatar approaches landmark', () => {
    const manager = new CartagenaLandmarksManager();
    const scene = new THREE.Scene();
    manager.setScene(scene);

    let nearbyName = '';
    manager.onLandmarkNearby((l) => {
      if (l) nearbyName = l.name;
    });

    // Stand 2 meters from Botero statue in Plaza Santo Domingo
    manager.updatePositions(-75.55208, 10.42438);
    expect(nearbyName).toContain('Botero');
  });
});

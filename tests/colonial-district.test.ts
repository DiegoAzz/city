import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ColonialDistrictManager } from '../src/buildings/colonial-district-manager';
import { ColonialModels } from '../src/buildings/colonial-models';

describe('Cartagena Centro Histórico 3D Architecture', () => {
  let districtManager: ColonialDistrictManager;
  let scene: THREE.Scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    districtManager = new ColonialDistrictManager();
    districtManager.setScene(scene);
  });

  it('defines authentic colonial buildings across Centro Histórico', () => {
    const buildings = districtManager.getBuildings();
    expect(buildings.length).toBeGreaterThanOrEqual(30);

    const ids = buildings.map((b) => b.id);
    expect(ids).toContain('iglesia_santo_domingo');
    expect(ids).toContain('cafe_santo_domingo');
    expect(ids).toContain('palacio_inquisicion');
    expect(ids).toContain('catedral_santa_catalina');
    expect(ids).toContain('portal_dulces_1');
    expect(ids).toContain('casona_mantilla_1');
    expect(ids).toContain('casona_factoria_1');
  });

  it('builds procedural 3D casona with clay tile roof and wooden balconies', () => {
    const casona = ColonialModels.buildCasona('yellow', 2, 7.0, 6.0);
    expect(casona).toBeInstanceOf(THREE.Group);
    expect(casona.children.length).toBeGreaterThan(5);
  });

  it('builds commercial portal with arcadas and cafe tables', () => {
    const portal = ColonialModels.buildPortalComercial('yellow', 'Café Santo Domingo');
    expect(portal).toBeInstanceOf(THREE.Group);
    expect(portal.children.length).toBeGreaterThan(5);
  });

  it('updates building coordinates relative to player in Three.js coordinate space', () => {
    // Player standing in Plaza Santo Domingo
    districtManager.updatePositions(-75.5520, 10.4243);

    // Verify scene has children added
    expect(scene.children.length).toBeGreaterThanOrEqual(30);
  });
});

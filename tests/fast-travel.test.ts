import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastTravelManager } from '../src/navigation/fast-travel';
import { CharacterController } from '../src/character/controller/character-controller';
import { CameraController } from '../src/camera/camera-controller';
import { SoundSystem } from '../src/audio/sound-system';

describe('Cartagena GPS Fast Travel System', () => {
  let character: CharacterController;
  let camera: CameraController;
  let soundSystem: SoundSystem;
  let fastTravel: FastTravelManager;
  let mockMap: any;

  beforeEach(() => {
    character = new CharacterController(-75.5520, 10.4243);
    mockMap = {
      jumpTo: vi.fn(),
      setCenter: vi.fn(),
      getBearing: vi.fn().mockReturnValue(30),
      getPitch: vi.fn().mockReturnValue(76),
      getZoom: vi.fn().mockReturnValue(20.6)
    };
    camera = new CameraController(mockMap, -75.5520, 10.4243);
    soundSystem = new SoundSystem();
    fastTravel = new FastTravelManager(character, camera, soundSystem);
  });

  it('lists all iconic Cartagena destinations', () => {
    const destinations = fastTravel.getDestinations();
    expect(destinations.length).toBeGreaterThanOrEqual(8);
    const ids = destinations.map((d) => d.id);
    expect(ids).toContain('santo_domingo');
    expect(ids).toContain('india_catalina');
    expect(ids).toContain('torre_reloj');
    expect(ids).toContain('baluarte_santo_domingo');
    expect(ids).toContain('castillo_san_felipe');
    expect(ids).toContain('zapatos_viejos');
    expect(ids).toContain('getsemani');
    expect(ids).toContain('bocagrande');
  });

  it('teleports character and camera to selected destination', () => {
    const success = fastTravel.travelTo('india_catalina');
    expect(success).toBe(true);

    const [lng, lat] = character.getPosition();
    expect(lng).toBeCloseTo(-75.54485, 4);
    expect(lat).toBeCloseTo(10.42628, 4);

    expect(mockMap.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [-75.54485, 10.42628],
        pitch: 76,
        zoom: 20.6
      })
    );
  });

  it('returns false for non-existent destination', () => {
    const success = fastTravel.travelTo('non_existent_place');
    expect(success).toBe(false);
  });
});

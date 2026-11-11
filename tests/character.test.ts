import { describe, it, expect } from 'vitest';
import { CharacterController, SPEED_PRESETS } from '../src/character/controller/character-controller';
import { CARTAGENA_CONFIG } from '../src/app/config';

describe('Character Controller & Movement Physics', () => {
  const initialLng = CARTAGENA_CONFIG.initialCenter[0];
  const initialLat = CARTAGENA_CONFIG.initialCenter[1];

  it('initializes character with idle state at initial coordinates', () => {
    const controller = new CharacterController(initialLng, initialLat);
    const state = controller.getState();

    expect(state.lng).toBe(initialLng);
    expect(state.lat).toBe(initialLat);
    expect(state.animState).toBe('idle');
    expect(state.speedMps).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.movementMode).toBe('foot');
  });

  it('updates position when joystick is engaged in walking mode', () => {
    const controller = new CharacterController(initialLng, initialLat);
    const dt = 1.0;
    const joystickUp = { x: 0, y: 1.0 };
    const cameraBearing = 0;

    controller.update(dt, joystickUp, cameraBearing);
    const state = controller.getState();

    expect(state.animState).toBe('walk');
    expect(state.speedMps).toBeCloseTo(SPEED_PRESETS.foot.base, 1);
    expect(state.lat).toBeGreaterThan(initialLat);
    expect(state.lng).toBeCloseTo(initialLng, 5);
  });

  it('applies running speed when running toggle is active', () => {
    const controller = new CharacterController(initialLng, initialLat);
    controller.setRunning(true);

    const dt = 1.0;
    const joystickRight = { x: 1.0, y: 0 };
    const cameraBearing = 0;

    controller.update(dt, joystickRight, cameraBearing);
    const state = controller.getState();

    expect(state.animState).toBe('run');
    expect(state.speedMps).toBeCloseTo(SPEED_PRESETS.foot.sprint, 1);
    expect(state.lng).toBeGreaterThan(initialLng);
  });

  it('handles vehicles and jumps correctly', () => {
    const controller = new CharacterController(initialLng, initialLat);

    // Test Jump
    expect(controller.getState().isGrounded).toBe(true);
    controller.jump();
    expect(controller.getState().isGrounded).toBe(false);

    // Switch to Motorcycle mode
    controller.setMovementMode('motorcycle');
    expect(controller.getMovementMode()).toBe('motorcycle');

    controller.update(1.0, { x: 0, y: 1.0 }, 0);
    expect(controller.getState().speedMps).toBeCloseTo(SPEED_PRESETS.motorcycle.base, 1);
  });

  it('returns to idle state when joystick returns to deadzone', () => {
    const controller = new CharacterController(initialLng, initialLat);
    controller.update(0.5, { x: 0, y: 1.0 }, 0);
    expect(controller.getState().animState).toBe('walk');

    controller.update(0.5, { x: 0, y: 0 }, 0);
    const state = controller.getState();
    expect(state.animState).toBe('idle');
    expect(state.speedMps).toBe(0);
  });
});

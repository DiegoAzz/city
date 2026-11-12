import { describe, it, expect, vi } from 'vitest';
import { IntroManager } from '../src/ui/intro/intro-manager';

describe('IntroManager & Brookhaven Onboarding System', () => {
  it('initializes in loading state and defaults to tourist role', () => {
    const mockQuality: any = {};
    const mockSound: any = { toggleMute: vi.fn() };
    const mockMultiplayer: any = { getPlayerName: () => 'TestPlayer', setPlayerName: vi.fn() };
    const onPlay = vi.fn();

    const intro = new IntroManager(mockQuality, mockSound, mockMultiplayer, { onPlay });

    expect(intro.getState()).toBe('loading');
    expect(intro.getSelectedRole().id).toBe('tourist');
  });

  it('updates progress without throwing and transitions when 100%', () => {
    vi.useFakeTimers();
    const mockQuality: any = {};
    const mockSound: any = { toggleMute: vi.fn() };
    const mockMultiplayer: any = { getPlayerName: () => 'TestPlayer', setPlayerName: vi.fn() };
    const onPlay = vi.fn();

    const intro = new IntroManager(mockQuality, mockSound, mockMultiplayer, { onPlay });

    intro.setProgress(50, 'Cargando OpenStreetMap 3D...');
    expect(intro.getState()).toBe('loading');

    intro.setProgress(100, '¡Todo listo!');
    vi.advanceTimersByTime(500);

    expect(intro.getState()).toBe('welcome');
    vi.useRealTimers();
  });

  it('transitions to playing and triggers onPlay callback on JUGAR click', () => {
    const mockQuality: any = {};
    const mockSound: any = { toggleMute: vi.fn() };
    const mockMultiplayer: any = { getPlayerName: () => 'TestPlayer', setPlayerName: vi.fn() };
    const onPlay = vi.fn();

    const intro = new IntroManager(mockQuality, mockSound, mockMultiplayer, { onPlay });

    intro.startGameplay();

    expect(intro.getState()).toBe('playing');
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});

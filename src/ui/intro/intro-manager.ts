import type { QualityManager } from '../../graphics/quality-manager';
import type { SoundSystem } from '../../audio/sound-system';
import type { MultiplayerManager } from '../../multiplayer/multiplayer-manager';

export type GameIntroState = 'loading' | 'welcome' | 'playing';

export interface RoleInfo {
  id: string;
  emoji: string;
  name: string;
}

export const ROLEPLAY_ROLES: RoleInfo[] = [
  { id: 'tourist', emoji: '🌴', name: 'Turista' },
  { id: 'student', emoji: '🎓', name: 'Estudiante' },
  { id: 'police', emoji: '👮', name: 'Policía' },
  { id: 'driver', emoji: '🚗', name: 'Conductor' },
  { id: 'medic', emoji: '🩺', name: 'Médico' },
  { id: 'mayor', emoji: '🏛️', name: 'Alcalde' }
];

export interface IntroCallbacks {
  onPlay: () => void;
  onRetry?: () => void;
}

export class IntroManager {
  private loadingScreen: HTMLElement | null = null;
  private welcomeScreen: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;
  private percentText: HTMLElement | null = null;
  private btnPlay: HTMLElement | null = null;
  private nameInput: HTMLInputElement | null = null;
  private colorChips: NodeListOf<HTMLElement> | null = null;
  private roleChips: NodeListOf<HTMLElement> | null = null;
  private selectedRole: RoleInfo = ROLEPLAY_ROLES[0];

  private state: GameIntroState = 'loading';
  private callbacks: IntroCallbacks;
  private qualityManager: QualityManager;
  private soundSystem: SoundSystem;
  private multiplayer: MultiplayerManager;

  constructor(
    qualityManager: QualityManager,
    soundSystem: SoundSystem,
    multiplayer: MultiplayerManager,
    callbacks: IntroCallbacks
  ) {
    this.qualityManager = qualityManager;
    this.soundSystem = soundSystem;
    this.multiplayer = multiplayer;
    this.callbacks = callbacks;

    if (typeof document !== 'undefined') {
      this.loadingScreen = document.getElementById('loading-screen');
      this.welcomeScreen = document.getElementById('welcome-screen');
      this.progressBar = document.getElementById('loading-progress-fill');
      this.statusText = document.getElementById('loading-status-text');
      this.percentText = document.getElementById('loading-percent-text');
      this.btnPlay = document.getElementById('btn-welcome-play');
      this.nameInput = document.getElementById('welcome-name-input') as HTMLInputElement;
    }

    this.loadSavedRole();
    this.bindEvents();
    this.initCustomizer();
  }

  private loadSavedRole(): void {
    if (typeof localStorage === 'undefined') return;
    const savedId = localStorage.getItem('city_world_role') || 'tourist';
    const match = ROLEPLAY_ROLES.find((r) => r.id === savedId);
    if (match) {
      this.selectedRole = match;
    }
  }

  private bindEvents(): void {
    if (typeof document === 'undefined') return;
    this.btnPlay?.addEventListener('click', () => {
      this.startGameplay();
    });

    // Name change in welcome screen
    this.nameInput?.addEventListener('input', () => {
      if (this.nameInput && this.nameInput.value.trim()) {
        this.multiplayer.setPlayerName(this.nameInput.value.trim());
      }
    });

    // Sound toggle in welcome screen
    const btnSound = document.getElementById('welcome-btn-sound');
    btnSound?.addEventListener('click', () => {
      const isMuted = this.soundSystem.toggleMute();
      const icon = btnSound.querySelector('.btn-icon');
      if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
    });

    // Quality toggle in welcome screen
    const btnQuality = document.getElementById('welcome-btn-quality');
    btnQuality?.addEventListener('click', () => {
      const nextProfile = this.qualityManager.cycleNextProfile();
      const label = btnQuality.querySelector('.btn-text');
      if (label) label.textContent = nextProfile.label;
    });
  }

  private initCustomizer(): void {
    if (typeof document === 'undefined') return;

    if (this.nameInput) {
      this.nameInput.value = this.multiplayer.getPlayerName();
    }

    // Color chips
    const savedColor = typeof localStorage !== 'undefined' ? (localStorage.getItem('city_world_avatar_color') || '#0284c7') : '#0284c7';
    this.colorChips = document.querySelectorAll('.color-chip');
    this.colorChips.forEach((chip) => {
      if (chip.getAttribute('data-color') === savedColor) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }

      chip.addEventListener('click', () => {
        this.colorChips?.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const hex = chip.getAttribute('data-color');
        if (hex && typeof localStorage !== 'undefined') {
          localStorage.setItem('city_world_avatar_color', hex);
        }
      });
    });

    // Role chips (Brookhaven RP identities)
    this.roleChips = document.querySelectorAll('.role-chip');
    this.roleChips.forEach((chip) => {
      if (chip.getAttribute('data-role') === this.selectedRole.id) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }

      chip.addEventListener('click', () => {
        this.roleChips?.forEach((r) => r.classList.remove('active'));
        chip.classList.add('active');
        const roleId = chip.getAttribute('data-role');
        const found = ROLEPLAY_ROLES.find((r) => r.id === roleId);
        if (found) {
          this.selectedRole = found;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('city_world_role', found.id);
          }
        }
      });
    });
  }

  public setProgress(percent: number, status: string): void {
    const clamped = Math.min(100, Math.max(0, Math.round(percent)));
    if (this.progressBar) {
      this.progressBar.style.width = `${clamped}%`;
    }
    if (this.percentText) {
      this.percentText.textContent = `${clamped}%`;
    }
    if (this.statusText) {
      this.statusText.textContent = status;
    }

    if (clamped >= 100) {
      setTimeout(() => {
        this.showWelcome();
      }, 400);
    }
  }

  public showWelcome(): void {
    if (this.state === 'playing') return;
    this.state = 'welcome';

    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        this.loadingScreen?.classList.add('hidden');
      }, 400);
    }

    if (this.welcomeScreen) {
      this.welcomeScreen.classList.remove('hidden');
      this.welcomeScreen.classList.add('fade-in');
    }
  }

  public startGameplay(): void {
    if (this.state === 'playing') return;
    this.state = 'playing';

    if (this.nameInput && this.nameInput.value.trim()) {
      this.multiplayer.setPlayerName(this.nameInput.value.trim());
    }

    // Update HUD role badge with chosen Brookhaven roleplay identity
    this.updateHudRoleBadge();

    if (this.welcomeScreen) {
      this.welcomeScreen.classList.add('fade-out');
      setTimeout(() => {
        this.welcomeScreen?.classList.add('hidden');
      }, 500);
    }

    // Reveal main in-game HUD
    if (typeof document !== 'undefined') {
      const hudContainer = document.getElementById('hud-container');
      if (hudContainer) {
        hudContainer.classList.remove('hidden');
        hudContainer.classList.add('fade-in');
      }
    }

    this.callbacks.onPlay();
  }

  public updateHudRoleBadge(): void {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('player-role-badge');
    if (badge) {
      const emojiSpan = badge.querySelector('.role-emoji');
      const textSpan = badge.querySelector('.role-name');
      if (emojiSpan) emojiSpan.textContent = this.selectedRole.emoji;
      if (textSpan) textSpan.textContent = this.selectedRole.name;
    }
  }

  public getSelectedRole(): RoleInfo {
    return this.selectedRole;
  }

  public getState(): GameIntroState {
    return this.state;
  }
}

import { FastTravelManager, CARTAGENA_DESTINATIONS } from '../../navigation/fast-travel';
import type { SoundSystem } from '../../audio/sound-system';

export class FastTravelModal {
  private modalOverlay: HTMLElement | null = null;
  private selectedFilter: string = 'all';

  constructor(
    private fastTravelManager: FastTravelManager,
    private soundSystem: SoundSystem,
    private onNotify?: (msg: string) => void
  ) {
    this.createDom();
    this.bindEvents();
  }

  private createDom(): void {
    if (typeof document === 'undefined') return;

    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'fast-travel-modal-overlay';
    this.modalOverlay.className = 'fast-travel-modal-overlay hidden';
    this.modalOverlay.style.display = 'none';

    this.renderContent();
    document.body.appendChild(this.modalOverlay);
  }

  private renderContent(): void {
    if (!this.modalOverlay) return;

    const destinations = CARTAGENA_DESTINATIONS;
    const filtered = this.selectedFilter === 'all'
      ? destinations
      : destinations.filter((d) => {
          if (this.selectedFilter === 'monumentos') return d.badge === '🗿' || d.badge === '👞';
          if (this.selectedFilter === 'fortalezas') return d.badge === '🏰' || d.badge === '🛡️';
          if (this.selectedFilter === 'playas') return d.badge === '🏖️' || d.badge === '⛵';
          if (this.selectedFilter === 'colonial') return d.badge === '🏛️' || d.badge === '🎨' || d.badge === '⛪';
          return true;
        });

    const cardsHtml = filtered
      .map(
        (dest) => `
        <div class="dest-card" data-id="${dest.id}">
          <div class="dest-card-header">
            <span class="dest-card-badge">${dest.badge}</span>
            <div class="dest-card-titles">
              <span class="dest-card-tag">${dest.tag}</span>
              <h4 class="dest-card-name">${dest.name}</h4>
            </div>
          </div>
          <p class="dest-card-desc">${dest.description}</p>
          <div class="dest-card-features">
            ${dest.features.map((f) => `<span class="dest-feature-pill">${f}</span>`).join('')}
          </div>
          <button type="button" class="dest-card-travel-btn" data-travel="${dest.id}">
            <span class="travel-btn-icon">🚀</span>
            <span class="travel-btn-text">¡Viajar Aquí!</span>
          </button>
        </div>
      `
      )
      .join('');

    this.modalOverlay.innerHTML = `
      <div class="fast-travel-dialog-card" role="dialog" aria-modal="true">
        <div class="travel-accent-bar"></div>
        <div class="travel-modal-header">
          <div class="travel-title-box">
            <span class="travel-top-chip">📍 CARTAGENA DE INDIAS · GPS</span>
            <h3 class="travel-modal-title">Destinos & Teletransporte</h3>
            <p class="travel-modal-subtitle">Viaja al instante por toda la ciudad y admira sus monumentos y arquitectura 3D</p>
          </div>
          <button id="btn-fast-travel-close" class="travel-close-btn" type="button" aria-label="Cerrar">✕</button>
        </div>

        <div class="travel-quick-bar">
          <button type="button" id="btn-quick-santo-domingo" class="quick-recenter-btn">
            <span>🎯</span>
            <span>Inicio: Plaza Santo Domingo & Botero</span>
          </button>
        </div>

        <div class="travel-filter-pills">
          <button type="button" class="travel-filter-btn ${this.selectedFilter === 'all' ? 'active' : ''}" data-filter="all">Todos (${destinations.length})</button>
          <button type="button" class="travel-filter-btn ${this.selectedFilter === 'colonial' ? 'active' : ''}" data-filter="colonial">Centro & Bohemio</button>
          <button type="button" class="travel-filter-btn ${this.selectedFilter === 'monumentos' ? 'active' : ''}" data-filter="monumentos">Monumentos 3D</button>
          <button type="button" class="travel-filter-btn ${this.selectedFilter === 'fortalezas' ? 'active' : ''}" data-filter="fortalezas">Fortalezas & Murallas</button>
          <button type="button" class="travel-filter-btn ${this.selectedFilter === 'playas' ? 'active' : ''}" data-filter="playas">Playas & Marina</button>
        </div>

        <div class="travel-modal-body">
          <div class="dest-grid">
            ${cardsHtml}
          </div>
        </div>
      </div>
    `;

    this.bindDynamicEvents();
  }

  private bindEvents(): void {
    if (!this.modalOverlay) return;

    // Close when clicking outside dialog
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  private bindDynamicEvents(): void {
    if (!this.modalOverlay) return;

    // Close button
    const btnClose = this.modalOverlay.querySelector('#btn-fast-travel-close');
    btnClose?.addEventListener('click', () => {
      this.soundSystem.playHorn('bicycle');
      this.close();
    });

    // Quick reset to Plaza Santo Domingo
    const btnQuick = this.modalOverlay.querySelector('#btn-quick-santo-domingo');
    btnQuick?.addEventListener('click', () => {
      this.travelTo('santo_domingo');
    });

    // Filter pills
    const filterBtns = this.modalOverlay.querySelectorAll('.travel-filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter') || 'all';
        this.selectedFilter = f;
        this.renderContent();
      });
    });

    // Destination Travel Buttons
    const travelBtns = this.modalOverlay.querySelectorAll('[data-travel]');
    travelBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-travel');
        if (id) {
          this.travelTo(id);
        }
      });
    });
  }

  private travelTo(destId: string): void {
    const success = this.fastTravelManager.travelTo(destId);
    if (success) {
      const dest = this.fastTravelManager.getDestinationById(destId);
      if (dest) {
        this.onNotify?.(`✨ ¡Llegaste a ${dest.name}! Explora a pie o en vehículo.`);
      }
      this.close();
    }
  }

  public open(): void {
    if (!this.modalOverlay) return;
    this.renderContent();
    this.modalOverlay.classList.remove('hidden');
    this.modalOverlay.style.display = 'flex';
  }

  public close(): void {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.add('hidden');
    this.modalOverlay.style.display = 'none';
  }

  public toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  public isOpen(): boolean {
    return !!this.modalOverlay && this.modalOverlay.style.display === 'flex';
  }
}

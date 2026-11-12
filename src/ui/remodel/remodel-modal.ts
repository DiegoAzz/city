import { RemodelManager } from '../../remodel/remodel-manager';
import { RemodelPresetId, RemodelPreset } from '../../remodel/remodel-types';
import type { SoundSystem } from '../../audio/sound-system';
import type { MapManager } from '../../map/map-engine/map-manager';

export class RemodelModal {
  private modalOverlay: HTMLElement | null = null;
  private selectedPresetId: RemodelPresetId = 'convention';
  private selectedColor: string = '#f59e0b';
  private currentTarget: {
    id: string;
    lng: number;
    lat: number;
    height: number;
    polygon?: [number, number][];
  } | null = null;

  constructor(
    private remodelManager: RemodelManager,
    private soundSystem: SoundSystem,
    private mapManager: MapManager
  ) {
    this.createDom();
    this.bindEvents();

    // Sync initial remodeled buildings to map layer
    this.mapManager.updateRemodeledGeoJSON(this.remodelManager.getAllRemodeled());
    this.remodelManager.onRemodel(() => {
      this.mapManager.updateRemodeledGeoJSON(this.remodelManager.getAllRemodeled());
    });
  }

  private createDom(): void {
    if (typeof document === 'undefined') return;

    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'remodel-modal-overlay';
    this.modalOverlay.className = 'remodel-modal-overlay hidden';
    this.modalOverlay.style.display = 'none';

    const presets = this.remodelManager.getPresets();
    const presetCardsHtml = presets
      .map(
        (p) => `
        <button type="button" class="remodel-preset-card ${p.id === 'convention' ? 'active' : ''}" data-preset="${p.id}">
          <span class="preset-card-icon">${p.icon}</span>
          <div class="preset-card-details">
            <span class="preset-card-title">${p.name}</span>
            <span class="preset-card-income">💰 +$${p.rentPerMinute}/min</span>
            <span class="preset-card-cost">Costo: $${p.cost}</span>
          </div>
        </button>
      `
      )
      .join('');

    this.modalOverlay.innerHTML = `
      <div class="remodel-modal-card" role="dialog" aria-modal="true">
        <div class="remodel-accent-bar"></div>
        <div class="remodel-modal-header">
          <div class="remodel-header-title-box">
            <span class="remodel-badge">🏛️ CARTAGENA COLONIAL</span>
            <h3 class="remodel-modal-title">Estudio de Remodelación</h3>
            <span id="remodel-target-info" class="remodel-target-info">Selecciona el destino del inmueble</span>
          </div>
          <button id="btn-remodel-close" class="remodel-close-btn" type="button" aria-label="Cerrar">✕</button>
        </div>

        <div class="remodel-modal-body">
          <!-- 1. Presets Grid -->
          <div class="remodel-section">
            <span class="remodel-section-title">Elige el Tipo de Edificación:</span>
            <div class="remodel-presets-grid">
              ${presetCardsHtml}
            </div>
          </div>

          <!-- 2. Building Name -->
          <div class="remodel-section">
            <label for="remodel-name-input" class="remodel-section-title">Nombre del Inmueble:</label>
            <input id="remodel-name-input" class="remodel-input" type="text" maxlength="32" value="Centro de Convenciones de Cartagena" />
          </div>

          <!-- 3. Colonial Color Palette -->
          <div class="remodel-section">
            <span class="remodel-section-title">Color Colonial de Fachada:</span>
            <div class="remodel-colors-row">
              <button type="button" class="remodel-color-btn active" data-color="#f59e0b" style="background-color: #f59e0b" title="Amarillo Colonial"></button>
              <button type="button" class="remodel-color-btn" data-color="#ea580c" style="background-color: #ea580c" title="Terracota Cálido"></button>
              <button type="button" class="remodel-color-btn" data-color="#0284c7" style="background-color: #0284c7" title="Azul Celeste Caribe"></button>
              <button type="button" class="remodel-color-btn" data-color="#10b981" style="background-color: #10b981" title="Verde Esmeralda"></button>
              <button type="button" class="remodel-color-btn" data-color="#db2777" style="background-color: #db2777" title="Rosa Bougainvillea"></button>
              <button type="button" class="remodel-color-btn" data-color="#f8fafc" style="background-color: #f8fafc" title="Blanco Estuco Mármol"></button>
            </div>
          </div>
        </div>

        <div class="remodel-modal-footer">
          <button id="btn-remodel-confirm" class="btn-remodel-confirm" type="button">
            <span class="btn-icon">✨</span>
            <span id="remodel-confirm-label">Aplicar Remodelación ($250)</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalOverlay);
  }

  private bindEvents(): void {
    if (typeof document === 'undefined') return;

    const btnClose = document.getElementById('btn-remodel-close');
    btnClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    // Preset selection
    const cards = document.querySelectorAll<HTMLButtonElement>('.remodel-preset-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');

        const presetId = card.getAttribute('data-preset') as RemodelPresetId;
        if (presetId) {
          this.selectedPresetId = presetId;
          const preset = this.remodelManager.getPreset(presetId);

          const inputName = document.getElementById('remodel-name-input') as HTMLInputElement;
          if (inputName) inputName.value = preset.defaultName;

          this.selectColor(preset.defaultColor);
          this.updateConfirmButtonText(preset);
        }
      });
    });

    // Color buttons
    const colorBtns = document.querySelectorAll<HTMLButtonElement>('.remodel-color-btn');
    colorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        if (color) this.selectColor(color);
      });
    });

    // Confirm button
    const btnConfirm = document.getElementById('btn-remodel-confirm');
    btnConfirm?.addEventListener('click', () => {
      this.handleConfirm();
    });
  }

  private selectColor(color: string): void {
    this.selectedColor = color;
    const colorBtns = document.querySelectorAll<HTMLButtonElement>('.remodel-color-btn');
    colorBtns.forEach((b) => {
      if (b.getAttribute('data-color') === color) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  private updateConfirmButtonText(preset: RemodelPreset): void {
    const label = document.getElementById('remodel-confirm-label');
    if (label) {
      label.textContent = `Aplicar Remodelación ($${preset.cost}) · 💰 +$${preset.rentPerMinute}/min`;
    }
  }

  public open(target?: {
    id: string;
    lng: number;
    lat: number;
    height?: number;
    polygon?: [number, number][];
    titleHint?: string;
  }): void {
    if (!this.modalOverlay) return;

    if (target) {
      this.currentTarget = {
        id: target.id,
        lng: target.lng,
        lat: target.lat,
        height: target.height || 14,
        polygon: target.polygon
      };
    } else {
      // Default to Plaza Santo Domingo western landmark
      this.currentTarget = {
        id: `building_remodel_${Date.now()}`,
        lng: -75.55218,
        lat: 10.42435,
        height: 14
      };
    }

    const infoEl = document.getElementById('remodel-target-info');
    if (infoEl) {
      infoEl.textContent = target?.titleHint || `📍 Edificio Colonial · Plaza Santo Domingo`;
    }

    const preset = this.remodelManager.getPreset(this.selectedPresetId);
    this.updateConfirmButtonText(preset);

    this.modalOverlay.style.display = 'flex';
    this.modalOverlay.classList.remove('hidden');
  }

  public close(): void {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.add('hidden');
    this.modalOverlay.style.display = 'none';
  }

  private handleConfirm(): void {
    if (!this.currentTarget) return;

    const inputName = document.getElementById('remodel-name-input') as HTMLInputElement;
    const name = inputName?.value.trim() || 'Inmueble Colonial';

    const result = this.remodelManager.remodel({
      id: this.currentTarget.id,
      name,
      presetId: this.selectedPresetId,
      color: this.selectedColor,
      lng: this.currentTarget.lng,
      lat: this.currentTarget.lat,
      height: this.currentTarget.height,
      polygon: this.currentTarget.polygon
    });

    if (result.success && result.building) {
      // Repaint in MapLibre
      this.mapManager.setBuildingColor(result.building.id, result.building.color);
      this.mapManager.updateRemodeledGeoJSON(this.remodelManager.getAllRemodeled());

      // Play triumphant fanfare sound
      this.soundSystem.playRemodelSuccess();

      // Show toast
      (window as any)._gameInstance?.getHud()?.showToast(
        `🏛️ ¡Edificio remodelado como "${name}"! Genera +$${result.building.rentPerMinute}/min.`,
        4200
      );

      this.close();
    } else {
      alert(result.reason || 'No se pudo completar la remodelación.');
    }
  }
}

import { PropertyManager } from '../../properties/property-manager';
import { VirtualProperty, FacadeStyle } from '../../properties/property-types';
import type { SoundSystem } from '../../audio/sound-system';

export class PropertyModal {
  private propertyManager: PropertyManager;
  private soundSystem: SoundSystem;
  private activeProperty: VirtualProperty | null = null;

  private actionPill: HTMLElement | null = null;
  private modalOverlay: HTMLElement | null = null;
  private selectedColor: string = '#38bdf8';
  private selectedFacade: FacadeStyle = 'colonial';

  constructor(propertyManager: PropertyManager, soundSystem: SoundSystem) {
    this.propertyManager = propertyManager;
    this.soundSystem = soundSystem;

    this.createDomElements();
    this.bindEvents();

    this.propertyManager.onNearbyPropertyChange((prop, _dist) => {
      this.handleNearbyProperty(prop);
    });

    this.propertyManager.onPropertiesChanged(() => {
      if (this.activeProperty) {
        const updated = this.propertyManager.getProperty(this.activeProperty.id);
        if (updated) {
          this.activeProperty = updated;
          this.handleNearbyProperty(updated);
        }
      }
    });
  }

  private createDomElements(): void {
    if (typeof document === 'undefined') return;

    // 1. Floating Banner / Pill when near a property
    this.actionPill = document.createElement('div');
    this.actionPill.id = 'property-action-pill';
    this.actionPill.className = 'property-action-pill hidden';
    this.actionPill.style.display = 'none';
    this.actionPill.innerHTML = `
      <span class="pill-house-icon">🏡</span>
      <div class="pill-info">
        <span class="pill-title">Propiedad Disponible</span>
        <span class="pill-sub">Toca para reclamar casa</span>
      </div>
      <button class="pill-action-btn" type="button">Ver</button>
    `;
    document.getElementById('hud-container')?.appendChild(this.actionPill);

    // 2. Property Claim & Customizer Modal
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'property-modal-overlay';
    this.modalOverlay.className = 'property-modal-overlay hidden';
    this.modalOverlay.style.display = 'none';
    this.modalOverlay.innerHTML = `
      <div class="property-modal-card">
        <div class="prop-modal-accent-bar"></div>
        <div class="prop-modal-header">
          <div class="prop-header-info">
            <span class="prop-modal-badge">🏡 PROPIEDAD EXCLUSIVA</span>
            <h3 id="prop-modal-name" class="prop-modal-title">Casa Colonial</h3>
            <span id="prop-modal-district" class="prop-modal-district">Centro Histórico · Cartagena</span>
          </div>
          <button id="btn-prop-close" class="prop-close-btn" type="button">✕</button>
        </div>

        <div class="prop-modal-body">
          <div id="prop-owner-banner" class="prop-owner-banner">
            <span class="owner-icon">👤</span>
            <span id="prop-owner-text" class="owner-text">Estado: Disponible para compra</span>
          </div>

          <div class="prop-form-group">
            <label for="prop-name-input" class="prop-label">Nombre de tu Casa / Mansión:</label>
            <input id="prop-name-input" class="prop-input" type="text" maxlength="24" value="Mi Mansión Colonial" />
          </div>

          <div class="prop-form-group">
            <span class="prop-label">Color de Fachada:</span>
            <div class="prop-colors-grid">
              <button type="button" class="prop-color-btn active" data-color="#38bdf8" style="background-color: #38bdf8" title="Celeste Caribe"></button>
              <button type="button" class="prop-color-btn" data-color="#34d399" style="background-color: #34d399" title="Verde Esmeralda"></button>
              <button type="button" class="prop-color-btn" data-color="#fbbf24" style="background-color: #fbbf24" title="Amarillo Colonial"></button>
              <button type="button" class="prop-color-btn" data-color="#f87171" style="background-color: #f87171" title="Terracota"></button>
              <button type="button" class="prop-color-btn" data-color="#c084fc" style="background-color: #c084fc" title="Lavanda"></button>
              <button type="button" class="prop-color-btn" data-color="#94a3b8" style="background-color: #94a3b8" title="Gris Neutro"></button>
            </div>
          </div>

          <div class="prop-form-group">
            <span class="prop-label">Estilo de Arquitectura:</span>
            <div class="prop-facade-chips">
              <button type="button" class="facade-chip active" data-facade="colonial">🏛️ Colonial</button>
              <button type="button" class="facade-chip" data-facade="modern">🏢 Moderna</button>
              <button type="button" class="facade-chip" data-facade="luxury">👑 Mansión Lujo</button>
              <button type="button" class="facade-chip" data-facade="penthouse">🌴 Penthouse</button>
            </div>
          </div>
        </div>

        <div class="prop-modal-footer">
          <button id="btn-prop-confirm" class="btn-prop-confirm" type="button">
            <span class="btn-icon">💰</span>
            <span id="prop-confirm-text">Comprar por $500</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modalOverlay);
  }

  private bindEvents(): void {
    if (typeof document === 'undefined') return;

    this.actionPill?.addEventListener('click', () => {
      this.openModal();
    });

    const btnClose = document.getElementById('btn-prop-close');
    btnClose?.addEventListener('click', () => {
      this.closeModal();
    });

    // Close on overlay backdrop tap
    this.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    });

    // Color buttons
    const colorBtns = document.querySelectorAll('.prop-color-btn');
    colorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        colorBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.getAttribute('data-color');
        if (color) this.selectedColor = color;
      });
    });

    // Facade chips
    const facadeChips = document.querySelectorAll('.facade-chip');
    facadeChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        facadeChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const facade = chip.getAttribute('data-facade') as FacadeStyle;
        if (facade) this.selectedFacade = facade;
      });
    });

    // Confirm / Claim Button
    const btnConfirm = document.getElementById('btn-prop-confirm');
    btnConfirm?.addEventListener('click', () => {
      this.handleConfirm();
    });
  }

  private handleNearbyProperty(prop: VirtualProperty | null): void {
    if (!this.actionPill) return;

    if (!prop) {
      this.actionPill.classList.add('hidden');
      return;
    }

    this.activeProperty = prop;
    const titleEl = this.actionPill.querySelector('.pill-title');
    const subEl = this.actionPill.querySelector('.pill-sub');

    if (prop.status === 'available') {
      if (titleEl) titleEl.textContent = `🏡 ${prop.name}`;
      if (subEl) subEl.textContent = `Disponible · Precio: $${prop.price} 💰 · Toca para Reclamar`;
      this.actionPill.classList.remove('claimed-mine', 'claimed-other');
      this.actionPill.classList.add('available');
    } else {
      const myId = (window as any)._gameInstance?.getMultiplayer()?.getMyId();
      const isMine = prop.ownerId === myId;
      if (isMine) {
        if (titleEl) titleEl.textContent = `🏡 Tu Propiedad: ${prop.name}`;
        if (subEl) subEl.textContent = `Toca para Personalizar y Decorar`;
        this.actionPill.classList.remove('available', 'claimed-other');
        this.actionPill.classList.add('claimed-mine');
      } else {
        if (titleEl) titleEl.textContent = `🏡 Casa de: ${prop.ownerName || 'Ciudadano'}`;
        if (subEl) subEl.textContent = `${prop.name} · Toca para Visitar`;
        this.actionPill.classList.remove('available', 'claimed-mine');
        this.actionPill.classList.add('claimed-other');
      }
    }

    this.actionPill.classList.remove('hidden');
  }

  public openModal(): void {
    if (!this.activeProperty || !this.modalOverlay) return;
    const prop = this.activeProperty;

    const nameEl = document.getElementById('prop-modal-name');
    const districtEl = document.getElementById('prop-modal-district');
    const ownerText = document.getElementById('prop-owner-text');
    const inputName = document.getElementById('prop-name-input') as HTMLInputElement;
    const confirmText = document.getElementById('prop-confirm-text');

    if (nameEl) nameEl.textContent = prop.name;
    if (districtEl) districtEl.textContent = `${prop.district} · Cartagena de Indias`;
    if (inputName) inputName.value = prop.name;

    const myId = (window as any)._gameInstance?.getMultiplayer()?.getMyId();
    const isMine = prop.ownerId === myId;

    if (prop.status === 'available') {
      if (ownerText) ownerText.textContent = `🟢 Disponible · Precio: $${prop.price} monedas`;
      if (confirmText) confirmText.textContent = `Comprar Casa por $${prop.price}`;
    } else if (isMine) {
      if (ownerText) ownerText.textContent = `👑 ¡Eres el Propietario!`;
      if (confirmText) confirmText.textContent = `Guardar Cambios de Decoración`;
    } else {
      if (ownerText) ownerText.textContent = `🔒 Propiedad Privada de: ${prop.ownerName}`;
      if (confirmText) confirmText.textContent = `Tocar Timbre / Saludar`;
    }

    this.modalOverlay.classList.remove('hidden');
  }

  public closeModal(): void {
    this.modalOverlay?.classList.add('hidden');
  }

  private handleConfirm(): void {
    if (!this.activeProperty) return;
    const prop = this.activeProperty;

    const inputName = document.getElementById('prop-name-input') as HTMLInputElement;
    const newName = inputName?.value.trim() || prop.name;

    const myId = (window as any)._gameInstance?.getMultiplayer()?.getMyId();
    const isMine = prop.ownerId === myId;

    if (prop.status === 'available' || isMine) {
      const res = this.propertyManager.claimProperty(
        prop.id,
        newName,
        this.selectedColor,
        this.selectedFacade
      );

      if (res.success) {
        this.soundSystem.playHorn('bicycle');
        this.closeModal();
        (window as any)._gameInstance?.getHud()?.showToast(`🎉 ¡Felicitaciones! Ahora posees: ${newName}`, 3500);
      } else {
        alert(res.reason || 'No se pudo adquirir la propiedad');
      }
    } else {
      this.soundSystem.playHorn('bicycle');
      this.closeModal();
      (window as any)._gameInstance?.getHud()?.showToast(`🔔 Tocaste el timbre de ${prop.ownerName}`, 2800);
    }
  }
}

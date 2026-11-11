export interface DialogAction {
  text: string;
  onClick?: () => void;
}

export interface DialogOptions {
  category?: string;
  icon?: string;
  title: string;
  message: string;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
  durationMs?: number;
}

export class GameDialog {
  private overlayEl: HTMLElement | null = null;
  private iconEl: HTMLElement | null = null;
  private categoryEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private primaryBtn: HTMLButtonElement | null = null;
  private secondaryBtn: HTMLButtonElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;
  private progressBar: HTMLElement | null = null;

  private dismissTimer: number | null = null;
  private isOpen: boolean = false;
  private currentPrimaryAction?: () => void;
  private currentSecondaryAction?: () => void;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    let overlay = document.getElementById('game-dialog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'game-dialog-overlay';
      overlay.className = 'game-dialog-overlay hidden';
      overlay.innerHTML = `
        <div class="game-dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <div class="dialog-accent-bar"></div>
          
          <div class="dialog-header">
            <div class="dialog-badge-group">
              <span id="dialog-icon" class="dialog-avatar">🧭</span>
              <div class="dialog-meta">
                <span id="dialog-category" class="dialog-category">AVISO</span>
                <h3 id="dialog-title" class="dialog-title">Mensaje</h3>
              </div>
            </div>
            <button id="dialog-close-btn" class="dialog-close-btn" aria-label="Cerrar aviso">✕</button>
          </div>

          <div class="dialog-body">
            <p id="dialog-message" class="dialog-message"></p>
          </div>

          <div class="dialog-footer">
            <button id="dialog-secondary-btn" class="dialog-btn dialog-btn-secondary">
              <span id="dialog-secondary-text">Entendido</span>
            </button>
            <button id="dialog-primary-btn" class="dialog-btn dialog-btn-primary hidden">
              <span id="dialog-primary-text">Aceptar</span>
            </button>
          </div>

          <div id="dialog-progress" class="dialog-progress-bar hidden"></div>
        </div>
      `;

      const appEl = document.getElementById('app') || document.body;
      appEl.appendChild(overlay);
    }

    this.overlayEl = overlay;
    this.iconEl = overlay.querySelector('#dialog-icon');
    this.categoryEl = overlay.querySelector('#dialog-category');
    this.titleEl = overlay.querySelector('#dialog-title');
    this.messageEl = overlay.querySelector('#dialog-message');
    this.primaryBtn = overlay.querySelector('#dialog-primary-btn');
    this.secondaryBtn = overlay.querySelector('#dialog-secondary-btn');
    this.closeBtn = overlay.querySelector('#dialog-close-btn');
    this.progressBar = overlay.querySelector('#dialog-progress');

    this.bindEvents();
  }

  private bindEvents(): void {
    this.closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.primaryBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = this.currentPrimaryAction;
      this.close();
      if (action) action();
    });

    this.secondaryBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = this.currentSecondaryAction;
      this.close();
      if (action) action();
    });

    // Tap outside dialog card dismisses it
    this.overlayEl?.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) {
        this.close();
      }
    });
  }

  public show(options: DialogOptions): void {
    if (!this.overlayEl) return;

    this.clearDismissTimer();

    // Set category & icon
    if (this.categoryEl) {
      this.categoryEl.textContent = (options.category || 'AVISO').toUpperCase();
    }
    if (this.iconEl) {
      this.iconEl.textContent = options.icon || '🧭';
    }

    // Set title and message
    if (this.titleEl) {
      this.titleEl.textContent = options.title;
    }
    if (this.messageEl) {
      this.messageEl.textContent = options.message;
    }

    // Configure primary button
    if (this.primaryBtn) {
      if (options.primaryAction) {
        const textSpan = this.primaryBtn.querySelector('#dialog-primary-text');
        if (textSpan) textSpan.textContent = options.primaryAction.text;
        this.primaryBtn.classList.remove('hidden');
        this.currentPrimaryAction = options.primaryAction.onClick;
      } else {
        this.primaryBtn.classList.add('hidden');
        this.currentPrimaryAction = undefined;
      }
    }

    // Configure secondary button
    if (this.secondaryBtn) {
      const textSpan = this.secondaryBtn.querySelector('#dialog-secondary-text');
      const label = options.secondaryAction?.text || (options.primaryAction ? 'Cerrar' : 'Entendido');
      if (textSpan) textSpan.textContent = label;
      this.currentSecondaryAction = options.secondaryAction?.onClick;
    }

    // Configure progress bar & auto-dismiss
    if (this.progressBar) {
      this.progressBar.style.animation = 'none';
      // Force DOM reflow
      void this.progressBar.offsetWidth;

      if (options.durationMs && options.durationMs > 0) {
        this.progressBar.classList.remove('hidden');
        this.progressBar.style.animation = `dialogProgressAnim ${options.durationMs}ms linear forwards`;

        this.dismissTimer = window.setTimeout(() => {
          this.close();
        }, options.durationMs);
      } else {
        this.progressBar.classList.add('hidden');
      }
    }

    // Reveal overlay
    this.overlayEl.classList.remove('hidden');
    this.overlayEl.classList.add('active');
    this.isOpen = true;
  }

  public close(): void {
    if (!this.overlayEl || !this.isOpen) return;

    this.clearDismissTimer();
    this.overlayEl.classList.remove('active');
    this.overlayEl.classList.add('closing');

    window.setTimeout(() => {
      this.overlayEl?.classList.remove('closing');
      this.overlayEl?.classList.add('hidden');
      this.isOpen = false;
    }, 200);
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}

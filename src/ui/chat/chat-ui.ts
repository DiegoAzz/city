import { MultiplayerManager } from '../../multiplayer/multiplayer-manager';
import { ChatMessage } from '../../multiplayer/types';

export class ChatUi {
  private multiplayer: MultiplayerManager;
  private container: HTMLElement;
  private btnToggle: HTMLElement;
  private chatDrawer: HTMLElement;
  private messagesContainer: HTMLElement;
  private inputField: HTMLInputElement;
  private unreadBadge: HTMLElement;

  private isOpen: boolean = false;
  private unreadCount: number = 0;

  constructor(multiplayer: MultiplayerManager) {
    this.multiplayer = multiplayer;

    // Create chat overlay elements
    this.container = document.createElement('div');
    this.container.className = 'chat-system';
    this.container.innerHTML = `
      <!-- Floating Chat Toggle Pill -->
      <button id="btn-chat-toggle" class="chat-toggle-pill" aria-label="Abrir Chat de Ciudadanos">
        <span class="chat-icon">💬</span>
        <span class="chat-label">Chat</span>
        <span id="chat-unread-badge" class="chat-unread hidden">0</span>
      </button>

      <!-- Expandable Gamer Chat Drawer -->
      <div id="chat-drawer" class="chat-drawer hidden">
        <div class="chat-header">
          <div class="chat-title">
            <span class="pulse-dot-green"></span>
            <span>Chat Ciudadano</span>
            <span id="chat-player-count" class="chat-count-chip">1 online</span>
          </div>
          <button id="btn-chat-close" class="chat-close-btn" aria-label="Cerrar">✕</button>
        </div>

        <div class="chat-name-row">
          <label>Tu nombre:</label>
          <input type="text" id="chat-name-input" maxlength="16" value="${this.escapeHtml(this.multiplayer.getPlayerName())}" />
        </div>

        <!-- Quick Emote / Reaction Chips -->
        <div class="chat-emotes-bar">
          <button class="emote-chip" data-msg="👋 ¡Hola explorador!">👋 Hola</button>
          <button class="emote-chip" data-msg="🏎️ ¡Vamos una carrera!">🏎️ Carrera</button>
          <button class="emote-chip" data-msg="⛵ ¡Vamos al mar en lancha!">⛵ Al mar</button>
          <button class="emote-chip" data-msg="🔥 ¡Sígueme!">🔥 Sígueme</button>
          <button class="emote-chip" data-msg="😎 ¡Está genial Cartagena!">😎 Genial</button>
          <button class="emote-chip" data-msg="😂">😂</button>
        </div>

        <!-- Messages History Feed -->
        <div id="chat-messages" class="chat-messages">
          <div class="chat-system-msg">¡Bienvenido a Cartagena Multijugador! Escribe un mensaje o usa un emote para interactuar.</div>
        </div>

        <!-- Input Bar -->
        <form id="chat-form" class="chat-input-bar">
          <input type="text" id="chat-input" placeholder="Escribe a los ciudadanos..." maxlength="80" autocomplete="off" />
          <button type="submit" id="btn-chat-send" class="chat-send-btn">Enviar</button>
        </form>
      </div>
    `;

    document.body.appendChild(this.container);

    this.btnToggle = document.getElementById('btn-chat-toggle')!;
    this.chatDrawer = document.getElementById('chat-drawer')!;
    this.messagesContainer = document.getElementById('chat-messages')!;
    this.inputField = document.getElementById('chat-input') as HTMLInputElement;
    this.unreadBadge = document.getElementById('chat-unread-badge')!;

    this.bindEvents();

    // Listen for incoming multiplayer chat
    this.multiplayer.onChatMessage((msg) => this.addMessage(msg));

    // Listen for player count changes
    this.multiplayer.onPlayerCountChange((count) => {
      const el = document.getElementById('chat-player-count');
      if (el) el.textContent = `${count} online`;
    });
  }

  private bindEvents(): void {
    this.btnToggle.addEventListener('click', () => this.toggle());

    const btnClose = document.getElementById('btn-chat-close');
    btnClose?.addEventListener('click', () => this.close());

    // Send on form submit
    const form = document.getElementById('chat-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage(this.inputField.value);
    });

    // Quick emote chips
    const chips = this.container.querySelectorAll('.emote-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-msg') || '';
        if (text) this.sendMessage(text);
      });
    });

    // Nickname edit
    const nameInput = document.getElementById('chat-name-input') as HTMLInputElement;
    nameInput?.addEventListener('change', () => {
      this.multiplayer.setPlayerName(nameInput.value);
    });
  }

  public toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  public open(): void {
    this.isOpen = true;
    this.chatDrawer.classList.remove('hidden');
    this.unreadCount = 0;
    this.unreadBadge.classList.add('hidden');
    setTimeout(() => this.inputField.focus(), 150);
  }

  public close(): void {
    this.isOpen = false;
    this.chatDrawer.classList.add('hidden');
    this.inputField.blur();
  }

  public sendMessage(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.multiplayer.sendChat(trimmed);
    this.inputField.value = '';

    // Add locally to feed
    this.addMessage({
      id: 'local',
      senderName: this.multiplayer.getPlayerName(),
      text: trimmed,
      timestamp: Date.now()
    });
  }

  public addMessage(msg: ChatMessage): void {
    const row = document.createElement('div');
    const isLocal = msg.id === 'local';
    row.className = `chat-msg-row ${isLocal ? 'msg-local' : 'msg-remote'}`;

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    row.innerHTML = `
      <span class="msg-author">${this.escapeHtml(msg.senderName)}</span>
      <span class="msg-text">${this.escapeHtml(msg.text)}</span>
      <span class="msg-time">${timeStr}</span>
    `;

    this.messagesContainer.appendChild(row);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Unread count indicator if drawer closed
    if (!this.isOpen && !isLocal) {
      this.unreadCount++;
      this.unreadBadge.textContent = String(this.unreadCount);
      this.unreadBadge.classList.remove('hidden');
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

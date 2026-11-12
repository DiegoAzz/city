import * as THREE from 'three';
import { PlayerData, ChatMessage } from './types';
import { RemotePlayer } from './remote-player';
import { CharacterController } from '../character/controller/character-controller';

export class MultiplayerManager {
  private ws: WebSocket | null = null;
  private localPlayerId: string;
  private localPlayerName: string;
  private localColor: number;
  private isConnected: boolean = false;
  private playerCount: number = 1;

  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private scene: THREE.Scene | null = null;
  private characterController: CharacterController;

  private lastSyncTime: number = 0;
  private onPlayerCountCallbacks: Array<(count: number) => void> = [];
  private onChatMessageCallbacks: Array<(msg: ChatMessage) => void> = [];
  private onPlayerJoinedCallbacks: Array<(name: string) => void> = [];
  private onPropertyUpdatedCallbacks: Array<(prop: any) => void> = [];
  private onPropertiesStateCallbacks: Array<(props: any[]) => void> = [];

  constructor(characterController: CharacterController) {
    this.characterController = characterController;

    // Load or generate player ID and nickname
    const savedId = localStorage.getItem('street_explorer_player_id');
    this.localPlayerId = savedId || 'player_' + Math.random().toString(36).substring(2, 9);
    if (!savedId) localStorage.setItem('street_explorer_player_id', this.localPlayerId);

    const savedName = localStorage.getItem('street_explorer_player_name');
    this.localPlayerName = savedName || 'Ciudadano ' + Math.floor(Math.random() * 899 + 100);

    // Random cute hoodie color
    const colors = [0x06b6d4, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6, 0xec4899];
    this.localColor = colors[Math.floor(Math.random() * colors.length)];

    this.connect();
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public getMyId(): string {
    return this.localPlayerId;
  }

  public onPropertyUpdated(cb: (prop: any) => void): void {
    this.onPropertyUpdatedCallbacks.push(cb);
  }

  public onPropertiesState(cb: (props: any[]) => void): void {
    this.onPropertiesStateCallbacks.push(cb);
  }

  public broadcastPropertyUpdate(property: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'update-property',
      property
    }));
  }

  public getPlayerName(): string {
    return this.localPlayerName;
  }

  public setPlayerName(name: string): void {
    const trimmed = name.trim().substring(0, 16);
    if (!trimmed) return;
    this.localPlayerName = trimmed;
    localStorage.setItem('street_explorer_player_name', trimmed);
    this.sendMove(true);
  }

  public getPlayerCount(): number {
    return this.playerCount;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public onPlayerCountChange(cb: (count: number) => void): void {
    this.onPlayerCountCallbacks.push(cb);
  }

  public onChatMessage(cb: (msg: ChatMessage) => void): void {
    this.onChatMessageCallbacks.push(cb);
  }

  public onPlayerJoined(cb: (name: string) => void): void {
    this.onPlayerJoinedCallbacks.push(cb);
  }

  private connect(): void {
    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${location.host}/ws/multiplayer`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sendJoin();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      // Reconnect fallback
      setTimeout(() => this.connect(), 4000);
    }
  }

  private handleServerMessage(msg: any): void {
    switch (msg.type) {
      case 'lobby-state':
        this.playerCount = (msg.count || 1);
        this.notifyPlayerCount();
        if (msg.peers && Array.isArray(msg.peers) && this.scene) {
          msg.peers.forEach((peer: PlayerData) => this.addOrUpdateRemotePlayer(peer));
        }
        break;

      case 'player-joined':
        this.playerCount = (msg.count || this.playerCount + 1);
        this.notifyPlayerCount();
        if (msg.player && this.scene) {
          this.addOrUpdateRemotePlayer(msg.player);
          this.onPlayerJoinedCallbacks.forEach((cb) => cb(msg.player.name || 'Nuevo ciudadano'));
        }
        break;

      case 'peer-update':
        if (msg.player && this.scene) {
          this.addOrUpdateRemotePlayer(msg.player);
        }
        break;

      case 'player-left':
        this.playerCount = (msg.count || Math.max(1, this.playerCount - 1));
        this.notifyPlayerCount();
        if (msg.id && this.remotePlayers.has(msg.id) && this.scene) {
          const rp = this.remotePlayers.get(msg.id)!;
          rp.dispose(this.scene);
          this.remotePlayers.delete(msg.id);
        }
        break;

      case 'chat-message':
        this.onChatMessageCallbacks.forEach((cb) => cb(msg));
        // If message is from a remote player, show 3D speech bubble above their avatar!
        if (msg.id && this.remotePlayers.has(msg.id)) {
          this.remotePlayers.get(msg.id)!.showChatBubble(msg.text);
        }
        break;

      case 'property-updated':
        if (msg.property) {
          this.onPropertyUpdatedCallbacks.forEach((cb) => cb(msg.property));
        }
        break;

      case 'properties-state':
        if (Array.isArray(msg.properties)) {
          this.onPropertiesStateCallbacks.forEach((cb) => cb(msg.properties));
        }
        break;
    }
  }

  private addOrUpdateRemotePlayer(data: PlayerData): void {
    if (data.id === this.localPlayerId || !this.scene) return;

    if (this.remotePlayers.has(data.id)) {
      this.remotePlayers.get(data.id)!.updateData(data);
    } else {
      const rp = new RemotePlayer(data, this.scene);
      this.remotePlayers.set(data.id, rp);
    }
  }

  private sendJoin(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const [lng, lat] = this.characterController.getPosition();
    const state = this.characterController.getState();

    const player: PlayerData = {
      id: this.localPlayerId,
      name: this.localPlayerName,
      color: this.localColor,
      lng,
      lat,
      altitude: state.altitude,
      bearing: state.bearingDeg,
      speed: state.speedMps,
      mode: state.movementMode,
      animState: state.animState
    };

    this.ws.send(JSON.stringify({ type: 'join', player }));
  }

  public sendMove(force: boolean = false): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (!force && now - this.lastSyncTime < 50) return; // 20 updates per second
    this.lastSyncTime = now;

    const [lng, lat] = this.characterController.getPosition();
    const state = this.characterController.getState();

    const player: Partial<PlayerData> = {
      id: this.localPlayerId,
      name: this.localPlayerName,
      lng,
      lat,
      altitude: state.altitude,
      bearing: state.bearingDeg,
      speed: state.speedMps,
      mode: state.movementMode,
      animState: state.animState
    };

    this.ws.send(JSON.stringify({ type: 'move', player }));
  }

  public sendChat(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'chat',
      text: trimmed
    }));
  }

  public update(deltaSeconds: number): void {
    this.sendMove(false);

    // Update all remote player animations and positions
    for (const rp of this.remotePlayers.values()) {
      rp.update(deltaSeconds);
    }
  }

  public getRemotePlayers(): Map<string, RemotePlayer> {
    return this.remotePlayers;
  }

  private notifyPlayerCount(): void {
    this.onPlayerCountCallbacks.forEach((cb) => cb(this.playerCount));
  }
}

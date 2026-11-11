import * as THREE from 'three';

/**
 * Creates 3D floating canvas billboards for player nametags and speech bubbles.
 */
export class PlayerBillboard {
  public sprite: THREE.Sprite;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  private currentName: string = '';
  private currentBubbleText: string | null = null;
  private bubbleExpireTimer: number | null = null;

  constructor(initialName: string, vehicleMode: string = 'foot') {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false
    });

    this.sprite = new THREE.Sprite(spriteMat);
    this.sprite.scale.set(1.4, 0.7, 1.0);
    this.sprite.position.set(0, 1.35, 0);

    this.update(initialName, vehicleMode);
  }

  public update(name: string, vehicleMode: string): void {
    this.currentName = name;
    this.redraw(vehicleMode);
  }

  public showSpeechBubble(text: string, durationMs: number = 4500): void {
    this.currentBubbleText = text;
    this.redraw();

    if (this.bubbleExpireTimer) {
      clearTimeout(this.bubbleExpireTimer);
    }

    this.bubbleExpireTimer = window.setTimeout(() => {
      this.currentBubbleText = null;
      this.redraw();
      this.bubbleExpireTimer = null;
    }, durationMs);
  }

  private redraw(vehicleMode: string = 'foot'): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 512, 256);

    const vehicleIcons: Record<string, string> = {
      foot: '🚶',
      bicycle: '🚲',
      motorcycle: '🛵',
      car: '🚗',
      boat: '🚤'
    };
    const icon = vehicleIcons[vehicleMode] || '🚶';

    // 1. Draw Speech Bubble if active
    if (this.currentBubbleText) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;

      // Rounded speech bubble background
      this.roundRect(ctx, 40, 20, 432, 90, 24);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(240, 110);
      ctx.lineTo(256, 130);
      ctx.lineTo(272, 110);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.stroke();

      // Message text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const truncated = this.currentBubbleText.length > 28
        ? this.currentBubbleText.substring(0, 26) + '...'
        : this.currentBubbleText;
      ctx.fillText(truncated, 256, 65);
    }

    // 2. Draw Player Nametag Pill
    const tagY = this.currentBubbleText ? 150 : 130;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;

    this.roundRect(ctx, 110, tagY, 292, 60, 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${icon} ${this.currentName}`, 256, tagY + 30);

    this.texture.needsUpdate = true;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  public dispose(): void {
    if (this.bubbleExpireTimer) clearTimeout(this.bubbleExpireTimer);
    this.texture.dispose();
  }
}

import type Phaser from 'phaser';
import type { Point } from './editor';
import type { VisualFlow } from './traffic';
import { drawPacket, packetEndpoint } from './workload-art';
import { buildingLayers } from './building-assets';
import { v3 } from './art-v3';

export function packetTexture(flow: VisualFlow, progress: number) {
  return `packet-${flow.kind}-${progress > .85 ? packetEndpoint(flow) : 'packet'}`;
}
export class PacketSprites {
  private images: Phaser.GameObjects.Image[] = [];
  private used = 0;
  constructor(private scene: Phaser.Scene) {
    const painter = scene.make.graphics({ x: 0, y: 0 });
    for (const kind of ['browse', 'order', 'bot'] as const) {
      const variants: VisualFlow[] = [
        { from: 'compute', to: 'database', kind, volume: 1, end: 'continue' },
        { from: 'compute', to: 'database', kind, volume: 1, end: 'failed' },
        { from: 'internet', to: 'edge', kind, volume: 1, end: 'filtered' },
        { from: 'internet', to: 'compute', kind, volume: 1, end: 'filtered' },
        { from: 'compute', to: 'cache', kind, volume: 1, end: 'success' },
      ];
      for (const flow of variants) {
        const key = packetTexture(flow, 1);
        if (scene.textures.exists(key)) continue;
        drawPacket(painter.clear(), { x: 16, y: 16 }, { x: 0, y: 0 }, flow, 1);
        painter.generateTexture(key, 32, 32);
      }
    }
    painter.destroy();
  }
  begin() { this.used = 0; }
  draw(point: Point, flow: VisualFlow, progress: number) {
    if (this.used >= 200) return;
    const key = packetTexture(flow, progress);
    const image = this.images[this.used] ?? this.scene.add.image(0, 0, key).setDepth(buildingLayers.traffic + 1);
    this.images[this.used++] = image;
    image.setTexture(key).setPosition(point.x, point.y).setScale(v3 ? flow.kind==='order'?1.65:1.4 : 1).setVisible(true);
  }
  end() { for (let i = this.used; i < this.images.length; i++) this.images[i].setVisible(false); }
  diagnostics() { return { allocated: this.images.length, visible: this.used }; }
  destroy() { for (const image of this.images) image.destroy(); this.images = []; }
}

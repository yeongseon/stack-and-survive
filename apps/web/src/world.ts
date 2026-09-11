import type { Controller, View } from './controller';
import { compare } from '@stack-and-survive/simulation/economy';

export function utilizationLabel(u: number | null): string {
  return u === null ? 'READY' : compare(u, 1) > 0 ? '! OVERLOADED' : compare(u, .7) > 0 ? 'WARNING' : 'HEALTHY';
}
export async function mountWorld(host: HTMLDivElement, controller: Controller): Promise<() => void> {
  const { default: Phaser } = await import('phaser');
  if (!host.isConnected) return () => {};
  let view: View = controller.getSnapshot();
  let frames = 0;
  const unsubscribe = controller.subscribe(() => { view = controller.getSnapshot(); });
  class World extends Phaser.Scene {
    graphics!: Phaser.GameObjects.Graphics;
    captions: Phaser.GameObjects.Text[] = [];
    create() {
      this.graphics = this.add.graphics();
      this.captions = Array.from({ length: 3 }, () => this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '13px', color: '#e6f0ed', align: 'center', backgroundColor: '#10202d', padding: { x: 8, y: 6 },
      }).setOrigin(.5, 0));
      host.dataset.renderer = 'ready';
    }
    update(time: number) {
      try {
        const width = this.scale.width; const height = this.scale.height;
        const positions = [{ x: width * .18, y: height * .32 }, { x: width * .5, y: height * .48 }, { x: width * .82, y: height * .64 }];
        const g = this.graphics.clear();
        g.lineStyle(1, 0x223b4b, .6);
        for (let x = -height; x < width + height; x += 56) { g.lineBetween(x, 0, x + height, height); g.lineBetween(x, 0, x - height, height); }
        g.lineStyle(3, 0x708b94);
        for (let i = 0; i < 2; i++) {
          const a = positions[i]; const b = positions[i + 1]; g.lineBetween(a.x, a.y, b.x, b.y);
          const x = a.x + (b.x - a.x) * .65; const y = a.y + (b.y - a.y) * .65;
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          g.lineBetween(x, y, x - 12 * Math.cos(angle - .5), y - 12 * Math.sin(angle - .5));
          g.lineBetween(x, y, x - 12 * Math.cos(angle + .5), y - 12 * Math.sin(angle + .5));
        }
        const requests = view.snapshot?.requests;
        const appU = requests?.app.utilization ?? null;
        const sqlU = requests ? Math.max(requests.sql.readUtilization, requests.sql.writeUtilization) : null;
        const labels = ['INTERNET', `APP SERVICE ×${view.state.runtime.architecture.resources.find(r => r.kind === 'compute')!.instances}`, 'AZURE SQL'];
        const utilization = [null, appU, sqlU];
        positions.forEach((p, i) => {
          const u = utilization[i]; const state = utilizationLabel(u);
          const color = state === '! OVERLOADED' ? 0xf58a78 : state === 'WARNING' ? 0xefc27b : 0x9bdac7;
          g.fillStyle(color, .25); g.fillRect(p.x - 34, p.y - 22, 68, 52);
          g.lineStyle(2, color); g.strokeRect(p.x - 34, p.y - 22, 68, 52);
          g.fillStyle(color, .75); g.fillTriangle(p.x - 34, p.y - 22, p.x, p.y - 42, p.x + 34, p.y - 22);
          if (state === '! OVERLOADED') { g.fillStyle(0xffffff); g.fillRect(p.x - 3, p.y - 12, 6, 17); g.fillCircle(p.x, p.y + 14, 3); }
          this.captions[i].setPosition(p.x, p.y + 48).setText(`${labels[i]}\n${i === 0 ? 'EXTERNAL TRAFFIC' : `${state}${u === null ? '' : ` · ${(u * 100).toFixed(1)}%`}`}`);
        });
        let packetCount = 0;
        if (view.state.runtime.status === 'RUNNING' && !view.error && requests) {
          const volumes = [requests.app.incoming, requests.sql.readDemand + requests.sql.writeDemand];
          volumes.forEach((volume, edge) => {
            const count = Math.min(30, Math.ceil(volume / 12)); packetCount += count;
            for (let i = 0; i < count; i++) {
              const p = (time / 3000 + i / count) % 1;
              const a = positions[edge]; const b = positions[edge + 1];
              g.fillStyle(0xdbead6); g.fillCircle(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 3);
            }
          });
        }
        host.dataset.frames = String(++frames); host.dataset.packets = String(packetCount);
        host.dataset.appState = utilizationLabel(appU); host.dataset.sqlState = utilizationLabel(sqlU);
        host.dataset.tick = String(view.state.runtime.time);
      } catch (error) {
        host.dataset.renderer = 'error';
        controller.presentationFailed(error instanceof Error ? error.message : 'Renderer failed');
        this.scene.pause();
      }
    }
  }
  let game: InstanceType<typeof Phaser.Game> | undefined;
  let resize: ResizeObserver | undefined;
  const destroy = () => { resize?.disconnect(); unsubscribe(); game?.destroy(true); };
  try {
    game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: host.clientWidth, height: host.clientHeight,
      backgroundColor: '#10202d', banner: false, scene: World, input: { keyboard: false, mouse: false, touch: false } });
    resize = new ResizeObserver(() => { if (host.clientWidth > 0 && host.clientHeight > 0) game?.scale.resize(host.clientWidth, host.clientHeight); });
    resize.observe(host); return destroy;
  } catch (error) { destroy(); throw error; }
}

import type { Controller, View } from './controller';
import { compare } from '@stack-and-survive/simulation/economy';
import { definitions } from '@stack-and-survive/cloud-domain';
import { positionError, project, snap, unproject, validTargets, type Point } from './editor';

export function utilizationLabel(u: number | null): string {
  return u === null ? 'READY' : compare(u, 1) > 0 ? '! OVERLOADED' : compare(u, .7) > 0 ? 'WARNING' : 'HEALTHY';
}
export async function mountWorld(host: HTMLDivElement, controller: Controller, generation: number): Promise<() => void> {
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
      this.captions = Array.from({ length: 5 }, () => this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '13px', color: '#e6f0ed', align: 'center', backgroundColor: '#10202d', padding: { x: 8, y: 6 },
      }).setOrigin(.5, 0));
      host.dataset.renderer = 'ready';
      controller.rendererReady(generation);
    }
    update(time: number) {
      try {
        const width = this.scale.width; const height = this.scale.height;
        const architecture = view.state.runtime.architecture;
        const resources = architecture.resources;
        const positions = resources.map(r => project(r, view.camera, width, height));
        const g = this.graphics.clear();
        g.lineStyle(1, 0x223b4b, .6);
        for (let x = -height; x < width + height; x += 56) { g.lineBetween(x, 0, x + height, height); g.lineBetween(x, 0, x - height, height); }
        g.lineStyle(3, 0x708b94);
        for (const connection of architecture.connections) {
          const a = positions[resources.findIndex(r => r.id === connection.from)];
          const b = positions[resources.findIndex(r => r.id === connection.to)];
          if (!a || !b) continue;
          g.lineBetween(a.x, a.y, b.x, b.y);
          const x = a.x + (b.x - a.x) * .65; const y = a.y + (b.y - a.y) * .65;
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          g.lineBetween(x, y, x - 12 * Math.cos(angle - .5), y - 12 * Math.sin(angle - .5));
          g.lineBetween(x, y, x - 12 * Math.cos(angle + .5), y - 12 * Math.sin(angle + .5));
        }
        const requests = view.snapshot?.requests;
        const appU = requests?.app.utilization ?? null;
        const sqlU = requests ? Math.max(requests.sql.readUtilization, requests.sql.writeUtilization) : null;
        this.captions.forEach(c => c.setVisible(false));
        const targets = view.connecting && view.connectionSource ? validTargets(architecture, view.connectionSource) : [];
        positions.forEach((p, i) => {
          const resource = resources[i];
          const u = resource.kind === 'compute' ? appU : resource.kind === 'database' ? sqlU : null;
          const connected = architecture.connections.some(c => c.from === resource.id || c.to === resource.id);
          const state = resource.remaining > 0 ? `PROVISIONING ${resource.remaining}s` : !connected ? 'DISCONNECTED' : utilizationLabel(u);
          const color = state === '! OVERLOADED' ? 0xf58a78 : state === 'WARNING' ? 0xefc27b : 0x9bdac7;
          g.fillStyle(color, .25); g.fillRect(p.x - 34, p.y - 22, 68, 52);
          g.lineStyle(view.selected === resource.id ? 4 : 2, view.selected === resource.id ? 0xffffff : color); g.strokeRect(p.x - 34, p.y - 22, 68, 52);
          g.fillStyle(color, .75); g.fillTriangle(p.x - 34, p.y - 22, p.x, p.y - 42, p.x + 34, p.y - 22);
          if (state === '! OVERLOADED') { g.fillStyle(0xffffff); g.fillRect(p.x - 3, p.y - 12, 6, 17); g.fillCircle(p.x, p.y + 14, 3); }
          if (targets.includes(resource.id)) { g.lineStyle(2, 0xefc27b); g.strokeCircle(p.x, p.y, 48); }
          this.captions[i].setVisible(true).setPosition(p.x, p.y + 48).setText(`${definitions[resource.kind].name}${resource.kind === 'compute' ? ` ×${resource.instances}` : ''}\n${resource.kind === 'internet' ? 'EXTERNAL TRAFFIC' : `${state}${u === null ? '' : ` · ${(u * 100).toFixed(1)}%`}`}`);
        });
        if (view.building && view.preview) {
          const point = snap(view.preview); const p = project(point, view.camera, width, height);
          const invalid = !!positionError(architecture, point);
          g.lineStyle(3, invalid ? 0xf58a78 : 0x9bdac7); g.strokeRect(p.x - 40, p.y - 40, 80, 80);
          host.dataset.placement = invalid ? 'invalid' : 'valid';
        } else host.dataset.placement = 'none';
        let packetCount = 0;
        if (view.state.runtime.status === 'RUNNING' && !view.error && requests) {
          const at = (kind: string) => positions[resources.findIndex(r => r.kind === kind)];
          const flows = [
            ...(requests.edge.active ? [{ a: at('internet'), b: at('edge'), volume: requests.offered.browse + requests.offered.order + requests.offered.bot }, { a: at('edge'), b: at('compute'), volume: requests.app.incoming }]
              : [{ a: at('internet'), b: at('compute'), volume: requests.app.incoming }]),
            ...(requests.cache.active ? [{ a: at('compute'), b: at('cache'), volume: requests.cache.eligible }, { a: at('cache'), b: at('database'), volume: requests.sql.readDemand }, { a: at('compute'), b: at('database'), volume: requests.sql.writeDemand }]
              : [{ a: at('compute'), b: at('database'), volume: requests.sql.readDemand + requests.sql.writeDemand }]),
          ];
          flows.forEach(({ a, b, volume }) => {
            const count = Math.min(30, Math.ceil(volume / 12)); packetCount += count;
            for (let i = 0; i < count; i++) {
              const p = (time / 3000 + i / count) % 1;
              if (!a || !b) continue;
              g.fillStyle(0xdbead6); g.fillCircle(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 3);
            }
          });
        }
        host.dataset.frames = String(++frames); host.dataset.packets = String(packetCount);
        host.dataset.appState = utilizationLabel(appU); host.dataset.sqlState = utilizationLabel(sqlU);
        host.dataset.tick = String(view.state.runtime.time);
        host.dataset.nodes = JSON.stringify(resources.map((r, i) => ({ id: r.id, ...positions[i] })));
      } catch (error) {
        host.dataset.renderer = 'error';
        controller.presentationFailed(error instanceof Error ? error.message : 'Renderer failed');
        this.scene.pause();
      }
    }
  }
  let game: InstanceType<typeof Phaser.Game> | undefined;
  let resize: ResizeObserver | undefined;
  let removeInput = () => {};
  let removeContextHandler = () => {};
  const destroy = () => { resize?.disconnect(); removeInput(); removeContextHandler(); unsubscribe(); game?.destroy(true); };
  try {
    game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: host.clientWidth, height: host.clientHeight,
      backgroundColor: '#10202d', banner: false, scene: World, input: { keyboard: false, mouse: false, touch: false } });
    const canvas = game.canvas; canvas.style.touchAction = 'none';
    const contextLost = () => { host.dataset.renderer = 'error'; controller.presentationFailed('Graphics context lost'); };
    canvas.addEventListener('webglcontextlost', contextLost);
    removeContextHandler = () => canvas.removeEventListener('webglcontextlost', contextLost);
    const point = (e: PointerEvent): Point => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const logical = (p: Point) => unproject(p, view.camera, canvas.clientWidth, canvas.clientHeight);
    let drag: { pointer: number; id: string | null; last: Point; offset: Point } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      const p = point(e);
      if (view.building) { controller.place(logical(p)); return; }
      const resource = view.state.runtime.architecture.resources.find(r => { const s = project(r, view.camera, canvas.clientWidth, canvas.clientHeight); return Math.abs(s.x - p.x) < 40 && Math.abs(s.y - p.y) < 44; });
      if (view.connecting) { if (resource) controller.connectNode(resource.id); return; }
      controller.select(resource?.id ?? null);
      const local = logical(p);
      drag = { pointer: e.pointerId, id: resource?.id ?? null, last: p, offset: { x: local.x - (resource?.x ?? 0), y: local.y - (resource?.y ?? 0) } };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = point(e); if (view.building) controller.preview(logical(p));
      if (!drag || drag.pointer !== e.pointerId) return;
      if (drag.id) { const local = logical(p); controller.move(drag.id, { x: local.x - drag.offset.x, y: local.y - drag.offset.y }); }
      else controller.setCamera({ ...view.camera, x: view.camera.x + (p.x - drag.last.x) / view.camera.zoom, y: view.camera.y + (p.y - drag.last.y) / view.camera.zoom });
      drag.last = p;
    };
    const up = (e: PointerEvent) => { if (drag?.pointer === e.pointerId) { if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); drag = null; } };
    const wheel = (e: WheelEvent) => { e.preventDefault(); controller.setCamera({ ...view.camera, zoom: view.camera.zoom * Math.exp(-e.deltaY * .001) }); };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('wheel', wheel, { passive: false });
    removeInput = () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('wheel', wheel); };
    resize = new ResizeObserver(() => { if (host.clientWidth > 0 && host.clientHeight > 0) game?.scale.resize(host.clientWidth, host.clientHeight); });
    resize.observe(host); return destroy;
  } catch (error) { destroy(); throw error; }
}

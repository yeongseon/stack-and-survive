import type { Controller, View } from './controller';
import { compare } from '@stack-and-survive/simulation/economy';
import { definitions } from '@stack-and-survive/cloud-domain';
import { positionError, project, snap, unproject, validTargets, viewportCamera, type Point } from './editor';
import { representativeCount, visualFlows } from './traffic';
import { createServiceBadge } from './service-icons';
import { drawBuilding, drawEnvironment, insideBuilding } from './building-art';

export function utilizationLabel(u: number | null): string {
  return u === null ? 'READY' : compare(u, 1) > 0 ? '! OVERLOADED' : compare(u, .7) > 0 ? 'WARNING' : 'HEALTHY';
}
export async function mountWorld(host: HTMLDivElement, controller: Controller, generation: number, onInspect: () => void): Promise<() => void> {
  const { default: Phaser } = await import('phaser');
  if (!host.isConnected) return () => {};
  let view: View = controller.getSnapshot();
  let frames = 0;
  const badgeLayer = document.createElement('div');
  badgeLayer.className = 'world-service-badges'; host.append(badgeLayer);
  const badges = new Map<string, HTMLSpanElement>();
  const unsubscribe = controller.subscribe(() => { view = controller.getSnapshot(); });
  class World extends Phaser.Scene {
    graphics!: Phaser.GameObjects.Graphics;
    trafficGraphics!: Phaser.GameObjects.Graphics;
    structureSignature = '';
    environment!: Phaser.GameObjects.Graphics;
    backgroundSize = '';
    captions: Phaser.GameObjects.Text[] = [];
    create() {
      this.environment = this.add.graphics();
      this.graphics = this.add.graphics();
      this.trafficGraphics = this.add.graphics();
      this.captions = Array.from({ length: 5 }, () => this.add.text(0, 0, '', {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#f2faff', align: 'center', backgroundColor: '#234253', padding: { x: 8, y: 5 },
      }).setOrigin(.5, 0));
      host.dataset.renderer = 'ready';
      controller.rendererReady(generation);
    }
    update(time: number) {
      try {
        const width = this.scale.width; const height = this.scale.height;
        const architecture = view.state.runtime.architecture;
        const resources = architecture.resources;
        const camera = viewportCamera(view.camera, width, height);
        const positions = resources.map(r => project(r, camera, width, height));
        for (const [id, badge] of badges) {
          if (!resources.some(r => r.id === id)) { badge.remove(); badges.delete(id); }
        }
        resources.forEach((resource, i) => {
          let badge = badges.get(resource.id);
          if (!badge) {
            const created = createServiceBadge(resource.kind);
            if (!created) return;
            badge = created; badges.set(resource.id, badge); badgeLayer.append(badge);
          }
          const p = positions[i];
          badge.hidden = p.x < 16 || p.x > width - 16 || p.y < 80 || p.y > height;
          badge.style.left = `${p.x - 16}px`; badge.style.top = `${p.y - 80}px`;
        });
        let g = this.graphics;
        if (this.backgroundSize !== `${width}:${height}`) {
          drawEnvironment(this.environment.clear(), width, height); this.backgroundSize = `${width}:${height}`;
        }
        const requests = view.snapshot?.requests;
        const appU = requests?.app.utilization ?? null;
        const sqlU = requests ? Math.max(requests.sql.readUtilization, requests.sql.writeUtilization) : null;
        const signature = JSON.stringify([width, height, architecture, camera, view.selected, view.connectionSource, view.preview, view.building, appU, sqlU, requests?.cache.utilization, view.state.runtime.scaleDue, view.state.runtime.preparationScaleDue]);
        if (signature !== this.structureSignature) {
        this.structureSignature = signature; g.clear();
        for (const connection of architecture.connections) {
          const a = positions[resources.findIndex(r => r.id === connection.from)];
          const b = positions[resources.findIndex(r => r.id === connection.to)];
          if (!a || !b) continue;
          g.lineStyle(12, 0x254554, .7); g.lineBetween(a.x, a.y + 12, b.x, b.y + 12);
          g.lineStyle(5, 0x90b7b9, .65); g.lineBetween(a.x, a.y, b.x, b.y);
          g.lineStyle(1, 0xd4eaf0, .8); g.lineBetween(a.x, a.y, b.x, b.y);
          const x = a.x + (b.x - a.x) * .65; const y = a.y + (b.y - a.y) * .65;
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          g.lineBetween(x, y, x - 12 * Math.cos(angle - .5), y - 12 * Math.sin(angle - .5));
          g.lineBetween(x, y, x - 12 * Math.cos(angle + .5), y - 12 * Math.sin(angle + .5));
        }
        this.captions.forEach(c => c.setVisible(false));
        const targets = view.connecting && view.connectionSource ? validTargets(architecture, view.connectionSource) : [];
        const buildingStates: { id: string; silhouette: string; completedModules: number; pendingModule: boolean; provisioning: boolean }[] = [];
        const sorted = resources.map((resource, i) => ({ resource, i, p: positions[i] })).sort((a, b) => a.p.y - b.p.y);
        sorted.forEach(({ p, i, resource }) => {
          const u = resource.kind === 'compute' ? appU : resource.kind === 'database' ? sqlU : resource.kind === 'cache' ? requests?.cache.utilization ?? null : null;
          const connected = architecture.connections.some(c => c.from === resource.id || c.to === resource.id);
          const state = resource.remaining > 0 ? `PROVISIONING ${resource.remaining}s` : !connected ? 'DISCONNECTED' : utilizationLabel(u);
          const building = drawBuilding(g, p, resource, connected, view.selected === resource.id,
            resource.kind === 'compute' && (view.state.runtime.scaleDue !== null || view.state.runtime.preparationScaleDue !== null), state === 'WARNING', state === '! OVERLOADED');
          buildingStates.push({ id: resource.id, ...building });
          if (targets.includes(resource.id)) { g.lineStyle(2, 0xefc27b); g.strokeCircle(p.x, p.y, 48); }
          const name = width < 600 ? { internet: 'Internet', compute: 'App', database: 'SQL', cache: 'Cache', edge: 'WAF' }[resource.kind] : definitions[resource.kind].name;
          this.captions[i].setFontSize(width < 600 ? 10 : 13).setWordWrapWidth(width < 600 ? 100 : 260, true)
            .setVisible(true).setPosition(Math.max(58, Math.min(width - 58, p.x)), p.y + 48)
            .setText(`${name}${resource.kind === 'compute' ? ` ×${resource.instances}` : ''}\n${resource.kind === 'internet' ? 'TRAFFIC' : `${state}${u === null ? '' : ` · ${(u * 100).toFixed(1)}%`}`}`);
        });
        host.dataset.buildings = JSON.stringify(buildingStates);
        if (view.building && view.preview) {
          const point = snap(view.preview); const p = project(point, camera, width, height);
          const invalid = !!positionError(architecture, point);
          g.lineStyle(3, invalid ? 0xf58a78 : 0x9bdac7); g.strokeRect(p.x - 40, p.y - 40, 80, 80);
          host.dataset.placement = invalid ? 'invalid' : 'valid';
        } else host.dataset.placement = 'none';
        }
        g = this.trafficGraphics.clear();
        let packetCount = 0;
        if (view.state.runtime.status === 'RUNNING' && !view.error && requests) {
          const at = (kind: string) => positions[resources.findIndex(r => r.kind === kind)];
          const flows = visualFlows(requests);
          flows.forEach((flow, lane) => {
            const a = at(flow.from); const b = at(flow.to);
            if (!a || !b) return;
            const count = representativeCount(flow.volume); packetCount += count;
            for (let i = 0; i < count; i++) {
              const p = (time / 3000 + i / count + lane * .07) % 1;
              const ingressRejected = flow.end === 'filtered' && flow.to === 'compute';
              const progress = ingressRejected ? p * .25 : p;
              const x = a.x + (b.x - a.x) * progress; const y = a.y + (b.y - a.y) * progress + (lane % 3 - 1) * 7;
              const color = flow.kind === 'bot' ? 0xf58a78 : flow.kind === 'order' ? 0xefc27b : 0x9bdac7;
              g.fillStyle(color); g.lineStyle(2, color);
              if (p > .85 && (flow.end === 'failed' || flow.end === 'filtered')) {
                g.lineBetween(x - 4, y - 4, x + 4, y + 4); g.lineBetween(x - 4, y + 4, x + 4, y - 4);
              } else if (p > .85 && flow.end === 'success' && flow.to === 'cache') g.strokeCircle(x, y, 7);
              else if (flow.kind === 'order') g.fillRect(x - 3, y - 3, 6, 6);
              else if (flow.kind === 'bot') g.fillTriangle(x - 4, y + 4, x, y - 4, x + 4, y + 4);
              else g.fillCircle(x, y, 3);
            }
          });
          host.dataset.flows = JSON.stringify(flows);
        } else host.dataset.flows = '[]';
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
  const destroy = () => { resize?.disconnect(); removeInput(); removeContextHandler(); unsubscribe(); badgeLayer.remove(); badges.clear(); game?.destroy(true); };
  try {
    game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: host.clientWidth, height: host.clientHeight,
      backgroundColor: '#345f79', banner: false, scene: World, input: { keyboard: false, mouse: false, touch: false } });
    const canvas = game.canvas; canvas.style.touchAction = 'none';
    const contextLost = () => { host.dataset.renderer = 'error'; controller.presentationFailed('Graphics context lost'); };
    canvas.addEventListener('webglcontextlost', contextLost);
    removeContextHandler = () => canvas.removeEventListener('webglcontextlost', contextLost);
    const point = (e: PointerEvent): Point => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const camera = () => viewportCamera(view.camera, canvas.clientWidth, canvas.clientHeight);
    const logical = (p: Point) => unproject(p, camera(), canvas.clientWidth, canvas.clientHeight);
    let drag: { pointer: number; id: string | null; last: Point; offset: Point } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      const p = point(e);
      if (view.building) { controller.place(logical(p)); return; }
      const resource = view.state.runtime.architecture.resources
        .map(r => ({ resource: r, center: project(r, camera(), canvas.clientWidth, canvas.clientHeight) }))
        .filter(item => insideBuilding(p, item.center))
        .sort((a, b) => Math.hypot(p.x - a.center.x, p.y - a.center.y) - Math.hypot(p.x - b.center.x, p.y - b.center.y) || b.resource.y - a.resource.y)[0]?.resource;
      if (view.connecting) { if (resource) controller.connectNode(resource.id); return; }
      controller.select(resource?.id ?? null);
      if (resource) onInspect();
      const local = logical(p);
      drag = { pointer: e.pointerId, id: resource?.id ?? null, last: p, offset: { x: local.x - (resource?.x ?? 0), y: local.y - (resource?.y ?? 0) } };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = point(e); if (view.building) controller.preview(logical(p));
      if (!drag || drag.pointer !== e.pointerId) return;
      if (drag.id) { const local = logical(p); controller.move(drag.id, { x: local.x - drag.offset.x, y: local.y - drag.offset.y }); }
      else controller.setCamera({ ...view.camera, x: view.camera.x + (p.x - drag.last.x) / camera().zoom, y: view.camera.y + (p.y - drag.last.y) / camera().zoom });
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

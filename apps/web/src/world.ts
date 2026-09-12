import type { Controller, View } from './controller';
import { compare } from '@stack-and-survive/simulation/economy';
import { definitions } from '@stack-and-survive/cloud-domain';
import { positionError, project, snap, unproject, validTargets, viewportCamera, type Point } from './editor';
import { representativeCount, visualFlows } from './traffic';
import { createServiceBadge } from './service-icons';
import { buildingPresentation, drawBuilding, insideBuilding } from './building-art';
import { drawEnvironment } from './environment-art';
import { buildingAssets, buildingLayers, moduleAsset, resourceArtBounds } from './building-assets';
import { BuildingSprites } from './building-sprites';
import { activeEffects, completedResources, drawEffect, effectMotion } from './effects';
import { diagnosticsEnabled } from './mode';
import { placeCaptions } from './annotations';

export function utilizationLabel(u: number | null): string {
  return u === null ? 'READY' : compare(u, 1) > 0 ? '! OVERLOADED' : compare(u, .7) > 0 ? 'WARNING' : 'HEALTHY';
}
export async function mountWorld(host: HTMLDivElement, controller: Controller, generation: number, onInspect: () => void): Promise<() => void> {
  const { default: Phaser } = await import('phaser');
  if (!host.isConnected) return () => {};
  let view: View = controller.getSnapshot();
  let frames = 0;
  let renderVisible = true;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionPreference.matches;
  const updateMotion = () => { reducedMotion = motionPreference.matches; };
  motionPreference.addEventListener('change', updateMotion);
  const badgeLayer = document.createElement('div');
  badgeLayer.className = 'world-service-badges'; host.append(badgeLayer);
  const badges = new Map<string, HTMLSpanElement>();
  let animationTime = 0;
  const completions = new Map<string, number>();
  let drawnCompletions = 0;
  const undrawnCompletions = new Set<string>();
  const unsubscribe = controller.subscribe(() => {
    const next = controller.getSnapshot();
    for (const kind of completedResources(view, next)) {
      completions.set(kind, animationTime + 1400);
      undrawnCompletions.add(kind);
    }
    view = next;
  });
  class World extends Phaser.Scene {
    graphics!: Phaser.GameObjects.Graphics;
    stateGraphics!: Phaser.GameObjects.Graphics;
    trafficGraphics!: Phaser.GameObjects.Graphics;
    effectsGraphics!: Phaser.GameObjects.Graphics;
    structureSignature = '';
    environment!: Phaser.GameObjects.Graphics;
    backgroundSize = '';
    wasVisible = true;
    diagnosticView: View | null = null;
    diagnosticSize = '';
    captions: Phaser.GameObjects.Text[] = [];
    sprites!: BuildingSprites;
    preload() {
      for (const asset of [...Object.values(buildingAssets), moduleAsset]) {
        this.load.image(asset.texture, asset.src);
      }
    }
    create() {
      this.environment = this.add.graphics();
      this.graphics = this.add.graphics();
      this.stateGraphics = this.add.graphics().setDepth(buildingLayers.state);
      this.trafficGraphics = this.add.graphics();
      this.effectsGraphics = this.add.graphics();
      this.sprites = new BuildingSprites(this);
      this.trafficGraphics.setDepth(buildingLayers.traffic); this.effectsGraphics.setDepth(buildingLayers.effects);
      this.events.once('shutdown', () => this.sprites.destroy());
      this.captions = Array.from({ length: 5 }, () => this.add.text(0, 0, '', {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#f2faff', align: 'center', backgroundColor: '#234253', padding: { x: 8, y: 5 },
      }).setOrigin(.5, 0).setDepth(buildingLayers.labels));
      if (diagnosticsEnabled) host.dataset.textureStatus = JSON.stringify(Object.entries(buildingAssets).map(([kind, asset]) => ({ kind, loaded: this.textures.exists(asset.texture) })));
      host.dataset.renderer = 'ready';
      controller.rendererReady(generation);
    }
    update(time: number, delta: number) {
      if (!view.error && (view.state.runtime.status === 'RUNNING' || view.state.runtime.status === 'PREPARATION')) animationTime += delta;
      try {
        const width = this.scale.width; const height = this.scale.height;
        const architecture = view.state.runtime.architecture;
        const resources = architecture.resources;
        const camera = viewportCamera(view.camera, width, height);
        const positions = resources.map(r => project(r, camera, width, height));
        this.scene.setVisible(renderVisible);
        if (diagnosticsEnabled) {
          host.dataset.renderVisible = String(renderVisible);
          host.dataset.reducedMotion = String(reducedMotion);
          host.dataset.effects = JSON.stringify(activeEffects(view));
        }
        if (this.wasVisible !== renderVisible) {
          this.structureSignature = ''; this.backgroundSize = ''; this.wasVisible = renderVisible;
        }
        const requests = view.snapshot?.requests;
        const appU = requests?.app.utilization ?? null;
        const sqlU = requests ? Math.max(requests.sql.readUtilization, requests.sql.writeUtilization) : null;
        const flows = view.state.runtime.status === 'RUNNING' && !view.error && requests ? visualFlows(requests) : [];
        if (diagnosticsEnabled && (this.diagnosticView !== view || this.diagnosticSize !== `${width}:${height}`)) {
          this.diagnosticView = view; this.diagnosticSize = `${width}:${height}`;
          host.dataset.appState = utilizationLabel(appU); host.dataset.sqlState = utilizationLabel(sqlU);
          host.dataset.tick = String(view.state.runtime.time);
          host.dataset.nodes = JSON.stringify(resources.map((r, i) => ({ id: r.id, ...positions[i] })));
          host.dataset.flows = JSON.stringify(flows);
          host.dataset.packets = String(flows.reduce((sum, flow) => sum + representativeCount(flow.volume), 0));
          host.dataset.buildings = JSON.stringify(resources.map(resource => ({ id: resource.id,
            ...buildingPresentation(resource, architecture.connections.some(c => c.from === resource.id || c.to === resource.id), view.selected === resource.id,
              resource.kind === 'compute' && (view.state.runtime.scaleDue !== null || view.state.runtime.preparationScaleDue !== null)) })));
          host.dataset.placement = view.building && view.preview ? positionError(architecture, snap(view.preview)) ? 'invalid' : 'valid' : 'none';
        }
        if (!renderVisible) return;
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
          const badgeY = p.y + resourceArtBounds(resource.kind).y - 36;
          badge.hidden = p.x < 16 || p.x > width - 16 || badgeY < 0 || badgeY > height - 32;
          badge.style.left = `${p.x - 16}px`; badge.style.top = `${badgeY}px`;
        });
        let g = this.graphics;
        if (this.backgroundSize !== `${width}:${height}`) {
          const environment = drawEnvironment(this.environment.clear(), width, height); this.backgroundSize = `${width}:${height}`;
          if (diagnosticsEnabled) host.dataset.environment = JSON.stringify(environment);
        }
        const signature = JSON.stringify([width, height, architecture, camera, view.selected, view.connectionSource, view.preview, view.building, appU, sqlU, requests?.cache.utilization, view.state.runtime.scaleDue, view.state.runtime.preparationScaleDue]);
        if (signature !== this.structureSignature) {
        this.structureSignature = signature; g.clear(); this.stateGraphics.clear();
        this.sprites.retain(resources.map(r => r.id));
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
        sorted.forEach(({ p, i, resource }, rank) => {
          const u = resource.kind === 'compute' ? appU : resource.kind === 'database' ? sqlU : resource.kind === 'cache' ? requests?.cache.utilization ?? null : null;
          const connected = architecture.connections.some(c => c.from === resource.id || c.to === resource.id);
          const state = resource.remaining > 0 ? `PROVISIONING ${resource.remaining}s` : !connected ? 'DISCONNECTED' : utilizationLabel(u);
          const pending = resource.kind === 'compute' && (view.state.runtime.scaleDue !== null || view.state.runtime.preparationScaleDue !== null);
          const spriteBody = this.sprites.update(resource, p, pending, rank);
          const building = drawBuilding(g, p, resource, connected, view.selected === resource.id,
            pending, state === 'WARNING', state === '! OVERLOADED', spriteBody, this.stateGraphics);
          buildingStates.push({ id: resource.id, ...building });
          if (targets.includes(resource.id)) { this.stateGraphics.lineStyle(2, 0xefc27b); this.stateGraphics.strokeCircle(p.x, p.y, 48); }
          const name = width < 600 ? { internet: 'Internet', compute: 'App', database: 'SQL', cache: 'Cache', edge: 'WAF' }[resource.kind] : definitions[resource.kind].name;
          this.captions[i].setFontSize(width < 600 ? 11 : 13).setWordWrapWidth(width < 600 ? 82 : 260, true)
            .setVisible(true).setPosition(Math.max(58, Math.min(width - 58, p.x)), p.y + 48)
            .setText(width < 600
              ? `${state === '! OVERLOADED' ? '! ' : resource.remaining > 0 ? '◷ ' : ''}${name}${resource.kind === 'compute' ? ` ×${resource.instances}` : ''}`
              : `${name}${resource.kind === 'compute' ? ` ×${resource.instances}` : ''}\n${resource.kind === 'internet' ? 'TRAFFIC' : `${state}${u === null ? '' : ` · ${(u * 100).toFixed(1)}%`}`}`);
        });
        if (width < 600) {
          const obstacles = positions.flatMap((p, i) => {
            const bounds = resourceArtBounds(resources[i].kind);
            return [{ ...bounds, x: p.x + bounds.x, y: p.y + bounds.y },
              ...(resources[i].kind === 'internet' ? [] : [{ x: p.x - 16, y: p.y + bounds.y - 36, width: 32, height: 32 }])];
          });
          const labels = placeCaptions(positions, resources.map((_, i) => ({ width: this.captions[i].width, height: this.captions[i].height })), { width, height }, obstacles);
          labels.forEach((label, i) => {
            this.captions[i].setPosition(label.x + label.width / 2, label.y);
            g.lineStyle(1, 0xc9e7ef, .65);
            g.lineBetween(positions[i].x, positions[i].y + 30, label.x + label.width / 2, label.y + label.height / 2);
          });
          if (diagnosticsEnabled) host.dataset.labels = JSON.stringify(labels);
        }
        if (diagnosticsEnabled) {
          host.dataset.buildings = JSON.stringify(buildingStates);
          host.dataset.spriteViews = JSON.stringify(this.sprites.diagnostics());
          host.dataset.spriteLayers = JSON.stringify({ state: this.stateGraphics.depth, traffic: this.trafficGraphics.depth, effects: this.effectsGraphics.depth, labels: this.captions[0].depth });
        }
        if (view.building && view.preview) {
          const point = snap(view.preview); const p = project(point, camera, width, height);
          const invalid = !!positionError(architecture, point);
          this.stateGraphics.lineStyle(3, invalid ? 0xf58a78 : 0x9bdac7); this.stateGraphics.strokeRect(p.x - 40, p.y - 40, 80, 80);
          if (diagnosticsEnabled) host.dataset.placement = invalid ? 'invalid' : 'valid';
        } else if (diagnosticsEnabled) host.dataset.placement = 'none';
        }
        g = this.trafficGraphics.clear();
        const effects = activeEffects(view);
        const fx = this.effectsGraphics.clear();
        for (const effect of effects) {
          const index = resources.findIndex(r => r.kind === effect.resource);
          if (index >= 0) drawEffect(fx, effect, positions[index], time, effectMotion(view, reducedMotion));
        }
        for (const [kind, until] of completions) {
          if (animationTime >= until) { completions.delete(kind); continue; }
          const p = positions[resources.findIndex(r => r.kind === kind)];
          if (p) {
            if (undrawnCompletions.delete(kind)) drawnCompletions++;
            const progress = reducedMotion ? .5 : 1 - (until - animationTime) / 1400;
            fx.lineStyle(3, 0xd6ffe5, 1 - progress); fx.strokeEllipse(p.x, p.y + 8, 80 + progress * 60, 28 + progress * 22);
          }
        }
        if (diagnosticsEnabled) {
          host.dataset.completions = JSON.stringify([...completions.keys()]);
          host.dataset.drawnCompletions = String(drawnCompletions);
        }
        if (view.state.runtime.status === 'FAILED' || view.state.runtime.status === 'COMPLETED') {
          fx.lineStyle(4, view.state.runtime.status === 'FAILED' ? 0xffa49b : 0x90e9c4, .8);
          fx.strokeRoundedRect(4, 4, Math.max(1, width - 8), Math.max(1, height - 8), 12);
        } else if (view.snapshot?.critical) {
          fx.lineStyle(3, 0xffac82, effectMotion(view, reducedMotion) ? .4 + .2 * Math.sin(time / 400) : .6);
          fx.strokeRect(2, 2, Math.max(1, width - 4), Math.max(1, height - 4));
        }
        if (diagnosticsEnabled) host.dataset.effects = JSON.stringify(effects);
        let packetCount = 0;
        if (view.state.runtime.status === 'RUNNING' && !view.error && requests) {
          const at = (kind: string) => positions[resources.findIndex(r => r.kind === kind)];
          flows.forEach((flow, lane) => {
            const a = at(flow.from); const b = at(flow.to);
            if (!a || !b) return;
            const count = representativeCount(flow.volume); packetCount += count;
            for (let i = 0; i < count; i++) {
              const p = reducedMotion ? (i + .5) / count : (time / 3000 + i / count + lane * .07) % 1;
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
          if (diagnosticsEnabled) host.dataset.flows = JSON.stringify(flows);
        } else if (diagnosticsEnabled) host.dataset.flows = '[]';
        if (diagnosticsEnabled) {
          host.dataset.frames = String(++frames); host.dataset.packets = String(packetCount);
          host.dataset.appState = utilizationLabel(appU); host.dataset.sqlState = utilizationLabel(sqlU);
          host.dataset.tick = String(view.state.runtime.time);
          host.dataset.nodes = JSON.stringify(resources.map((r, i) => ({ id: r.id, ...positions[i] })));
        }
      } catch (error) {
        host.dataset.renderer = 'error';
        controller.presentationFailed(error instanceof Error ? error.message : 'Renderer failed');
        this.scene.pause();
      }
    }
  }
  let game: InstanceType<typeof Phaser.Game> | undefined;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  let removeInput = () => {};
  let removeContextHandler = () => {};
  const destroy = () => { resize?.disconnect(); intersection?.disconnect(); motionPreference.removeEventListener('change', updateMotion); removeInput(); removeContextHandler(); unsubscribe(); badgeLayer.remove(); badges.clear(); game?.destroy(true); };
  try {
    game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: host.clientWidth, height: host.clientHeight,
      backgroundColor: '#345f79', banner: false, scene: World, input: { keyboard: false, mouse: false, touch: false } });
    const canvas = game.canvas; canvas.style.touchAction = 'none';
    const contextLost = (event: Event) => { event.preventDefault(); host.dataset.renderer = 'error'; controller.presentationFailed('Graphics context lost'); };
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
        .filter(item => {
          const bounds = resourceArtBounds(item.resource.kind);
          return insideBuilding(p, item.center) || (p.x >= item.center.x + bounds.x && p.x <= item.center.x + bounds.x + bounds.width
            && p.y >= item.center.y + bounds.y && p.y <= item.center.y + bounds.y + bounds.height);
        })
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
    intersection = new IntersectionObserver(entries => {
      const entry = entries[entries.length - 1];
      renderVisible = entry.isIntersecting && entry.intersectionRatio > 0;
    }, { threshold: 0 });
    intersection.observe(host);
    resize.observe(host); return destroy;
  } catch (error) { destroy(); throw error; }
}

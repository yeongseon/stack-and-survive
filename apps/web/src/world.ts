import type { Controller, View } from './controller';
import { compare } from '@stack-and-survive/simulation/economy';
import { definitions } from '@stack-and-survive/cloud-domain';
import { positionError, project, snap, unproject, validTargets, viewportCamera, type Point } from './editor';
import { representativeCount, visualFlows } from './traffic';
import { createServiceBadge } from './service-icons';
import { buildingPresentation, drawBuilding, insideBuilding } from './building-art';
import { drawEnvironment } from './environment-art';
import { buildingAssets, buildingLayers, moduleAsset, resourceArtBounds, playerBuildingScale } from './building-assets';
import { BuildingSprites } from './building-sprites';
import { drawProcessingLane, lanePoint, processingLanes } from './processing-lanes';
import { pressureLosses, pressurePositions, pressureQueues } from './queue-visualization';
import { activeEffects, completedResources, drawEffect, effectMotion } from './effects';
import { diagnosticsEnabled } from './mode';
import { placeCaptions } from './annotations';
import { tycoonPoint, playerMap } from './tycoon-layout';
import { attachPlayerNavigation, type PlayerNavigation } from './player-navigation';
import { hitWorldTarget, worldTargets, type WorldTarget } from './world-interaction';
import { drawConstruction } from './construction-art';
import { resourceVisualState } from './resource-visual-state';
import { drawFacilityBanks, facilityStateKey } from './resource-banks';
import { FacilityLighting } from './facility-lighting';
import { resourceActivity, drawResourceActivity } from './resource-activity';
import { drawIntake, packetPalette } from './workload-art';
import { PacketSprites } from './packet-sprites';
import { v3, v3Images } from './art-v3';
import { V3Sprites } from './v3-sprites';
import { facilityBays } from './facility-bays';
import { generateHallBackground, generateForegroundLayer } from './hall-background';

export function utilizationLabel(u: number | null): string {
  return u === null ? 'READY' : compare(u, 1) > 0 ? '! OVERLOADED' : compare(u, .7) > 0 ? 'WARNING' : 'HEALTHY';
}
export async function mountWorld(host: HTMLDivElement, controller: Controller, generation: number, onInspect: () => void, navigation?: PlayerNavigation, onWorldBuild?: (target: WorldTarget) => void, onReady?: () => void): Promise<() => void> {
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
  let hovered: WorldTarget | null = null;
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
    frameGraphics!: Phaser.GameObjects.Graphics;
    interactionGraphics!: Phaser.GameObjects.Graphics;
    structureSignature = '';
    structureDraws = 0;
    environment!: Phaser.GameObjects.Graphics;
    backgroundSize = '';
    wasVisible = true;
    diagnosticView: View | null = null;
    diagnosticSize = '';
    diagnosticMotion: boolean | null = null;
    captions: Phaser.GameObjects.Text[] = [];
    sprites!: BuildingSprites;
    packets!: PacketSprites;
    lighting!: FacilityLighting;
    heroSprites!: V3Sprites;
    hallBackground: Phaser.GameObjects.Image | null = null;
    hallForeground: Phaser.GameObjects.Image | null = null;
    preload() {
      for (const asset of v3 ? v3Images : [...Object.values(buildingAssets), moduleAsset]) {
        this.load.image(asset.texture, asset.src);
      }
    }
    create() {
      if(v3 && v3Images.some(asset=>!this.textures.exists(asset.texture))) {
        host.dataset.renderer='error'; controller.presentationFailed('V3 preview textures did not load. Re-export the local art and rebuild graphics.');
        this.scene.pause(); return;
      }
      this.environment = this.add.graphics();
      this.graphics = this.add.graphics();
      this.stateGraphics = this.add.graphics().setDepth(buildingLayers.state);
      this.trafficGraphics = this.add.graphics();
      this.effectsGraphics = this.add.graphics();
      this.frameGraphics = this.add.graphics().setScrollFactor(0).setDepth(buildingLayers.effects + 1);
      this.interactionGraphics = this.add.graphics().setDepth(buildingLayers.state + 1);
      this.sprites = new BuildingSprites(this);
      this.packets = new PacketSprites(this);
      this.lighting = new FacilityLighting(this);
      this.heroSprites = new V3Sprites(this);
      if (v3) {
        const hallCanvas = generateHallBackground();
        this.textures.addCanvas('hall-background', hallCanvas);
        this.hallBackground = this.add.image(0, 0, 'hall-background').setOrigin(0, 0).setDepth(-1);
        const fgCanvas = generateForegroundLayer();
        this.textures.addCanvas('hall-foreground', fgCanvas);
        this.hallForeground = this.add.image(0, 0, 'hall-foreground').setOrigin(0, 0).setDepth(buildingLayers.effects + 0.5);
      }
      this.trafficGraphics.setDepth(buildingLayers.traffic); this.effectsGraphics.setDepth(buildingLayers.effects);
      this.events.once('shutdown', () => { this.sprites.destroy(); this.packets.destroy(); this.lighting.destroy(); this.heroSprites.destroy(); if (this.hallBackground) this.hallBackground.destroy(); if (this.hallForeground) this.hallForeground.destroy(); });
      this.captions = Array.from({ length: 5 }, () => this.add.text(0, 0, '', {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#f2faff', align: 'center', backgroundColor: '#234253', padding: { x: 8, y: 5 },
      }).setOrigin(.5, 0).setDepth(buildingLayers.labels));
      if (diagnosticsEnabled) host.dataset.textureStatus = JSON.stringify(Object.entries(buildingAssets).map(([kind, asset]) => ({ kind, loaded: this.textures.exists(asset.texture) })));
      host.dataset.renderer = 'ready';
      controller.rendererReady(generation);
      onReady?.();
    }
    update(time: number, delta: number) {
      if (!view.error && (view.state.runtime.status === 'RUNNING' || view.state.runtime.status === 'PREPARATION')) animationTime += delta;
      try {
        const screenWidth = this.scale.width; const screenHeight = this.scale.height;
        const width = view.playerMode ? playerMap.width : screenWidth;
        const height = view.playerMode ? playerMap.height : screenHeight;
        navigation?.resize({ width: screenWidth, height: screenHeight });
        const playerCamera = view.playerMode ? navigation?.getSnapshot() : undefined;
        if (playerCamera) {
          this.cameras.main.setZoom(playerCamera.effectiveZoom);
          this.cameras.main.centerOn(playerCamera.state.centerX, playerCamera.state.centerY);
          this.frameGraphics.setScale(1 / playerCamera.effectiveZoom).setPosition(screenWidth / 2 * (1 - 1 / playerCamera.effectiveZoom), screenHeight / 2 * (1 - 1 / playerCamera.effectiveZoom));
        }
        const architecture = view.state.runtime.architecture;
        const resources = architecture.resources;
        const camera = viewportCamera(view.camera, width, height);
        const positions = resources.map(r => view.playerMode ? tycoonPoint(r.kind) : project(r, camera, width, height));
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
        const visualState = resourceVisualState(view, reducedMotion);
        if (v3 && view.playerMode) {
          this.heroSprites.begin();
          resources.map((resource,i)=>({resource,p:positions[i]})).sort((a,b)=>a.p.y-b.p.y).forEach(({resource,p},rank)=>this.heroSprites.update(resource,p,rank,view,animationTime,reducedMotion));
          this.heroSprites.end();
          if(diagnosticsEnabled)host.dataset.v3Sprites=JSON.stringify(this.heroSprites.diagnostics());
        }
        const appU = requests?.app.utilization ?? null;
        const sqlU = requests ? Math.max(requests.sql.readUtilization, requests.sql.writeUtilization) : null;
        const flows = view.state.runtime.status === 'RUNNING' && !view.error && requests ? visualFlows(requests) : [];
        const queues = pressureQueues(requests ?? null);
        if (diagnosticsEnabled && (this.diagnosticView !== view || this.diagnosticSize !== `${width}:${height}` || this.diagnosticMotion !== reducedMotion)) {
          this.diagnosticView = view; this.diagnosticSize = `${width}:${height}`; this.diagnosticMotion = reducedMotion;
          host.dataset.appState = utilizationLabel(appU); host.dataset.sqlState = utilizationLabel(sqlU);
          host.dataset.tick = String(view.state.runtime.time);
          host.dataset.nodes = JSON.stringify(resources.map((r, i) => ({ id: r.id, ...positions[i] })));
          host.dataset.flows = JSON.stringify(flows);
          host.dataset.pressureQueues = JSON.stringify(queues);
          host.dataset.resourceStates = JSON.stringify(visualState);
          host.dataset.pressureLosses = JSON.stringify(pressureLosses(requests ?? null));
          host.dataset.packets = String(flows.reduce((sum, flow) => sum + representativeCount(flow.volume), 0));
          host.dataset.buildings = JSON.stringify(resources.map(resource => ({ id: resource.id,
            ...buildingPresentation(resource, architecture.connections.some(c => c.from === resource.id || c.to === resource.id), view.selected === resource.id,
              resource.kind === 'compute' && (view.state.runtime.scaleDue !== null || view.state.runtime.preparationScaleDue !== null)) })));
          host.dataset.placement = view.building && view.preview ? positionError(architecture, snap(view.preview)) ? 'invalid' : 'valid' : 'none';
        }
        if (!renderVisible) return;
        const interaction = this.interactionGraphics.clear();
        if (view.playerMode) {
          const targets = worldTargets(view, width, height);
          for (const target of targets) {
            if (target.build && target.kind !== 'compute') {
              const { x, y } = target.point;
              interaction.fillStyle(0x153746, .8); interaction.lineStyle(2, 0x8bbcad, .8);
              interaction.fillPoints([{ x: x-46, y }, { x, y:y-24 }, { x:x+46, y }, { x, y:y+24 }], true);
              interaction.strokePoints([{ x: x-46, y }, { x, y:y-24 }, { x:x+46, y }, { x, y:y+24 }], true);
              interaction.lineBetween(x-9, y, x+9, y); interaction.lineBetween(x, y-7, x, y+7);
              if (target.kind === 'edge') { interaction.lineBetween(x-25,y-3,x-25,y-20); interaction.lineBetween(x+25,y-3,x+25,y-20); }
              else { for (const dx of [-20,0,20]) interaction.strokeRect(x+dx-5,y-12,10,8); }
            }
            if (target.id === hovered?.id) {
              const b = target.bounds;
              interaction.lineStyle(3 / (playerCamera?.effectiveZoom ?? 1), 0xf4d698, .95);
              interaction.strokeRoundedRect(target.point.x+b.x-5, target.point.y+b.y-5, b.width+10, b.height+10, 6);
            }
          }
          const construction = v3 ? [] : drawConstruction(interaction, view, resource => positions[resources.indexOf(resource)], width);
          if (diagnosticsEnabled) {
            host.dataset.constructionSites = JSON.stringify(construction);
            host.dataset.worldTargets = JSON.stringify(targets.map(t => ({ id:t.id, kind:t.kind, build:t.build, ...(playerCamera ? playerCamera.fitToScreen(t.point) : t.point) })));
          }
        }
        this.lighting.update(resources, positions, visualState, width, !!view.playerMode);
        if (diagnosticsEnabled) host.dataset.facilityLights = JSON.stringify(this.lighting.diagnostics());
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
          const point = positions[i];
          const badgeTop = point.y + resourceArtBounds(resource.kind, view.playerMode ? playerBuildingScale(resource.kind, width) : 1, view.playerMode).y;
          const p = playerCamera ? playerCamera.fitToScreen({ x: point.x, y: badgeTop }) : { x: point.x, y: badgeTop };
          const badgeY = p.y - 36;
          badge.hidden = p.x < 16 || p.x > screenWidth - 16 || badgeY < 0 || badgeY > screenHeight - 32;
          badge.style.left = `${p.x - 16}px`; badge.style.top = `${badgeY}px`;
        });
        let g = this.graphics;
        if (this.backgroundSize !== `${width}:${height}`) {
          if (v3 && view.playerMode && this.hallBackground) {
            this.environment.clear();
            this.hallBackground.setVisible(true);
            if (this.hallForeground) this.hallForeground.setVisible(true);
          } else {
            if (this.hallBackground) this.hallBackground.setVisible(false);
            if (this.hallForeground) this.hallForeground.setVisible(false);
            const environment = drawEnvironment(this.environment.clear(), width, height, view.playerMode);
            if (diagnosticsEnabled) host.dataset.environment = JSON.stringify(environment);
          }
          this.backgroundSize = `${width}:${height}`;
        }
        const lanes = processingLanes(architecture, requests ?? null);
        const signature = JSON.stringify([width, height, architecture, camera, view.selected, view.connectionSource, view.preview, view.building, appU, sqlU, requests?.cache.utilization, view.state.runtime.scaleDue, view.state.runtime.preparationScaleDue, lanes, view.playerMode ? facilityStateKey(visualState) : null]);
        if (signature !== this.structureSignature) {
        this.structureSignature = signature; g.clear(); this.stateGraphics.clear();
        if (diagnosticsEnabled) host.dataset.renderedSelection = view.selected ?? '';
        if (diagnosticsEnabled) host.dataset.structureDraws = String(++this.structureDraws);
        this.sprites.retain(resources.map(r => r.id));
        for (const connection of lanes) {
          const a = positions[resources.findIndex(r => r.id === connection.from)];
          const b = positions[resources.findIndex(r => r.id === connection.to)];
          if (!a || !b) continue;
          drawProcessingLane(g, a, b, connection);
        }
        if (diagnosticsEnabled) host.dataset.lanes = JSON.stringify(lanes);
        this.captions.forEach(c => c.setVisible(false));
        const targets = view.connecting && view.connectionSource ? validTargets(architecture, view.connectionSource) : [];
        const buildingStates: { id: string; silhouette: string; completedModules: number; pendingModule: boolean; provisioning: boolean }[] = [];
        const renderedBanks: ({ id: string } & ReturnType<typeof drawFacilityBanks>)[] = [];
        const sorted = resources.map((resource, i) => ({ resource, i, p: positions[i] })).sort((a, b) => a.p.y - b.p.y);
        sorted.forEach(({ p, i, resource }, rank) => {
          const u = resource.kind === 'compute' ? appU : resource.kind === 'database' ? sqlU : resource.kind === 'cache' ? requests?.cache.utilization ?? null : null;
          const connected = architecture.connections.some(c => c.from === resource.id || c.to === resource.id);
          const state = resource.remaining > 0 ? `PROVISIONING ${resource.remaining}s` : !connected ? 'DISCONNECTED' : utilizationLabel(u);
          const pending = resource.kind === 'compute' && (view.state.runtime.scaleDue !== null || view.state.runtime.preparationScaleDue !== null);
          const artScale = view.playerMode ? playerBuildingScale(resource.kind, width) : 1;
          const hero = !!v3 && !!view.playerMode;
          const spriteBody = hero || this.sprites.update(resource, p, pending, rank, view.playerMode && resource.kind === 'compute' ? visualState.app.bays : undefined, artScale);
          const building = hero ? buildingPresentation(resource,connected,view.selected===resource.id,pending) : drawBuilding(g, p, resource, connected, view.selected === resource.id,
            pending, state === 'WARNING', state === '! OVERLOADED', spriteBody, this.stateGraphics, artScale);
          if (!hero && view.playerMode && resource.remaining === 0 && (resource.kind === 'compute' || resource.kind === 'database')) {
            const color = state === '! OVERLOADED' ? 0xff685d : state === 'WARNING' ? 0xffb64f : 0x67dded;
            this.stateGraphics.lineStyle(state === '! OVERLOADED' ? 4 : 2, color, .75);
            this.stateGraphics.strokeEllipse(p.x, p.y + 12, 116 * artScale, 40 * artScale);
            if (resource.kind === 'database') {
              this.stateGraphics.fillStyle(color, .12); this.stateGraphics.fillEllipse(p.x, p.y - 45 * artScale, 72 * artScale, 90 * artScale);
              for (const [side, pressure] of [[-1, visualState.sql.readPressure], [1, visualState.sql.writePressure]] as const) {
                const warning = pressure === 'overcapacity' || pressure === 'warning';
                this.stateGraphics.fillStyle(pressure === 'overcapacity' ? 0xff685d : warning ? 0xffb64f : 0x67dded);
                this.stateGraphics.fillRect(p.x + side * 35 * artScale, p.y - 82 * artScale, 6, warning ? 20 : 7);
              }
            }
          }
          buildingStates.push({ id: resource.id, ...building });
          if (view.playerMode && !hero) renderedBanks.push({ id: resource.id, ...drawFacilityBanks(this.stateGraphics, resource.kind, p, artScale, visualState) });
          if (targets.includes(resource.id)) { this.stateGraphics.lineStyle(2, 0xefc27b); this.stateGraphics.strokeCircle(p.x, p.y, 48); }
          const name = width < 600 ? { internet: 'Internet', compute: 'App', database: 'SQL', cache: 'Cache', edge: 'WAF' }[resource.kind] : definitions[resource.kind].name;
          this.captions[i].setFontSize(width < 600 ? 11 : 13).setWordWrapWidth(width < 600 ? 82 : 260, true)
            .setVisible(!view.playerMode).setPosition(Math.max(58, Math.min(width - 58, p.x)), p.y + 48)
            .setText(width < 600
              ? `${state === '! OVERLOADED' ? '! ' : resource.remaining > 0 ? '◷ ' : ''}${name}${resource.kind === 'compute' ? ` ×${resource.instances}` : ''}`
              : `${name}${resource.kind === 'compute' ? ` ×${resource.instances}` : ''}\n${resource.kind === 'internet' ? 'TRAFFIC' : `${state}${u === null ? '' : ` · ${(u * 100).toFixed(1)}%`}`}`);
        });
        if (width < 600 && !view.playerMode) {
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
          host.dataset.facilityBanks = JSON.stringify(renderedBanks);
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
        if (view.playerMode && !v3) {
          const activity = resourceActivity(view);
          const pose = drawResourceActivity(fx, activity, resources, positions, animationTime, effectMotion(view, reducedMotion), width);
          if (diagnosticsEnabled) host.dataset.resourceActivity = JSON.stringify({ items: activity, pose });
        }
        for (const queue of queues) {
          const target = resources.findIndex(r => r.kind === queue.resource);
          const sourceKind = queue.resource === 'compute' ? requests?.edge.active ? 'edge' : 'internet'
            : queue.signal === 'sql-read' && requests?.cache.active ? 'cache' : 'compute';
          const source = resources.findIndex(r => r.kind === sourceKind);
          if (target < 0 || source < 0) continue;
          const markers = pressurePositions(positions[source], positions[target], queue.count);
          const color = queue.severity === 'critical' ? 0xff846f : queue.severity === 'warning' ? 0xffc35f : 0xafd8e8;
          if (view.playerMode && queue.count > 0) {
            const p = positions[target];
            fx.lineStyle(queue.severity === 'critical' ? 5 : 2, color, .65);
            fx.strokeEllipse(p.x, p.y + 6, queue.resource === 'database' ? 160 : 145, 62);
          }
          markers.forEach((point, i) => {
            const pulse = effectMotion(view, reducedMotion) ? Math.sin(time / 350 + i) * .8 : 0;
            fx.fillStyle(0x173647, .7); fx.fillEllipse(point.x + 2, point.y + 5, 11, 5);
            fx.fillStyle(color, .18); fx.fillCircle(point.x, point.y, 10);
            fx.fillStyle(color, .95); fx.fillRoundedRect(point.x - 5, point.y - 5 + pulse, 10, 10, 1);
            fx.lineStyle(1, 0xeff7f4, .8); fx.strokeRect(point.x - 5, point.y - 5 + pulse, 10, 10);
          });
        }
        for (const loss of pressureLosses(requests ?? null)) {
          const from = positions[resources.findIndex(r => r.kind === loss.from)];
          const to = positions[resources.findIndex(r => r.kind === loss.to)];
          if (!from || !to) continue;
          const points = pressurePositions(from, to, loss.count);
          fx.lineStyle(2, loss.stage === 'sql-write' ? 0xf0c77e : 0xff8e83);
          for (const point of points) {
            const y = point.y + (loss.stage === 'sql-write' ? 24 : 15);
            fx.lineBetween(point.x - 3, y - 3, point.x + 3, y + 3);
            fx.lineBetween(point.x - 3, y + 3, point.x + 3, y - 3);
          }
        }
        for (const effect of effects) {
          const index = resources.findIndex(r => r.kind === effect.resource);
          if (index >= 0 && !v3) drawEffect(fx, effect, positions[index], time, effectMotion(view, reducedMotion));
        }
        for (const [kind, until] of completions) {
          if (animationTime >= until) { completions.delete(kind); continue; }
          const p = positions[resources.findIndex(r => r.kind === kind)];
          if (p) {
            if (undrawnCompletions.delete(kind)) drawnCompletions++;
            const progress = reducedMotion ? .5 : 1 - (until - animationTime) / 1400;
            if(v3){
              const resource=resources.find(r=>r.kind===kind)!;
              const scale=playerBuildingScale(resource.kind);
              const bay=kind==='compute'?facilityBays[Math.max(0,resource.instances-1)]:{x:0,y:0};
              const x=p.x+bay.x*scale,y=p.y+bay.y*scale;
              fx.lineStyle(3,0xc8ffed,(1-progress)*.8);fx.strokeEllipse(x,y+14,100*scale*(.7+progress*.4),40*scale*(.7+progress*.4));
              for(let i=0;i<4;i++){
                const dx=(i-1.5)*14*scale;
                fx.lineStyle(2,0xc8ffed,(1-progress)*.65);fx.lineBetween(x+dx,y-progress*65*scale,x+dx,y-progress*65*scale-8);
              }
            }else{fx.lineStyle(3, 0xd6ffe5, 1 - progress); fx.strokeEllipse(p.x, p.y + 8, 80 + progress * 60, 28 + progress * 22);}
          }
        }
        if (diagnosticsEnabled) {
          host.dataset.completions = JSON.stringify([...completions.keys()]);
          host.dataset.drawnCompletions = String(drawnCompletions);
        }
        const frame = this.frameGraphics.clear();
        if (view.state.runtime.status === 'FAILED' || view.state.runtime.status === 'COMPLETED') {
          frame.lineStyle(4, view.state.runtime.status === 'FAILED' ? 0xffa49b : 0x90e9c4, .8);
          frame.strokeRoundedRect(4, 4, Math.max(1, screenWidth - 8), Math.max(1, screenHeight - 8), 12);
        } else if (view.snapshot?.critical) {
          frame.lineStyle(3, 0xffac82, effectMotion(view, reducedMotion) ? .4 + .2 * Math.sin(time / 400) : .6);
          frame.strokeRect(2, 2, Math.max(1, screenWidth - 4), Math.max(1, screenHeight - 4));
        }
        if (diagnosticsEnabled) host.dataset.effects = JSON.stringify(effects);
        let packetCount = 0;
        this.packets.begin();
        if (view.playerMode && !v3) {
          const intake = positions[resources.findIndex(r => r.kind === 'internet')];
          if (intake) drawIntake(fx, intake, visualState.internet);
        }
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
              const point = lanePoint(a, b, progress);
              const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
              const offset = (lane % 3 - 1) * 4;
              const x = point.x - (b.y - a.y) / length * offset; const y = point.y + (b.x - a.x) / length * offset;
              g.lineStyle(flow.kind === 'order' ? 4 : 3, packetPalette[flow.kind], v3 ? .4 : .22);
              const trail=v3?30:17;
              g.lineBetween(x - (b.x - a.x) / length * trail, y - (b.y - a.y) / length * trail, x, y);
              this.packets.draw({ x, y }, flow, p);
            }
          });
          if (diagnosticsEnabled) host.dataset.flows = JSON.stringify(flows);
        } else if (diagnosticsEnabled) host.dataset.flows = '[]';
        this.packets.end();
        if (diagnosticsEnabled) {
          host.dataset.packetPool = JSON.stringify(this.packets.diagnostics());
          host.dataset.frames = String(++frames); host.dataset.packets = String(packetCount);
          host.dataset.appState = utilizationLabel(appU); host.dataset.sqlState = utilizationLabel(sqlU);
          host.dataset.tick = String(view.state.runtime.time);
          host.dataset.nodes = JSON.stringify(resources.map((r, i) => ({ id: r.id, ...(playerCamera ? playerCamera.fitToScreen(positions[i]) : positions[i]) })));
          if (playerCamera) {
            host.dataset.playerCamera = JSON.stringify(playerCamera.state);
            host.dataset.worldNodes = JSON.stringify(resources.map((r,i)=>({id:r.id,...positions[i]})));
          }
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
      backgroundColor: '#081922', banner: false, scene: World, input: { keyboard: false, mouse: false, touch: false } });
    const canvas = game.canvas; canvas.style.touchAction = 'none';
    const contextLost = (event: Event) => { event.preventDefault(); host.dataset.renderer = 'error'; controller.presentationFailed('Graphics context lost'); };
    canvas.addEventListener('webglcontextlost', contextLost);
    removeContextHandler = () => canvas.removeEventListener('webglcontextlost', contextLost);
    const point = (e: PointerEvent): Point => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const camera = () => viewportCamera(view.camera, canvas.clientWidth, canvas.clientHeight);
    const logical = (p: Point) => unproject(p, camera(), canvas.clientWidth, canvas.clientHeight);
    const hitResource = (screen: Point) => {
      const p = view.playerMode && navigation ? navigation.getSnapshot().screenToFit(screen) : screen;
      return view.state.runtime.architecture.resources
        .map(r => ({ resource: r, center: view.playerMode ? tycoonPoint(r.kind) : project(r, camera(), canvas.clientWidth, canvas.clientHeight) }))
        .filter(item => {
          const bounds = resourceArtBounds(item.resource.kind, view.playerMode ? playerBuildingScale(item.resource.kind, canvas.clientWidth) : 1, view.playerMode);
          return insideBuilding(p, item.center) || (p.x >= item.center.x + bounds.x && p.x <= item.center.x + bounds.x + bounds.width
            && p.y >= item.center.y + bounds.y && p.y <= item.center.y + bounds.y + bounds.height);
        })
        .sort((a, b) => Math.hypot(p.x - a.center.x, p.y - a.center.y) - Math.hypot(p.x - b.center.x, p.y - b.center.y) || b.resource.y - a.resource.y)[0]?.resource;
    };
    let drag: { pointer: number; id: string | null; last: Point; offset: Point } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      const p = point(e);
      if (view.building) { controller.place(logical(p)); return; }
      const resource = hitResource(p);
      if (view.connecting) { if (resource) controller.connectNode(resource.id); return; }
      controller.select(resource?.id ?? null);
      if (resource) onInspect();
      if (view.playerMode) return;
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
    const wheel = (e: WheelEvent) => { if (view.playerMode) return; e.preventDefault(); controller.setCamera({ ...view.camera, zoom: view.camera.zoom * Math.exp(-e.deltaY * .001) }); };
    if (view.playerMode && navigation) {
      const targetAt = (p: Point) => hitWorldTarget(worldTargets(view, playerMap.width, playerMap.height), navigation.getSnapshot().screenToWorld(p), navigation.getSnapshot().effectiveZoom);
      const stopNavigation = attachPlayerNavigation(canvas, navigation, p => {
        const target = targetAt(p);
        if (target?.build && onWorldBuild) { onWorldBuild(target); return; }
        controller.select(target?.id ?? null); if (target) onInspect();
      });
      const hover = (event: PointerEvent) => { hovered = event.buttons ? null : targetAt(point(event)); canvas.style.cursor = event.buttons ? 'grabbing' : hovered ? 'pointer' : 'grab'; };
      const leave = () => { hovered = null; canvas.style.cursor = 'grab'; };
      canvas.addEventListener('pointermove', hover); canvas.addEventListener('pointerleave', leave);
      removeInput = () => { stopNavigation(); canvas.removeEventListener('pointermove', hover); canvas.removeEventListener('pointerleave', leave); };
    } else {
      canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('wheel', wheel, { passive: false });
      removeInput = () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('wheel', wheel); };
    }
    resize = new ResizeObserver(() => { if (host.clientWidth > 0 && host.clientHeight > 0) game?.scale.resize(host.clientWidth, host.clientHeight); });
    intersection = new IntersectionObserver(entries => {
      const entry = entries[entries.length - 1];
      renderVisible = entry.isIntersecting && entry.intersectionRatio > 0;
    }, { threshold: 0 });
    intersection.observe(host);
    resize.observe(host); return destroy;
  } catch (error) { destroy(); throw error; }
}

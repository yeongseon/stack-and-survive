import type { World } from './model';
import { attachInput, packets } from './model';

export type RenderStats = { frames: number; fps: number; packets: number };
export type Renderer = { destroy(): void };
type Report = (stats: RenderStats) => void;

function meter(report: Report) {
  let frames = 0; let windowFrames = 0; let start = performance.now();
  return (packetCount: number) => {
    frames++; windowFrames++;
    const now = performance.now();
    if (now - start >= 250) {
      report({ frames, fps: windowFrames * 1000 / (now - start), packets: packetCount });
      start = now; windowFrames = 0;
    }
  };
}

export async function mountPhaser(host: HTMLDivElement, world: World, report: Report, changed: () => void): Promise<Renderer> {
  const { default: Phaser } = await import('phaser');
  if (!host.isConnected) return { destroy() {} };
  const tick = meter(report);
  let removeInput = () => {};
  class Scene extends Phaser.Scene {
    graphics!: Phaser.GameObjects.Graphics;
    create() { this.graphics = this.add.graphics(); }
    update(time: number) {
      const camera = this.cameras.main;
      camera.setZoom(world.camera.zoom);
      camera.centerOn(-world.camera.x, -world.camera.y);
      const g = this.graphics.clear();
      g.lineStyle(1, 0x203345, 0.6);
      for (let x = -900; x <= 900; x += 60) g.lineBetween(x, -600, x, 600);
      for (let y = -600; y <= 600; y += 60) g.lineBetween(-900, y, 900, y);
      for (const [from, to] of world.links) {
        const a = world.buildings.find(n => n.id === from)!;
        const b = world.buildings.find(n => n.id === to)!;
        g.lineStyle(3, 0x648c9e); g.lineBetween(a.x, a.y, b.x, b.y);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const x = a.x + (b.x - a.x) * .72; const y = a.y + (b.y - a.y) * .72;
        g.lineBetween(x, y, x - 13 * Math.cos(angle - .5), y - 13 * Math.sin(angle - .5));
        g.lineBetween(x, y, x - 13 * Math.cos(angle + .5), y - 13 * Math.sin(angle + .5));
      }
      for (const n of world.buildings) {
        const color = n.id === 'sql' && world.overloaded ? 0xf17469 : n.color;
        g.fillStyle(color, .3); g.fillRect(n.x - 35, n.y - 22, 70, 60);
        g.lineStyle(world.selected === n.id ? 4 : 2, world.selected === n.id ? 0xffffff : color);
        g.strokeRect(n.x - 35, n.y - 22, 70, 60);
        g.fillStyle(color, .9);
        g.fillTriangle(n.x - 35, n.y - 22, n.x, n.y - 43, n.x + 35, n.y - 22);
        if (n.id === 'sql' && world.overloaded) {
          g.fillStyle(0xffffff); g.fillRect(n.x - 3, n.y - 15, 6, 20); g.fillCircle(n.x, n.y + 13, 3);
        }
      }
      const ps = packets(world, time / 1000);
      ps.forEach((p, i) => { g.fillStyle(i % 3 === 0 ? 0xeab970 : 0x9adbd0); g.fillCircle(p.x, p.y, 2.8); });
      tick(ps.length);
    }
  }
  const game = new Phaser.Game({
    type: Phaser.WEBGL, parent: host, width: host.clientWidth, height: host.clientHeight,
    backgroundColor: '#0d1925', banner: false, scene: Scene,
    input: { mouse: false, touch: false, keyboard: false },
    render: { antialias: true },
  });
  let resize: ResizeObserver | undefined;
  const destroy = () => { resize?.disconnect(); removeInput(); game.destroy(true); };
  try {
    removeInput = attachInput(game.canvas, world, changed);
    resize = new ResizeObserver(() => { game.scale.resize(host.clientWidth, host.clientHeight); changed(); });
    resize.observe(host);
    return { destroy };
  } catch (error) { destroy(); throw error; }
}

export async function mountPlayCanvas(host: HTMLDivElement, world: World, report: Report, changed: () => void): Promise<Renderer> {
  const pc = await import('playcanvas');
  if (!host.isConnected) return { destroy() {} };
  const canvas = document.createElement('canvas'); host.append(canvas);
  let app: InstanceType<typeof pc.Application>;
  try { app = new pc.Application(canvas, { graphicsDeviceOptions: { antialias: true, alpha: false } }); }
  catch (error) { canvas.remove(); throw error; }
  const materials: InstanceType<typeof pc.StandardMaterial>[] = [];
  let resize: ResizeObserver | undefined;
  let removeInput = () => {};
  const destroy = () => {
    resize?.disconnect(); removeInput(); app.destroy(); materials.forEach(m => { m.destroy(); }); canvas.remove();
  };
  try {
  app.graphicsDevice.maxPixelRatio = 1;
  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  const camera = new pc.Entity('camera');
  camera.addComponent('camera', { projection: pc.PROJECTION_ORTHOGRAPHIC, orthoHeight: host.clientHeight / 2,
    clearColor: new pc.Color(13 / 255, 25 / 255, 37 / 255), nearClip: 1, farClip: 2000 });
  camera.setPosition(0, 0, 1000); app.root.addChild(camera);
  const material = (hex: number) => {
    const m = new pc.StandardMaterial();
    m.useLighting = false; m.diffuse.set(0, 0, 0);
    m.emissive.set(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
    m.update(); materials.push(m); return m;
  };
  const normal = world.buildings.map(n => material(n.color));
  const red = material(0xf17469); const white = material(0xffffff);
  const packetMaterials = [material(0xeab970), material(0x9adbd0)];
  const makeBox = (name: string, mat: InstanceType<typeof pc.StandardMaterial>) => {
    const entity = new pc.Entity(name); entity.addComponent('render', { type: 'box', material: mat });
    app.root.addChild(entity); return entity;
  };
  const buildings = world.buildings.map((n, i) => makeBox(n.id, normal[i]));
  const selection = makeBox('selection', white);
  const ps = Array.from({ length: 120 }, (_, i) => makeBox(`packet-${i}`, packetMaterials[i % 3 === 0 ? 0 : 1]));
  const lineColor = new pc.Color(.39, .55, .62); const gridColor = new pc.Color(.12, .2, .27);
  const line = (x1: number, y1: number, x2: number, y2: number, grid = false) =>
    app.drawLine(new pc.Vec3(x1, -y1, -10), new pc.Vec3(x2, -y2, -10), grid ? gridColor : lineColor);
  const tick = meter(report); let seconds = 0;
  app.on('update', (dt: number) => {
    seconds += dt;
    camera.setPosition(-world.camera.x, world.camera.y, 1000);
    if (camera.camera) camera.camera.orthoHeight = host.clientHeight / (2 * world.camera.zoom);
    for (let x = -900; x <= 900; x += 60) line(x, -600, x, 600, true);
    for (let y = -600; y <= 600; y += 60) line(-900, y, 900, y, true);
    world.links.forEach(([from, to]) => {
      const a = world.buildings.find(n => n.id === from)!; const b = world.buildings.find(n => n.id === to)!;
      line(a.x, a.y, b.x, b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const x = a.x + (b.x - a.x) * .72; const y = a.y + (b.y - a.y) * .72;
      line(x, y, x - 13 * Math.cos(angle - .5), y - 13 * Math.sin(angle - .5));
      line(x, y, x - 13 * Math.cos(angle + .5), y - 13 * Math.sin(angle + .5));
    });
    world.buildings.forEach((n, i) => {
      const e = buildings[i]; e.setPosition(n.x, -n.y, 0); e.setLocalScale(58, 58, 30); e.setEulerAngles(20, 25, 0);
      if (e.render) e.render.material = n.id === 'sql' && world.overloaded ? red : normal[i];
    });
    const selected = world.buildings.find(n => n.id === world.selected);
    selection.enabled = !!selected;
    if (selected) { selection.setPosition(selected.x, -selected.y - 46, 0); selection.setLocalScale(70, 3, 3); }
    const positions = packets(world, seconds);
    ps.forEach((p, i) => { p.enabled = i < positions.length; if (positions[i]) {
      p.setPosition(positions[i].x, -positions[i].y, 65); p.setLocalScale(5.6, 5.6, 3);
    } });
    tick(positions.length);
  });
  resize = new ResizeObserver(() => {
    if (host.isConnected && host.clientWidth > 0 && host.clientHeight > 0) { app.resizeCanvas(host.clientWidth, host.clientHeight); changed(); }
  });
  resize.observe(host); app.resizeCanvas(host.clientWidth, host.clientHeight);
  removeInput = attachInput(canvas, world, changed); app.start();
  return { destroy };
  } catch (error) { destroy(); throw error; }
}

export type NodeId = 'internet' | 'app' | 'sql';
export type Point = { x: number; y: number };
export type Building = Point & { id: NodeId; label: string; color: number };
export type Link = [NodeId, NodeId];
export type Camera = Point & { zoom: number };
export type World = {
  buildings: Building[];
  links: Link[];
  camera: Camera;
  selected: NodeId | null;
  connectionMode: boolean;
  connectionSource: NodeId | null;
  overloaded: boolean;
  message: string;
};

export const PACKET_COUNT = 120;
export function createWorld(): World {
  return {
    buildings: [
      { id: 'internet', label: 'INTERNET', x: -220, y: -115, color: 0x73bdd9 },
      { id: 'app', label: 'APP SERVICE', x: 0, y: 0, color: 0x8ee2ae },
      { id: 'sql', label: 'AZURE SQL', x: 220, y: 115, color: 0xeab970 },
    ],
    links: [['internet', 'app'], ['app', 'sql']],
    camera: { x: 0, y: 0, zoom: 1 }, selected: null,
    connectionMode: false, connectionSource: null, overloaded: false,
    message: 'Synthetic fixture ready. No simulation is running.',
  };
}

export function project(p: Point, camera: Camera, width: number, height: number): Point {
  return { x: width / 2 + (p.x + camera.x) * camera.zoom,
    y: height / 2 + (p.y + camera.y) * camera.zoom };
}
export function unproject(p: Point, camera: Camera, width: number, height: number): Point {
  return { x: (p.x - width / 2) / camera.zoom - camera.x,
    y: (p.y - height / 2) / camera.zoom - camera.y };
}
export function addLink(world: World, from: NodeId, to: NodeId): boolean {
  if (!((from === 'internet' && to === 'app') || (from === 'app' && to === 'sql'))) {
    world.message = 'Invalid direction. Use Internet → App Service → SQL.';
    return false;
  }
  if (world.links.some(([a, b]) => a === from && b === to)) {
    world.message = 'This connection already exists.';
    return false;
  }
  world.links.push([from, to]);
  world.message = `Connected ${from} → ${to}.`;
  return true;
}
export function packets(world: World, seconds: number): Point[] {
  if (world.links.length === 0) return [];
  return Array.from({ length: PACKET_COUNT }, (_, i) => {
    const link = world.links[i % world.links.length];
    const a = world.buildings.find(n => n.id === link[0])!;
    const b = world.buildings.find(n => n.id === link[1])!;
    const progress = (seconds * 0.24 + i / PACKET_COUNT) % 1;
    return { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress };
  });
}

// Shared pointer adapter deliberately holds interaction behavior constant across engines.
export function attachInput(canvas: HTMLCanvasElement, world: World, changed: () => void): () => void {
  let active: { id: number; last: Point; building: Building | undefined } | undefined;
  const local = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || active) return;
    const p = local(event);
    const hit = world.buildings.find(n => {
      const s = project(n, world.camera, canvas.clientWidth, canvas.clientHeight);
      return Math.abs(s.x - p.x) < 42 * world.camera.zoom && Math.abs(s.y - p.y) < 42 * world.camera.zoom;
    });
    world.selected = hit?.id ?? null;
    changed();
    if (world.connectionMode) {
      if (!hit) return;
      if (world.connectionSource) {
        addLink(world, world.connectionSource, hit.id);
        world.connectionSource = null;
      } else {
        world.connectionSource = hit.id;
        world.message = `Source: ${hit.label}. Select a target.`;
      }
      changed();
      return;
    }
    active = { id: event.pointerId, last: p, building: hit };
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (!active || active.id !== event.pointerId) return;
    const p = local(event);
    const dx = (p.x - active.last.x) / world.camera.zoom;
    const dy = (p.y - active.last.y) / world.camera.zoom;
    const target = active.building ?? world.camera;
    target.x += dx; target.y += dy;
    active.last = p;
    changed();
  };
  const up = (event: PointerEvent) => {
    if (active?.id !== event.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    active = undefined;
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    world.camera.zoom = Math.min(1.8, Math.max(0.55, world.camera.zoom * Math.exp(-event.deltaY * 0.001)));
    changed();
  };
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('wheel', wheel, { passive: false });
  return () => {
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
    canvas.removeEventListener('lostpointercapture', up); canvas.removeEventListener('wheel', wheel);
  };
}

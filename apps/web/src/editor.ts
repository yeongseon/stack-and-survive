import type { Architecture, Kind } from '@stack-and-survive/schema';
import { allowsConnection, definitions, parseArchitecture } from '@stack-and-survive/cloud-domain';

export type Point = { x: number; y: number };
export type Camera = Point & { zoom: number };
export function viewportCamera(camera: Camera, width: number, height: number): Camera {
  const fit = width >= 640 ? Math.min(1, Math.max(.1, (height - 260) / 300))
    : Math.min(1, Math.max(0.1, (width - 120) / 520), Math.max(0.1, (height - 140) / 400));
  return { ...camera, zoom: camera.zoom * fit };
}
export function positionError(architecture: Architecture, position: Point, movingId?: string): string | null {
  if (![position.x, position.y].every(Number.isFinite) || Math.abs(position.x) > 900 || Math.abs(position.y) > 600) return 'Place inside the build area (±900 × ±600).';
  if (architecture.resources.some(r => r.id !== movingId && Math.abs(r.x - position.x) < 90 && Math.abs(r.y - position.y) < 100)) return 'Resource footprints overlap.';
  return null;
}
export function snap(point: Point): Point { return { x: Math.round(point.x / 20) * 20, y: Math.round(point.y / 20) * 20 }; }
export function placeResource(architecture: Architecture, kind: Kind, position: Point): Architecture {
  if (kind === 'internet') throw new Error('Internet is the fixed traffic source.');
  if (architecture.resources.some(r => r.kind === kind)) throw new Error(`Only one ${definitions[kind].name} building is supported.`);
  const p = snap(position); const error = positionError(architecture, p); if (error) throw new Error(error);
  const a = parseArchitecture(architecture);
  a.resources.push({ id: kind, kind, ...p, instances: 1, remaining: definitions[kind].provisioning });
  return a;
}
export function moveResource(architecture: Architecture, id: string, position: Point): Architecture {
  const a = parseArchitecture(architecture); const resource = a.resources.find(r => r.id === id);
  if (!resource) throw new Error('Resource not found.');
  const p = snap(position); const error = positionError(a, p, id); if (error) throw new Error(error);
  resource.x = p.x; resource.y = p.y; return a;
}
export function removeResource(architecture: Architecture, id: string): Architecture {
  const a = parseArchitecture(architecture); const r = a.resources.find(n => n.id === id);
  if (!r || r.kind === 'internet') throw new Error('The Internet source cannot be removed.');
  a.resources = a.resources.filter(n => n.id !== id);
  a.connections = a.connections.filter(c => c.from !== id && c.to !== id);
  return a;
}
export function connectResources(architecture: Architecture, from: string, to: string): Architecture {
  if (architecture.connections.some(c => c.from === from && c.to === to)) throw new Error('This connection already exists.');
  const next = parseArchitecture(architecture);
  next.connections.push({ from, to });
  return parseArchitecture(next);
}
export function disconnectResources(architecture: Architecture, from: string, to: string): Architecture {
  const next = parseArchitecture(architecture);
  if (!next.connections.some(c => c.from === from && c.to === to)) throw new Error('Connection not found.');
  next.connections = next.connections.filter(c => c.from !== from || c.to !== to);
  return next;
}
export function validTargets(architecture: Architecture, from: string): string[] {
  const source = architecture.resources.find(r => r.id === from);
  if (!source) return [];
  return architecture.resources.filter(resource => allowsConnection(source.kind, resource.kind)
    && !architecture.connections.some(c => c.from === from && c.to === resource.id)).map(r => r.id);
}
export function project(point: Point, camera: Camera, width: number, height: number): Point {
  return { x: width / 2 + (point.x + camera.x) * camera.zoom, y: height / 2 + (point.y + camera.y) * camera.zoom };
}
export function unproject(point: Point, camera: Camera, width: number, height: number): Point {
  return { x: (point.x - width / 2) / camera.zoom - camera.x, y: (point.y - height / 2) / camera.zoom - camera.y };
}

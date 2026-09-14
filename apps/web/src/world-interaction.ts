import type { Kind } from '@stack-and-survive/schema';
import type { View } from './controller';
import type { Point } from './editor';
import { tycoonPoint } from './tycoon-layout';
import { facilityBays } from './facility-bays';
import { playerBuildingScale, resourceArtBounds } from './building-assets';

export type WorldTarget = { id: string; kind: Kind; point: Point; bounds: { x: number; y: number; width: number; height: number }; build: boolean };
export function worldTargets(view: View, width: number, height: number): WorldTarget[] {
  const targets: WorldTarget[] = [];
  for (const kind of ['internet', 'edge', 'compute', 'cache', 'database'] as const) {
    const point = tycoonPoint(kind, width, height);
    const resource = view.state.runtime.architecture.resources.find(r => r.kind === kind);
    const scale = playerBuildingScale(kind, width);
    targets.push({ id: resource?.id ?? kind, kind, point, build: !resource,
      bounds: resource ? resourceArtBounds(kind, scale, true) : { x: -48, y: -28, width: 96, height: 56 } });
    if (kind === 'compute' && resource && resource.instances < 4 && view.state.runtime.scaleDue === null) {
      const bay = facilityBays[resource.instances];
      targets.unshift({ id: 'app-bay', kind, build: true, point: { x: point.x + bay.x * scale, y: point.y + bay.y * scale }, bounds: { x: -28 * scale, y: -14 * scale, width: 56 * scale, height: 28 * scale } });
    }
  }
  return targets;
}
export function hitWorldTarget(targets: WorldTarget[], point: Point, zoom: number): WorldTarget | null {
  const padding = 8 / zoom;
  return targets.find(target => {
    const b = target.bounds, halfWidth = Math.max(22 / zoom, b.width / 2 + padding), halfHeight = Math.max(22 / zoom, b.height / 2 + padding);
    const center = { x: target.point.x + b.x + b.width / 2, y: target.point.y + b.y + b.height / 2 };
    return Math.abs(point.x - center.x) <= halfWidth && Math.abs(point.y - center.y) <= halfHeight;
  }) ?? null;
}

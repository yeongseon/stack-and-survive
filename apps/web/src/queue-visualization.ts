import type { RequestSnapshot } from '@stack-and-survive/simulation';
import { compare } from '@stack-and-survive/simulation/economy';
import type { Point } from './editor';
import type { Kind } from '@stack-and-survive/schema';

export type QueueSeverity = 'none' | 'busy' | 'warning' | 'critical';
export type VisualQueue = {
  resource: 'compute' | 'database'; count: number; severity: QueueSeverity;
  utilization: number | null; droppedPerSecond: number | null;
  signal: 'none' | 'app' | 'sql-read' | 'sql-write';
  failureMarkers: number;
};
export function visualQueue(resource: VisualQueue['resource'], utilization: number | null, droppedPerSecond: number | null, demand: number): VisualQueue {
  const valid = utilization !== null && droppedPerSecond !== null && [utilization, droppedPerSecond, demand].every(Number.isFinite)
    && utilization >= 0 && droppedPerSecond >= 0 && demand >= 0;
  if (!valid) return { resource, count: 0, severity: 'none', utilization: null, droppedPerSecond: null, signal: 'none', failureMarkers: 0 };
  let count = 0; let severity: QueueSeverity = 'none';
  if (demand > 0 && compare(utilization, .7) >= 0) {
    if (compare(utilization, .9) < 0) { count = 1 + Math.floor(Math.min(1, (utilization - .7) / .1)); severity = 'busy'; }
    else if (compare(utilization, 1) <= 0) { count = 3 + Math.floor(Math.min(1, (utilization - .9) / .1)); severity = 'warning'; }
    else if (compare(utilization, 1.2) <= 0) { count = 5 + Math.floor(Math.min(3, (utilization - 1) / .2 * 3)); severity = 'critical'; }
    else { count = Math.min(12, 9 + Math.floor((utilization - 1.2) * 10)); severity = 'critical'; }
  }
  return { resource, count: Math.max(0, Math.min(12, count)), severity, utilization, droppedPerSecond, signal: resource === 'compute' ? 'app' : 'none',
    failureMarkers: demand > 0 && droppedPerSecond > 0 ? Math.min(3, Math.ceil(droppedPerSecond / 20)) : 0 };
}
export function pressureQueues(snapshot: RequestSnapshot | null): VisualQueue[] {
  if (!snapshot) return [visualQueue('compute', null, null, 0), visualQueue('database', null, null, 0)];
  const app = visualQueue('compute', snapshot.app.utilization,
    snapshot.app.dropped.browse + snapshot.app.dropped.order + snapshot.app.dropped.bot, snapshot.app.incoming);
  const sql = visualQueue('database', Math.max(snapshot.sql.readUtilization, snapshot.sql.writeUtilization),
    snapshot.sql.readsDropped + snapshot.sql.writesDropped, snapshot.sql.readDemand + snapshot.sql.writeDemand);
  sql.signal = sql.count === 0 ? 'none' : compare(snapshot.sql.readUtilization, snapshot.sql.writeUtilization) >= 0 ? 'sql-read' : 'sql-write';
  return [app, sql];
}
export type PressureLoss = { from: Kind; to: 'compute' | 'database'; stage: 'app' | 'sql-read' | 'sql-write'; droppedPerSecond: number; count: number };
export function pressureLosses(snapshot: RequestSnapshot | null): PressureLoss[] {
  if (!snapshot) return [];
  const losses: Omit<PressureLoss, 'count'>[] = [
    { from: snapshot.edge.active ? 'edge' : 'internet', to: 'compute', stage: 'app', droppedPerSecond: snapshot.app.dropped.browse + snapshot.app.dropped.order + snapshot.app.dropped.bot },
    { from: snapshot.cache.active ? 'cache' : 'compute', to: 'database', stage: 'sql-read', droppedPerSecond: snapshot.sql.readsDropped },
    { from: 'compute', to: 'database', stage: 'sql-write', droppedPerSecond: snapshot.sql.writesDropped },
  ];
  return losses.filter(loss => Number.isFinite(loss.droppedPerSecond) && loss.droppedPerSecond > 0)
    .map(loss => ({ ...loss, count: Math.min(3, Math.ceil(loss.droppedPerSecond / 20)) }));
}
export function pressurePositions(from: Point, to: Point, count: number): Point[] {
  if (![from.x, from.y, to.x, to.y, count].every(Number.isFinite) || count <= 0) return [];
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length < 1) return [];
  const dx = (to.x - from.x) / length; const dy = (to.y - from.y) / length;
  return Array.from({ length: Math.min(12, Math.floor(count)) }, (_, i) => {
    const back = Math.min(length * .8, 65 + Math.floor(i / 3) * 11);
    const side = ((i % 3) - 1) * 10;
    return { x: to.x - dx * back - dy * side, y: to.y - dy * back + dx * side };
  });
}

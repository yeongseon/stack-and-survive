import type Phaser from 'phaser';
import type { View } from './controller';
import type { Kind } from '@stack-and-survive/schema';
import type { Point } from './editor';
import { compare } from '@stack-and-survive/simulation/economy';

export type Effect = { resource: Kind; type: 'construction' | 'scaling' | 'overload' | 'cache-hit' | 'shield' | 'emergency'; strength: number };
export function activeEffects(view: View): Effect[] {
  const runtime = view.state.runtime;
  const live = runtime.status === 'RUNNING' && !view.error;
  const effects: Effect[] = [];
  for (const resource of runtime.architecture.resources) {
    if (resource.remaining > 0) effects.push({ resource: resource.kind, type: 'construction', strength: resource.remaining });
    if (resource.kind === 'compute' && (runtime.scaleDue !== null || runtime.preparationScaleDue !== null)) effects.push({ resource: 'compute', type: 'scaling', strength: 1 });
  }
  const requests = view.snapshot?.requests;
  if (!live || !requests) return effects;
  for (const [resource, utilization] of [['compute', requests.app.utilization], ['database', Math.max(requests.sql.readUtilization, requests.sql.writeUtilization)], ['cache', requests.cache.utilization ?? 0]] as const) {
    if (compare(utilization, 1) > 0) effects.push({ resource, type: 'overload', strength: utilization });
  }
  if (requests.cache.active && requests.cache.hits > 0) effects.push({ resource: 'cache', type: 'cache-hit', strength: requests.cache.hits });
  if (requests.edge.active && requests.edge.filtered.bot > 0) {
    const emergency = runtime.emergency !== null && view.snapshot!.time >= runtime.emergency.start && view.snapshot!.time < runtime.emergency.end;
    effects.push({ resource: 'edge', type: emergency ? 'emergency' : 'shield', strength: requests.edge.filtered.bot });
  }
  return effects;
}
export function completedResources(previous: View, current: View): Kind[] {
  if (previous.state.runtime.status === 'COMPLETED' || previous.state.runtime.status === 'FAILED') return [];
  return current.state.runtime.architecture.resources.filter(resource => {
    const before = previous.state.runtime.architecture.resources.find(r => r.id === resource.id);
    return before && ((before.remaining > 0 && resource.remaining === 0) || resource.instances > before.instances);
  }).map(r => r.kind);
}
export function effectMotion(view: View, reduced: boolean): boolean {
  return !reduced && !view.error && (view.state.runtime.status === 'RUNNING' || view.state.runtime.status === 'PREPARATION');
}
export function filterCheckpoint(time: number, animated: boolean, emergency: boolean) {
  const phase = animated ? (time / 1600) % 1 : .5;
  return { scanY: -58 + phase * 48, bars: emergency ? 5 : 3, color: emergency ? 0xffd882 : 0x90dcff };
}
export function drawEffect(g: Phaser.GameObjects.Graphics, effect: Effect, point: Point, time: number, animated: boolean) {
  const phase = animated ? (time / 1600) % 1 : .5;
  const pulse = animated ? .45 + .2 * Math.sin(time / 220) : .55;
  g.save(); g.translateCanvas(point.x, point.y);
  if (effect.type === 'construction' || effect.type === 'scaling') {
    g.lineStyle(2, 0x9fe5ff, .8); g.strokeEllipse(0, 12, 100, 38);
    g.lineStyle(3, 0xe1f8ff, .7); const angle = phase * Math.PI * 2;
    g.lineBetween(Math.cos(angle) * 49, 12 + Math.sin(angle) * 18, Math.cos(angle + .5) * 49, 12 + Math.sin(angle + .5) * 18);
    g.fillStyle(0x73d0ff, .12); g.fillRect(-30, -62 + phase * 60, 60, 5);
  } else if (effect.type === 'overload') {
    g.lineStyle(2, 0xffa496, pulse); g.strokeEllipse(0, 12, 106 + phase * 12, 38 + phase * 8);
    g.fillStyle(0xffd1ac, pulse); for (let i = 0; i < 3; i++) g.fillRect(40, -32 + i * 7, 8, 3);
  } else if (effect.type === 'cache-hit') {
    g.lineStyle(2, 0x8effdc, 1 - phase * .6); g.strokeEllipse(0, -7, 45 + phase * 40, 18 + phase * 15);
    g.lineStyle(2, 0xd9fff1); g.lineBetween(-6, -54, -1, -49); g.lineBetween(-1, -49, 8, -60);
  } else {
    const checkpoint = filterCheckpoint(time, animated, effect.type === 'emergency');
    g.lineStyle(2, checkpoint.color, .7);
    g.lineBetween(-28, -58, -28, -10); g.lineBetween(28, -58, 28, -10);
    g.fillStyle(checkpoint.color, pulse); g.fillRect(-26, checkpoint.scanY, 52, 3);
    for (let i = 0; i < checkpoint.bars; i++) g.fillRect(-22 + i * 10, 9, 6, 4);
  }
  g.restore();
}

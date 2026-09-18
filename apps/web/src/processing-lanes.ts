import type Phaser from 'phaser';
import type { Architecture } from '@stack-and-survive/schema';
import type { RequestSnapshot } from '@stack-and-survive/simulation';
import type { Point } from './editor';
import { visualFlows } from './traffic';

export type ProcessingLane = { from: string; to: string; volume: number; dropped: number; state: 'idle' | 'flowing' | 'busy' | 'dropping' };
export function processingLanes(architecture: Architecture, snapshot: RequestSnapshot | null): ProcessingLane[] {
  const flows = snapshot ? visualFlows(snapshot) : [];
  return architecture.connections.map(connection => {
    const from = architecture.resources.find(r => r.id === connection.from);
    const to = architecture.resources.find(r => r.id === connection.to);
    const matches = flows.filter(flow => flow.from === from?.kind && flow.to === to?.kind);
    const volume = matches.reduce((sum, flow) => sum + flow.volume, 0);
    const dropped = matches.filter(flow => flow.end === 'failed').reduce((sum, flow) => sum + flow.volume, 0);
    return { ...connection, volume, dropped, state: dropped > 0 ? 'dropping' : volume > 150 ? 'busy' : volume > 0 ? 'flowing' : 'idle' };
  });
}
export function lanePoint(from: Point, to: Point, progress: number): Point {
  const p = Math.max(0, Math.min(1, progress));
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p };
}
export function drawProcessingLane(g: Pick<Phaser.GameObjects.Graphics, 'lineStyle' | 'lineBetween'>, from: Point, to: Point, lane: ProcessingLane) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (!Number.isFinite(length) || length === 0) return;
  const normal = { x: -(to.y - from.y) / length, y: (to.x - from.x) / length };
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  g.lineStyle(31, 0x112636, .55); g.lineBetween(from.x + 3, from.y + 7, to.x + 3, to.y + 7);
  g.lineStyle(25, 0x314c61); g.lineBetween(from.x, from.y, to.x, to.y);
  g.lineStyle(19, 0x162f43); g.lineBetween(from.x, from.y, to.x, to.y);
  const color = lane.state === 'idle' ? 0x7693a3 : lane.state === 'dropping' ? 0xe0b37d : 0x76d8ff;
  for (const offset of [-10, 10]) {
    g.lineStyle(1, 0x91b8c9, .85); g.lineBetween(from.x + normal.x * offset, from.y + normal.y * offset, to.x + normal.x * offset, to.y + normal.y * offset);
  }
  g.lineStyle(10, color, lane.state === 'idle' ? .08 : .25); g.lineBetween(from.x, from.y, to.x, to.y);
  g.lineStyle(2, color, lane.state === 'idle' ? .3 : .9); g.lineBetween(from.x, from.y, to.x, to.y);
  const marks = Math.max(1, Math.min(30, Math.floor(length / 65)));
  for (let i = 1; i <= marks; i++) {
    const p = lanePoint(from, to, i / (marks + 1));
    g.lineStyle(2, color, .8);
    g.lineBetween(p.x, p.y, p.x - Math.cos(angle - .5) * 7, p.y - Math.sin(angle - .5) * 7);
    g.lineBetween(p.x, p.y, p.x - Math.cos(angle + .5) * 7, p.y - Math.sin(angle + .5) * 7);
    if (lane.state === 'dropping') {
      g.lineStyle(3, color, 1);
      g.lineBetween(p.x + normal.x * 6, p.y + normal.y * 6, p.x + normal.x * 13, p.y + normal.y * 13);
      g.lineBetween(p.x - normal.x * 6, p.y - normal.y * 6, p.x - normal.x * 13, p.y - normal.y * 13);
    }
  }
}

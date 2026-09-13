import type Phaser from 'phaser';
import type { Point } from './editor';
import type { VisualFlow } from './traffic';
import type { resourceVisualState } from './resource-visual-state';

export const packetPalette = { browse: 0x77dfff, order: 0xffcf68, bot: 0xff776e };
export function offeredMarkers(offered: number | null) {
  return offered === null || !Number.isFinite(offered) || offered <= 0 ? 0 : Math.min(12, Math.ceil(offered / 45));
}
export function packetEndpoint(flow: VisualFlow) {
  if (flow.end === 'filtered') return flow.to === 'edge' ? 'edge-filter' : 'intake-limit';
  if (flow.end === 'failed') return 'failure';
  return flow.end === 'success' && flow.to === 'cache' ? 'cache-hit' : 'packet';
}
export function drawPacket(g: Phaser.GameObjects.Graphics, point: Point, direction: Point, flow: VisualFlow, progress: number) {
  const { x, y } = point; const color = packetPalette[flow.kind];
  const failed = progress > .85 && (flow.end === 'failed' || flow.end === 'filtered');
  const hit = progress > .85 && flow.end === 'success' && flow.to === 'cache';
  const radius = flow.kind === 'order' ? 5 : 4;
  g.lineStyle(flow.kind === 'order' ? 4 : 3, color, .22);
  g.lineBetween(x - direction.x * 17, y - direction.y * 17, x, y);
  g.fillStyle(hit ? 0x80f3ce : color, .13); g.fillRoundedRect(x - radius - 4, y - radius - 4, radius * 2 + 8, radius * 2 + 8, 4);
  if (failed) {
    g.lineStyle(2, 0xff8c82); g.lineBetween(x - 5, y - 5, x + 5, y + 5); g.lineBetween(x - 5, y + 5, x + 5, y - 5);
    if (packetEndpoint(flow) === 'edge-filter') { g.lineStyle(1, color); g.strokeRect(x - 8, y - 8, 16, 16); }
    if (packetEndpoint(flow) === 'intake-limit') { g.lineStyle(3, 0xffcf68); g.lineBetween(x - 8, y + 9, x + 8, y + 9); }
  } else if (hit) {
    g.lineStyle(2, 0x80f3ce); g.strokeCircle(x, y, 9);
    g.lineBetween(x - 4, y, x - 1, y + 3); g.lineBetween(x - 1, y + 3, x + 5, y - 4);
  } else {
    g.fillStyle(color); g.fillRoundedRect(x - radius, y - radius, radius * 2, radius * 2, flow.kind === 'bot' ? 0 : 2);
    g.lineStyle(1, 0xe9ffff, .85); g.lineBetween(x - radius + 1, y - radius + 1, x + radius - 1, y - radius + 1);
    if (flow.kind === 'bot') {
      g.fillStyle(0x541f36); g.fillRect(x - 1, y - 4, 3, 3); g.fillRect(x - 4, y + 1, 3, 3);
    } else if (flow.kind === 'order') {
      g.lineStyle(1, 0x694b22); g.strokeRect(x - 2, y - 2, 4, 4);
    }
  }
}
export function drawIntake(g: Phaser.GameObjects.Graphics, point: Point, state: ReturnType<typeof resourceVisualState>['internet']) {
  const count = offeredMarkers(state.offered);
  for (let i = 0; i < count; i++) {
    g.fillStyle(0x77dfff, .55); g.fillRect(point.x - 28 + (i % 4) * 15, point.y - 75 - Math.floor(i / 4) * 9, 9, 4);
  }
  if (state.rateLimited) {
    g.lineStyle(4, 0xffc56d); g.lineBetween(point.x - 26, point.y + 25, point.x + 26, point.y + 25);
    for (const x of [-20, 0, 20]) { g.lineStyle(2, 0xffc56d); g.lineBetween(point.x + x, point.y + 18, point.x + x, point.y + 32); }
  }
}

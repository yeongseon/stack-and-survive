import type Phaser from 'phaser';
import type { Kind, Resource } from '@stack-and-survive/schema';
import type { Point } from './editor';
import type { View } from './controller';
import { facilityBays } from './facility-bays';
import { playerBuildingScale } from './building-assets';

export type ResourceActivity = { resource: Kind; type: 'server-work' | 'cache-work' | 'sql-read' | 'sql-write' | 'intake'; slot?: number };
export function resourceActivity(view: View): ResourceActivity[] {
  if (view.error || view.state.runtime.status !== 'RUNNING' || !view.snapshot) return [];
  const r = view.snapshot.requests;
  const active = (kind: Kind) => view.state.runtime.architecture.resources.find(resource => resource.kind === kind && resource.remaining === 0);
  const items: ResourceActivity[] = [];
  const app = active('compute');
  if (app && r.app.accepted.browse + r.app.accepted.order + r.app.accepted.bot > 0) {
    for (let slot = 0; slot < app.instances; slot++) items.push({ resource: 'compute', type: 'server-work', slot });
  }
  if (active('cache') && r.cache.active && r.cache.processed > 0) items.push({ resource: 'cache', type: 'cache-work' });
  if (active('database') && r.sql.readsAccepted > 0) items.push({ resource: 'database', type: 'sql-read' });
  if (active('database') && r.sql.writesAccepted > 0) items.push({ resource: 'database', type: 'sql-write' });
  if (r.offered.browse + r.offered.order + r.offered.bot > 0) items.push({ resource: 'internet', type: 'intake' });
  return items;
}

export function activityPose(time: number, moving: boolean) {
  const phase = moving ? (time % 3200) / 3200 : .25;
  return { phase, angle: phase * Math.PI * 2, alpha: moving ? .6 + Math.sin(phase * Math.PI * 2) * .18 : .72 };
}

export function drawResourceActivity(g: Phaser.GameObjects.Graphics, items: ResourceActivity[], resources: Resource[], positions: Point[], time: number, moving: boolean, width: number) {
  const pose = activityPose(time, moving);
  for (const item of items) {
    const index = resources.findIndex(r => r.kind === item.resource);
    if (index < 0) continue;
    const p = positions[index], scale = playerBuildingScale(item.resource, width);
    g.save(); g.translateCanvas(p.x, p.y); g.scaleCanvas(scale, scale);
    if (item.type === 'server-work') {
      const bay = facilityBays[item.slot ?? 0];
      const angle = pose.angle + (item.slot ?? 0) * .8;
      g.lineStyle(1.5, 0x9defff, pose.alpha);
      g.strokeEllipse(bay.x, bay.y - 62, 15, 7);
      for (let blade = 0; blade < 3; blade++) {
        const a = angle + blade * Math.PI * 2 / 3;
        g.lineBetween(bay.x, bay.y-62, bay.x+Math.cos(a)*6, bay.y-62+Math.sin(a)*3);
      }
      for (let lamp=0;lamp<3;lamp++) { g.fillStyle(0x6ee4ff, lamp === Math.floor(pose.phase*3) ? .95 : .45); g.fillRect(bay.x-13, bay.y-42+lamp*9, 4, 3); }
    } else if (item.type === 'cache-work') {
      g.lineStyle(2, 0x6bf3c9, pose.alpha);
      for (let bank=0;bank<3;bank++) { const x=-24+bank*24; g.lineBetween(x-5, -13+bank*2, x+5, -13+bank*2); }
    } else if (item.type === 'intake') {
      g.lineStyle(2, 0x99eaff, pose.alpha); g.strokeEllipse(0, 0, 64, 22);
    } else {
      const side = item.type === 'sql-read' ? -38 : 38;
      g.fillStyle(item.type === 'sql-read' ? 0x8be8ff : 0xffd38c, pose.alpha);
      g.fillRect(side-4, -43 + pose.phase*12, 8, 3);
    }
    g.restore();
  }
  return pose;
}

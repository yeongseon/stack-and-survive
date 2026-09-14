import type Phaser from 'phaser';
import { definitions } from '@stack-and-survive/cloud-domain';
import type { Resource } from '@stack-and-survive/schema';
import type { View } from './controller';
import type { Point } from './editor';
import { facilityBays } from './facility-bays';
import { playerBuildingScale } from './building-assets';

export function constructionProgress(remaining: number, duration: number): number {
  if (!Number.isFinite(remaining) || !Number.isFinite(duration) || duration <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - remaining / duration));
}
export function constructionSites(view: View) {
  const runtime = view.state.runtime;
  const sites: { resource: Resource; progress: number; bay: number | null }[] = [];
  for (const resource of runtime.architecture.resources) {
    if ((resource.kind === 'cache' || resource.kind === 'edge') && resource.remaining > 0) {
      sites.push({ resource, progress: constructionProgress(resource.remaining, definitions[resource.kind].provisioning), bay: null });
    }
    if (resource.kind === 'compute' && runtime.scaleDue !== null && resource.instances < 4) {
      sites.push({ resource, progress: constructionProgress(runtime.scaleDue - runtime.time, 8), bay: resource.instances });
    }
  }
  return sites;
}
export function drawConstruction(g: Phaser.GameObjects.Graphics, view: View, at: (resource: Resource) => Point, width: number) {
  const sites = constructionSites(view);
  for (const site of sites) {
    const origin = at(site.resource), scale = playerBuildingScale(site.resource.kind, width);
    const bay = site.bay === null ? { x: 0, y: 0 } : facilityBays[site.bay];
    const p = { x: origin.x + bay.x * scale, y: origin.y + bay.y * scale };
    const w = (site.bay === null ? 46 : 25) * scale, h = (24 + site.progress * 44) * scale;
    g.lineStyle(2, 0xe6bd7e, .9);
    for (const side of [-1, 1]) {
      g.lineBetween(p.x + side*w, p.y, p.x + side*w, p.y-h);
      g.lineBetween(p.x + side*w, p.y-h, p.x, p.y-h-14*scale);
    }
    g.lineBetween(p.x-w,p.y-h,p.x+w,p.y-h);
    g.fillStyle(0x122b3b,.95); g.fillRect(p.x-w,p.y+19*scale,w*2,5);
    g.fillStyle(0xe6bd7e); g.fillRect(p.x-w,p.y+19*scale,w*2*site.progress,5);
    for (let i=0;i<4;i++) {
      g.fillStyle(i/4 < site.progress ? 0xefce91 : 0x40515d);
      g.fillRect(p.x-w+4+i*(w*2-12)/4,p.y+9*scale,4*scale,3*scale);
    }
  }
  return sites.map(site => ({ id: site.resource.id, bay: site.bay, progress: site.progress }));
}

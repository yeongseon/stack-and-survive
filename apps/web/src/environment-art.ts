import type Phaser from 'phaser';
import { tycoonPoint } from './tycoon-layout';
import { playerBuildingScale, resourceArtBounds } from './building-assets';

type Graphics = Phaser.GameObjects.Graphics;
type EquipmentKind = 'rack' | 'cooling' | 'cabinet';
export type Equipment = { kind: EquipmentKind; x: number; y: number; width: number; height: number };
export function equipmentBounds(e: Equipment) {
  const left = Math.floor(e.x - e.width / 2 - 1);
  const right = Math.ceil(Math.max(e.x + e.width / 2 + 11, e.x + e.width * 1.45));
  const top = Math.floor(e.y - e.height - 7);
  return { x: left, y: top, width: right - left, height: Math.ceil(e.y + 13) - top };
}
export function playerProtectedAreas(width: number, height: number) {
  return (['internet', 'edge', 'compute', 'cache', 'database'] as const).flatMap(kind => {
    const p = tycoonPoint(kind, width, height);
    const art = resourceArtBounds(kind, playerBuildingScale(kind, width), true);
    return [
      { x: p.x + art.x - 12, y: p.y + art.y - 44, width: art.width + 24, height: art.height + 56 },
      { x: p.x - 85, y: p.y + 16, width: 170, height: 135 },
    ];
  });
}
export function playerFacilityLayout(width: number, height: number): Equipment[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 250 || height < 300) return [];
  const wide = width >= 900;
  const count = Math.min(15, Math.max(3, Math.floor(width / (wide ? 95 : 70))));
  const candidates: Equipment[] = [];
  for (let i = 0; i < count; i++) {
    const x = 45 + i * (width - 104) / Math.max(1, count - 1);
    candidates.push({ kind: i % 5 === 3 ? 'cooling' : i % 7 === 6 ? 'cabinet' : 'rack', x,
      y: wide ? 132 + (i % 3) * 7 : 34, width: wide ? 52 : 32, height: wide ? 96 + (i % 2) * 12 : 20 });
    if (wide && i < Math.ceil(count * .3)) candidates.push({ kind: i % 3 === 0 ? 'cabinet' : 'rack', x,
      y: height - 42, width: 57, height: 88 + (i % 2) * 18 });
  }
  for (let i = 0; i < 4; i++) candidates.push({ kind: i % 2 ? 'cabinet' : 'cooling', x: width - 38,
    y: 205 + i * 90, width: 24, height: 52 });
  const protectedAreas = playerProtectedAreas(width, height);
  return candidates.filter(e => {
    const b = equipmentBounds(e);
    return b.x >= 20 && b.y >= 6 && b.x + b.width <= width - 16 && b.y + b.height <= height - 28
      && !protectedAreas.some(p => b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y);
  });
}
export function facilityLayout(width: number, height: number): Equipment[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 160 || height < 160) return [];
  const unit = width < 600 ? 23 : 34;
  const top = width < 600 ? 56 : 78;
  const count = Math.min(18, Math.max(4, Math.floor((width - 100) / (unit + 8))));
  const equipment: Equipment[] = [];
  for (let i = 0; i < count; i++) {
    const x = 50 + i * (width - 110) / Math.max(1, count - 1);
    equipment.push({ kind: i === Math.floor(count / 2) ? 'cooling' : 'rack', x, y: top, width: unit, height: width < 600 ? 40 : 62 });
  }
  for (let i = 0; i < Math.min(4, Math.floor((height - 150) / 80)); i++) {
    equipment.push({ kind: i % 2 ? 'cabinet' : 'cooling', x: width - 31, y: 145 + i * 80, width: 21, height: 39 });
  }
  return equipment;
}
function polygon(g: Graphics, points: number[][], color: number, alpha = 1) {
  g.fillStyle(color, alpha); g.beginPath(); g.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) g.lineTo(x, y);
  g.closePath(); g.fillPath();
}
function equipment(g: Graphics, e: Equipment, index: number) {
  const { x, y, width: w, height: h } = e;
  g.fillStyle(0x111d2b, .35); g.fillEllipse(x + w / 2, y + 4, w * 1.9, 17);
  polygon(g, [[x - w / 2, y - h], [x + w / 2, y - h + 6], [x + w / 2, y], [x - w / 2, y - 6]], e.kind === 'rack' ? 0x334352 : 0x66737b);
  polygon(g, [[x + w / 2, y - h + 6], [x + w / 2 + 10, y - h], [x + w / 2 + 10, y - 6], [x + w / 2, y]], 0x243340);
  polygon(g, [[x - w / 2, y - h], [x - w / 2 + 10, y - h - 6], [x + w / 2 + 10, y - h], [x + w / 2, y - h + 6]], 0x788b98);
  if (e.kind === 'rack') {
    g.fillStyle(0x162736); g.fillRect(x - w / 2 + 4, y - h + 8, w - 8, h - 17);
    for (let j = 0; j < 6; j++) {
      const yy = y - h + 12 + j * (h - 25) / 6;
      g.lineStyle(1, 0x577082); g.lineBetween(x - w / 2 + 6, yy, x + w / 2 - 6, yy + 3);
      g.fillStyle(j % 3 === index % 3 ? 0x6fafd1 : 0x497786); g.fillRect(x + w / 2 - 8, yy + 1, 2, 2);
    }
    if (w >= 40) {
      g.lineStyle(1, 0x829eb1, .65); g.strokeRect(x - w / 2 + 3, y - h + 7, w - 6, h - 15);
      g.lineStyle(2, 0x45b1d6, .8); g.lineBetween(x - w / 2 + 5, y - h + 5, x + w / 2 - 5, y - h + 10);
      g.fillStyle(0xc3b58a, .65); g.fillRect(x - w / 2 + 6, y - 13, 9, 3);
      if (index % 3 === 0) { g.lineStyle(1, 0x43637b); g.lineBetween(x, y-h+13, x, y-14); }
      for (let vent = 0; vent < 4; vent++) { g.lineStyle(1, 0x50667a); g.lineBetween(x+w/2+3, y-h+17+vent*12, x+w/2+8, y-h+14+vent*12); }
    }
  } else if (e.kind === 'cooling') {
    for (let j = 0; j < 2; j++) {
      const yy = y - h + 15 + j * (h - 22) / 2;
      g.fillStyle(0x34434d); g.fillCircle(x, yy, w * .28);
      g.lineStyle(1, 0xadb8bb); g.strokeCircle(x, yy, w * .28);
      g.lineBetween(x - 4, yy - 4, x + 4, yy + 4); g.lineBetween(x - 4, yy + 4, x + 4, yy - 4);
    }
  } else {
    g.lineStyle(1, 0x9aa8ae); g.strokeRect(x - w / 2 + 3, y - h + 8, w - 6, h - 15);
    g.fillStyle(0xb9a26b); g.fillRect(x + 2, y - 20, 3, 6);
    if (w >= 40) {
      g.fillStyle(0x223b50); g.fillRect(x-w/2+7, y-h+14, w-14, 18);
      g.lineStyle(2, 0xbcb083); g.lineBetween(x-w/2+11, y-h+23, x+w/2-11, y-h+23);
      g.lineStyle(1, 0x4d6170); for (let j=0;j<4;j++) g.lineBetween(x-w/2+8, y-32-j*5, x+w/2-8, y-32-j*5);
    }
  }
}
export function drawEnvironment(g: Graphics, width: number, height: number, player = false) {
  if (player) g.fillGradientStyle(0x152a43, 0x243d57, 0x344b60, 0x172c43);
  else g.fillGradientStyle(0x5a6b7b, 0x657989, 0x819199, 0x687f8c);
  g.fillRect(0, 0, width, height);
  const tile = width < 600 ? 38 : 56;
  for (let row = -1; row < Math.ceil(height / (tile * .55)) + 1; row++) {
    for (let col = -1; col < Math.ceil(width / tile) + 1; col++) {
      const x = col * tile + (row % 2 ? tile / 2 : 0); const y = row * tile * .55;
      polygon(g, [[x, y], [x + tile / 2, y + tile * .275], [x, y + tile * .55], [x - tile / 2, y + tile * .275]], (row + col) % 3 ? 0x8a9aa3 : 0xa3afb4, player ? .025 : .16);
      g.lineStyle(1, player ? 0x6b87a0 : 0x344d60, player ? .12 : .3); g.lineBetween(x, y, x + tile / 2, y + tile * .275); g.lineBetween(x + tile / 2, y + tile * .275, x, y + tile * .55);
      if (row > 2 && row % 6 === 0 && col % 5 === 0) {
        g.lineStyle(1, 0x40586a, .55);
        for (let j = 0; j < 6; j++) g.lineBetween(x - 11 + j * 4, y + 5 + j, x - 21 + j * 4, y + 11 + j);
      }
    }
  }
  const wallHeight = width < 600 ? 60 : 84;
  if (player) {
    for (const kind of ['compute', 'database'] as const) {
      const p = tycoonPoint(kind, width, height), scale = playerBuildingScale(kind, width);
      const half = (kind === 'compute' ? 116 : 88) * scale, depth = 48 * scale;
      polygon(g, [[p.x-half,p.y+18],[p.x,p.y-depth+18],[p.x+half,p.y+18],[p.x,p.y+depth+18]], 0x081b29,.55);
      polygon(g, [[p.x-half,p.y+10],[p.x,p.y-depth+10],[p.x+half,p.y+10],[p.x,p.y+depth+10]], 0x2b485b,.55);
      g.lineStyle(1,0x688d9d,.6); g.lineBetween(p.x-half,p.y+10,p.x,p.y+depth+10); g.lineBetween(p.x,p.y+depth+10,p.x+half,p.y+10);
      for (const side of [-1,1]) { g.lineStyle(3,0x8aafac,.55); g.lineBetween(p.x+side*half*.78,p.y+18,p.x+side*half*.57,p.y+depth*.35+18); }
    }
  }
  g.fillGradientStyle(0x1c3046, 0x2c4358, 0x526878, 0x394f65); g.fillRect(0, 0, width, wallHeight);
  polygon(g, [[0, 0], [21, 10], [21, height], [0, height]], 0x293f53);
  polygon(g, [[width - 16, 12], [width, 0], [width, height], [width - 16, height]], 0x22384d);
  g.lineStyle(4, 0x14293d); g.lineBetween(0, 13, width, 13);
  g.lineStyle(2, 0x59788a); g.lineBetween(0, 11, width, 11);
  g.lineStyle(2, 0xaa9464, .7); g.lineBetween(0, 20, width, 20);
  for (let x = 30; x < width; x += 140) {
    g.lineStyle(2, 0x30495b); g.lineBetween(x, 0, x, wallHeight);
    g.lineStyle(1, 0x80929c); g.lineBetween(x + 4, 0, x + 4, wallHeight);
    g.fillStyle(0xffd89a, .06); g.fillEllipse(x + 48, wallHeight + 25, 85, 60);
    g.fillStyle(0xf0d5a4, .85); g.fillRoundedRect(x + 39, 25, 17, 5, 2);
  }
  const objects = player ? playerFacilityLayout(width, height) : facilityLayout(width, height);
  if (player && width >= 900) {
    g.lineStyle(2, 0x698fa1, .3); g.lineBetween(35, height * .84, width - 35, height * .84);
    g.lineStyle(9, 0x152b40, .9); g.lineBetween(35, 163, width - 35, 163);
    g.lineStyle(2, 0x65a5bd, .6); g.lineBetween(35, 159, width - 35, 159);
    g.lineStyle(2, 0xabb895, .6); g.lineBetween(35, 167, width - 35, 167);
    for (let x = 40; x < width - 40; x += 55) { g.lineStyle(2, 0x334d61); g.lineBetween(x, 157, x, 170); }
  }
  if (player) {
    g.fillStyle(0x1c3445, .8); g.fillRect(22, height - 15, width - 44, 8);
    for (let x = 32; x < width - 25; x += 120) {
      g.lineStyle(3, 0x4a6270); g.lineBetween(x, height - 32, x, height - 11);
      g.fillStyle(0xc2b181, .65); g.fillRect(x - 4, height - 34, 8, 3);
    }
  }
  objects.forEach((object, i) => equipment(g, object, i));
  g.lineStyle(3, 0x314857); g.lineBetween(25, height - 19, width - 25, height - 19);
  g.lineStyle(1, 0xb9a77b, .85); g.lineBetween(25, height - 23, width - 25, height - 23);
  for (let x = 27; x < width - 25; x += 44) {
    g.lineStyle(2, 0xc1ae7c, .6); g.lineBetween(x, height - 20, x + 7, height - 26);
  }
  return { equipmentCount: objects.length, style: 'indoor-data-center', layout: player ? 'protected-player-aisle' : 'editor-perimeter' };
}

import type Phaser from 'phaser';

type Graphics = Phaser.GameObjects.Graphics;
type EquipmentKind = 'rack' | 'cooling' | 'cabinet';
export type Equipment = { kind: EquipmentKind; x: number; y: number; width: number; height: number };
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
  }
}
export function drawEnvironment(g: Graphics, width: number, height: number) {
  g.fillGradientStyle(0x5a6b7b, 0x657989, 0x819199, 0x687f8c); g.fillRect(0, 0, width, height);
  const tile = width < 600 ? 38 : 56;
  for (let row = -1; row < Math.ceil(height / (tile * .55)) + 1; row++) {
    for (let col = -1; col < Math.ceil(width / tile) + 1; col++) {
      const x = col * tile + (row % 2 ? tile / 2 : 0); const y = row * tile * .55;
      polygon(g, [[x, y], [x + tile / 2, y + tile * .275], [x, y + tile * .55], [x - tile / 2, y + tile * .275]], (row + col) % 3 ? 0x8a9aa3 : 0xa3afb4, .16);
      g.lineStyle(1, 0x344d60, .3); g.lineBetween(x, y, x + tile / 2, y + tile * .275); g.lineBetween(x + tile / 2, y + tile * .275, x, y + tile * .55);
      if (row > 2 && row % 6 === 0 && col % 5 === 0) {
        g.lineStyle(1, 0x40586a, .55);
        for (let j = 0; j < 6; j++) g.lineBetween(x - 11 + j * 4, y + 5 + j, x - 21 + j * 4, y + 11 + j);
      }
    }
  }
  const wallHeight = width < 600 ? 60 : 84;
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
  const objects = facilityLayout(width, height);
  objects.forEach((object, i) => equipment(g, object, i));
  g.lineStyle(3, 0x314857); g.lineBetween(25, height - 19, width - 25, height - 19);
  g.lineStyle(1, 0xb9a77b, .85); g.lineBetween(25, height - 23, width - 25, height - 23);
  for (let x = 27; x < width - 25; x += 44) {
    g.lineStyle(2, 0xc1ae7c, .6); g.lineBetween(x, height - 20, x + 7, height - 26);
  }
  return { equipmentCount: objects.length, style: 'indoor-data-center' };
}

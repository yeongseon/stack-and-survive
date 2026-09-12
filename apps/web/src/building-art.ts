import type Phaser from 'phaser';
import type { Kind, Resource } from '@stack-and-survive/schema';
import type { Point } from './editor';

type Graphics = Phaser.GameObjects.Graphics;
export function insideBuilding(point: Point, center: Point): boolean {
  return Math.abs(point.x - center.x) <= 58 && point.y >= center.y - 67 && point.y <= center.y + 32;
}
export const buildingIdentity: Record<Kind, { silhouette: string; accent: number }> = {
  internet: { silhouette: 'cloud-uplink', accent: 0xb7eaff },
  compute: { silhouette: 'modular-processing-hub', accent: 0x58b6ff },
  database: { silhouette: 'layered-data-vault', accent: 0xa4b3ff },
  cache: { silhouette: 'memory-accelerator', accent: 0x5de9ce },
  edge: { silhouette: 'security-gateway', accent: 0xffd67e },
};

function polygon(g: Graphics, points: number[][], color: number, alpha = 1) {
  g.fillStyle(color, alpha);
  g.beginPath(); g.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) g.lineTo(x, y);
  g.closePath(); g.fillPath();
}

function block(g: Graphics, x: number, y: number, width: number, depth: number, height: number, top: number, left: number, right: number) {
  polygon(g, [[x, y - height], [x + width, y + width * .42 - height], [x + width - depth, y + (width + depth) * .42 - height], [x - depth, y + depth * .42 - height]], top);
  polygon(g, [[x - depth, y + depth * .42 - height], [x + width - depth, y + (width + depth) * .42 - height], [x + width - depth, y + (width + depth) * .42], [x - depth, y + depth * .42]], left);
  polygon(g, [[x + width - depth, y + (width + depth) * .42 - height], [x + width, y + width * .42 - height], [x + width, y + width * .42], [x + width - depth, y + (width + depth) * .42]], right);
}

export function buildingPresentation(resource: Resource, connected: boolean, selected: boolean, pendingScale: boolean) {
  return {
    ...buildingIdentity[resource.kind], selected, connected,
    provisioning: resource.remaining > 0,
    completedModules: resource.kind === 'compute' && resource.remaining === 0 ? resource.instances : 0,
    pendingModule: resource.kind === 'compute' && pendingScale && resource.remaining === 0,
  };
}

export function drawBuilding(g: Graphics, point: Point, resource: Resource, connected: boolean, selected: boolean, pendingScale: boolean, warning: boolean, overloaded: boolean) {
  const state = buildingPresentation(resource, connected, selected, pendingScale);
  const accent = overloaded ? 0xff8e83 : warning ? 0xffd67e : state.accent;
  g.save(); g.translateCanvas(point.x, point.y);
  g.fillStyle(0x06121f, .3); g.fillEllipse(7, 28, 128, 44);
  block(g, 0, -20, 58, 58, 8, 0x3c647a, 0x24485e, 0x17354b);
  polygon(g, [[0, -30], [56, -6], [0, 18], [-56, -6]], selected ? 0x567e90 : 0x42697e);
  g.lineStyle(selected ? 3 : 1, selected ? 0xe7faff : 0x82a8b7, selected ? 1 : .65);
  g.strokePoints([{ x: 0, y: -30 }, { x: 56, y: -6 }, { x: 0, y: 18 }, { x: -56, y: -6 }], true);
  if (state.provisioning) {
    g.lineStyle(2, accent, .8);
    g.strokeRect(-27, -54, 54, 57);
    g.lineBetween(-27, -54, 0, -66); g.lineBetween(0, -66, 27, -54);
    for (let y = -44; y < 0; y += 12) g.lineBetween(-27, y, 27, y);
    g.fillStyle(accent, .12); g.fillRect(-27, -54, 54, 57);
  } else if (resource.kind === 'compute') {
    block(g, -7, -13, 40, 32, 41, 0xd8effc, 0x709ab8, 0x406b8e);
    block(g, -5, -51, 35, 27, 5, 0x8fd3ff, 0x4b9bcc, 0x306e9b);
    g.fillStyle(0x193f62); g.fillRect(-32, -34, 17, 19);
    g.fillStyle(accent); g.fillRect(-29, -31, 11, 3); g.fillRect(-29, -24, 11, 3);
    g.lineStyle(2, 0xe4f8ff); g.lineBetween(10, -37, 10, -18);
    for (let i = 0; i < 4; i++) {
      const x = -33 + i * 18; const y = 6 + Math.abs(i - 1.5) * -3;
      if (i < state.completedModules) {
        block(g, x, y, 13, 9, 14, 0xa2cfff, 0x456f96, 0x25496e);
        g.fillStyle(accent); g.fillRect(x - 5, y - 7, 7, 3);
      } else if (i === state.completedModules && state.pendingModule) {
        g.lineStyle(2, accent, .7); g.strokeRect(x - 9, y - 14, 19, 17);
      } else { g.fillStyle(0x18384e, .6); g.fillEllipse(x, y + 4, 13, 5); }
    }
  } else if (resource.kind === 'database') {
    block(g, 0, -12, 37, 37, 7, 0xb9c9e0, 0x5e799b, 0x355171);
    for (let i = 0; i < 3; i++) {
      const y = -4 - i * 17;
      g.fillStyle(0x526e9c); g.fillRect(-27, y - 17, 54, 17); g.fillEllipse(0, y, 54, 21);
      g.fillStyle(0xa4bbdd); g.fillEllipse(0, y - 17, 54, 21);
      g.lineStyle(2, accent); g.strokeEllipse(0, y - 3, 52, 20);
      g.fillStyle(0xe1efff); g.fillRect(-19, y - 13, 4, 5);
    }
    g.fillStyle(0x243e6c); g.fillEllipse(0, -55, 34, 12);
    g.fillStyle(accent); g.fillEllipse(0, -56, 23, 7);
  } else if (resource.kind === 'cache') {
    block(g, -5, -7, 40, 32, 16, 0xb2efdf, 0x459d99, 0x28676f);
    for (let i = 0; i < 3; i++) {
      block(g, -21 + i * 18, -15 + i * 5, 12, 12, 25, 0xd5fff1, 0x59c4b2, 0x2c8d8f);
      g.fillStyle(accent); g.fillCircle(-23 + i * 18, -30 + i * 5, 3);
    }
    g.lineStyle(3, accent); g.lineBetween(-32, 8, 23, 8);
    g.lineBetween(-32, 8, -39, 0); g.lineBetween(23, 8, 33, 0);
  } else if (resource.kind === 'edge') {
    block(g, -29, -5, 15, 13, 43, 0xf4e2b8, 0xa29375, 0x706452);
    block(g, 28, -5, 15, 13, 43, 0xf4e2b8, 0xa29375, 0x706452);
    block(g, -24, -43, 64, 12, 9, 0xffe7ac, 0xb09b68, 0x776849);
    polygon(g, [[-19, -34], [22, -34], [22, -7], [1, 8], [-19, -7]], accent, .16);
    g.lineStyle(2, accent, .9); g.strokePoints([{ x: -19, y: -34 }, { x: 22, y: -34 }, { x: 22, y: -7 }, { x: 1, y: 8 }, { x: -19, y: -7 }], true);
    g.lineStyle(3, 0xfff2c9); g.lineBetween(-7, -14, 0, -8); g.lineBetween(0, -8, 11, -23);
  } else {
    g.fillStyle(0x507995); g.fillEllipse(0, 0, 69, 24);
    g.lineStyle(4, accent); g.strokeEllipse(0, -2, 66, 25);
    g.fillStyle(0xccedff); g.fillCircle(-20, -30, 15); g.fillCircle(0, -39, 22); g.fillCircle(23, -30, 15); g.fillRoundedRect(-33, -30, 68, 18, 8);
    g.lineStyle(3, 0x58b6ff); g.lineBetween(0, -25, 0, -5); g.lineBetween(0, -5, -6, -12); g.lineBetween(0, -5, 6, -12);
  }
  if (!connected && resource.kind !== 'internet') {
    g.lineStyle(2, 0xd5e5ed); g.strokeCircle(37, 10, 7); g.lineBetween(31, 16, 43, 4);
  }
  if (overloaded || warning) {
    g.fillStyle(accent); g.fillTriangle(37, -33, 47, -16, 27, -16);
    g.lineStyle(2, 0x233744); g.lineBetween(37, -28, 37, -23); g.fillStyle(0x233744); g.fillCircle(37, -20, 1);
  }
  g.restore();
  return state;
}

export function drawEnvironment(g: Graphics, width: number, height: number) {
  g.fillGradientStyle(0x294e6a, 0x345f79, 0x547d88, 0x3e727e); g.fillRect(0, 0, width, height);
  for (let i = 0; i < 8; i++) {
    const x = ((i * 191 + 47) % 997) / 997 * width;
    const y = ((i * 127 + 23) % 463) / 463 * height;
    g.fillStyle(0xe2f5ff, .035); g.fillEllipse(x, y, 210, 70);
  }
  const top = 32; const bottom = height - 30;
  polygon(g, [[width * .08, top + 40], [width * .8, top], [width * .96, bottom - 40], [width * .2, bottom + 15]], 0x193e4b, .6);
  polygon(g, [[width * .08, top + 28], [width * .8, top - 12], [width * .96, bottom - 52], [width * .2, bottom + 3]], 0x527777);
  g.lineStyle(1, 0x91b2b0, .17);
  for (let x = -height; x < width + height; x += 64) { g.lineBetween(x, 0, x + height, height); g.lineBetween(x, 0, x - height, height); }
  for (let i = 0; i < 12; i++) {
    const x = 30 + i * (width - 60) / 11;
    const y = i % 2 === 0 ? 25 : height - 28;
    block(g, x, y, 13, 10, 5, 0x93b5b2, 0x426569, 0x2d505a);
    g.fillStyle(0xbee4d8); g.fillCircle(x, y - 3, 2);
  }
}

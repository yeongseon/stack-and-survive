import type Phaser from 'phaser';
import type { Kind } from '@stack-and-survive/schema';
import type { Point } from './editor';
import type { PressureState, resourceVisualState } from './resource-visual-state';

type Visual = ReturnType<typeof resourceVisualState>;
type Bank = { x: number; y: number; height: number; state: PressureState; bars: number };
export function facilityBanks(kind: Kind, visual: Visual): Bank[] {
  if (kind === 'database' && visual.sql.lifecycle === 'active') return [
    { x: -38, y: -20, height: 36, state: visual.sql.readPressure, bars: 3 },
    { x: 38, y: -20, height: 36, state: visual.sql.writePressure, bars: 2 },
  ];
  if (kind === 'cache' && visual.cache.lifecycle === 'active') return [-24, 0, 24].map((x, i) => ({
    x, y: 4 + i * 2, height: 22, state: visual.cache.onPath ? visual.cache.pressure : 'unmeasured', bars: 3,
  }));
  return [];
}
export function facilityStateKey(visual: Visual) {
  return [visual.app.bays, visual.sql.lifecycle, visual.sql.readPressure, visual.sql.writePressure,
    visual.cache.lifecycle, visual.cache.pressure, visual.cache.onPath, visual.edge.lifecycle, visual.edge.boost, visual.edge.onPath];
}
const colorFor = (state: PressureState, cache: boolean) => state === 'overcapacity' ? 0xff756a
  : state === 'warning' ? 0xffbd64 : state === 'unmeasured' ? 0x6f8796 : cache ? 0x6df0cb : 0x67dded;

export function gatewayCue(visual: Visual) {
  return visual.edge.lifecycle !== 'active' ? 'none' : visual.edge.boost === 'queued' ? 'request-dots'
    : visual.edge.boost === 'scheduled' ? 'activation-clock' : visual.edge.boost === 'active' ? 'boost-bars' : 'normal-rails';
}

export function drawFacilityBanks(g: Phaser.GameObjects.Graphics, kind: Kind, point: Point, scale: number, visual: Visual) {
  const banks = facilityBanks(kind, visual);
  const cue = kind === 'edge' ? gatewayCue(visual) : 'none';
  g.save(); g.translateCanvas(point.x, point.y); g.scaleCanvas(scale, scale);
  for (const bank of banks) {
    const { x, y, height } = bank;
    const color = colorFor(bank.state, kind === 'cache');
    g.fillStyle(0x122d43, .95); g.fillPoints([{ x: x-9, y: y-height }, { x, y: y-height-5 }, { x: x+9, y: y-height }, { x: x+9, y }, { x, y: y+5 }, { x: x-9, y }], true);
    g.lineStyle(1, 0x7399ad); g.strokePoints([{ x: x-9, y: y-height }, { x, y: y-height-5 }, { x: x+9, y: y-height }, { x: x+9, y }, { x, y: y+5 }, { x: x-9, y }], true);
    for (let i = 0; i < bank.bars; i++) {
      const yy = y - height + 7 + i * 7;
      g.lineStyle(bank.state === 'overcapacity' ? 3 : 2, color);
      g.lineBetween(x-5, yy, x+5, yy);
    }
    if (bank.state === 'warning' || bank.state === 'overcapacity') {
      g.fillStyle(color); g.fillTriangle(x, y-height-17, x-5, y-height-8, x+5, y-height-8);
      g.lineStyle(1, 0x102735); g.lineBetween(x, y-height-14, x, y-height-11);
    }
  }
  if (kind === 'edge' && visual.edge.lifecycle === 'active') {
    const boosted = visual.edge.boost === 'active';
    const color = boosted ? 0xffda8b : visual.edge.onPath ? 0x68dcec : 0x6f8796;
    g.lineStyle(boosted ? 3 : 2, color, .9);
    g.lineBetween(-24, -53, -24, -8); g.lineBetween(24, -53, 24, -8);
    for (const x of [-14, 0, 14]) {
      g.lineBetween(x-3, 6, x+3, 10); g.lineBetween(x+3, 10, x-3, 14);
    }
    if (cue === 'request-dots') { g.fillStyle(0xffda8b); for (const x of [-7, 0, 7]) g.fillRect(x-1, -41, 3, 3); }
    if (cue === 'activation-clock') { g.lineStyle(2, 0xffda8b); g.strokeCircle(0, -39, 6); g.lineBetween(0, -39, 0, -44); }
    if (boosted) { g.lineBetween(-23, -55, 23, -55); g.lineBetween(-23, -60, 23, -60); }
  }
  g.restore();
  return { banks, cue };
}

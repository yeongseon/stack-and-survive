import type { Kind } from '@stack-and-survive/schema';
import bounds from '../../../art/buildings/bounds.json' with { type: 'json' };

export type BuildingAsset = { texture: string; src: string; width: number; height: number; originX: number; originY: number; footprintWidth: number; footprintDepth: number; visible: { x: number; y: number; width: number; height: number } };
export const buildingLayers = Object.freeze({ ground: 0, body: 100, traffic: 1000, state: 2000, effects: 3000, labels: 4000 });
const asset = (name: keyof typeof bounds, visibleHeight: number, base = 14): BuildingAsset => {
  const b = bounds[name]; const scale = visibleHeight / b.height;
  return { texture: `building-${name}`, src: `/assets/buildings/${name}.png`,
    width: b.sourceWidth * scale, height: b.sourceHeight * scale,
    originX: (b.left + b.width / 2) / b.sourceWidth,
    originY: (b.top + b.height) / b.sourceHeight - base / (b.sourceHeight * scale),
    footprintWidth: 116, footprintDepth: 96,
    visible: { x: -b.width * scale / 2, y: base - visibleHeight, width: b.width * scale, height: visibleHeight } };
};
export const buildingAssets: Partial<Record<Kind, BuildingAsset>> = {
  compute: asset('app-service', 108), database: asset('azure-sql', 112), cache: asset('redis', 76), edge: asset('protected-edge', 104),
};
export const moduleAsset = asset('app-module', 27, 7);
export function resourceArtBounds(kind: Kind) {
  const art = buildingAssets[kind]?.visible;
  return { x: Math.min(-58, art?.x ?? -58), y: Math.min(-67, art?.y ?? -67),
    width: Math.max(116, art?.width ?? 116), height: 32 - Math.min(-67, art?.y ?? -67) };
}

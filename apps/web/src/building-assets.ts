import type { Kind, Resource } from '@stack-and-survive/schema';
import { resourceTier } from '@stack-and-survive/cloud-domain';
import bounds from '../../../art/buildings/bounds.json' with { type: 'json' };
import { facilityBays, facilityModuleScale } from './facility-bays';
import { assetUrl } from './asset-url';
import { v3, v3Asset } from './art-v3';

export type BuildingAsset = { texture: string; src: string; width: number; height: number; originX: number; originY: number; footprintWidth: number; footprintDepth: number; visible: { x: number; y: number; width: number; height: number } };
export const buildingLayers = Object.freeze({ ground: 0, body: 100, traffic: 1000, state: 2000, effects: 3000, labels: 4000 });
const asset = (name: keyof typeof bounds, visibleHeight: number, base = 14): BuildingAsset => {
  const b = bounds[name]; const scale = visibleHeight / b.height;
  return { texture: `building-${name}`, src: assetUrl(`assets/buildings/${name}.png`),
    width: b.sourceWidth * scale, height: b.sourceHeight * scale,
    originX: (b.left + b.width / 2) / b.sourceWidth,
    originY: (b.top + b.height) / b.sourceHeight - base / (b.sourceHeight * scale),
    footprintWidth: 116, footprintDepth: 96,
    visible: { x: -b.width * scale / 2, y: base - visibleHeight, width: b.width * scale, height: visibleHeight } };
};
export const buildingAssets: Partial<Record<Kind, BuildingAsset>> = v3 ? {
  internet: v3Asset('intake'), compute: v3Asset('app-service'), database: v3Asset('azure-sql'), cache: v3Asset('redis-cache'), edge: v3Asset('protected-edge'),
} : {
  compute: asset('app-service', 108), database: asset('azure-sql', 112), cache: asset('redis', 76), edge: asset('protected-edge', 104),
};
export const moduleAsset = v3 ? v3Asset('app-module') : asset('app-module', 27, 7);
export function playerBuildingScale(kind: Kind, _width?: number) {
  void _width;
  if (v3) return kind === 'compute' ? 2.5 : kind === 'database' ? 2.7 : 1.9;
  return kind === 'database' ? 2.3 : kind === 'compute' ? 1.9 : 1.7;
}
export function activeBuildingScale(resource: Resource, width?: number) {
  const scale = playerBuildingScale(resource.kind, width);
  return resource.kind === 'database' ? scale * [0.58, 0.78, 1][resourceTier(resource) - 1] : scale;
}
export function resourceArtBounds(kind: Kind, scale = 1, player = false) {
  const art = buildingAssets[kind]?.visible;
  if (v3 && art && player) {
    const envelope = kind === 'compute' ? v3Asset('app-4').visible : art;
    return { x: envelope.x * scale, y: envelope.y * scale, width: envelope.width * scale, height: envelope.height * scale };
  }
  if (kind === 'compute' && player) {
    const module = moduleAsset.visible;
    const left = Math.min(...facilityBays.map(p => p.x + Math.min(-31, module.x * facilityModuleScale)));
    const top = Math.min(...facilityBays.map(p => p.y + Math.min(-67, module.y * facilityModuleScale)));
    const right = Math.max(...facilityBays.map(p => p.x + Math.max(31, (module.x + module.width) * facilityModuleScale)));
    const bottom = Math.max(...facilityBays.map(p => p.y + Math.max(16, (module.y + module.height) * facilityModuleScale)));
    const x = Math.floor(left * scale), y = Math.floor(top * scale);
    return { x, y, width: Math.ceil(right * scale) - x, height: Math.ceil(bottom * scale) - y };
  }
  return { x: Math.min(-58, art?.x ?? -58) * scale, y: Math.min(-67, art?.y ?? -67) * scale,
    width: Math.max(116, art?.width ?? 116) * scale, height: (32 - Math.min(-67, art?.y ?? -67)) * scale };
}

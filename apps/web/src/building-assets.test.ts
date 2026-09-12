import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { buildingAssets, moduleAsset } from './building-assets';
import { spriteModules } from './building-sprites';

it('maps four original building textures and one reusable module separately from Azure identity', () => {
  expect(Object.keys(buildingAssets)).toEqual(['compute', 'database', 'cache', 'edge']);
  for (const asset of [...Object.values(buildingAssets), moduleAsset]) {
    expect(asset.src).toMatch(/^\/assets\/buildings\/.+\.png$/);
    expect(asset.originX).toBeGreaterThan(0); expect(asset.originX).toBeLessThan(1);
    expect(asset.originY).toBeGreaterThan(0); expect(asset.originY).toBeLessThan(1);
    expect(asset.footprintWidth).toBe(116); expect(asset.width).toBeGreaterThan(0);
  }
});
it('uses measured visible art height rather than transparent source canvas for display sizing', () => {
  expect(buildingAssets.compute!.visible.height).toBe(108);
  expect(buildingAssets.database!.visible.height).toBe(112);
  expect(buildingAssets.cache!.visible.height).toBeLessThan(buildingAssets.compute!.visible.height);
  expect(moduleAsset.visible.height).toBe(27);
});
it('uses only completed instance modules and one pending ghost', () => {
  const app = baseline(3).resources.find(r => r.kind === 'compute')!;
  expect(spriteModules(app, true)).toEqual({ active: 3, ghost: true });
  expect(spriteModules({ ...app, remaining: 1 }, true)).toEqual({ active: 0, ghost: false });
  expect(spriteModules(baseline().resources[2], false)).toEqual({ active: 0, ghost: false });
});

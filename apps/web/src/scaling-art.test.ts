import { describe, expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { optionalScalingAsset, scalingAsset, scalingModuleAsset } from './scaling-art';
import { appBays } from './resource-visual-state';
import { activeBuildingScale, playerBuildingScale } from './building-assets';
import { createController } from './controller';
import { worldTargets } from './world-interaction';
describe('scaling art contract', () => {
  it('starts SQL compact and grows only with activated tiers, including its hit target', () => {
    const controller = createController({ start: () => () => {} }, undefined, true);
    controller.start(); controller.inspectNextTick();
    const sql = () => controller.getSnapshot().state.runtime.architecture.resources.find(r => r.kind === 'database')!;
    const initial = activeBuildingScale(sql());
    expect(initial).toBeCloseTo(playerBuildingScale('database') * .58);
    const targetWidth = () => worldTargets(controller.getSnapshot(), 1440, 900).find(target => target.kind === 'database')!.bounds.width;
    const smallTarget = targetWidth();
    controller.queueAction({ type: 'SCALE_UP_DATABASE' }); controller.inspectNextTick();
    expect(activeBuildingScale(sql())).toBe(initial);
    expect(targetWidth()).toBe(smallTarget);
    for (let tick = 0; tick < 10; tick++) controller.inspectNextTick();
    expect(activeBuildingScale(sql())).toBeCloseTo(playerBuildingScale('database') * .78);
    expect(targetWidth()).toBeGreaterThan(smallTarget);
    controller.queueAction({ type: 'SCALE_DOWN_DATABASE' }); controller.inspectNextTick();
    for (let tick = 0; tick < 10; tick++) controller.inspectNextTick();
    expect(activeBuildingScale(sql())).toBe(initial);
    expect(targetWidth()).toBe(smallTarget);
    expect(activeBuildingScale({ ...sql(), tier: 3 })).toBe(playerBuildingScale('database'));
    controller.destroy();
  });
  it('selects same-facility tier assets only when present, otherwise existing art', () => {
    const app = baseline(3).resources.find(r => r.kind === 'compute')!; app.tier = 3;
    expect(scalingAsset(app, () => false)).toBe('app-service');
    expect(scalingAsset(app, name => name === 'app-service-tier-3')).toBe('app-service-tier-3');
    expect(scalingModuleAsset(app, () => false)).toBe('app-module');
    expect(optionalScalingAsset('azure-sql-replica')).toBe(true);
    expect(optionalScalingAsset('azure-sql')).toBe(false);
  });
  it('keeps all active machines visible during deterministic draining', () => {
    const app = baseline(4).resources.find(r => r.kind === 'compute')!;
    expect(appBays(app, false, false, true)).toEqual(['active', 'active', 'active', 'draining']);
    app.instances = 3;
    expect(appBays(app, false)).toEqual(['active', 'active', 'active', 'available']);
  });
});

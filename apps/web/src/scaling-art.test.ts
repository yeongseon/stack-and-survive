import { describe, expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { optionalScalingAsset, scalingAsset, scalingModuleAsset } from './scaling-art';
import { appBays } from './resource-visual-state';
describe('scaling art contract', () => {
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

import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { buildingIdentity, buildingPresentation, insideBuilding } from './building-art';

it('assigns five distinct silhouettes without substituting official icon artwork', () => {
  expect(new Set(Object.values(buildingIdentity).map(v => v.silhouette)).size).toBe(5);
});
it('completed modules reflect active instances and never pending capacity', () => {
  const resource = baseline(3).resources.find(r => r.kind === 'compute')!;
  const before = structuredClone(resource);
  expect(buildingPresentation(resource, true, true, true)).toMatchObject({ completedModules: 3, pendingModule: true });
  expect(buildingPresentation({ ...resource, remaining: 2 }, true, false, false)).toMatchObject({ completedModules: 0, provisioning: true });
  expect(resource).toEqual(before);
});
it('preserves disconnected and selected states for non-color overlays', () => {
  const resource = baseline(1, true).resources.find(r => r.kind === 'cache')!;
  expect(buildingPresentation(resource, false, true, false)).toMatchObject({ connected: false, selected: true, silhouette: 'memory-accelerator' });
});
it('includes visible platform edges and roof without selecting labels', () => {
  expect(insideBuilding({ x: 55, y: 0 }, { x: 0, y: 0 })).toBe(true);
  expect(insideBuilding({ x: 0, y: -60 }, { x: 0, y: 0 })).toBe(true);
  expect(insideBuilding({ x: 0, y: 50 }, { x: 0, y: 0 })).toBe(false);
});

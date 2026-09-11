import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { connectResources, disconnectResources, moveResource, placeResource, positionError, project, removeResource, unproject, validTargets } from './editor';
import { validateStart } from '@stack-and-survive/cloud-domain';
it('places a disconnected resource with full provisioning and snaps position', () => {
  const a = baseline(); const placed = placeResource(a, 'cache', { x: -241, y: 181 });
  expect(placed.resources.at(-1)).toMatchObject({ kind: 'cache', x: -240, y: 180, remaining: 5 });
  expect(placed.connections).toEqual(a.connections); expect(a.resources).toHaveLength(3);
  expect(() => placeResource(placed, 'cache', { x: -400, y: 200 })).toThrow('Only one');
});
it('rejects overlaps, invalid bounds and removes dangling connections', () => {
  const a = baseline(); expect(positionError(a, a.resources[0])).toContain('overlap');
  expect(() => moveResource(a, 'compute', { x: Infinity, y: 0 })).toThrow();
  expect(removeResource(a, 'compute').connections).toEqual([]);
  expect(() => removeResource(a, 'internet')).toThrow();
});
it('pan and zoom projection are invertible', () => {
  const camera = { x: 41, y: -33, zoom: 1.4 }; const point = { x: 270, y: 80 };
  const restored = unproject(project(point, camera, 1000, 600), camera, 1000, 600);
  expect(restored.x).toBeCloseTo(point.x); expect(restored.y).toBeCloseTo(point.y);
});
it('connection editing preserves validation and direct write requirements', () => {
  let a = baseline(2, true, true); a.connections = [];
  expect(() => connectResources(a, 'database', 'compute')).toThrow('direction');
  expect(validTargets(a, 'internet')).toEqual(['compute', 'edge']);
  a = connectResources(a, 'internet', 'edge');
  expect(validateStart(a).length).toBeGreaterThan(0);
  a = connectResources(a, 'edge', 'compute'); a = connectResources(a, 'compute', 'cache'); a = connectResources(a, 'cache', 'database');
  expect(validateStart(a).join()).toContain('write');
  a = connectResources(a, 'compute', 'database'); expect(validateStart(a)).toEqual([]);
  expect(() => connectResources(a, 'compute', 'database')).toThrow('already exists');
  a = connectResources(a, 'internet', 'compute'); expect(validateStart(a).join()).toContain('Exactly one');
  a = disconnectResources(a, 'internet', 'compute'); expect(validateStart(a)).toEqual([]);
});

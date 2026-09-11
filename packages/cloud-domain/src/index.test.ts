import { expect, it } from 'vitest';
import { baseline, parseArchitecture, validateStart } from './index';
it('validates direct and protected cached baselines', () => {
  expect(validateStart(baseline())).toEqual([]); expect(validateStart(baseline(3, true, true))).toEqual([]);
});
it('requires direct write edge and rejects invalid directions', () => {
  const a = baseline(2, true); a.connections = a.connections.filter(c => c.from !== 'compute' || c.to !== 'database');
  expect(validateStart(a).join()).toContain('write');
  a.connections.push({ from: 'database', to: 'compute' }); expect(() => parseArchitecture(a)).toThrow();
});
it('normalizes duplicates and rejects duplicate resource ids', () => {
  const a = baseline(); a.connections.push(a.connections[0]); expect(parseArchitecture(a).connections).toHaveLength(2);
  a.resources.push(a.resources[0]); expect(() => parseArchitecture(a)).toThrow('Duplicate');
});
it('allows disconnected optional provisioning but rejects partial paths', () => {
  const a = baseline(2, true); a.connections = a.connections.filter(c => c.from !== 'cache' && c.to !== 'cache');
  a.resources.find(r => r.kind === 'cache')!.remaining = 5; expect(validateStart(a)).toEqual([]);
  a.connections.push({ from: 'compute', to: 'cache' }); expect(validateStart(a).length).toBeGreaterThan(0);
});
it('rejects dual ingress, unknown types and nonfinite placement', () => {
  const a = baseline(2, false, true); a.connections.push({ from: 'internet', to: 'compute' }); expect(validateStart(a).join()).toContain('Exactly one');
  expect(() => parseArchitecture({ ...baseline(), resources: [{ kind: 'unknown' }] })).toThrow();
  const b = baseline(); b.resources[0].x = NaN; expect(() => parseArchitecture(b)).toThrow();
});

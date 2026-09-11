import { expect, it } from 'vitest';
import { blackFriday, parseScenario } from './index';
it('loads the canonical versioned 180-second scenario', () => {
  expect(blackFriday.duration).toBe(180); expect(blackFriday.traffic[3].botRatio).toBe(.4);
});
it('rejects malformed ratios, gaps and unsupported versions', () => {
  expect(() => parseScenario({ ...blackFriday, businessMix: { browse: .8, order: .3 } })).toThrow('sum');
  expect(() => parseScenario({ ...blackFriday, traffic: [{ start: 1, end: 180, rps: 100, botRatio: 0 }] })).toThrow('contiguous');
  expect(() => parseScenario({ ...blackFriday, balanceVersion: '9' })).toThrow('version');
});
it('rejects nonfinite rates and normalizes near-one mix', () => {
  expect(() => parseScenario({ ...blackFriday, traffic: [{ start: 0, end: 180, rps: Infinity, botRatio: 0 }] })).toThrow();
  const s = parseScenario({ ...blackFriday, businessMix: { browse: .8, order: .2000000001 } });
  expect(s.businessMix.browse + s.businessMix.order).toBeCloseTo(1, 14);
});
it('isolates parsed content and freezes all scenario data', () => {
  const input = JSON.parse(JSON.stringify(blackFriday));
  const parsed = parseScenario(input);
  input.traffic[0].rps = 999;
  expect(parsed.traffic[0].rps).toBe(100);
  for (const value of [parsed, parsed.traffic, parsed.traffic[0], parsed.businessMix, parsed.targets]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
  expect(Reflect.set(parsed.traffic[0], 'rps', 999)).toBe(false);
});

import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processBaseline } from './index';

it('processes an unsaturated baseline without SQL traffic from bots', () => {
  const s = processBaseline(baseline(), { browse: 80, order: 20, bot: 40 });
  expect(s.successful).toEqual({ browse: 80, order: 20 });
  expect(s.sql.readDemand + s.sql.writeDemand).toBe(100);
  expect(s.app.incoming).toBe(140);
});
it('admits every request class proportionally when App is saturated', () => {
  const s = processBaseline(baseline(), { browse: 160, order: 40, bot: 100 });
  expect(s.app.accepted).toEqual({ browse: 80, order: 20, bot: 50 });
  expect(s.app.utilization).toBe(2);
});
it('scaling App exposes independent SQL read and write capacity', () => {
  const traffic = { browse: 240, order: 100, bot: 0 };
  const one = processBaseline(baseline(), traffic);
  const four = processBaseline(baseline(4), traffic);
  expect(four.app.capacity).toBeGreaterThan(one.app.capacity);
  expect(four.sql.readCapacity).toBe(one.sql.readCapacity);
  expect(four.sql.writeCapacity).toBe(one.sql.writeCapacity);
  expect(four.successful).toEqual({ browse: 180, order: 70 });
  expect(four.sql.readsDropped).toBe(60);
  expect(four.sql.writesDropped).toBe(30);
});
it('conserves each legitimate class across first-loss stages', () => {
  const s = processBaseline(baseline(2), { browse: 400, order: 200, bot: 50 });
  expect(s.successful.browse + s.app.dropped.browse + s.sql.readsDropped).toBeCloseTo(s.offered.browse, 12);
  expect(s.successful.order + s.app.dropped.order + s.sql.writesDropped).toBeCloseTo(s.offered.order, 12);
});
it('does not mutate inputs or imply support for future optional paths', () => {
  const a = baseline(); const before = JSON.stringify(a); const traffic = Object.freeze({ browse: 80, order: 20, bot: 0 });
  expect(processBaseline(a, traffic)).toEqual(processBaseline(a, traffic));
  expect(JSON.stringify(a)).toBe(before);
  expect(() => processBaseline(baseline(2, true), traffic)).toThrow('Baseline slice');
});

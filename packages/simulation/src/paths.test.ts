import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from './index';

it('cache reduces only reads and leaves writes unchanged', () => {
  const traffic = { browse: 240, order: 60, bot: 0 };
  const direct = processRequests(baseline(3), traffic);
  const cached = processRequests(baseline(3, true), traffic);
  expect(cached.sql.readDemand).toBeCloseTo(48);
  expect(cached.cache.hits).toBe(192);
  expect(cached.sql.writeDemand).toBe(direct.sql.writeDemand);
});
it('cache overflow falls through to SQL without dropping requests at cache', () => {
  const s = processRequests(baseline(4, true), { browse: 600, order: 0, bot: 0 });
  expect(s.cache).toMatchObject({ processed: 500, hits: 400, misses: 100, overflow: 100, utilization: 1.2 });
  expect(s.sql.readDemand).toBe(200); expect(s.successful.browse).toBe(580);
  expect(s.sql.readsDropped).toBe(20);
});
it('normal WAF filters bots and records false positives by business class', () => {
  const s = processRequests(baseline(3, true, true), { browse: 240, order: 60, bot: 200 });
  expect(s.edge.filtered).toEqual({ browse: 1.2, order: .3, bot: 140 });
  expect(s.app.incoming).toBeCloseTo(358.5);
  expect(s.sql.writeDemand).toBeCloseTo(59.7);
  expect(s.successful.browse + s.successful.order).toBeCloseTo(298.5);
});
it.each([0, 5])('disconnected cache and edge have no traffic effect with remaining=%s', remaining => {
  const a = baseline(3, true, true);
  a.connections = baseline(3).connections;
  for (const r of a.resources) if (r.kind === 'cache' || r.kind === 'edge') r.remaining = remaining;
  const t = { browse: 240, order: 60, bot: 200 };
  expect(processRequests(a, t)).toEqual(processRequests(baseline(3), t));
});
it('connected pending optional resource cannot silently alter a ready run', () => {
  const a = baseline(3, true); a.resources.find(r => r.kind === 'cache')!.remaining = 1;
  expect(() => processRequests(a, { browse: 100, order: 0, bot: 0 })).toThrow('provisioning');
});
it('conserves each class across WAF App and SQL losses', () => {
  for (const instances of [1, 2, 3, 4]) for (const cache of [false, true]) for (const edge of [false, true]) {
    const s = processRequests(baseline(instances, cache, edge), { browse: 520.2, order: 179.8, bot: 300 });
    expect(s.successful.browse + s.edge.filtered.browse + s.app.dropped.browse + s.sql.readsDropped).toBeCloseTo(s.offered.browse, 10);
    expect(s.successful.order + s.edge.filtered.order + s.app.dropped.order + s.sql.writesDropped).toBeCloseTo(s.offered.order, 10);
    expect(s.edge.filtered.bot + s.app.dropped.bot + s.app.accepted.bot).toBeCloseTo(s.offered.bot, 10);
  }
});

import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processBaseline } from './index';

it('zero demand produces finite zero metrics', () => {
  const s = processBaseline(baseline(), { browse: 0, order: 0, bot: 0 });
  expect(s.app.utilization).toBe(0); expect(s.sql.readUtilization).toBe(0);
  expect(s.sql.writeUtilization).toBe(0); expect(s.successful).toEqual({ browse: 0, order: 0 });
  expect(JSON.stringify(s)).not.toContain('null');
});
it('exact App and SQL capacity is admitted without numerical loss', () => {
  const app = processBaseline(baseline(), { browse: 100, order: 50, bot: 0 });
  expect(app.app.utilization).toBe(1); expect(app.app.dropped).toEqual({ browse: 0, order: 0, bot: 0 });
  const sql = processBaseline(baseline(2), { browse: 180, order: 70, bot: 0 });
  expect(sql.sql.readUtilization).toBe(1); expect(sql.sql.writeUtilization).toBe(1);
  expect(sql.sql.readsDropped + sql.sql.writesDropped).toBe(0);
});
it.each([NaN, Infinity, -Infinity, -1])('rejects invalid traffic %s in each class', value => {
  for (const kind of ['browse', 'order', 'bot'] as const) {
    expect(() => processBaseline(baseline(), { browse: 0, order: 0, bot: 0, [kind]: value })).toThrow();
  }
});
it('rejects excessive aggregate demand and invalid architecture state', () => {
  expect(() => processBaseline(baseline(), { browse: 600, order: 401, bot: 0 })).toThrow();
  const a = baseline(); a.connections = [];
  expect(() => processBaseline(a, { browse: 1, order: 0, bot: 0 })).toThrow();
  a.connections = baseline().connections; a.resources[1].remaining = 1;
  expect(() => processBaseline(a, { browse: 1, order: 0, bot: 0 })).toThrow('provisioning');
});
it('preserves bot-only traffic without generating business operations', () => {
  const s = processBaseline(baseline(), { browse: 0, order: 0, bot: 1000 });
  expect(s.app.accepted.bot).toBe(150); expect(s.app.dropped.bot).toBe(850);
  expect(s.sql.readDemand + s.sql.writeDemand).toBe(0);
  expect(s.successful).toEqual({ browse: 0, order: 0 });
});
it('conserves fractional class counts across a deterministic grid of workloads', () => {
  for (const instances of [1, 2, 3, 4]) for (const rps of [0, .1, 100, 150, 299.9, 500, 1000]) for (const botRatio of [0, .2, .4, 1]) {
    const bot = rps * botRatio;
    const traffic = { browse: (rps - bot) * .8, order: (rps - bot) * .2, bot };
    const first = processBaseline(baseline(instances), traffic);
    expect(processBaseline(baseline(instances), traffic)).toEqual(first);
    expect(first.successful.browse + first.sql.readsDropped + first.app.dropped.browse).toBeCloseTo(traffic.browse, 10);
    expect(first.successful.order + first.sql.writesDropped + first.app.dropped.order).toBeCloseTo(traffic.order, 10);
    expect(first.app.accepted.bot + first.app.dropped.bot).toBeCloseTo(bot, 10);
  }
});
it('visual placement does not change processing outcomes', () => {
  const a = baseline(2); const b = baseline(2);
  b.resources.forEach(r => { r.x += 500; r.y -= 900; });
  const traffic = { browse: 192.3, order: 48.1, bot: 60.2 };
  expect(processBaseline(a, traffic)).toEqual(processBaseline(b, traffic));
});

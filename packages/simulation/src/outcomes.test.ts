import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFridayV02 as blackFriday, parseScenario } from '@stack-and-survive/scenarios';
import { advanceService, createServiceState, latencyMultiplier, runServiceScenario, serviceMetrics } from './outcomes';
import { processRequests } from './index';
import { pauseRuntime, startRuntime } from './runtime';

it.each([[.5, 1], [.7, 1], [.85, 1.5], [1, 3], [1.25, 4], [9, 8]])('computes saturation latency at %s', (u, expected) => {
  expect(latencyMultiplier(u)).toBeCloseTo(expected);
});
it('has no-demand conventions and no fake latency', () => {
  const m = serviceMetrics(processRequests(baseline(), { browse: 0, order: 0, bot: 100 }));
  expect(m).toMatchObject({ availability: 1, errorRate: 0, noDemand: true, averageLatency: null, peakLatency: null, orderSuccessRate: null });
});
it('weights successful routes and distinguishes peak from average', () => {
  const m = serviceMetrics(processRequests(baseline(3, true), { browse: 100, order: 10, bot: 0 }));
  expect(m.latencyNumerator).toBe(80 * 68 + 20 * 118 + 10 * 130);
  expect(m.peakLatency).toBe(130); expect(m.averageLatency).toBeCloseTo(9100 / 110);
});
it('fails baseline after20 bad ticks and timely scale resets the streak', () => {
  const failed = runServiceScenario(baseline(), blackFriday);
  expect(failed.runtime.time).toBe(50); expect(failed.termination).toBe('availability');
  let s = createServiceState(baseline(), blackFriday); s.runtime = startRuntime(s.runtime);
  while (s.runtime.time < 43) s = advanceService(s, blackFriday, s.runtime.time === 34 ? [{ time: 34, sequence: 0, type: 'SCALE_OUT' }] : []).nextState;
  expect(s.streaks.availability).toBe(0); expect(s.runtime.status).toBe('RUNNING');
});
it('ignores zero-demand ticks for consecutive failure and freezes pause', () => {
  const scenario = parseScenario({ ...blackFriday, duration: 21, traffic: [{ start: 0, end: 19, rps: 300, botRatio: 0 }, { start: 19, end: 20, rps: 0, botRatio: 0 }, { start: 20, end: 21, rps: 300, botRatio: 0 }] });
  const final = runServiceScenario(baseline(), scenario);
  expect(final.runtime.status).toBe('COMPLETED'); expect(final.streaks.availability).toBe(1);
  let s = createServiceState(baseline(), scenario); s.runtime = startRuntime(s.runtime);
  s = advanceService(s, scenario, []).nextState; s.runtime = pauseRuntime(s.runtime);
  expect(advanceService(s, scenario, []).nextState).toEqual(s);
});
it('critical Order flow fails before availability window', () => {
  const scenario = parseScenario({ ...blackFriday, businessMix: { browse: 0, order: 1 }, traffic: [{ start: 0, end: 180, rps: 200, botRatio: 0 }] });
  const s = runServiceScenario(baseline(3), scenario);
  expect(s.runtime.time).toBe(15); expect(s.termination).toBe('order');
});
it('budget wins over completion and finished state cannot advance', () => {
  const scenario = parseScenario({ ...blackFriday, budget: 137 });
  const s = runServiceScenario(baseline(4, true, true), scenario, [{ time: 120, sequence: 0, type: 'EMERGENCY_WAF' }]);
  expect(s.runtime.time).toBe(180); expect(s.termination).toBe('budget');
  expect(advanceService(s, scenario, []).nextState).toEqual(s);
});
it('protected3 delivers canonical full-run availability and weighted latency', () => {
  const s = runServiceScenario(baseline(3, true, true), blackFriday);
  expect(s.termination).toBe('completed'); expect(s.totals.availability).toBeCloseTo(.995, 10);
  expect(s.totals.averageLatency).toBeCloseTo(111.915884, 5);
  expect(s.economy.netBusinessValue).toBeCloseTo(366.69675, 6);
});

import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday, parseScenario } from '@stack-and-survive/scenarios';
import { advanceSimulation, createSimulation, simulateScenario } from './results';
import { pauseRuntime, resumeRuntime, startRuntime, type Action } from './runtime';
import { processRequests } from './index';
import { compare } from './economy';

// Independent arithmetic reference values from SIMULATION_SPEC v0.2 section 110, not recorded engine output.
const references = [
  { instances: 1, cache: false, waf: false, elapsed: 50, availability: 81.081081, latency: 230, cost: 14.166667, nbv: 51.373333, score: 1073 },
  { instances: 2, cache: false, waf: false, elapsed: 140, availability: 90.101010, latency: 259.180830, cost: 51.333333, nbv: 257.036667, score: 4305 },
  { instances: 2, cache: true, waf: false, elapsed: 140, availability: 91.919192, latency: 173.332845, cost: 70, nbv: 239.72, score: 4549 },
  { instances: 2, cache: true, waf: true, elapsed: 140, availability: 96.219919, latency: 145.175753, cost: 77, nbv: 251.241081, score: 6539 },
  { instances: 4, cache: false, waf: false, elapsed: 140, availability: 94.141414, latency: 198.543826, cost: 74.666667, nbv: 265.503333, score: 5172 },
  { instances: 3, cache: true, waf: false, elapsed: 180, availability: 95.683453, latency: 148.593340, cost: 105, nbv: 352.62, score: 7585 },
  { instances: 4, cache: true, waf: false, elapsed: 180, availability: 100, latency: 101.948019, cost: 120, nbv: 363.72, score: 8500 },
  { instances: 3, cache: true, waf: true, elapsed: 180, availability: 99.5, latency: 111.915884, cost: 114, nbv: 366.696750, score: 9450 },
  { instances: 4, cache: true, waf: true, elapsed: 180, availability: 99.5, latency: 106.537787, cost: 129, nbv: 351.696750, score: 8892 },
];
function near(actual: number | null, expected: number): void {
  expect(actual).not.toBeNull();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(1e-6 * Math.max(1, Math.abs(expected)));
}
it.each(references)('matches canonical v0.2 $instances instances/cache=$cache/waf=$waf', r => {
  const result = simulateScenario(baseline(r.instances, r.cache, r.waf), blackFriday);
  expect(result.elapsedTime).toBe(r.elapsed); expect(result.score).toBe(r.score);
  expect(result.status).toBe(r.elapsed === 180 ? 'COMPLETED' : 'FAILED');
  expect(result.termination).toBe(r.elapsed === 180 ? 'completed' : 'availability');
  const expectedPrimary = r.instances === 1 ? 'App Service Saturation'
    : r.instances === 4 && !r.cache ? 'Azure SQL Saturation'
    : r.instances === 2 || (r.instances === 3 && !r.waf) ? 'Unfiltered Bot Traffic'
    : r.instances === 4 && r.waf ? 'Overprovisioning' : 'No Critical Issue';
  expect(result.primary).toBe(expectedPrimary);
  expect(result.bottleneck).toBe(expectedPrimary === 'App Service Saturation' || expectedPrimary === 'Unfiltered Bot Traffic'
    ? 'App Service' : expectedPrimary === 'Azure SQL Saturation' ? 'Azure SQL' : null);
  near(result.metrics.availability * 100, r.availability); near(result.metrics.averageLatency, r.latency);
  near(result.economy.infrastructureCost, r.cost); near(result.economy.netBusinessValue, r.nbv);
  expect(simulateScenario(baseline(r.instances, r.cache, r.waf), blackFriday)).toEqual(result);
});
it('matches reactive scaling without erasing earlier failures', () => {
  const result = simulateScenario(baseline(2, true, true), blackFriday, [{ time: 124, sequence: 0, type: 'SCALE_OUT' }]);
  expect(result.status).toBe('COMPLETED'); expect(result.elapsedTime).toBe(180); expect(result.score).toBe(9170);
  near(result.metrics.availability * 100, 98.098296); near(result.economy.infrastructureCost, 103); near(result.economy.netBusinessValue, 369.221348);
  expect(result.targetAttainment.availability).toBe(false);
});
it('matches emergency bridge, expiry and late-scaling counterfactual', () => {
  const actions: Action[] = [{ time: 120, sequence: 0, type: 'EMERGENCY_WAF' }, { time: 142, sequence: 1, type: 'SCALE_OUT' }];
  const result = simulateScenario(baseline(2, true, true), blackFriday, actions);
  expect(result.status).toBe('COMPLETED'); expect(result.score).toBe(9298);
  near(result.metrics.availability * 100, 98.127830); near(result.economy.infrastructureCost, 101.5);
  near(result.economy.netBusinessValue, 362.899926); expect(result.economy.emergencyCost).toBe(8);
  expect(result.elapsedTime).toBe(180);
  const expired = simulateScenario(baseline(2, true, true), blackFriday, actions.slice(0, 1));
  const late = simulateScenario(baseline(2, true, true), blackFriday, actions.slice(1));
  expect(expired).toMatchObject({ elapsedTime: 171, status: 'FAILED', termination: 'availability', primary: 'Unfiltered Bot Traffic' });
  expect(late).toMatchObject({ elapsedTime: 140, status: 'FAILED', termination: 'availability', primary: 'Unfiltered Bot Traffic' });
  expect(late.economy.emergencyCost).toBe(0);
});
it('matches rate-limit trade-off and exact budget exhaustion', () => {
  const result = simulateScenario(baseline(3, true, true), blackFriday, [{ time: 118, sequence: 0, type: 'RATE_LIMIT', enabled: true }, { time: 178, sequence: 1, type: 'RATE_LIMIT', enabled: false }]);
  expect(result.score).toBe(8977); near(result.metrics.averageLatency, 106.788914); near(result.metrics.availability * 100, 97.352518);
  expect(result).toMatchObject({ status: 'COMPLETED', elapsedTime: 180, termination: 'completed', primary: 'Excessive Rate Limiting' });
  near(result.economy.netBusinessValue, 353.712);
  const exhausted = simulateScenario(baseline(4, true, true), parseScenario({ ...blackFriday, budget: 137 }), [{ time: 120, sequence: 0, type: 'EMERGENCY_WAF' }]);
  expect(exhausted.status).toBe('FAILED'); expect(exhausted.elapsedTime).toBe(180); expect(exhausted.primary).toBe('Budget Exhaustion');
  expect(compare(exhausted.economy.remainingBudget, 0)).toBe(0);
  near(exhausted.economy.infrastructureCost + exhausted.economy.emergencyCost, 137);
});
it('every tick conserves requests and repeated pauses leave full state untouched', () => {
  let state = createSimulation(baseline(3, true, true), blackFriday); state.runtime = startRuntime(state.runtime);
  while (state.runtime.status === 'RUNNING') {
    const frozen = structuredClone(state); frozen.runtime = pauseRuntime(state.runtime);
    const before = structuredClone(frozen);
    for (let i = 0; i < 3; i++) {
      const paused = advanceSimulation(frozen, blackFriday, [{ time: frozen.runtime.time, sequence: 1000, type: 'SCALE_OUT' }]);
      expect(paused.snapshot).toBeNull();
      expect(paused.outcomes[0].accepted).toBe(false);
      expect(paused.nextState).toEqual(before);
      expect(frozen).toEqual(before);
      expect(paused.nextState.economy).toEqual(before.economy);
      expect(paused.nextState.streaks).toEqual(before.streaks);
    }
    state.runtime = resumeRuntime(frozen.runtime);
    const result = advanceSimulation(state, blackFriday);
    const r = result.snapshot!.requests;
    for (const kind of ['browse', 'order'] as const) {
      const sqlLost = kind === 'browse' ? r.sql.readsDropped : r.sql.writesDropped;
      near(r.successful[kind] + r.edge.filtered[kind] + r.rateLimit.rejected[kind] + r.app.dropped[kind] + sqlLost, r.offered[kind]);
    }
    state = result.nextState;
  }
  expect(state.runtime.time).toBe(180); expect(state.attribution.ticks).toBe(180);
});
it('replays from the original architecture rather than the final scaled architecture', () => {
  const initial = baseline(2, true, true);
  const original = structuredClone(initial);
  const actions: Action[] = [{ time: 124, sequence: 0, type: 'SCALE_OUT' }, { time: 125, sequence: 1, type: 'SCALE_OUT' }];
  let state = createSimulation(initial, blackFriday); state.runtime = startRuntime(state.runtime);
  while (state.runtime.status === 'RUNNING') state = advanceSimulation(state, blackFriday, actions.filter(a => a.time === state.runtime.time)).nextState;
  expect(initial.resources.find(r => r.kind === 'compute')!.instances).toBe(2);
  expect(state.runtime.architecture.resources.find(r => r.kind === 'compute')!.instances).toBe(3);
  expect(initial).toEqual(original);
  expect(state.runtime.initialArchitecture).toEqual(original);
  expect(state.runtime.actionLog.map(o => o.accepted)).toEqual([true, false]);
  const logged = state.runtime.actionLog.map(o => o.action);
  expect(logged).toEqual(actions);
  expect(simulateScenario(state.runtime.initialArchitecture!, blackFriday, logged)).toEqual(simulateScenario(initial, blackFriday, actions));
  let replay = createSimulation(state.runtime.initialArchitecture!, blackFriday); replay.runtime = startRuntime(replay.runtime);
  while (replay.runtime.status === 'RUNNING') replay = advanceSimulation(replay, blackFriday, logged.filter(a => a.time === replay.runtime.time)).nextState;
  expect(replay.runtime.actionLog).toEqual(state.runtime.actionLog);
  expect(replay).toEqual(state);
});

it.each([false, true])('rate limit follows proportional admission when saturated=%s', saturated => {
  const architecture = baseline(saturated ? 1 : 4, true, true);
  const traffic = { browse: 240, order: 60, bot: 200 };
  const before = processRequests(architecture, traffic);
  const after = processRequests(architecture, traffic, { rateLimit: true, emergency: false });
  near(after.app.incoming, before.app.incoming * .95);
  expect(after.app.utilization).toBeLessThan(before.app.utilization);
  expect(after.edge.filtered).toEqual(before.edge.filtered);
  for (const kind of ['browse', 'order', 'bot'] as const) {
    near(after.app.accepted[kind], before.app.accepted[kind] * (saturated ? 1 : .95));
  }
  near(after.sql.readDemand, before.sql.readDemand * (saturated ? 1 : .95));
  near(after.sql.writeDemand, before.sql.writeDemand * (saturated ? 1 : .95));
});

it('observes reactive scale activation and recovery at exactly tick132', () => {
  let state = createSimulation(baseline(2, true, true), blackFriday); state.runtime = startRuntime(state.runtime);
  while (state.runtime.time <= 132) {
    const time = state.runtime.time;
    const result = advanceSimulation(state, blackFriday, time === 124 ? [{ time: 124, sequence: 0, type: 'SCALE_OUT' }] : []);
    if (time === 131) {
      expect(result.snapshot!.requests.app.capacity).toBe(300);
      expect(result.nextState.streaks.availability).toBe(12);
    }
    if (time === 132) {
      expect(result.snapshot!.requests.app.capacity).toBe(450);
      expect(result.nextState.streaks.availability).toBe(0);
      expect(result.nextState.totals.availability).toBeLessThan(.99);
    }
    state = result.nextState;
  }
});

it('keeps future actions until their tick and does not execute them after failure', () => {
  for (const withEmergency of [true, false]) {
    const actions: Action[] = [
      ...(withEmergency ? [{ time: 120, sequence: 0, type: 'EMERGENCY_WAF' } as const] : []),
      { time: 142, sequence: 1, type: 'SCALE_OUT' },
    ];
    const original = structuredClone(actions);
    let state = createSimulation(baseline(2, true, true), blackFriday); state.runtime = startRuntime(state.runtime);
    while (state.runtime.status === 'RUNNING') {
      const time = state.runtime.time;
      const result = advanceSimulation(state, blackFriday, actions.filter(a => a.time === time));
      if (time < 142) expect(result.nextState.runtime.actionLog.some(o => o.action.type === 'SCALE_OUT')).toBe(false);
      if (withEmergency && time >= 121 && time < 151) expect(result.snapshot!.requests.edge.filtered.bot).toBe(180);
      if (withEmergency && time === 149) expect(result.snapshot!.requests.app.capacity).toBe(300);
      if (withEmergency && time === 150) expect(result.snapshot!.requests.app.capacity).toBe(450);
      if (withEmergency && time === 151) expect(result.snapshot!.requests.edge.filtered.bot).toBe(140);
      state = result.nextState;
    }
    expect(actions).toEqual(original);
    expect(state.runtime.status).toBe(withEmergency ? 'COMPLETED' : 'FAILED');
    expect(state.runtime.actionLog.map(o => o.action)).toEqual(withEmergency ? actions : []);
    expect(state.runtime.architecture.resources.find(r => r.kind === 'compute')!.instances).toBe(withEmergency ? 3 : 2);
  }
});

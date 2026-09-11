import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday, parseScenario } from '@stack-and-survive/scenarios';
import { activeCostPerMinute, advanceEconomy, compare, createEconomicState, type EconomicState } from './economy';
import { pauseRuntime, startRuntime, type Action } from './runtime';
import type { Scenario } from '@stack-and-survive/schema';

function started(instances = 1, cache = false, edge = false, scenario: Scenario = blackFriday): EconomicState {
  const state = createEconomicState(baseline(instances, cache, edge), scenario);
  state.runtime = startRuntime(state.runtime); return state;
}
it('charges active disconnected resources but not pending resources', () => {
  const a = baseline(3, true, true); a.connections = baseline(3).connections;
  expect(activeCostPerMinute(a)).toBe(38);
  a.resources.find(r => r.kind === 'cache')!.remaining = 5;
  expect(activeCostPerMinute(a)).toBe(30);
  const state = createEconomicState(a, blackFriday); state.runtime = startRuntime(state.runtime);
  const result = advanceEconomy(state, blackFriday, []);
  expect(result.nextState.economy.infrastructureCost).toBeCloseTo(30 / 60);
  expect(result.transition.snapshot!.requests.edge.active).toBe(false);
  expect(result.transition.snapshot!.requests.cache.active).toBe(false);
});
it('no cost or revenue accumulates in preparation or pause', () => {
  const prep = createEconomicState(baseline(), blackFriday);
  expect(advanceEconomy(prep, blackFriday, []).nextState).toEqual(prep);
  const state = started(); state.runtime = pauseRuntime(state.runtime);
  expect(advanceEconomy(state, blackFriday, []).nextState).toEqual(state);
});
it('successful business generates value but does not refill operational budget', () => {
  const state = advanceEconomy(started(), blackFriday, []).nextState;
  expect(state.economy.revenue).toBeCloseTo(1.16);
  expect(state.economy.remainingBudget).toBeCloseTo(140 - 17 / 60);
  expect(state.economy.netBusinessValue).toBeCloseTo(1.16 - 17 / 60);
});
it('incident loss is additional to lost revenue including WAF false positives', () => {
  const state = advanceEconomy(started(3, true, true), blackFriday, []).nextState;
  expect(state.economy.incidentLoss).toBeCloseTo(1.16 * .005 * .25);
  expect(state.economy.revenue).toBeCloseTo(1.16 * .995);
});
it('scaling cost begins at activation, not request time', () => {
  let s = started(); const action: Action = { time: 0, sequence: 0, type: 'SCALE_OUT' };
  s = advanceEconomy(s, blackFriday, [action]).nextState;
  while (s.runtime.time < 8) s = advanceEconomy(s, blackFriday, []).nextState;
  expect(s.economy.infrastructureCost).toBeCloseTo(8 * 17 / 60);
  s = advanceEconomy(s, blackFriday, []).nextState;
  expect(s.economy.infrastructureCost).toBeCloseTo((8 * 17 + 22) / 60);
});
it('charges emergency once and accounts for prior same-tick spending', () => {
  const scenario = parseScenario({ ...blackFriday, budget: 8.1 });
  const s = started(3, true, true, scenario);
  const result = advanceEconomy(s, scenario, [
    { time: 0, sequence: 0, type: 'EMERGENCY_WAF' }, { time: 0, sequence: 1, type: 'SCALE_OUT' },
  ]);
  expect(result.transition.outcomes.map(o => o.accepted)).toEqual([true, false]);
  expect(result.nextState.economy.emergencyCost).toBe(8);
});
it('rejects emergency at exactly8 credits without consuming use', () => {
  const scenario = parseScenario({ ...blackFriday, budget: 8 });
  const s = started(3, true, true, scenario);
  const result = advanceEconomy(s, scenario, [{ time: 0, sequence: 0, type: 'EMERGENCY_WAF' }]);
  expect(result.transition.outcomes[0].accepted).toBe(false);
  expect(result.nextState.runtime.emergencyUsed).toBe(false); expect(result.nextState.economy.emergencyCost).toBe(0);
});
it('maximum stack plus emergency spends137 and exact reduced budget fails', () => {
  for (const budget of [140, 137]) {
    const scenario = parseScenario({ ...blackFriday, budget });
    let state = createEconomicState(baseline(4, true, true), scenario); state.runtime = startRuntime(state.runtime);
    while (state.runtime.status === 'RUNNING') {
      state = advanceEconomy(state, scenario, state.runtime.time === 120 ? [{ time: 120, sequence: 0, type: 'EMERGENCY_WAF' }] : []).nextState;
    }
    expect(state.runtime.time).toBe(180);
    expect(state.economy.infrastructureCost).toBeCloseTo(129, 10); expect(state.economy.emergencyCost).toBe(8);
    expect(state.runtime.status).toBe(budget === 140 ? 'COMPLETED' : 'FAILED');
  }
  expect(compare(1e-12, 0)).toBe(0);
});
it.each([[-1e-6, false], [0, true], [1e-6, true]] as const)('checks post-scale tick affordability at offset %s', (offset, accepted) => {
  const scenario = parseScenario({ ...blackFriday, budget: 22 / 60 + offset });
  const result = advanceEconomy(started(1, false, false, scenario), scenario, [{ time: 0, sequence: 0, type: 'SCALE_OUT' }]);
  expect(result.transition.outcomes[0].accepted).toBe(accepted);
  expect(result.nextState.runtime.scaleDue).toBe(accepted ? 8 : null);
  expect(result.nextState.economy.remainingBudget).toBeCloseTo(scenario.budget - 17 / 60);
});

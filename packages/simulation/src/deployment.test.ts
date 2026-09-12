import { expect, it } from 'vitest';
import { baseline, validateStart } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { createSimulation, advanceSimulation } from './results';
import { pauseRuntime, resumeRuntime, startRuntime, type Action } from './runtime';
import { activeCostPerMinute } from './economy';

it.each([['cache', 5, 8], ['edge', 4, 3]] as const)('%s stays inert until exact activation tick', (kind, duration, cost) => {
  let state = createSimulation(baseline(), blackFriday); state.runtime = startRuntime(state.runtime);
  const before = structuredClone(state);
  const action: Action = { type: 'DEPLOY_RESOURCE', kind, x: 0, y: 0, time: 0, sequence: 0 };
  let tick = advanceSimulation(state, blackFriday, [action, { ...action, sequence: 1 }]);
  expect(tick.outcomes.map(o => o.accepted)).toEqual([true, false]); expect(state).toEqual(before);
  state = tick.nextState;
  for (let t = 1; t <= duration; t++) {
    expect(tick.snapshot!.requests[kind].active).toBe(false);
    expect(activeCostPerMinute(state.runtime.architecture)).toBe(17);
    expect(validateStart(state.runtime.architecture)).toEqual([]);
    tick = advanceSimulation(state, blackFriday); state = tick.nextState;
  }
  expect(tick.snapshot!.time).toBe(duration); expect(tick.snapshot!.requests[kind].active).toBe(true);
  expect(activeCostPerMinute(state.runtime.architecture)).toBe(17 + cost);
  expect(validateStart(state.runtime.architecture)).toEqual([]);
  expect(state.runtime.architecture.connections).toContainEqual({ from: 'compute', to: 'database' });
});
it('freezes deployment during pause and rejects terminal or malformed actions', () => {
  let state = createSimulation(baseline(), blackFriday); state.runtime = startRuntime(state.runtime);
  const action: Action = { type: 'DEPLOY_RESOURCE', kind: 'cache', x: 0, y: 0, time: 0, sequence: 0 };
  state = advanceSimulation(state, blackFriday, [action]).nextState;
  state.runtime = pauseRuntime(state.runtime);
  expect(advanceSimulation(state, blackFriday).nextState).toEqual(state);
  state.runtime = resumeRuntime(state.runtime);
  expect(advanceSimulation(state, blackFriday).nextState.runtime.time).toBe(2);
  expect(() => advanceSimulation(state, blackFriday, [{ ...action, x: NaN }])).toThrow();
  state.runtime.status = 'FAILED';
  expect(advanceSimulation(state, blackFriday, [action]).outcomes[0].accepted).toBe(false);
});
it('supports simultaneous independent expansions without replacing write routing', () => {
  let state = createSimulation(baseline(), blackFriday); state.runtime = startRuntime(state.runtime);
  state = advanceSimulation(state, blackFriday, [
    { type: 'DEPLOY_RESOURCE', kind: 'cache', x: -200, y: 100, time: 0, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'edge', x: 0, y: -150, time: 0, sequence: 1 },
    { type: 'SCALE_OUT', time: 0, sequence: 2 },
  ]).nextState;
  while (state.runtime.time < 9) state = advanceSimulation(state, blackFriday).nextState;
  expect(validateStart(state.runtime.architecture)).toEqual([]);
  expect(state.runtime.architecture.resources.find(r => r.kind === 'compute')!.instances).toBe(2);
  expect(activeCostPerMinute(state.runtime.architecture)).toBe(33);
});
it('rejects unaffordable expansion without charging or adding a pending resource', () => {
  const state = createSimulation(baseline(), blackFriday); state.runtime = startRuntime(state.runtime);
  state.economy.remainingBudget = .3;
  const tick = advanceSimulation(state, blackFriday, [{ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 0, y: 0, time: 0, sequence: 0 }]);
  expect(tick.outcomes[0]).toMatchObject({ accepted: false });
  expect(tick.nextState.runtime.architecture.resources.some(r => r.kind === 'cache')).toBe(false);
  expect(tick.nextState.economy.emergencyCost).toBe(0);
});

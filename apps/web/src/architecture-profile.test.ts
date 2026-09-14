import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { advanceSimulation, createSimulation, simulationResult } from '@stack-and-survive/simulation/results';
import { startRuntime, type Action } from '@stack-and-survive/simulation/runtime';
import { summarizeRun } from './run-history';
import { classifyArchitecture } from './architecture-profile';

type Intent = Action extends infer A ? A extends Action ? Omit<A, 'sequence'> : never : never;
const scale = (time: number): Intent => ({ type: 'SCALE_OUT', time });
const cache = (time: number): Intent => ({ type: 'DEPLOY_RESOURCE', kind: 'cache', time, x: 190, y: -100 });
const edge = (time: number): Intent => ({ type: 'DEPLOY_RESOURCE', kind: 'edge', time, x: -210, y: 0 });
function run(intents: Intent[]) {
  const actions: Action[] = intents.map((action, sequence) => ({ ...action, sequence }));
  let state = createSimulation(baseline(), blackFridayChallenge.workload);
  state.runtime = startRuntime(state.runtime);
  while (state.runtime.status === 'RUNNING') state = advanceSimulation(state, blackFridayChallenge.workload, actions.filter(a => a.time === state.runtime.time)).nextState;
  return summarizeRun({ ...simulationResult(state, blackFridayChallenge.workload), challenge: blackFridayChallenge,
    initialArchitecture: baseline(), actionLog: state.runtime.actionLog }, state.runtime.architecture, 'profile-fixture');
}

it.each([
  { id: 'cache-led', actions: [scale(20), cache(65), scale(66), scale(110)] },
  { id: 'layered', actions: [scale(22), cache(70), edge(71), scale(112)] },
  { id: 'cache-first', actions: [cache(0), scale(22), edge(71), scale(112)] },
  { id: 'emergency-bridge', actions: [scale(22), cache(70), edge(71), { type: 'EMERGENCY_WAF', time: 120 } as Intent, scale(142)] },
])('describes a reachable completed live $id run without ranking it', ({ id, actions }) => {
  const summary = run(actions);
  expect(summary.status).toBe('COMPLETED');
  const profile = classifyArchitecture(summary);
  expect(profile.id).toBe(id);
  expect(profile.evidence.length).toBeGreaterThanOrEqual(2);
  expect(profile.evidence.join(' ')).toContain('180s');
  expect(classifyArchitecture(structuredClone(summary))).toEqual(profile);
});

it('uses accepted order including sequence ties, never rejected requests', () => {
  const sameTick = run([cache(0), scale(0), edge(71), scale(112)]);
  expect(classifyArchitecture(sameTick).id).toBe('cache-first');
  const reverse = run([scale(0), cache(0), edge(71), scale(112)]);
  expect(classifyArchitecture(reverse).id).toBe('layered');
  const rejected = run([scale(22), cache(70), edge(71), scale(112)]);
  rejected.actionLog.unshift({ action: { type: 'EMERGENCY_WAF', time: 0, sequence: 0 }, accepted: false, reason: 'No Edge' });
  expect(classifyArchitecture(rejected).id).toBe('layered');
});

it('does not call failures complete or missing and pending evidence a known strategy', () => {
  const failed = run([]);
  expect(classifyArchitecture(failed).id).toBe('mixed');
  expect(classifyArchitecture(failed).evidence.join(' ')).toContain('Stopped at 50s');
  expect(classifyArchitecture(null).id).toBe('unknown');
  const pending = run([scale(20), cache(65), scale(66), scale(110), edge(179)]);
  expect(pending.finalArchitecture.resources.find(r => r.kind === 'edge')?.remaining).toBeGreaterThan(0);
  expect(classifyArchitecture(pending).id).toBe('cache-led');
  const noCharge = run([scale(22), cache(70), edge(71), scale(112)]);
  noCharge.actionLog.push({ action: { type: 'EMERGENCY_WAF', time: 179, sequence: 4 }, accepted: true, reason: null });
  expect(classifyArchitecture(noCharge).id).toBe('layered');
});

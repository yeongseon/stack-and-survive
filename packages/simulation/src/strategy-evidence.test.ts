import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { advanceSimulation, createSimulation, simulationResult } from './results';
import { startRuntime, type Action } from './runtime';
import { blackFridayChallenge, evaluateObjective } from '@stack-and-survive/scenarios/challenge';
import { compare } from './economy';

type PlanAction = Action extends infer A ? A extends Action ? Omit<A, 'sequence'> : never : never;
const scale = (time: number): PlanAction => ({ type: 'SCALE_OUT', time });
const cache = (time: number): PlanAction => ({ type: 'DEPLOY_RESOURCE', kind: 'cache', time, x: 190, y: -100 });
const edge = (time: number): PlanAction => ({ type: 'DEPLOY_RESOURCE', kind: 'edge', time, x: -210, y: 0 });
const strategies: { id: string; actions: PlanAction[] }[] = [
  { id: 'no-action', actions: [] },
  { id: 'scale-only', actions: [scale(20), scale(60), scale(110)] },
  { id: 'cache-scale', actions: [scale(20), cache(65), scale(66), scale(110)] },
  { id: 'edge-scale', actions: [scale(20), edge(65), scale(110)] },
  { id: 'balanced', actions: [scale(20), cache(65), edge(66), scale(110)] },
  { id: 'just-in-time-balanced', actions: [scale(22), cache(70), edge(71), scale(112)] },
  { id: 'emergency-bridge', actions: [scale(22), cache(70), edge(71), { type: 'EMERGENCY_WAF', time: 120 }, scale(142)] },
];
const expected: Record<string, { elapsed: number; availability: number; cost: number; emergencyCost: number; nbv: number; score: number; botsAtApp: number; botsProcessed: number }> = {
  'no-action': { elapsed: 50, availability: .8108108108108109, cost: 14.166666666667, emergencyCost: 0, nbv: 51.373333333333, score: 1073, botsAtApp: 0, botsProcessed: 0 },
  'scale-only': { elapsed: 140, availability: .9414141414141414, cost: 56.833333333333, emergencyCost: 0, nbv: 283.336666666667, score: 5296, botsAtApp: 6700, botsProcessed: 6700 },
  'cache-scale': { elapsed: 180, availability: 1, cost: 92.333333333333, emergencyCost: 0, nbv: 391.386666666667, score: 8500, botsAtApp: 14700, botsProcessed: 14700 },
  'edge-scale': { elapsed: 140, availability: .9406262626262616, cost: 54.383333333333, emergencyCost: 0, nbv: 284.640966666667, score: 6339, botsAtApp: 2010, botsProcessed: 2010 },
  balanced: { elapsed: 180, availability: .9964148681055149, cost: 89, emergencyCost: 0, nbv: 392.55225, score: 9478, botsAtApp: 4410, botsProcessed: 4410 },
  'just-in-time-balanced': { elapsed: 180, availability: .9965467625899274, cost: 87.75, emergencyCost: 0, nbv: 393.882, score: 9481, botsAtApp: 4410, botsProcessed: 4410 },
  'emergency-bridge': { elapsed: 180, availability: .9828250662933443, cost: 85.25, emergencyCost: 8, nbv: 380.085176334272, score: 9329, botsAtApp: 3210, botsProcessed: 3179.694735567543 },
};

function measure(plan: typeof strategies[number]) {
  const actions: Action[] = plan.actions.map((action, sequence) => ({ ...action, sequence }));
  let state = createSimulation(baseline(), blackFriday); state.runtime = startRuntime(state.runtime);
  let botsAtApp = 0, botsProcessed = 0;
  while (state.runtime.status === 'RUNNING') {
    const next = advanceSimulation(state, blackFriday, actions.filter(a => a.time === state.runtime.time));
    expect(next.outcomes.every(outcome => outcome.accepted)).toBe(true);
    botsAtApp += next.snapshot!.requests.rateLimit.passed.bot;
    botsProcessed += next.snapshot!.requests.app.accepted.bot;
    state = next.nextState;
  }
  const result = simulationResult(state, blackFriday);
  return { id: plan.id, status: result.status, elapsed: result.elapsedTime, termination: result.termination,
    objectiveMet: evaluateObjective(blackFridayChallenge, result),
    availability: result.metrics.availability, cost: result.economy.infrastructureCost, emergencyCost: result.economy.emergencyCost,
    nbv: result.economy.netBusinessValue, score: result.score, peaks: result.attribution.peaks,
    botsAtApp, botsProcessed, botDisplacement: result.attribution.botDisplacement,
    cacheEfficiency: result.cacheHitRatio, actions: state.runtime.actionLog };
}

it.each(strategies)('matches measured repeatable live plan from App1: $id', plan => {
  const measured = measure(plan); expect(measure(plan)).toEqual(measured);
  const reference = expected[plan.id];
  expect(measured.elapsed).toBe(reference.elapsed); expect(measured.score).toBe(reference.score);
  expect(measured.objectiveMet).toBe(reference.elapsed === 180);
  expect(measured.status).toBe(reference.elapsed === 180 ? 'COMPLETED' : 'FAILED');
  expect(measured.termination).toBe(reference.elapsed === 180 ? 'completed' : 'availability');
  for (const field of ['availability', 'cost', 'emergencyCost', 'nbv', 'botsAtApp', 'botsProcessed'] as const) expect(measured[field]).toBeCloseTo(reference[field], 6);
  expect(measured.actions).toHaveLength(plan.actions.length);
  const sqlRead = plan.id === 'no-action' ? 2 / 3 : plan.id === 'scale-only' ? 4 / 3 : plan.id === 'edge-scale' ? 1.3266666666666667 : .9777777777777777;
  const sqlWrite = plan.id === 'no-action' ? 3 / 7 : plan.id === 'scale-only' || plan.id === 'cache-scale' ? 6 / 7 : .8528571428571429;
  expect(measured.peaks.sqlRead).toBeCloseTo(sqlRead, 6);
  expect(measured.peaks.sqlWrite).toBeCloseTo(sqlWrite, 6);
  expect(measured.peaks.app).toBeCloseTo(plan.id === 'no-action' ? 22 / 15 : plan.id === 'scale-only' || plan.id === 'cache-scale' ? 5 / 6 : plan.id === 'emergency-bridge' ? 1.195 : .856, 6);
  expect(measured.peaks.cache).toBeCloseTo(plan.id === 'cache-scale' ? .48 : plan.actions.some(action => action.type === 'DEPLOY_RESOURCE' && action.kind === 'cache') ? .4776 : 0, 6);
  expect(measured.botDisplacement).toBeCloseTo(plan.id === 'emergency-bridge' ? 4.027458932583502 : 0, 6);
  if (plan.id === 'no-action' || plan.id === 'scale-only' || plan.id === 'edge-scale') expect(measured.cacheEfficiency).toBe(null);
  else expect(measured.cacheEfficiency).toBeCloseTo(.8, 6);
});

it('offers three nondominated successful schedules in the tested set, without mistaking short failure for efficiency', () => {
  const all = strategies.map(measure);
  const completed = all.filter(result => result.objectiveMet);
  expect(completed).toHaveLength(4);
  const dominates = (a: typeof completed[number], b: typeof completed[number]) => {
    const differences = [compare(a.availability, b.availability), compare(b.cost + b.emergencyCost, a.cost + a.emergencyCost),
      compare(a.nbv, b.nbv), compare(b.botsProcessed, a.botsProcessed),
      compare(b.peaks.app, a.peaks.app), compare(b.peaks.sqlRead, a.peaks.sqlRead), compare(b.peaks.sqlWrite, a.peaks.sqlWrite)];
    return differences.every(value => value >= 0) && differences.some(value => value > 0);
  };
  expect(completed.filter(result => !completed.some(other => other !== result && dominates(other, result))).map(result => result.id))
    .toEqual(['cache-scale', 'just-in-time-balanced', 'emergency-bridge']);
  expect(completed.some(result => completed.every(other => other === result || dominates(result, other)))).toBe(false);
  expect(all[0].cost).toBeLessThan(Math.min(...completed.map(result => result.cost)));
  expect(all[0].objectiveMet).toBe(false);
});

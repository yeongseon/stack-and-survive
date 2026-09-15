import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { advanceSimulation, createSimulation, simulateScenario, simulationResult } from './results';
import { startRuntime, type Action } from './runtime';

const scale = (time: number): Action => ({ type: 'SCALE_OUT', time, sequence: 0 });
const cache = (time: number): Action => ({ type: 'DEPLOY_RESOURCE', kind: 'cache', time, sequence: 0, x: 190, y: -100 });
const edge = (time: number): Action => ({ type: 'DEPLOY_RESOURCE', kind: 'edge', time, sequence: 0, x: -210, y: 0 });
const plans = [
  { id: 'no-action', actions: [] },
  { id: 'scale-only', actions: [scale(16), scale(57), scale(102)] },
  { id: 'cache-scale', actions: [scale(16), cache(17), scale(57), scale(102)] },
  { id: 'layered', actions: [scale(16), cache(17), edge(57), scale(57)] },
  { id: 'early-max', actions: [cache(0), edge(0), scale(0), scale(8), scale(16)] },
];
const expected = [
  { time: 45, availability: .7142857142857143, funds: 68.63, revenue: 63.8, cost: 12.75, nbv: 44.67, score: 810 },
  { time: 45, availability: .9272727272727272, funds: 69.32, revenue: 88.2, cost: 14.5, nbv: 73.42, score: 3555 },
  { time: 180, availability: 1, funds: 26.473066666667, revenue: 519.564, cost: 100.483333333333, nbv: 419.080666666667, score: 8500 },
  { time: 180, availability: .9962011609734314, funds: 26.159026, revenue: 517.59026, cost: 100.6, nbv: 416.496825, score: 9474 },
  { time: 180, availability: .995044652824291, funds: 2.565604666667, revenue: 516.98938, cost: 124.133333333333, nbv: 392.212391666667, score: 8951 },
];
it('pins measured v0.3 strategies, keeping reinvestment useful but not unlimited', () => {
  const rows = plans.map(plan => {
    const actions = plan.actions.map((action, sequence) => ({ ...action, sequence }));
    const result = simulateScenario(baseline(), blackFriday, actions);
    expect(simulateScenario(baseline(), blackFriday, actions)).toEqual(result);
    let state=createSimulation(baseline(),blackFriday);state.runtime=startRuntime(state.runtime);
    while(state.runtime.status==='RUNNING')state=advanceSimulation(state,blackFriday,actions.filter(action=>action.time===state.runtime.time)).nextState;
    expect(simulationResult(state,blackFriday)).toEqual(result);
    expect(state.runtime.actionLog.every(outcome=>outcome.accepted)).toBe(true);
    expect(state.runtime.actionLog.map(outcome=>outcome.action)).toEqual(actions.filter(action=>action.time<result.elapsedTime));
    expect(result.economy.remainingBudget).toBeCloseTo(blackFriday.budget + result.economy.revenue * .1 - result.economy.infrastructureCost - result.economy.emergencyCost, 9);
    return { id: plan.id, status: result.status, time: result.elapsedTime, availability: result.metrics.availability, funds: result.economy.remainingBudget,
      revenue: result.economy.revenue, potential: result.economy.potentialRevenue, cost: result.economy.infrastructureCost, nbv: result.economy.netBusinessValue, score: result.score };
  });
  rows.forEach((row, index) => {
    const reference=expected[index];
    expect(row.time).toBe(reference.time); expect(row.score).toBe(reference.score);
    for(const key of ['availability','funds','revenue','cost','nbv'] as const) expect(row[key]).toBeCloseTo(reference[key],6);
  });
  expect(rows[0].status).toBe('FAILED');
  expect(rows.find(row => row.id === 'layered')?.status).toBe('COMPLETED');
  expect(rows[2].availability).toBeGreaterThan(.999);
  expect(rows[3].availability).toBeGreaterThan(.99);
  expect(rows[4].funds).toBeLessThan(3);
  const potential = blackFriday.traffic.reduce((sum, phase) => sum + (phase.end-phase.start)*phase.rps*(1-phase.botRatio)*(.8*.002+.2*.05),0);
  expect(potential).toBeCloseTo(519.564,9);
  expect(rows[2].revenue).toBeCloseTo(potential,9);
});

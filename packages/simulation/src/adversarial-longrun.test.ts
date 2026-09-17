import { describe, expect, it } from 'vitest';
import { createSimulation, advanceSimulation, simulateScenario } from './results';
import { startRuntime, type Action } from './runtime';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';

const scenario = blackFridayChallenge.workload;

describe('full-run stability (180-tick Black Friday)', () => {
  it('action log does not grow beyond accepted+rejected actions', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
    }

    // Action log should only contain the 4 actions we submitted
    expect(state.runtime.actionLog).toHaveLength(4);
    // All should be accepted
    expect(state.runtime.actionLog.every(o => o.accepted)).toBe(true);
  });

  it('phase attribution array is bounded by traffic phase count', () => {
    const r = simulateScenario(canonicalPlayerStart(), scenario, [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ]);
    // Phases should match traffic phases, not grow unbounded
    expect(r.phases.length).toBeLessThanOrEqual(scenario.traffic.length);
    expect(r.phases.length).toBeGreaterThan(0);
  });

  it('deployments array is empty at completion (all provisioned)', () => {
    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 0, sequence: 0, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 0, sequence: 1, x: -210, y: 0 },
    ];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
    }

    // After 180 ticks, all deployments should be provisioned
    expect(state.runtime.deployments).toEqual([]);
  });

  it('economy values remain stable across full 180-tick run', () => {
    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ];

    let prevBudget = state.economy.remainingBudget;

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;

      // Budget should never be NaN/Infinity
      expect(Number.isFinite(state.economy.remainingBudget)).toBe(true);
      expect(Number.isFinite(state.economy.infrastructureCost)).toBe(true);
      expect(Number.isFinite(state.economy.revenue)).toBe(true);

      // Budget changes should be bounded (no sudden jumps)
      const delta = Math.abs(state.economy.remainingBudget - prevBudget);
      expect(delta).toBeLessThan(50); // No single tick should shift budget by >50
      prevBudget = state.economy.remainingBudget;
    }

    expect(state.runtime.status).toBe('COMPLETED');
  });

  it('availability tracking is consistent across all ticks', () => {
    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    while (state.runtime.status === 'RUNNING') {
      const transition = advanceSimulation(state, scenario);
      state = transition.nextState;
    }

    // Availability must be in [0, 1]
    expect(state.totals.availability).toBeGreaterThanOrEqual(0);
    expect(state.totals.availability).toBeLessThanOrEqual(1);
    // Offered must be positive
    expect(state.totals.offered).toBeGreaterThan(0);
    // Successful must be <= offered
    expect(state.totals.successful).toBeLessThanOrEqual(state.totals.offered + 0.001); // epsilon
  });

  it('10 consecutive full simulations produce identical results (determinism)', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 57, sequence: 2, x: -210, y: 0 },
      { type: 'SCALE_OUT', time: 57, sequence: 3 },
    ];

    const results = Array.from({ length: 10 }, () =>
      simulateScenario(canonicalPlayerStart(), scenario, actions)
    );

    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBe(results[0].score);
      expect(results[i].elapsedTime).toBe(results[0].elapsedTime);
      expect(results[i].metrics.availability).toBe(results[0].metrics.availability);
      expect(results[i].economy.remainingBudget).toBe(results[0].economy.remainingBudget);
      expect(results[i].economy.infrastructureCost).toBe(results[0].economy.infrastructureCost);
    }
  });

  it('streaks reset properly and do not accumulate across simulation', () => {
    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    // No-action run will eventually fail on streaks
    let maxAvailStreak = 0;
    let maxOrderStreak = 0;

    while (state.runtime.status === 'RUNNING') {
      const transition = advanceSimulation(state, scenario);
      state = transition.nextState;
      maxAvailStreak = Math.max(maxAvailStreak, state.streaks.availability);
      maxOrderStreak = Math.max(maxOrderStreak, state.streaks.order);
    }

    expect(state.runtime.status).toBe('FAILED');
    // Streaks should be bounded by termination thresholds
    expect(maxAvailStreak).toBeLessThanOrEqual(20);
    expect(maxOrderStreak).toBeLessThanOrEqual(15);
  });
});

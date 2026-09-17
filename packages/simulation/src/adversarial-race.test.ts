import { describe, expect, it } from 'vitest';
import { createSimulation, advanceSimulation, simulateScenario } from './results';
import { startRuntime, type Action } from './runtime';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';

const scenario = blackFridayChallenge.workload;

describe('headless adversarial simulations', () => {
  it('maximum legal action density: all values finite and within bounds', () => {
    const actions: Action[] = [];
    let seq = 0;
    actions.push({ type: 'SCALE_OUT', time: 0, sequence: seq++ });
    actions.push({ type: 'DEPLOY_RESOURCE', kind: 'cache', time: 0, sequence: seq++, x: 190, y: -100 });
    actions.push({ type: 'DEPLOY_RESOURCE', kind: 'edge', time: 0, sequence: seq++, x: -210, y: 0 });
    actions.push({ type: 'RATE_LIMIT', enabled: true, time: 0, sequence: seq++ });
    actions.push({ type: 'RATE_LIMIT', enabled: false, time: 6, sequence: seq++ });
    actions.push({ type: 'SCALE_OUT', time: 9, sequence: seq++ });
    actions.push({ type: 'EMERGENCY_WAF', time: 10, sequence: seq++ });
    actions.push({ type: 'SCALE_OUT', time: 20, sequence: seq++ });

    const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(10000);
    expect(Number.isFinite(r.economy.remainingBudget)).toBe(true);
  });

  it('rate-limit toggling every tick: most rejected by cooldown, no crash', () => {
    const actions: Action[] = Array.from({ length: 179 }, (_, i) => ({
      type: 'RATE_LIMIT' as const,
      enabled: i % 2 === 0,
      time: i,
      sequence: i,
    }));

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);
    let accepted = 0;
    let rejected = 0;

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) {
        if (o.accepted) accepted++;
        else rejected++;
      }
    }

    // Most should be rejected due to 5-tick cooldown
    expect(rejected).toBeGreaterThan(accepted);
    expect(Number.isFinite(state.economy.remainingBudget)).toBe(true);
  });

  it('per-tick conservation: all numeric values finite for every tick of 180-tick run', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    let tickCount = 0;
    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      tickCount++;

      if (transition.snapshot) {
        const r = transition.snapshot.requests;
        for (const kind of ['browse', 'order', 'bot'] as const) {
          expect(Number.isFinite(r.offered[kind]), `tick ${tickCount}: offered.${kind}`).toBe(true);
          expect(r.offered[kind]).toBeGreaterThanOrEqual(0);
        }
        for (const kind of ['browse', 'order'] as const) {
          expect(Number.isFinite(r.successful[kind]), `tick ${tickCount}: successful.${kind}`).toBe(true);
          expect(r.successful[kind]).toBeGreaterThanOrEqual(0);
        }
        expect(Number.isFinite(r.app.capacity), `tick ${tickCount}: app.capacity`).toBe(true);
        expect(r.app.capacity).toBeGreaterThan(0);
      }
    }

    expect(state.runtime.status).toBe('COMPLETED');
    expect(tickCount).toBe(180);
  });
});

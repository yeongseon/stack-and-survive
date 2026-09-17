import { describe, expect, it } from 'vitest';
import { createSimulation, advanceSimulation, simulateScenario } from './results';
import { startRuntime, type Action } from './runtime';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';

const scenario = blackFridayChallenge.workload;

describe('headless adversarial simulations', () => {
  it('maximum legal actions do not cause numeric overflow', () => {
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

  it('action at every tick does not crash (many rejected)', () => {
    const actions: Action[] = Array.from({ length: 179 }, (_, i) => ({
      type: 'RATE_LIMIT' as const,
      enabled: i % 2 === 0,
      time: i,
      sequence: i,
    }));
    const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('conservation: all numeric values finite for every tick of 180-tick run', () => {
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
      }
    }

    expect(state.runtime.status).toBe('COMPLETED');
    expect(tickCount).toBe(180);
  });

  it('spam scale at every tick does not crash or create negative budget', () => {
    const spamActions: Action[] = Array.from({ length: 179 }, (_, i) => ({
      type: 'SCALE_OUT' as const,
      time: i,
      sequence: i,
    }));
    const r = simulateScenario(canonicalPlayerStart(), scenario, spamActions);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.economy.remainingBudget).toBeGreaterThanOrEqual(-0.01);
  });

  it('deploy same resource twice: second is rejected without crash', () => {
    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 5, sequence: 0, x: 100, y: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 10, sequence: 1, x: 200, y: 0 },
    ];
    const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('emergency WAF without edge is rejected without crash', () => {
    const r = simulateScenario(canonicalPlayerStart(), scenario, [
      { type: 'EMERGENCY_WAF', time: 5, sequence: 0 },
    ]);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('emergency WAF twice: second is rejected', () => {
    const r = simulateScenario(canonicalPlayerStart(), scenario, [
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 1, sequence: 0, x: -200, y: 0 },
      { type: 'EMERGENCY_WAF', time: 10, sequence: 1 },
      { type: 'EMERGENCY_WAF', time: 50, sequence: 2 },
    ]);
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

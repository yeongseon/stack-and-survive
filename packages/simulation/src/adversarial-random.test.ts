import { describe, expect, it } from 'vitest';
import { createSimulation, advanceSimulation, simulateScenario } from './results';
import { startRuntime, type Action } from './runtime';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';

const scenario = blackFridayChallenge.workload;

// Seeded PRNG for reproducible random sequences
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateRandomActions(seed: number, count: number): Action[] {
  const rng = mulberry32(seed);
  const actions: Action[] = [];
  const types = ['SCALE_OUT', 'RATE_LIMIT', 'DEPLOY_RESOURCE', 'EMERGENCY_WAF'] as const;

  for (let seq = 0; seq < count; seq++) {
    const time = Math.floor(rng() * 179);
    const typeIdx = Math.floor(rng() * types.length);
    const type = types[typeIdx];

    if (type === 'SCALE_OUT') {
      actions.push({ type: 'SCALE_OUT', time, sequence: seq });
    } else if (type === 'RATE_LIMIT') {
      actions.push({ type: 'RATE_LIMIT', enabled: rng() > 0.5, time, sequence: seq });
    } else if (type === 'DEPLOY_RESOURCE') {
      const kind = rng() > 0.5 ? 'cache' : 'edge';
      actions.push({ type: 'DEPLOY_RESOURCE', kind, time, sequence: seq, x: Math.floor(rng() * 400 - 200), y: Math.floor(rng() * 300 - 150) });
    } else {
      actions.push({ type: 'EMERGENCY_WAF', time, sequence: seq });
    }
  }

  // Sort by time then sequence for valid ordering
  actions.sort((a, b) => a.time - b.time || a.sequence - b.sequence);
  // Re-assign monotonic sequences
  actions.forEach((a, i) => { (a as { sequence: number }).sequence = i; });
  return actions;
}

describe('random action sequence fuzzing', () => {
  const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

  it.each(seeds)('seed %i: 20 random actions complete without crash or invalid state', (seed) => {
    const actions = generateRandomActions(seed, 20);
    const r = simulateScenario(canonicalPlayerStart(), scenario, actions);

    // Property invariants
    expect(Number.isFinite(r.score), `seed ${seed}: score finite`).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(10000);
    expect(Number.isFinite(r.metrics.availability)).toBe(true);
    expect(r.metrics.availability).toBeGreaterThanOrEqual(0);
    expect(r.metrics.availability).toBeLessThanOrEqual(1);
    expect(Number.isFinite(r.economy.remainingBudget)).toBe(true);
    expect(Number.isFinite(r.economy.infrastructureCost)).toBe(true);
    expect(['COMPLETED', 'FAILED']).toContain(r.status);
    expect(r.elapsedTime).toBeGreaterThan(0);
    expect(r.elapsedTime).toBeLessThanOrEqual(180);
  });

  it('seed 99: 50 random actions with per-tick invariant checking', () => {
    const actions = generateRandomActions(99, 50);

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    let tick = 0;
    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      tick++;

      // Per-tick invariants
      expect(Number.isFinite(state.economy.remainingBudget), `tick ${tick}: budget finite`).toBe(true);
      expect(Number.isFinite(state.economy.infrastructureCost), `tick ${tick}: cost finite`).toBe(true);
      expect(state.runtime.time).toBeGreaterThanOrEqual(0);
      expect(state.runtime.time).toBeLessThanOrEqual(180);

      // Architecture invariants
      for (const r of state.runtime.architecture.resources) {
        expect(r.instances).toBeGreaterThanOrEqual(1);
        expect(r.instances).toBeLessThanOrEqual(4);
        expect(r.remaining).toBeGreaterThanOrEqual(0);
      }

      // No duplicate resource kinds
      const kinds = state.runtime.architecture.resources.map(r => r.kind);
      expect(new Set(kinds).size).toBe(kinds.length);

      if (transition.snapshot) {
        const req = transition.snapshot.requests;
        expect(req.app.capacity).toBeGreaterThan(0);
        for (const kind of ['browse', 'order'] as const) {
          expect(req.successful[kind]).toBeGreaterThanOrEqual(0);
        }
      }
    }

    expect(['COMPLETED', 'FAILED']).toContain(state.runtime.status);
  });

  it('seed 42: 100 random actions stress test', () => {
    const actions = generateRandomActions(42, 100);
    const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});

describe('random player vs intentional strategy comparison', () => {
  it('intentional strategy outperforms random actions on average', () => {
    const intentional = simulateScenario(canonicalPlayerStart(), scenario, [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ]);

    const randomScores: number[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const actions = generateRandomActions(seed, 10);
      const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
      randomScores.push(r.score);
    }

    const avgRandom = randomScores.reduce((a, b) => a + b, 0) / randomScores.length;

    // Intentional strategy (8500) should beat average random
    expect(intentional.score).toBeGreaterThan(avgRandom);
    // There should be meaningful variance in random scores
    const min = Math.min(...randomScores);
    const max = Math.max(...randomScores);
    expect(max - min).toBeGreaterThan(100);
  });

  it('do-nothing is worse than random on average', () => {
    const doNothing = simulateScenario(canonicalPlayerStart(), scenario, []);

    const randomScores: number[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const actions = generateRandomActions(seed, 10);
      const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
      randomScores.push(r.score);
    }

    const avgRandom = randomScores.reduce((a, b) => a + b, 0) / randomScores.length;
    expect(avgRandom).toBeGreaterThan(doNothing.score);
  });
});

describe('event stacking verification', () => {
  it('emergency WAF expires after 30 ticks and cannot be reactivated', () => {
    // Deploy edge, then use emergency WAF
    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 0, sequence: 0, x: -200, y: 0 },
      { type: 'EMERGENCY_WAF', time: 10, sequence: 1 },
      // Try to use emergency again at tick 50 (after expiry)
      { type: 'EMERGENCY_WAF', time: 50, sequence: 2 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    let emergencyActive = false;
    let emergencyExpired = false;
    let secondEmergencyAccepted = false;

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;

      if (state.runtime.emergency) emergencyActive = true;
      if (emergencyActive && !state.runtime.emergency) emergencyExpired = true;

      // Check if second emergency was accepted
      for (const outcome of transition.outcomes) {
        if (outcome.action.sequence === 2 && outcome.accepted) secondEmergencyAccepted = true;
      }
    }

    expect(emergencyActive).toBe(true);
    expect(emergencyExpired).toBe(true);
    expect(secondEmergencyAccepted).toBe(false); // Cannot reuse
    expect(state.runtime.emergencyUsed).toBe(true);
  });

  it('rate limit toggle has 5-tick cooldown', () => {
    const actions: Action[] = [
      { type: 'RATE_LIMIT', enabled: true, time: 0, sequence: 0 },
      { type: 'RATE_LIMIT', enabled: false, time: 3, sequence: 1 }, // Too soon — rejected
      { type: 'RATE_LIMIT', enabled: false, time: 6, sequence: 2 }, // After cooldown — accepted
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const outcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) {
        outcomes.push({ seq: o.action.sequence, accepted: o.accepted });
      }
    }

    const seq0 = outcomes.find(o => o.seq === 0);
    const seq1 = outcomes.find(o => o.seq === 1);
    const seq2 = outcomes.find(o => o.seq === 2);

    expect(seq0?.accepted).toBe(true);  // First toggle accepted
    expect(seq1?.accepted).toBe(false); // Too soon — cooldown
    expect(seq2?.accepted).toBe(true);  // After cooldown
  });

  it('scale-out 8-tick delay does not stack with concurrent requests', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 0, sequence: 0 },
      { type: 'SCALE_OUT', time: 1, sequence: 1 }, // Should be rejected — pending
      { type: 'SCALE_OUT', time: 9, sequence: 2 }, // After first completes
      { type: 'SCALE_OUT', time: 10, sequence: 3 }, // Should be rejected — pending
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const outcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) {
        outcomes.push({ seq: o.action.sequence, accepted: o.accepted });
      }
    }

    expect(outcomes.find(o => o.seq === 0)?.accepted).toBe(true);
    expect(outcomes.find(o => o.seq === 1)?.accepted).toBe(false); // Pending
    expect(outcomes.find(o => o.seq === 2)?.accepted).toBe(true);
    expect(outcomes.find(o => o.seq === 3)?.accepted).toBe(false); // Pending
  });
});

describe('collection growth measurement', () => {
  it('no unbounded arrays grow during 180-tick simulation', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 30, sequence: 2, x: -210, y: 0 },
      { type: 'SCALE_OUT', time: 57, sequence: 3 },
      { type: 'SCALE_OUT', time: 102, sequence: 4 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const measurements: { tick: number; actionLog: number; deployments: number; resources: number; connections: number; phases: number }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;

      measurements.push({
        tick: state.runtime.time,
        actionLog: state.runtime.actionLog.length,
        deployments: state.runtime.deployments.length,
        resources: state.runtime.architecture.resources.length,
        connections: state.runtime.architecture.connections.length,
        phases: state.phases.length,
      });
    }

    // Action log: bounded by number of submitted actions (5)
    const maxActionLog = Math.max(...measurements.map(m => m.actionLog));
    expect(maxActionLog).toBe(5);

    // Deployments: peak during provisioning, then back to 0
    const maxDeployments = Math.max(...measurements.map(m => m.deployments));
    expect(maxDeployments).toBeLessThanOrEqual(2); // cache + edge at most
    const finalDeployments = measurements[measurements.length - 1].deployments;
    expect(finalDeployments).toBe(0);

    // Resources: bounded by base (3) + optional (2) = 5
    const maxResources = Math.max(...measurements.map(m => m.resources));
    expect(maxResources).toBeLessThanOrEqual(5);

    // Connections: bounded
    const maxConnections = Math.max(...measurements.map(m => m.connections));
    expect(maxConnections).toBeLessThanOrEqual(10);

    // Phases: bounded by traffic phase count
    const maxPhases = Math.max(...measurements.map(m => m.phases));
    expect(maxPhases).toBeLessThanOrEqual(scenario.traffic.length);

    // None grow linearly with tick count
    const firstHalf = measurements.slice(0, 90);
    const secondHalf = measurements.slice(90);
    const avgFirst = firstHalf.reduce((s, m) => s + m.actionLog + m.deployments + m.resources + m.connections + m.phases, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, m) => s + m.actionLog + m.deployments + m.resources + m.connections + m.phases, 0) / secondHalf.length;
    // Second half should not be significantly larger than first (no linear growth)
    expect(avgSecond).toBeLessThan(avgFirst * 3);
  });
});

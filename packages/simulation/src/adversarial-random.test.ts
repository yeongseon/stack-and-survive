import { describe, expect, it } from 'vitest';
import { createSimulation, advanceSimulation, simulateScenario, type SimulationState } from './results';
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

// Adversarial-invalid-mixed: generates random actions including many illegal ones
function generateAdversarialActions(seed: number, count: number): Action[] {
  const rng = mulberry32(seed);
  const actions: Action[] = [];
  const types = ['SCALE_OUT', 'RATE_LIMIT', 'DEPLOY_RESOURCE', 'EMERGENCY_WAF'] as const;

  for (let seq = 0; seq < count; seq++) {
    const time = Math.floor(rng() * 179);
    const type = types[Math.floor(rng() * types.length)];
    if (type === 'SCALE_OUT') actions.push({ type: 'SCALE_OUT', time, sequence: seq });
    else if (type === 'RATE_LIMIT') actions.push({ type: 'RATE_LIMIT', enabled: rng() > 0.5, time, sequence: seq });
    else if (type === 'DEPLOY_RESOURCE') actions.push({ type: 'DEPLOY_RESOURCE', kind: rng() > 0.5 ? 'cache' : 'edge', time, sequence: seq, x: Math.floor(rng() * 400 - 200), y: Math.floor(rng() * 300 - 150) });
    else actions.push({ type: 'EMERGENCY_WAF', time, sequence: seq });
  }
  actions.sort((a, b) => a.time - b.time || a.sequence - b.sequence);
  actions.forEach((a, i) => { (a as { sequence: number }).sequence = i; });
  return actions;
}

// Random-valid-player: generates actions using authoritative simulation state.
// Every generated action is submitted to the real simulation and verified accepted.
function generateValidPlayerRun(seed: number, maxActions: number) {
  const rng = mulberry32(seed);
  let state = createSimulation(canonicalPlayerStart(), scenario);
  state.runtime = startRuntime(state.runtime);
  const acceptedActions: Action[] = [];
  let rejectedCount = 0;

  while (state.runtime.status === 'RUNNING') {
    const tickActions: Action[] = [];
    if (rng() > 0.3) { // 70% chance to attempt an action this tick
      const rt = state.runtime;
      const app = rt.architecture.resources.find(r => r.kind === 'compute')!;
      const hasCache = rt.architecture.resources.some(r => r.kind === 'cache');
      const hasEdge = rt.architecture.resources.some(r => r.kind === 'edge');
      const edgeActive = hasEdge && rt.architecture.resources.find(r => r.kind === 'edge')!.remaining === 0;
      const seq = rt.lastSequence + 1;
      const candidates: Action[] = [];

      if (rt.scaleDue === null && app.remaining === 0 && app.instances < 4)
        candidates.push({ type: 'SCALE_OUT', time: rt.time, sequence: seq });
      if (!hasCache)
        candidates.push({ type: 'DEPLOY_RESOURCE', kind: 'cache', time: rt.time, sequence: seq, x: 190, y: -100 });
      if (!hasEdge)
        candidates.push({ type: 'DEPLOY_RESOURCE', kind: 'edge', time: rt.time, sequence: seq, x: -210, y: 0 });
      if (!rt.rateTransition && (rt.lastRateToggle === null || rt.time - rt.lastRateToggle >= 5))
        candidates.push({ type: 'RATE_LIMIT', enabled: !rt.rateLimit, time: rt.time, sequence: seq });
      if (edgeActive && !rt.emergencyUsed && rt.architecture.connections.some(c => c.from === rt.architecture.resources.find(r => r.kind === 'edge')!.id))
        candidates.push({ type: 'EMERGENCY_WAF', time: rt.time, sequence: seq });

      if (candidates.length > 0 && acceptedActions.length < maxActions) {
        tickActions.push(candidates[Math.floor(rng() * candidates.length)]);
      }
    }

    const transition = advanceSimulation(state, scenario, tickActions);
    state = transition.nextState;
    for (const o of transition.outcomes) {
      if (o.accepted) acceptedActions.push(o.action);
      else rejectedCount++;
    }
  }

  return { state, acceptedActions, rejectedCount };
}

// Reusable per-tick invariant checker
function assertSimulationInvariants(state: SimulationState, context: string) {
  // Numeric stability
  expect(Number.isFinite(state.economy.remainingBudget), `${context}: budget finite`).toBe(true);
  expect(Number.isFinite(state.economy.infrastructureCost), `${context}: cost finite`).toBe(true);
  expect(Number.isFinite(state.economy.revenue), `${context}: revenue finite`).toBe(true);

  // Runtime time monotonic and bounded
  expect(state.runtime.time).toBeGreaterThanOrEqual(0);
  expect(state.runtime.time).toBeLessThanOrEqual(scenario.duration);

  // Architecture invariants
  for (const r of state.runtime.architecture.resources) {
    expect(r.instances, `${context}: ${r.kind} instances`).toBeGreaterThanOrEqual(1);
    expect(r.instances, `${context}: ${r.kind} instances`).toBeLessThanOrEqual(4);
    expect(r.remaining, `${context}: ${r.kind} remaining`).toBeGreaterThanOrEqual(0);
  }

  // No duplicate resource kinds
  const kinds = state.runtime.architecture.resources.map(r => r.kind);
  expect(new Set(kinds).size, `${context}: unique resource kinds`).toBe(kinds.length);

  // Connection endpoints reference existing resources
  const resourceIds = new Set(state.runtime.architecture.resources.map(r => r.id));
  for (const conn of state.runtime.architecture.connections) {
    expect(resourceIds.has(conn.from), `${context}: connection from ${conn.from} exists`).toBe(true);
    expect(resourceIds.has(conn.to), `${context}: connection to ${conn.to} exists`).toBe(true);
  }

  // Deployments reference existing resources
  for (const d of state.runtime.deployments) {
    expect(resourceIds.has(d.id), `${context}: deployment ${d.id} exists`).toBe(true);
  }

  // lastSequence monotonic
  expect(state.runtime.lastSequence).toBeGreaterThanOrEqual(-1);
}

describe('adversarial-invalid random fuzzing', () => {
  const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

  it.each(seeds)('seed %i: 20 adversarial actions — final result valid', (seed) => {
    const actions = generateAdversarialActions(seed, 20);
    const r = simulateScenario(canonicalPlayerStart(), scenario, actions);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(10000);
    expect(r.metrics.availability).toBeGreaterThanOrEqual(0);
    expect(r.metrics.availability).toBeLessThanOrEqual(1);
    expect(['COMPLETED', 'FAILED']).toContain(r.status);
    expect(r.elapsedTime).toBeGreaterThan(0);
    expect(r.elapsedTime).toBeLessThanOrEqual(180);
  });
});

describe('per-tick invariant checking across multiple seeds', () => {
  const perTickSeeds = Array.from({ length: 10 }, (_, i) => i + 100);

  it.each(perTickSeeds)('seed %i: 30 adversarial actions — invariants hold every tick', (seed) => {
    const actions = generateAdversarialActions(seed, 30);

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    let prevTime = -1;
    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;

      assertSimulationInvariants(state, `seed ${seed} tick ${state.runtime.time}`);

      // Time must be strictly monotonic
      expect(state.runtime.time).toBeGreaterThan(prevTime);
      prevTime = state.runtime.time;

      if (transition.snapshot) {
        expect(transition.snapshot.requests.app.capacity).toBeGreaterThan(0);
      }
    }

    expect(['COMPLETED', 'FAILED']).toContain(state.runtime.status);
  });
});

describe('valid-player random strategy comparison', () => {
  const validRuns = Array.from({ length: 20 }, (_, i) => generateValidPlayerRun(i + 200, 10));

  it('valid-player generator produces zero rejected actions', () => {
    for (let i = 0; i < validRuns.length; i++) {
      expect(validRuns[i].rejectedCount, `seed ${i + 200}: rejected`).toBe(0);
    }
  });

  it('intentional cache+scale outperforms random-valid median score', () => {
    const intentional = simulateScenario(canonicalPlayerStart(), scenario, [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ]);

    const scores = validRuns.map(r => r.state.runtime.status === 'COMPLETED' || r.state.runtime.status === 'FAILED'
      ? simulateScenario(canonicalPlayerStart(), scenario, r.acceptedActions).score : 0);
    const completed = validRuns.filter(r => r.state.runtime.status === 'COMPLETED').length;
    const median = [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)];

    expect(intentional.status).toBe('COMPLETED');
    expect(intentional.score).toBeGreaterThan(median);

    console.log(`\n=== Valid-Player Random Strategy Analysis ===`);
    console.log(`Intentional: score=${intentional.score}, completed=true`);
    console.log(`Random-valid (n=20): median=${median}, min=${Math.min(...scores)}, max=${Math.max(...scores)}, completed=${completed}/20, rejected=0`);
  });

  it('random-valid average score exceeds do-nothing score', () => {
    const doNothing = simulateScenario(canonicalPlayerStart(), scenario, []);
    expect(doNothing.status).toBe('FAILED');

    const scores = validRuns.map(r => {
      const result = simulateScenario(canonicalPlayerStart(), scenario, r.acceptedActions);
      return result.score;
    });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const completionRate = validRuns.filter(r => r.state.runtime.status === 'COMPLETED').length / validRuns.length;
    const doNothingCompletionRate = 0; // do-nothing always fails

    expect(avg).toBeGreaterThan(doNothing.score);
    expect(completionRate).toBeGreaterThan(doNothingCompletionRate);
  });
});

describe('event stacking verification', () => {
  it('emergency WAF expires after 30 ticks and cannot be reactivated', () => {
    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 0, sequence: 0, x: -200, y: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 0, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 5, sequence: 2 },
      { type: 'EMERGENCY_WAF', time: 10, sequence: 3 },
      { type: 'EMERGENCY_WAF', time: 50, sequence: 4 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);
    let emergencyActive = false;
    let emergencyExpired = false;

    const allOutcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      if (state.runtime.emergency) emergencyActive = true;
      if (emergencyActive && !state.runtime.emergency) emergencyExpired = true;
      for (const o of transition.outcomes) allOutcomes.push({ seq: o.action.sequence, accepted: o.accepted });
    }

    expect(emergencyActive).toBe(true);
    expect(emergencyExpired).toBe(true);
    expect(allOutcomes.find(o => o.seq === 3)!.accepted).toBe(true);
    expect(allOutcomes.find(o => o.seq === 4)!.accepted).toBe(false);
    expect(state.runtime.emergencyUsed).toBe(true);
    expect(state.economy.emergencyCost).toBe(8);
  });

  it('rate limit toggle has 5-tick cooldown enforced', () => {
    const actions: Action[] = [
      { type: 'RATE_LIMIT', enabled: true, time: 0, sequence: 0 },
      { type: 'RATE_LIMIT', enabled: false, time: 3, sequence: 1 },
      { type: 'RATE_LIMIT', enabled: false, time: 6, sequence: 2 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);
    const outcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) outcomes.push({ seq: o.action.sequence, accepted: o.accepted });
    }

    expect(outcomes.find(o => o.seq === 0)!.accepted).toBe(true);
    expect(outcomes.find(o => o.seq === 1)!.accepted).toBe(false);
    expect(outcomes.find(o => o.seq === 2)!.accepted).toBe(true);
  });

  it('scale-out 8-tick delay: concurrent requests rejected', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 0, sequence: 0 },
      { type: 'SCALE_OUT', time: 1, sequence: 1 },
      { type: 'SCALE_OUT', time: 9, sequence: 2 },
      { type: 'SCALE_OUT', time: 10, sequence: 3 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);
    const outcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) outcomes.push({ seq: o.action.sequence, accepted: o.accepted });
    }

    expect(outcomes.find(o => o.seq === 0)!.accepted).toBe(true);
    expect(outcomes.find(o => o.seq === 1)!.accepted).toBe(false);
    expect(outcomes.find(o => o.seq === 2)!.accepted).toBe(true);
    expect(outcomes.find(o => o.seq === 3)!.accepted).toBe(false);
  });
});

describe('collection growth — explicit bounds', () => {
  it('all runtime collections bounded by design limits', () => {
    const actions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 30, sequence: 2, x: -210, y: 0 },
      { type: 'SCALE_OUT', time: 57, sequence: 3 },
      { type: 'SCALE_OUT', time: 102, sequence: 4 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;

      // Explicit design bounds
      expect(state.runtime.actionLog.length).toBeLessThanOrEqual(actions.length);
      expect(state.runtime.deployments.length).toBeLessThanOrEqual(2); // max: cache + edge
      expect(state.runtime.architecture.resources.length).toBeLessThanOrEqual(5); // internet + compute + db + cache + edge
      expect(state.runtime.architecture.connections.length).toBeLessThanOrEqual(10);
      expect(state.phases.length).toBeLessThanOrEqual(scenario.traffic.length);
    }

    // At completion: all deployments resolved
    expect(state.runtime.deployments).toEqual([]);
    expect(state.runtime.actionLog).toHaveLength(5);
  });
});

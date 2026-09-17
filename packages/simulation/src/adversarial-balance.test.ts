import { describe, expect, it } from 'vitest';
import { createSimulation, advanceSimulation, simulateScenario } from './results';
import { startRuntime, type Action } from './runtime';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';

const scenario = blackFridayChallenge.workload;

function run(actions: Action[]) {
  return simulateScenario(canonicalPlayerStart(), scenario, actions);
}

// Mitigation strategy definitions — all start from canonicalPlayerStart()
const strategies: Record<string, Action[]> = {
  doNothing: [],
  scaleOnly: [
    { type: 'SCALE_OUT', time: 5, sequence: 0 },
    { type: 'SCALE_OUT', time: 30, sequence: 1 },
    { type: 'SCALE_OUT', time: 60, sequence: 2 },
  ],
  cacheScale: [
    { type: 'SCALE_OUT', time: 16, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
    { type: 'SCALE_OUT', time: 57, sequence: 2 },
    { type: 'SCALE_OUT', time: 102, sequence: 3 },
  ],
  edgeScale: [
    { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 5, sequence: 0, x: -200, y: 0 },
    { type: 'SCALE_OUT', time: 16, sequence: 1 },
    { type: 'SCALE_OUT', time: 57, sequence: 2 },
    { type: 'SCALE_OUT', time: 102, sequence: 3 },
  ],
  balanced: [
    { type: 'SCALE_OUT', time: 16, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
    { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 57, sequence: 2, x: -210, y: 0 },
    { type: 'SCALE_OUT', time: 57, sequence: 3 },
  ],
  earlyAllIn: [
    { type: 'SCALE_OUT', time: 1, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 1, sequence: 1, x: 190, y: -100 },
    { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 1, sequence: 2, x: -210, y: 0 },
    { type: 'SCALE_OUT', time: 10, sequence: 3 },
  ],
  lateScale: [
    { type: 'SCALE_OUT', time: 100, sequence: 0 },
    { type: 'SCALE_OUT', time: 120, sequence: 1 },
    { type: 'SCALE_OUT', time: 140, sequence: 2 },
  ],
  rateLimitOnly: [
    { type: 'RATE_LIMIT', enabled: true, time: 1, sequence: 0 },
  ],
};

// Compute all results deterministically at module level — no shared mutable state
const results = Object.fromEntries(
  Object.entries(strategies).map(([name, actions]) => [name, run(actions)])
);

type StrategyMetrics = {
  name: string;
  score: number;
  availability: number;
  cost: number;
  remainingBudget: number;
  completed: boolean;
};

function metrics(name: string): StrategyMetrics {
  const r = results[name];
  return {
    name,
    score: r.score,
    availability: r.metrics.availability,
    cost: r.economy.infrastructureCost,
    remainingBudget: r.economy.remainingBudget,
    completed: r.status === 'COMPLETED',
  };
}

// Pareto dominance: A dominates B if A is no worse on every metric AND strictly better on at least one
function dominates(a: StrategyMetrics, b: StrategyMetrics): boolean {
  const aWins = (a.score >= b.score) && (a.availability >= b.availability) &&
                (a.cost <= b.cost) && (a.remainingBudget >= b.remainingBudget) &&
                (a.completed || !b.completed);
  const strictlyBetter = (a.score > b.score) || (a.availability > b.availability) ||
                         (a.cost < b.cost) || (a.remainingBudget > b.remainingBudget) ||
                         (a.completed && !b.completed);
  return aWins && strictlyBetter;
}

describe('strategy results — Black Friday', () => {
  it('do-nothing fails early (no free ride)', () => {
    expect(results.doNothing.status).toBe('FAILED');
    expect(results.doNothing.elapsedTime).toBeLessThan(scenario.duration);
  });

  it('different strategies produce meaningfully different scores', () => {
    const scores = Object.values(results).map(r => r.score);
    expect(new Set(scores).size).toBeGreaterThanOrEqual(4);
  });

  it('no completing strategy Pareto-dominates all other completing strategies', () => {
    const completing = Object.keys(results)
      .filter(name => results[name].status === 'COMPLETED')
      .map(metrics);
    expect(completing.length).toBeGreaterThanOrEqual(2);

    for (const candidate of completing) {
      const dominated = completing.filter(other => other.name !== candidate.name && dominates(candidate, other));
      // A strategy may dominate some, but must NOT dominate ALL others
      expect(dominated.length, `"${candidate.name}" dominates ${dominated.map(d => d.name).join(', ')}`).toBeLessThan(completing.length - 1);
    }
  });

  it('rate-limit-only is not a viable survival strategy', () => {
    expect(results.rateLimitOnly.status).toBe('FAILED');
  });

  it('late scaling performs worse than timely scaling', () => {
    expect(results.cacheScale.score).toBeGreaterThan(results.lateScale.score);
  });

  it('strategy choice matters: cache+scale vs edge+scale produce different availability', () => {
    expect(results.cacheScale.metrics.availability).not.toBe(results.edgeScale.metrics.availability);
  });

  it('cache+scale completes but edgeScale fails — cache is nearly mandatory for Black Friday', () => {
    expect(results.cacheScale.status).toBe('COMPLETED');
    expect(results.edgeScale.status).toBe('FAILED');
  });
});

describe('numeric stability', () => {
  it('all strategy results have finite numeric values in valid ranges', () => {
    for (const [name, r] of Object.entries(results)) {
      expect(Number.isFinite(r.score), `${name}: score`).toBe(true);
      expect(Number.isFinite(r.metrics.availability), `${name}: availability`).toBe(true);
      expect(Number.isFinite(r.economy.remainingBudget), `${name}: budget`).toBe(true);
      expect(Number.isFinite(r.economy.infrastructureCost), `${name}: cost`).toBe(true);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(10000);
      expect(r.metrics.availability).toBeGreaterThanOrEqual(0);
      expect(r.metrics.availability).toBeLessThanOrEqual(1);
    }
  });

  it('full 180-tick simulation: per-phase attribution is finite', () => {
    const r = results.cacheScale;
    expect(r.status).toBe('COMPLETED');
    expect(r.elapsedTime).toBe(180);
    for (const phase of r.phases) {
      expect(Number.isFinite(phase.data.ticks)).toBe(true);
      expect(Number.isFinite(phase.data.successful)).toBe(true);
      expect(Number.isFinite(phase.data.offered)).toBe(true);
    }
  });

  it('score is deterministic: 10 identical runs produce identical output', () => {
    const runs = Array.from({ length: 10 }, () => run(strategies.balanced));
    const scores = runs.map(r => r.score);
    expect(new Set(scores).size).toBe(1);
  });
});

describe('action rejection contracts', () => {
  it('duplicate cache deploy: first accepted, second rejected with no side effects', () => {
    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 5, sequence: 0, x: 100, y: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 10, sequence: 1, x: 200, y: 0 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const allOutcomes: { seq: number; accepted: boolean; reason: string | null }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) {
        allOutcomes.push({ seq: o.action.sequence, accepted: o.accepted, reason: o.reason });
      }
    }

    const first = allOutcomes.find(o => o.seq === 0)!;
    const second = allOutcomes.find(o => o.seq === 1)!;
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(false);
    expect(second.reason).not.toBeNull();
    // Exactly one cache exists
    const caches = state.runtime.architecture.resources.filter(r => r.kind === 'cache');
    expect(caches).toHaveLength(1);
  });

  it('emergency WAF without edge: rejected, no charge, emergencyUsed stays false', () => {
    const actions: Action[] = [
      { type: 'EMERGENCY_WAF', time: 5, sequence: 0 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const allOutcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) {
        allOutcomes.push({ seq: o.action.sequence, accepted: o.accepted });
      }
    }

    const wafOutcome = allOutcomes.find(o => o.seq === 0)!;
    expect(wafOutcome.accepted).toBe(false);
    expect(state.runtime.emergencyUsed).toBe(false);
    expect(state.runtime.emergency).toBeNull();
    expect(state.economy.emergencyCost).toBe(0);
  });

  it('second emergency WAF: rejected after first expires, no second charge', () => {
    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 1, sequence: 0, x: -200, y: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 1, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 5, sequence: 2 },
      { type: 'EMERGENCY_WAF', time: 10, sequence: 3 },
      { type: 'EMERGENCY_WAF', time: 50, sequence: 4 },
    ];

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    const allOutcomes: { seq: number; accepted: boolean }[] = [];

    while (state.runtime.status === 'RUNNING') {
      const tickActions = actions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      for (const o of transition.outcomes) {
        allOutcomes.push({ seq: o.action.sequence, accepted: o.accepted });
      }
    }

    expect(allOutcomes.find(o => o.seq === 3)!.accepted).toBe(true);
    expect(allOutcomes.find(o => o.seq === 4)!.accepted).toBe(false);
    expect(state.runtime.emergencyUsed).toBe(true);
    expect(state.economy.emergencyCost).toBe(8); // Only one charge
  });

  it('spam scale: budget never drops below zero, max 3 accepted from 179 attempts', () => {
    const spamActions: Action[] = Array.from({ length: 179 }, (_, i) => ({
      type: 'SCALE_OUT' as const,
      time: i,
      sequence: i,
    }));

    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);

    let acceptedCount = 0;

    while (state.runtime.status === 'RUNNING') {
      const tickActions = spamActions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      acceptedCount += transition.outcomes.filter(o => o.accepted).length;
    }

    // Max 3 scale-outs accepted (start with 1, max 4 instances)
    expect(acceptedCount).toBeLessThanOrEqual(3);
    expect(state.economy.remainingBudget).toBeGreaterThanOrEqual(-0.01);
    // Instance count never exceeds 4
    const app = state.runtime.architecture.resources.find(r => r.kind === 'compute')!;
    expect(app.instances).toBeLessThanOrEqual(4);
  });
});

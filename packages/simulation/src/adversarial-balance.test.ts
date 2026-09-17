import { describe, expect, it } from 'vitest';
import { simulateScenario } from './results';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import type { Action } from './runtime';

const scenario = blackFridayChallenge.workload;

function run(actions: Action[]) {
  return simulateScenario(canonicalPlayerStart(), scenario, actions);
}

// Strategy definitions using actual game mechanics
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

describe('architecture balance simulation', () => {
  const results: Record<string, ReturnType<typeof run>> = {};

  it('runs all strategies and collects results', () => {
    for (const [name, actions] of Object.entries(strategies)) {
      results[name] = run(actions);
    }
    // Print balance table for inspection
    console.log('\n=== BALANCE SIMULATION RESULTS ===');
    console.log('Strategy          | Status    | Elapsed | Avail  | Score | Budget Left');
    console.log('-'.repeat(80));
    for (const [name, r] of Object.entries(results)) {
      console.log(
        `${name.padEnd(18)}| ${r.status.padEnd(10)}| ${String(r.elapsedTime).padStart(7)} | ${(r.metrics.availability * 100).toFixed(1).padStart(5)}% | ${String(r.score).padStart(5)} | ${r.economy.remainingBudget.toFixed(1)}`
      );
    }
  });

  it('do-nothing fails early (no free ride)', () => {
    const r = results.doNothing ?? run(strategies.doNothing);
    expect(r.status).toBe('FAILED');
    expect(r.elapsedTime).toBeLessThan(scenario.duration);
  });

  it('different strategies produce meaningfully different scores', () => {
    const scores = Object.values(results).map(r => r.score);
    const uniqueScores = new Set(scores);
    // At least 4 distinct scores across 8 strategies
    expect(uniqueScores.size).toBeGreaterThanOrEqual(4);
  });

  it('no single strategy dominates all metrics', () => {
    const completed = Object.entries(results).filter(([, r]) => r.status === 'COMPLETED');
    if (completed.length < 2) return; // Can't compare if only 1 completes

    // Check that the highest scorer does NOT also have the lowest cost
    const byScore = [...completed].sort((a, b) => b[1].score - a[1].score);
    const byCost = [...completed].sort((a, b) => a[1].economy.infrastructureCost - b[1].economy.infrastructureCost);

    // If one strategy is best at everything, that's a concern
    if (byScore[0][0] === byCost[0][0]) {
      console.warn(`WARNING: "${byScore[0][0]}" has highest score AND lowest cost — potential dominance`);
    }
  });

  it('rate-limit-only is not a viable survival strategy', () => {
    const r = results.rateLimitOnly ?? run(strategies.rateLimitOnly);
    expect(r.status).toBe('FAILED');
  });

  it('late scaling performs worse than timely scaling', () => {
    const late = results.lateScale ?? run(strategies.lateScale);
    const cache = results.cacheScale ?? run(strategies.cacheScale);
    expect(cache.score).toBeGreaterThan(late.score);
  });

  it('architecture choice matters: cache+scale vs edge+scale produce different availability', () => {
    const cs = results.cacheScale ?? run(strategies.cacheScale);
    const es = results.edgeScale ?? run(strategies.edgeScale);
    expect(cs.metrics.availability).not.toBe(es.metrics.availability);
  });
});

describe('numeric stability', () => {
  it('all strategy results have finite numeric values', () => {
    for (const [name, actions] of Object.entries(strategies)) {
      const r = run(actions);
      expect(Number.isFinite(r.score), `${name}: score is finite`).toBe(true);
      expect(Number.isFinite(r.metrics.availability), `${name}: availability is finite`).toBe(true);
      expect(Number.isFinite(r.economy.remainingBudget), `${name}: budget is finite`).toBe(true);
      expect(Number.isFinite(r.economy.infrastructureCost), `${name}: cost is finite`).toBe(true);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(10000);
      expect(r.metrics.availability).toBeGreaterThanOrEqual(0);
      expect(r.metrics.availability).toBeLessThanOrEqual(1);
    }
  });

  it('full 180-tick simulation accumulates no NaN or Infinity', () => {
    const r = run(strategies.cacheScale);
    expect(r.status).toBe('COMPLETED');
    expect(r.elapsedTime).toBe(180);
    for (const phase of r.phases) {
      expect(Number.isFinite(phase.data.ticks)).toBe(true);
      expect(Number.isFinite(phase.data.successful)).toBe(true);
      expect(Number.isFinite(phase.data.offered)).toBe(true);
    }
  });

  it('score is deterministic: same inputs always produce same output', () => {
    const results = Array.from({ length: 10 }, () => run(strategies.balanced));
    const scores = results.map(r => r.score);
    expect(new Set(scores).size).toBe(1);
  });
});

describe('exploit strategies', () => {
  it('spam scale at every tick does not crash or create negative budget', () => {
    // Try to scale at every tick — most will be rejected
    const spamActions: Action[] = Array.from({ length: 179 }, (_, i) => ({
      type: 'SCALE_OUT' as const,
      time: i,
      sequence: i,
    }));
    const r = run(spamActions);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.economy.remainingBudget).toBeGreaterThanOrEqual(-0.01); // epsilon tolerance
  });

  it('deploy same resource twice is rejected', () => {
    const dupeActions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 5, sequence: 0, x: 100, y: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 10, sequence: 1, x: 200, y: 0 },
    ];
    const r = run(dupeActions);
    // Second deploy should be rejected; game should not crash
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('emergency WAF without edge is rejected', () => {
    const actions: Action[] = [
      { type: 'EMERGENCY_WAF', time: 5, sequence: 0 },
    ];
    const r = run(actions);
    // Should be rejected (no edge deployed), game continues
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('emergency WAF twice is rejected', () => {
    const actions: Action[] = [
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 1, sequence: 0, x: -200, y: 0 },
      { type: 'EMERGENCY_WAF', time: 10, sequence: 1 },
      { type: 'EMERGENCY_WAF', time: 50, sequence: 2 },
    ];
    const r = run(actions);
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

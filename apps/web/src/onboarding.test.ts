import { describe, expect, it } from 'vitest';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { trafficPhaseLabel } from './wave-feedback';

const scenario = blackFridayChallenge.workload;

describe('Black Friday mission brief content', () => {
  it('scenario duration is 180 seconds', () => {
    expect(scenario.duration).toBe(180);
  });

  it('opening traffic is 100 req/s', () => {
    expect(scenario.traffic[0].rps).toBe(100);
    expect(scenario.traffic[0].botRatio).toBe(0);
  });

  it('final wave is 600 req/s with 45% bots', () => {
    const finalPhase = scenario.traffic.at(-1)!;
    expect(finalPhase.rps).toBe(600);
    expect(Math.round(finalPhase.botRatio * 100)).toBe(45);
  });

  it('traffic phases escalate (not all identical)', () => {
    const rpsValues = scenario.traffic.map(p => p.rps);
    expect(new Set(rpsValues).size).toBeGreaterThan(3);
    expect(Math.max(...rpsValues)).toBeGreaterThan(Math.min(...rpsValues) * 2);
  });

  it('bots appear in later phases', () => {
    const botPhases = scenario.traffic.filter(p => p.botRatio > 0);
    expect(botPhases.length).toBeGreaterThan(0);
    // First phase has no bots
    expect(scenario.traffic[0].botRatio).toBe(0);
  });
});

describe('challenge ladder objectives', () => {
  it('has exactly 3 levels', () => {
    expect(challengeLadder).toHaveLength(3);
  });

  it('Survive: finish scenario duration', () => {
    const survive = challengeLadder[0];
    expect(survive.title).toBe('Survive');
    expect(survive.challenge.objective.kind).toBe('survive');
    expect(survive.challenge.workload.duration).toBe(180);
  });

  it('Reliable Business: 99% availability', () => {
    const reliable = challengeLadder[1];
    expect(reliable.title).toBe('Reliable Business');
    expect(reliable.challenge.objective.kind).toBe('availability');
    if (reliable.challenge.objective.kind === 'availability') {
      expect(reliable.challenge.objective.target).toBe(0.99);
    }
  });

  it('Customer First: 99.9% availability', () => {
    const customer = challengeLadder[2];
    expect(customer.title).toBe('Customer First');
    expect(customer.challenge.objective.kind).toBe('availability');
    if (customer.challenge.objective.kind === 'availability') {
      expect(customer.challenge.objective.target).toBe(0.999);
    }
  });

  it('all levels use the same Black Friday workload', () => {
    const workloadIds = challengeLadder.map(l => l.challenge.workload.id);
    expect(new Set(workloadIds).size).toBe(1);
    expect(workloadIds[0]).toBe('black-friday');
  });
});

describe('phase labels derive from scenario data', () => {
  it('first phase is Opening traffic', () => {
    expect(trafficPhaseLabel(scenario, 0)).toBe('Opening traffic');
  });

  it('last phase is FINAL WAVE', () => {
    expect(trafficPhaseLabel(scenario, scenario.traffic.length - 1)).toBe('FINAL WAVE');
  });

  it('bot attack phases are labeled correctly', () => {
    const botAttackIndices = scenario.traffic.map((p, i) => {
      if (i === 0 || i === scenario.traffic.length - 1) return -1;
      const prev = scenario.traffic[i - 1];
      return p.rps * p.botRatio > prev.rps * prev.botRatio ? i : -1;
    }).filter(i => i >= 0);

    for (const idx of botAttackIndices) {
      expect(trafficPhaseLabel(scenario, idx)).toBe('Bot attack');
    }
  });
});

import { describe, expect, it } from 'vitest';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { trafficPhaseLabel } from './wave-feedback';
import { missionStatus } from './mission-status';
import { createSimulation, advanceSimulation } from '@stack-and-survive/simulation/results';
import { startRuntime } from '@stack-and-survive/simulation/runtime';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';

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

  it('recovery windows are labeled correctly', () => {
    const recoveryIndices = scenario.traffic.map((p, i) => {
      if (i === 0 || i === scenario.traffic.length - 1) return -1;
      const prev = scenario.traffic[i - 1];
      return p.rps < prev.rps && p.rps * p.botRatio <= prev.rps * prev.botRatio ? i : -1;
    }).filter(i => i >= 0);

    for (const idx of recoveryIndices) {
      expect(trafficPhaseLabel(scenario, idx)).toBe('Recovery window');
    }
  });

  it('every phase has a non-empty label', () => {
    for (let i = 0; i < scenario.traffic.length; i++) {
      const label = trafficPhaseLabel(scenario, i);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('mission status at phase boundaries', () => {
  // Use a qualifying strategy so the simulation survives to the final wave
  const qualifyingActions = [
    { type: 'SCALE_OUT' as const, time: 16, sequence: 0 },
    { type: 'DEPLOY_RESOURCE' as const, kind: 'cache' as const, time: 17, sequence: 1, x: 190, y: -100 },
    { type: 'SCALE_OUT' as const, time: 57, sequence: 2 },
    { type: 'SCALE_OUT' as const, time: 102, sequence: 3 },
  ];

  function viewAtTick(tick: number) {
    let state = createSimulation(canonicalPlayerStart(), scenario);
    state.runtime = startRuntime(state.runtime);
    let snapshot = null;
    for (let t = 0; t < tick && state.runtime.status === 'RUNNING'; t++) {
      const tickActions = qualifyingActions.filter(a => a.time === state.runtime.time);
      const transition = advanceSimulation(state, scenario, tickActions);
      state = transition.nextState;
      snapshot = transition.snapshot;
    }
    return { state, snapshot, result: null, challenge: blackFridayChallenge, error: null } as Parameters<typeof missionStatus>[0];
  }

  it('phase 1 at tick 0: Opening traffic', () => {
    const view = viewAtTick(1);
    const status = missionStatus(view);
    expect(status.label).toBe('Opening traffic');
    expect(status.phaseRps).toBe(100);
    expect(status.phaseBots).toBe(0);
    expect(status.tone).toBe('traffic');
  });

  it('final phase: FINAL WAVE with correct rps and bots', () => {
    const finalStart = scenario.traffic.at(-1)!.start;
    const view = viewAtTick(finalStart + 1);
    const status = missionStatus(view);
    expect(status.label).toBe('FINAL WAVE');
    expect(status.phaseRps).toBe(600);
    expect(status.phaseBots).toBe(45);
    expect(status.tone).toBe('attack');
  });

  it('arriving flag is true during first 3 ticks of a non-opening phase', () => {
    const phase2Start = scenario.traffic[1].start;
    const view = viewAtTick(phase2Start + 1);
    const status = missionStatus(view);
    expect(status.arriving).toBe(true);
    expect(status.phaseIndex).toBe(1);
  });

  it('clock counts down correctly', () => {
    const view = viewAtTick(60);
    const status = missionStatus(view);
    expect(status.remaining).toBe(120);
    expect(status.clock).toBe('02:00');
  });

  it('objective text matches challenge', () => {
    const view = viewAtTick(1);
    const status = missionStatus(view);
    expect(status.objective).toBe('Keep the business alive');
  });
});

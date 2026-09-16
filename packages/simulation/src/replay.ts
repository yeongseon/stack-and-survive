import type { Architecture } from '@stack-and-survive/schema';
import { parseArchitecture } from '@stack-and-survive/cloud-domain';
import { parseChallenge, evaluateObjective, type Challenge } from '@stack-and-survive/scenarios/challenge';
import { parseScenario } from '@stack-and-survive/scenarios';
import { validateActionSchedule, startRuntime, type Action, type ActionOutcome } from './runtime';
import { createSimulation, advanceSimulation, simulationResult } from './results';
import { compare } from './economy';

export type ReplayRequest = {
  challenge: Challenge;
  initialArchitecture: Architecture;
  actions: Action[];
};

export type ReplayResult = {
  status: 'COMPLETED' | 'FAILED';
  elapsed: number;
  score: number;
  objectiveMet: boolean;
  availability: number;
  offered: number;
  served: number;
  cost: number;
  emergencyCost: number;
  nbv: number;
  peaks: { app: number; sqlRead: number; sqlWrite: number };
  finalArchitecture: Architecture;
  actionLog: ActionOutcome[];
};

export function replayRun(input: ReplayRequest): ReplayResult {
  const challenge = parseChallenge(input.challenge);
  const scenario = parseScenario(challenge.workload);
  validateActionSchedule(input.actions, scenario.duration);

  let state = createSimulation(input.initialArchitecture, scenario);
  state.runtime = startRuntime(state.runtime);
  const schedule = new Map<number, Action[]>();
  for (const action of input.actions) {
    schedule.set(action.time, [...(schedule.get(action.time) ?? []), action]);
  }
  while (state.runtime.status === 'RUNNING') {
    state = advanceSimulation(state, scenario, schedule.get(state.runtime.time) ?? []).nextState;
  }

  const result = simulationResult(state, scenario);
  const objectiveMet = evaluateObjective(challenge, { status: result.status, elapsedTime: result.elapsedTime, metrics: { availability: result.metrics.availability } });

  return {
    status: result.status as 'COMPLETED' | 'FAILED',
    elapsed: result.elapsedTime,
    score: result.score,
    objectiveMet,
    availability: result.metrics.availability,
    offered: result.metrics.offered,
    served: result.metrics.successful,
    cost: result.economy.infrastructureCost,
    emergencyCost: result.economy.emergencyCost,
    nbv: result.economy.netBusinessValue,
    peaks: result.attribution.peaks,
    finalArchitecture: parseArchitecture(state.runtime.architecture),
    actionLog: state.runtime.actionLog,
  };
}

export function verifyReplay(input: ReplayRequest, claimed: {
  status: string; elapsed: number; score: number; availability: number;
  offered: number; served: number; cost: number; emergencyCost: number; nbv: number;
  peaks: { app: number; sqlRead: number; sqlWrite: number };
  finalArchitecture: Architecture; actionLog: ActionOutcome[];
}): ReplayResult {
  const actual = replayRun(input);

  if (actual.status !== claimed.status || actual.elapsed !== claimed.elapsed || actual.score !== claimed.score)
    throw new Error('Replay does not reproduce claimed result');
  if (JSON.stringify(actual.finalArchitecture) !== JSON.stringify(claimed.finalArchitecture))
    throw new Error('Replay produces different final architecture');
  if (JSON.stringify(actual.actionLog) !== JSON.stringify(claimed.actionLog))
    throw new Error('Replay produces different action log');

  const pairs: [number, number][] = [
    [actual.availability, claimed.availability],
    [actual.offered, claimed.offered],
    [actual.served, claimed.served],
    [actual.cost, claimed.cost],
    [actual.emergencyCost, claimed.emergencyCost],
    [actual.nbv, claimed.nbv],
    [actual.peaks.app, claimed.peaks.app],
    [actual.peaks.sqlRead, claimed.peaks.sqlRead],
    [actual.peaks.sqlWrite, claimed.peaks.sqlWrite],
  ];
  if (pairs.some(([a, b]) => compare(a, b) !== 0))
    throw new Error('Replay metrics do not match claimed values');

  return actual;
}

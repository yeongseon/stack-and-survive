/**
 * Deterministic snapshot export for architecture evaluation and replay.
 * Produces a serializable read-only projection of simulation state.
 */
import type { SimulationSnapshot, SimulationEvent } from './contract';
import type { SimulationState } from '../results';
import type { RequestSnapshot } from '../index';
import type { Action } from '../runtime';
import { deriveResourceStates, deriveMetrics } from './metrics';

export function createSnapshot(
  state: SimulationState,
  snapshot: RequestSnapshot | null,
  events: readonly SimulationEvent[],
  scenarioId: string,
  seed: string,
): SimulationSnapshot {
  return {
    scenarioId,
    seed,
    elapsedSeconds: state.runtime.time,
    resources: deriveResourceStates(state),
    metrics: deriveMetrics(state, snapshot),
    events: events.map(e => ({ ...e })),
  };
}

export interface ReplayFixture {
  scenarioId: string;
  seed: string;
  elapsedSeconds: number;
  snapshot: SimulationSnapshot;
  actions: Action[];
}

export function createReplayFixture(
  state: SimulationState,
  requestSnapshot: RequestSnapshot | null,
  events: readonly SimulationEvent[],
  scenarioId: string,
  seed: string,
  actions: readonly Action[],
): ReplayFixture {
  return {
    scenarioId,
    seed,
    elapsedSeconds: state.runtime.time,
    snapshot: createSnapshot(state, requestSnapshot, events, scenarioId, seed),
    actions: actions.map(a => ({ ...a })),
  };
}

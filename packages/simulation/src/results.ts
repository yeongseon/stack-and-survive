import type { Architecture, Scenario } from '@stack-and-survive/schema';
import { compare } from './economy';
import { accumulateAttribution, emptyAttribution, explain, type Attribution } from './attribution';
import { advanceService, createServiceState, type ServiceState } from './outcomes';
import { startRuntime, type Action } from './runtime';

export type PhaseAttribution = { start: number; end: number; data: Attribution };
export type SimulationState = ServiceState & { attribution: Attribution; phases: PhaseAttribution[] };
export function createSimulation(architecture: Architecture, scenario: Scenario): SimulationState {
  return { ...createServiceState(architecture, scenario), attribution: emptyAttribution(), phases: [] };
}
export function advanceSimulation(state: SimulationState, scenario: Scenario, actions: readonly Action[] = []) {
  const transition = advanceService(state, scenario, actions);
  const next: SimulationState = { ...structuredClone(state), ...transition.nextState };
  if (transition.snapshot) {
    const request = transition.snapshot.requests;
    next.attribution = accumulateAttribution(next.attribution, request);
    const phase = scenario.traffic.find(p => p.start <= transition.snapshot!.time && transition.snapshot!.time < p.end)!;
    let summary = next.phases.find(p => p.start === phase.start);
    if (!summary) { summary = { start: phase.start, end: phase.end, data: emptyAttribution() }; next.phases.push(summary); }
    summary.data = accumulateAttribution(summary.data, request);
  }
  return { ...transition, nextState: next };
}
const clamp = (v: number) => Math.max(0, Math.min(100, v));
export function simulationResult(state: SimulationState, scenario: Scenario) {
  if (state.runtime.status !== 'FAILED' && state.runtime.status !== 'COMPLETED') throw new Error('Result requires a finished attempt');
  const survived = state.runtime.status === 'COMPLETED';
  const averageAppUtilization = state.attribution.ticks ? state.attribution.appUtilSum / state.attribution.ticks : 0;
  const overprovisioned = survived && compare(state.economy.infrastructureCost, 120) > 0 && compare(averageAppUtilization, .5) < 0;
  const negativeValue = survived && compare(state.economy.netBusinessValue, 0) < 0;
  const components = {
    reliability: clamp(100 - (100 - state.totals.availability * 100) * 5),
    latency: state.totals.averageLatency === null ? 0 : clamp(scenario.targets.latencyMs / state.totals.averageLatency * 100),
    businessValue: clamp(state.economy.netBusinessValue / scenario.targets.netBusinessValue * 100),
    security: !scenario.traffic.some(p => p.rps > 0 && p.botRatio > 0) ? 100 : state.attribution.botsOffered === 0 ? 0 : state.attribution.botsFiltered / state.attribution.botsOffered * 100,
  };
  const failurePenalty = survived ? 0 : 1500; const overprovisioningPenalty = overprovisioned ? 500 : 0;
  const weighted = 100 * (components.reliability * .4 + components.latency * .2 + components.businessValue * .25 + components.security * .15);
  const score = Math.round(Math.max(0, Math.min(negativeValue ? 3000 : 10000, weighted - failurePenalty - overprovisioningPenalty)));
  const targetAttainment = {
    availability: survived && compare(state.totals.availability, scenario.targets.availability) >= 0,
    latency: survived && state.totals.averageLatency !== null && compare(state.totals.averageLatency, scenario.targets.latencyMs) <= 0,
    businessValue: survived && compare(state.economy.netBusinessValue, scenario.targets.netBusinessValue) >= 0,
  };
  return {
    status: state.runtime.status, termination: state.termination, elapsedTime: state.runtime.time,
    scenarioId: scenario.id, schemaVersion: scenario.schemaVersion, balanceVersion: scenario.balanceVersion,
    metrics: { ...state.totals }, economy: { ...state.economy }, averageAppUtilization,
    attribution: structuredClone(state.attribution),
    cacheHitRatio: state.attribution.eligibleReads > 0 ? state.attribution.cacheHits / state.attribution.eligibleReads : null,
    ...explain(state.attribution, { budgetFailure: state.termination === 'budget', serviceFailure: !survived && state.termination !== 'budget', negativeValue, overprovisioned }),
    components, failurePenalty, overprovisioningPenalty, score, targetAttainment,
    phases: state.phases.map(p => ({ ...structuredClone(p), partial: p.data.ticks < p.end - p.start,
      ...explain(p.data, { serviceFailure: !survived && state.termination !== 'budget' && state.runtime.time >= p.start && state.runtime.time <= p.end }) })),
  };
}
export function simulateScenario(architecture: Architecture, scenario: Scenario, actions: readonly Action[] = []) {
  let state = createSimulation(architecture, scenario); state.runtime = startRuntime(state.runtime);
  while (state.runtime.status === 'RUNNING') state = advanceSimulation(state, scenario, actions.filter(a => a.time === state.runtime.time)).nextState;
  return simulationResult(state, scenario);
}

import type { Architecture, Scenario } from '@stack-and-survive/schema';
import { advanceEconomy, compare, createEconomicState, type EconomicState } from './economy';
import { startRuntime, type Action } from './runtime';
import type { RequestSnapshot } from './index';

export type Termination = 'budget' | 'availability' | 'order' | 'completed' | null;
export type ServiceMetrics = {
  offered: number; successful: number; availability: number; errorRate: number; noDemand: boolean;
  latencyNumerator: number; averageLatency: number | null; peakLatency: number | null;
  orderSuccessRate: number | null;
};
export type ServiceState = EconomicState & {
  totals: ServiceMetrics;
  streaks: { availability: number; order: number; overload: number[] };
  termination: Termination;
  critical: boolean;
  ticks: number;
};
export function latencyMultiplier(u: number): number {
  if (compare(u, .7) <= 0) return 1;
  if (compare(u, 1) <= 0) return 1 + 2 * ((u - .7) / .3) ** 2;
  return Math.min(8, 3 + 4 * (u - 1));
}
export function serviceMetrics(s: RequestSnapshot): ServiceMetrics {
  const offered = s.offered.browse + s.offered.order;
  const successful = s.successful.browse + s.successful.order;
  const edge = s.edge.active ? 15 : 0;
  const app = 60 * latencyMultiplier(s.app.utilization);
  const cache = s.cache.active ? 8 * latencyMultiplier(s.cache.utilization ?? 0) : 0;
  const routes = [
    { count: s.cache.hits, latency: edge + app + cache },
    { count: s.sql.readsAccepted, latency: edge + app + cache + 50 * latencyMultiplier(s.sql.readUtilization) },
    { count: s.sql.writesAccepted, latency: edge + app + 70 * latencyMultiplier(s.sql.writeUtilization) },
  ].filter(r => r.count > 0);
  const latencyNumerator = routes.reduce((sum, r) => sum + r.count * r.latency, 0);
  return {
    offered, successful, availability: offered === 0 ? 1 : successful / offered,
    errorRate: offered === 0 ? 0 : (offered - successful) / offered, noDemand: offered === 0,
    latencyNumerator, averageLatency: successful === 0 ? null : latencyNumerator / successful,
    peakLatency: routes.length ? Math.max(...routes.map(r => r.latency)) : null,
    orderSuccessRate: s.offered.order === 0 ? null : s.successful.order / s.offered.order,
  };
}
export function createServiceState(architecture: Architecture, scenario: Scenario): ServiceState {
  return {
    ...createEconomicState(architecture, scenario),
    totals: { offered: 0, successful: 0, availability: 1, errorRate: 0, noDemand: true, latencyNumerator: 0, averageLatency: null, peakLatency: null, orderSuccessRate: null },
    streaks: { availability: 0, order: 0, overload: [0, 0, 0, 0] }, termination: null, critical: false, ticks: 0,
  };
}
export function advanceService(state: ServiceState, scenario: Scenario, actions: readonly Action[]) {
  const result = advanceEconomy(state, scenario, actions);
  const next: ServiceState = { ...structuredClone(state), ...result.nextState };
  if (!result.transition.snapshot) return { nextState: next, snapshot: null, outcomes: result.transition.outcomes };
  const request = result.transition.snapshot.requests;
  const metrics = serviceMetrics(request);
  next.ticks++;
  next.totals.offered += metrics.offered; next.totals.successful += metrics.successful;
  next.totals.latencyNumerator += metrics.latencyNumerator;
  next.totals.noDemand = next.totals.offered === 0;
  next.totals.availability = next.totals.noDemand ? 1 : next.totals.successful / next.totals.offered;
  next.totals.errorRate = next.totals.noDemand ? 0 : (next.totals.offered - next.totals.successful) / next.totals.offered;
  next.totals.averageLatency = next.totals.successful === 0 ? null : next.totals.latencyNumerator / next.totals.successful;
  if (metrics.peakLatency !== null) next.totals.peakLatency = Math.max(next.totals.peakLatency ?? 0, metrics.peakLatency);
  // Order success is a per-tick failure signal, not a mean of per-tick ratios.
  next.totals.orderSuccessRate = null;
  next.streaks.availability = !metrics.noDemand && compare(metrics.availability, .9) < 0 ? next.streaks.availability + 1 : 0;
  next.streaks.order = metrics.orderSuccessRate !== null && compare(metrics.orderSuccessRate, .5) < 0 ? next.streaks.order + 1 : 0;
  const utilizations = [request.app.utilization, request.cache.utilization, request.sql.readUtilization, request.sql.writeUtilization];
  next.streaks.overload = utilizations.map((u, i) => u !== null && compare(u, 1) > 0 ? next.streaks.overload[i] + 1 : 0);
  next.critical = compare(metrics.availability, .95) < 0 || compare(next.economy.remainingBudget / scenario.budget, .2) < 0 || next.streaks.overload.some(n => n >= 5);
  next.termination = result.budgetExhausted ? 'budget' : next.streaks.availability >= 20 ? 'availability' : next.streaks.order >= 15 ? 'order' : next.runtime.time === scenario.duration ? 'completed' : null;
  if (next.termination !== null) next.runtime.status = next.termination === 'completed' ? 'COMPLETED' : 'FAILED';
  return {
    nextState: next,
    snapshot: { ...result.transition.snapshot, metrics, economy: { ...next.economy }, critical: next.critical, status: next.runtime.status,
      failureCountdown: { availability: Math.max(0, 20 - next.streaks.availability), order: Math.max(0, 15 - next.streaks.order) } },
    outcomes: result.transition.outcomes,
  };
}
export function runServiceScenario(architecture: Architecture, scenario: Scenario, actions: readonly Action[] = []): ServiceState {
  let state = createServiceState(architecture, scenario);
  state.runtime = startRuntime(state.runtime);
  while (state.runtime.status === 'RUNNING') state = advanceService(state, scenario, actions.filter(a => a.time === state.runtime.time)).nextState;
  return state;
}

/**
 * Derive operational metrics from existing simulation state.
 * All values are read-only projections — they do not modify the simulation.
 *
 * Derivation formulas documented in docs/simulation-metrics.md.
 */
import { definitions, appTiers, databaseTiers, readReplica, resourceTier, resourceRunningCost } from '@stack-and-survive/cloud-domain';
import type { RequestSnapshot } from '../index';
import type { SimulationMetrics, ResourceState, AzureResourceCategory } from './contract';
import type { SimulationState } from '../results';

const categoryMap: Record<string, AzureResourceCategory> = {
  internet: 'operations',
  compute: 'compute',
  database: 'data',
  cache: 'cache',
  edge: 'edge',
};

export function deriveResourceStates(state: SimulationState): ResourceState[] {
  const r = state.runtime;
  return r.architecture.resources.map(resource => {
    const def = definitions[resource.kind];
    const offline = resource.remaining > 0;
    const costPerMinute = resourceRunningCost(resource);
    let utilization = 0;
    let capacity = 0;

    if (resource.kind === 'compute') {
      capacity = resource.instances * appTiers[resourceTier(resource) - 1].capacity;
      utilization = state.runtime.status === 'RUNNING' && !offline ? (state.attribution.appUtilSum / Math.max(1, state.attribution.ticks)) : 0;
    } else if (resource.kind === 'database') {
      const tier = databaseTiers[resourceTier(resource) - 1];
      capacity = tier.reads + tier.writes + (resource.readReplicas ?? 0) * readReplica.capacity;
      const ticks = state.attribution.ticks;
      utilization = ticks > 0 ? Math.max(state.attribution.peaks.sqlRead, state.attribution.peaks.sqlWrite) : 0;
    } else if (resource.kind === 'cache') {
      capacity = 500;
      utilization = state.attribution.eligibleReads > 0 ? state.attribution.cacheHits / state.attribution.eligibleReads : 0;
    }

    const health: ResourceState['health'] = offline ? 'offline'
      : utilization > 1.0 ? 'critical'
      : utilization > 0.7 ? 'warning'
      : 'healthy';

    return {
      id: resource.id,
      serviceType: def.name,
      displayName: def.name,
      category: categoryMap[resource.kind] ?? 'operations',
      instances: resource.instances,
      capacity,
      utilization: Math.round(utilization * 100) / 100,
      health,
      estimatedCostUnits: Math.round(costPerMinute * 100) / 100,
    };
  });
}

export function deriveMetrics(state: SimulationState, snapshot: RequestSnapshot | null): SimulationMetrics {
  const r = snapshot;
  const economy = state.economy;

  const requestsPerSecond = r ? r.offered.browse + r.offered.order + r.offered.bot : 0;
  const successfulThisTick = r ? r.successful.browse + r.successful.order : 0;
  const offeredLegitimate = r ? r.offered.browse + r.offered.order : 0;
  const successRate = offeredLegitimate > 0 ? successfulThisTick / offeredLegitimate : 1;

  // p95 latency: approximate from peak latency (available in totals)
  // Peak latency represents worst-case path; p95 is typically ~80% of peak
  const peakLatency = state.totals.peakLatency ?? 0;
  const p95LatencyMs = Math.round(peakLatency * 0.8);

  // App CPU: derived from app utilization (capped at 100%)
  const appUtilization = r?.app.utilization ?? 0;
  const appCpuPercent = Math.round(Math.min(100, appUtilization * 100));

  // Database: max of read/write utilization
  const dbUtil = r ? Math.max(r.sql.readUtilization, r.sql.writeUtilization) : 0;
  const databaseUtilizationPercent = Math.round(Math.min(100, dbUtil * 100));

  // Cache hit ratio: only when cache is active
  const cacheHitRatioPercent = r?.cache.active && r.cache.hitRatio !== null
    ? Math.round(r.cache.hitRatio * 100) : undefined;

  // Blocked bots: only when edge is active
  const blockedBotRequests = r?.edge.active ? Math.round(r.edge.filtered.bot) : undefined;

  return {
    requestsPerSecond: Math.round(requestsPerSecond),
    successRate: Math.round(successRate * 1000) / 1000,
    p95LatencyMs,
    appCpuPercent,
    databaseUtilizationPercent,
    cacheHitRatioPercent,
    blockedBotRequests,
    estimatedCostUnits: Math.round(economy.infrastructureCost * 100) / 100,
  };
}

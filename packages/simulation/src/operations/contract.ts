/**
 * Azure-oriented operational simulation contracts.
 * Read-only projections derived from existing simulation state.
 * These types do NOT modify simulation behavior.
 */

export type AzureResourceCategory = 'edge' | 'compute' | 'data' | 'cache' | 'operations';

export interface ResourceState {
  id: string;
  serviceType: string;
  displayName: string;
  category: AzureResourceCategory;
  instances: number;
  capacity: number;
  utilization: number;
  health: 'healthy' | 'warning' | 'critical' | 'offline';
  estimatedCostUnits: number;
}

export interface SimulationMetrics {
  requestsPerSecond: number;
  successRate: number;
  p95LatencyMs: number;
  appCpuPercent: number;
  databaseUtilizationPercent: number;
  cacheHitRatioPercent?: number;
  blockedBotRequests?: number;
  estimatedCostUnits: number;
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  type: 'traffic' | 'capacity' | 'latency' | 'security' | 'scaling' | 'deployment' | 'recovery';
  severity: 'info' | 'warning' | 'critical' | 'resolved';
  sourceResourceId?: string;
  title: string;
  detail: string;
  metricChanges?: Partial<SimulationMetrics>;
}

export interface SimulationSnapshot {
  scenarioId: string;
  seed: string;
  elapsedSeconds: number;
  resources: ResourceState[];
  metrics: SimulationMetrics;
  events: SimulationEvent[];
}

export interface ArchitectureFinding {
  id: string;
  pillar: 'reliability' | 'security' | 'costOptimization' | 'performanceEfficiency' | 'operationalExcellence';
  severity: 'positive' | 'advisory' | 'risk';
  title: string;
  evidence: string;
  recommendation?: string;
  documentationUrl?: string;
}

/**
 * State-driven alert generation from simulation threshold transitions.
 * Alerts are deterministic: same state transitions produce the same alerts.
 * Thresholds reuse existing engine values where available.
 */
import type { RequestSnapshot } from '../index';
import type { SimulationEvent } from './contract';
import type { Runtime } from '../runtime';

// Named threshold constants — documented in docs/simulation-metrics.md
export const THRESHOLDS = {
  APP_WARNING: 0.7,       // Matches existing world-guide threshold
  APP_CRITICAL: 1.0,      // Matches existing overload detection
  DB_WARNING: 0.7,
  DB_CRITICAL: 1.0,       // Matches existing overload detection
  BOT_RATIO: 0.05,        // Minimum bot ratio to trigger alert
  TRAFFIC_SURGE_RATIO: 1.5, // Current rps > 1.5× previous rps
} as const;

type AlertKey = string;

interface AlertState {
  appWarning: boolean;
  appCritical: boolean;
  dbWarning: boolean;
  dbCritical: boolean;
  botsDetected: boolean;
  scalePending: boolean;
  cacheDeployed: boolean;
  edgeDeployed: boolean;
  lastRps: number;
  emitted: Set<AlertKey>;
}

export function createAlertState(): AlertState {
  return {
    appWarning: false,
    appCritical: false,
    dbWarning: false,
    dbCritical: false,
    botsDetected: false,
    scalePending: false,
    cacheDeployed: false,
    edgeDeployed: false,
    lastRps: 0,
    emitted: new Set(),
  };
}

function alertId(type: string, time: number): string {
  return `${type}:${time}`;
}

export function generateAlerts(
  snapshot: RequestSnapshot | null,
  runtime: Runtime,
  previous: AlertState,
): { events: SimulationEvent[]; next: AlertState } {
  const events: SimulationEvent[] = [];
  const time = runtime.time;
  const next: AlertState = { ...previous, emitted: new Set(previous.emitted) };

  if (!snapshot || runtime.status !== 'RUNNING') return { events, next };

  const r = snapshot;
  const rps = r.offered.browse + r.offered.order + r.offered.bot;
  const appUtil = r.app.utilization;
  const dbUtil = Math.max(r.sql.readUtilization, r.sql.writeUtilization);
  const botRatio = rps > 0 ? r.offered.bot / rps : 0;

  const emit = (id: string, event: Omit<SimulationEvent, 'id'>) => {
    if (!next.emitted.has(id)) {
      events.push({ ...event, id });
      next.emitted.add(id);
    }
  };

  // Traffic surge: rps increased by more than 50% from previous tick
  if (previous.lastRps > 0 && rps > previous.lastRps * THRESHOLDS.TRAFFIC_SURGE_RATIO) {
    emit(alertId('traffic-surge', time), {
      timestamp: time, type: 'traffic', severity: 'info',
      title: 'Traffic surge detected',
      detail: `Traffic increased from ${Math.round(previous.lastRps)} to ${Math.round(rps)} req/s`,
    });
  }
  next.lastRps = rps;

  // App utilization transitions
  const appWarn = appUtil >= THRESHOLDS.APP_WARNING && appUtil < THRESHOLDS.APP_CRITICAL;
  const appCrit = appUtil >= THRESHOLDS.APP_CRITICAL;

  if (appCrit && !previous.appCritical) {
    emit(alertId('app-critical', time), {
      timestamp: time, type: 'capacity', severity: 'critical',
      sourceResourceId: 'compute',
      title: 'App Service overloaded',
      detail: `App utilization at ${Math.round(appUtil * 100)}% — requests are being dropped`,
    });
  } else if (appWarn && !previous.appWarning && !appCrit) {
    emit(alertId('app-warning', time), {
      timestamp: time, type: 'capacity', severity: 'warning',
      sourceResourceId: 'compute',
      title: 'App Service capacity warning',
      detail: `App utilization at ${Math.round(appUtil * 100)}% — approaching capacity limit`,
    });
  }
  if (previous.appCritical && !appCrit) {
    emit(alertId('app-recovered', time), {
      timestamp: time, type: 'recovery', severity: 'resolved',
      sourceResourceId: 'compute',
      title: 'App Service recovered',
      detail: 'App utilization returned below capacity',
    });
  }
  next.appWarning = appWarn;
  next.appCritical = appCrit;

  // Database utilization transitions
  const dbWarn = dbUtil >= THRESHOLDS.DB_WARNING && dbUtil < THRESHOLDS.DB_CRITICAL;
  const dbCrit = dbUtil >= THRESHOLDS.DB_CRITICAL;

  if (dbCrit && !previous.dbCritical) {
    emit(alertId('db-critical', time), {
      timestamp: time, type: 'latency', severity: 'critical',
      sourceResourceId: 'database',
      title: 'Database bottleneck detected',
      detail: `Database utilization at ${Math.round(dbUtil * 100)}% — queries are being dropped`,
    });
  } else if (dbWarn && !previous.dbWarning && !dbCrit) {
    emit(alertId('db-warning', time), {
      timestamp: time, type: 'latency', severity: 'warning',
      sourceResourceId: 'database',
      title: 'Database utilization warning',
      detail: `Database utilization at ${Math.round(dbUtil * 100)}% — approaching capacity`,
    });
  }
  if (previous.dbCritical && !dbCrit) {
    emit(alertId('db-recovered', time), {
      timestamp: time, type: 'recovery', severity: 'resolved',
      sourceResourceId: 'database',
      title: 'Database pressure decreased',
      detail: 'Database utilization returned below capacity',
    });
  }
  next.dbWarning = dbWarn;
  next.dbCritical = dbCrit;

  // Bot detection
  if (botRatio >= THRESHOLDS.BOT_RATIO && !previous.botsDetected) {
    emit(alertId('bots-detected', time), {
      timestamp: time, type: 'security', severity: 'warning',
      title: 'Bot traffic detected',
      detail: `${Math.round(botRatio * 100)}% of traffic appears automated`,
    });
    next.botsDetected = true;
  }
  if (previous.botsDetected && botRatio < THRESHOLDS.BOT_RATIO) {
    next.botsDetected = false;
  }

  // Scale-out events
  if (runtime.scaleDue !== null && !previous.scalePending) {
    emit(alertId('scale-started', time), {
      timestamp: time, type: 'scaling', severity: 'info',
      sourceResourceId: 'compute',
      title: 'Scale-out initiated',
      detail: `Additional App instance provisioning — ready in ${runtime.scaleDue - time} ticks`,
    });
    next.scalePending = true;
  }
  if (previous.scalePending && runtime.scaleDue === null) {
    emit(alertId('scale-completed', time), {
      timestamp: time, type: 'scaling', severity: 'info',
      sourceResourceId: 'compute',
      title: 'Scale-out completed',
      detail: `App Service now has ${runtime.architecture.resources.find(r => r.kind === 'compute')?.instances ?? 0} active instances`,
    });
    next.scalePending = false;
  }

  // Cache deployment
  const cacheActive = runtime.architecture.resources.some(r => r.kind === 'cache' && r.remaining === 0);
  if (cacheActive && !previous.cacheDeployed) {
    emit(alertId('cache-deployed', time), {
      timestamp: time, type: 'deployment', severity: 'info',
      sourceResourceId: 'cache',
      title: 'Cache deployed',
      detail: 'Azure Managed Redis is now active — serving eligible read requests',
    });
    next.cacheDeployed = true;
  }

  // Edge deployment
  const edgeActive = runtime.architecture.resources.some(r => r.kind === 'edge' && r.remaining === 0);
  if (edgeActive && !previous.edgeDeployed) {
    emit(alertId('edge-deployed', time), {
      timestamp: time, type: 'deployment', severity: 'info',
      sourceResourceId: 'edge',
      title: 'Protected Edge deployed',
      detail: 'WAF is now filtering bot traffic at ingress',
    });
    next.edgeDeployed = true;
  }

  return { events, next };
}

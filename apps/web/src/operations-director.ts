/**
 * Operations Director — derives presentation events from authoritative simulation state.
 * Pure function: does not modify simulation. Produces transient game-feel events.
 */
import type { View } from './controller';
import { blackFriday } from '@stack-and-survive/scenarios';
import { compare } from '@stack-and-survive/simulation/economy';
import { trafficPhaseLabel, lostSales } from './wave-feedback';

export type OperationEvent = {
  id: string;
  time: number;
  category: 'wave' | 'warning' | 'critical' | 'success' | 'economy' | 'countdown';
  title: string;
  detail?: string;
  priority: number;
  duration: number;
};

interface DirectorState {
  lastPhaseIndex: number;
  appWarning: boolean;
  appCritical: boolean;
  dbWarning: boolean;
  dbCritical: boolean;
  customerLoss: boolean;
  lastActivations: Set<string>;
  finalWaveAnnounced: boolean;
}

export function createDirectorState(): DirectorState {
  return {
    lastPhaseIndex: -1,
    appWarning: false,
    appCritical: false,
    dbWarning: false,
    dbCritical: false,
    customerLoss: false,
    lastActivations: new Set(),
    finalWaveAnnounced: false,
  };
}

export function deriveOperationEvents(view: View, previous: DirectorState): { events: OperationEvent[]; next: DirectorState } {
  const events: OperationEvent[] = [];
  const next: DirectorState = { ...previous, lastActivations: new Set(previous.lastActivations) };
  const scenario = view.challenge?.workload ?? blackFriday;
  const runtime = view.state.runtime;
  const r = view.snapshot?.requests;

  if (runtime.status !== 'RUNNING' || view.error || !r) return { events, next };

  const time = runtime.time;
  let priority = 0;

  // --- Wave transitions ---
  const phaseIndex = scenario.traffic.findIndex(p => p.start <= time && time < p.end);
  if (phaseIndex >= 0 && phaseIndex !== previous.lastPhaseIndex && previous.lastPhaseIndex >= 0) {
    const phase = scenario.traffic[phaseIndex];
    const label = trafficPhaseLabel(scenario, phaseIndex);
    const isFinal = phaseIndex === scenario.traffic.length - 1;
    const remaining = scenario.duration - phase.start;
    const botPct = Math.round(phase.botRatio * 100);
    const detail = isFinal
      ? `${phase.rps} req/s · ${botPct}% bots · SURVIVE ${remaining}s`
      : botPct > 0
        ? `${phase.rps} req/s · ${botPct}% bots`
        : `${phase.rps} req/s`;

    events.push({
      id: `wave:${phaseIndex}`,
      time,
      category: isFinal ? 'critical' : label === 'Bot attack' ? 'warning' : label === 'Recovery window' ? 'success' : 'wave',
      title: label.toUpperCase(),
      detail,
      priority: isFinal ? 10 : 8,
      duration: isFinal ? 3000 : 2000,
    });

    if (isFinal) next.finalWaveAnnounced = true;
    priority = Math.max(priority, isFinal ? 10 : 8);
  }
  next.lastPhaseIndex = phaseIndex;

  // --- App pressure transitions ---
  const appUtil = r.app.utilization;
  const appCrit = compare(appUtil, 1) > 0;
  const appWarn = !appCrit && compare(appUtil, 0.7) > 0;

  if (appCrit && !previous.appCritical && priority < 9) {
    events.push({
      id: `app-critical:${time}`, time, category: 'critical', priority: 9, duration: 2000,
      title: 'APP SATURATED',
      detail: 'Customer requests are being dropped',
    });
  } else if (appWarn && !previous.appWarning && !appCrit && priority < 6) {
    events.push({
      id: `app-warning:${time}`, time, category: 'warning', priority: 6, duration: 1500,
      title: 'APP PRESSURE RISING',
      detail: `${Math.round(appUtil * 100)}% utilization`,
    });
  }
  if (previous.appCritical && !appCrit && priority < 5) {
    events.push({
      id: `app-recovered:${time}`, time, category: 'success', priority: 5, duration: 1500,
      title: 'APP PRESSURE EASED',
    });
  }
  next.appWarning = appWarn;
  next.appCritical = appCrit;

  // --- DB pressure transitions ---
  const dbUtil = Math.max(r.sql.readUtilization, r.sql.writeUtilization);
  const dbCrit = compare(dbUtil, 1) > 0;
  const dbWarn = !dbCrit && compare(dbUtil, 0.7) > 0;

  if (dbCrit && !previous.dbCritical && priority < 9) {
    const writeHeavy = compare(r.sql.writeUtilization, r.sql.readUtilization) > 0;
    events.push({
      id: `db-critical:${time}`, time, category: 'critical', priority: 9, duration: 2000,
      title: writeHeavy ? 'SQL WRITE BOTTLENECK' : 'SQL READ BOTTLENECK',
      detail: 'Orders are being dropped',
    });
  }
  if (previous.dbCritical && !dbCrit && priority < 5) {
    events.push({
      id: `db-recovered:${time}`, time, category: 'success', priority: 5, duration: 1500,
      title: 'DATABASE PRESSURE EASED',
    });
  }
  next.dbWarning = dbWarn;
  next.dbCritical = dbCrit;

  // --- Customer loss transitions ---
  const loss = lostSales(r) ?? 0;
  const hasLoss = compare(loss, 0.02) > 0;
  if (hasLoss && !previous.customerLoss && priority < 7) {
    events.push({
      id: `customer-loss:${time}`, time, category: 'critical', priority: 7, duration: 2000,
      title: 'CUSTOMERS DROPPING',
      detail: `Sales at risk`,
    });
  }
  if (previous.customerLoss && !hasLoss && priority < 5) {
    events.push({
      id: `customer-recovered:${time}`, time, category: 'success', priority: 5, duration: 1500,
      title: 'SALES RECOVERED',
      detail: 'Customer losses stopped',
    });
  }
  next.customerLoss = hasLoss;

  // --- Resource activations ---
  for (const resource of runtime.architecture.resources) {
    const key = `${resource.kind}:${resource.instances}`;
    if (resource.remaining === 0 && !previous.lastActivations.has(key)) {
      const labels: Record<string, string> = {
        compute: `CAPACITY ONLINE · ${resource.instances} instances`,
        cache: 'CACHE ONLINE · Reads accelerated',
        edge: 'PROTECTION ONLINE · Filtering bots',
      };
      if (labels[resource.kind] && priority < 6) {
        events.push({
          id: `activate:${resource.kind}:${time}`, time, category: 'success', priority: 6, duration: 1500,
          title: labels[resource.kind],
        });
      }
    }
    if (resource.remaining === 0) next.lastActivations.add(key);
  }

  // Sort by priority descending, keep only highest if multiple
  events.sort((a, b) => b.priority - a.priority);

  return { events: events.slice(0, 2), next };
}

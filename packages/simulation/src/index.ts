import { number, type Architecture } from '@stack-and-survive/schema';
import { parseArchitecture, validateStart, appTiers, databaseTiers, resourceTier, readReplica } from '@stack-and-survive/cloud-domain';

export type Traffic = Readonly<{ browse: number; order: number; bot: number }>;
export const capacity = Object.freeze({ appPerInstance: 150, sqlRead: 180, sqlWrite: 70, cache: 500 });
export type BaselineSnapshot = {
  offered: Traffic;
  app: { capacity: number; incoming: number; utilization: number; accepted: Traffic; dropped: Traffic };
  sql: { readDemand: number; writeDemand: number; readCapacity: number; writeCapacity: number;
    readUtilization: number; writeUtilization: number; readsAccepted: number; writesAccepted: number;
    readsDropped: number; writesDropped: number };
  successful: { browse: number; order: number };
};
export type RequestSnapshot = BaselineSnapshot & {
  edge: { active: boolean; filtered: Traffic; passed: Traffic };
  rateLimit: { active: boolean; rejected: Traffic; passed: Traffic };
  cache: { active: boolean; eligible: number; processed: number; hits: number; misses: number; overflow: number; utilization: number | null; hitRatio: number | null };
};

export function processBaseline(architecture: Architecture, traffic: Traffic): BaselineSnapshot {
  if (architecture.resources.some(r => r.kind === 'cache' || r.kind === 'edge')) {
    throw new Error('Baseline slice supports only Internet, App and SQL');
  }
  return processRequests(architecture, traffic);
}

export function processRequests(architecture: Architecture, traffic: Traffic, controls: { rateLimit: boolean; emergency: boolean } = { rateLimit: false, emergency: false }): RequestSnapshot {
  const a = parseArchitecture(architecture);
  const errors = validateStart(a);
  if (errors.length) throw new Error(errors.join('; '));
  const offered = {
    browse: number(traffic.browse, 'browse traffic'), order: number(traffic.order, 'order traffic'), bot: number(traffic.bot, 'bot traffic'),
  };
  number(offered.browse + offered.order + offered.bot, 'total traffic', 0, 1000);
  const onPath = (kind: 'cache' | 'edge') => {
    const r = a.resources.find(resource => resource.kind === kind);
    return !!r && r.remaining === 0 && a.connections.some(c => c.from === r.id || c.to === r.id);
  };
  const edgeActive = onPath('edge');
  const falsePositive = controls.emergency ? .03 : .005;
  const botFilter = controls.emergency ? .9 : .7;
  const filtered = { browse: offered.browse * (edgeActive ? falsePositive : 0), order: offered.order * (edgeActive ? falsePositive : 0), bot: offered.bot * (edgeActive ? botFilter : 0) };
  const passed = { browse: offered.browse - filtered.browse, order: offered.order - filtered.order, bot: offered.bot - filtered.bot };
  const rejected = { browse: passed.browse * (controls.rateLimit ? .05 : 0), order: passed.order * (controls.rateLimit ? .05 : 0), bot: passed.bot * (controls.rateLimit ? .05 : 0) };
  const admitted = { browse: passed.browse - rejected.browse, order: passed.order - rejected.order, bot: passed.bot - rejected.bot };
  const incoming = admitted.browse + admitted.order + admitted.bot;
  const app = a.resources.find(r => r.kind === 'compute')!;
  const sql = a.resources.find(r => r.kind === 'database')!;
  const appCapacity = app.instances * appTiers[resourceTier(app) - 1].capacity;
  const sqlTier = databaseTiers[resourceTier(sql) - 1];
  const readCapacity = sqlTier.reads + (sql.readReplicas ?? 0) * readReplica.capacity;
  const writeCapacity = sqlTier.writes;
  const ratio = incoming === 0 ? 1 : Math.min(1, appCapacity / incoming);
  const accepted = { browse: admitted.browse * ratio, order: admitted.order * ratio, bot: admitted.bot * ratio };
  const dropped = { browse: admitted.browse - accepted.browse, order: admitted.order - accepted.order, bot: admitted.bot - accepted.bot };
  const cacheActive = onPath('cache');
  const eligible = cacheActive ? accepted.browse : 0;
  const processed = Math.min(eligible, capacity.cache);
  const hits = processed * .8;
  const misses = processed - hits;
  const overflow = eligible - processed;
  const readDemand = cacheActive ? misses + overflow : accepted.browse;
  const readsAccepted = Math.min(readDemand, readCapacity);
  const writesAccepted = Math.min(accepted.order, writeCapacity);
  return {
    offered, app: { capacity: appCapacity, incoming, utilization: incoming / appCapacity, accepted, dropped },
    edge: { active: edgeActive, filtered, passed },
    rateLimit: { active: controls.rateLimit, rejected, passed: admitted },
    cache: { active: cacheActive, eligible, processed, hits, misses, overflow, utilization: cacheActive ? eligible / capacity.cache : null, hitRatio: eligible > 0 ? hits / eligible : null },
    sql: { readDemand, writeDemand: accepted.order, readCapacity, writeCapacity,
      readUtilization: readDemand / readCapacity, writeUtilization: accepted.order / writeCapacity,
      readsAccepted, writesAccepted, readsDropped: readDemand - readsAccepted, writesDropped: accepted.order - writesAccepted },
    successful: { browse: hits + readsAccepted, order: writesAccepted },
  };
}

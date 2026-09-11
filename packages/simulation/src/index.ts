import { number, type Architecture } from '@stack-and-survive/schema';
import { parseArchitecture, validateStart } from '@stack-and-survive/cloud-domain';

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
  cache: { active: boolean; eligible: number; processed: number; hits: number; misses: number; overflow: number; utilization: number | null; hitRatio: number | null };
};

export function processBaseline(architecture: Architecture, traffic: Traffic): BaselineSnapshot {
  if (architecture.resources.some(r => r.kind === 'cache' || r.kind === 'edge')) {
    throw new Error('Baseline slice supports only Internet, App and SQL');
  }
  return processRequests(architecture, traffic);
}

export function processRequests(architecture: Architecture, traffic: Traffic): RequestSnapshot {
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
  const filtered = { browse: offered.browse * (edgeActive ? .005 : 0), order: offered.order * (edgeActive ? .005 : 0), bot: offered.bot * (edgeActive ? .7 : 0) };
  const passed = { browse: offered.browse - filtered.browse, order: offered.order - filtered.order, bot: offered.bot - filtered.bot };
  const incoming = passed.browse + passed.order + passed.bot;
  const appCapacity = a.resources.find(r => r.kind === 'compute')!.instances * capacity.appPerInstance;
  const ratio = incoming === 0 ? 1 : Math.min(1, appCapacity / incoming);
  const accepted = { browse: passed.browse * ratio, order: passed.order * ratio, bot: passed.bot * ratio };
  const dropped = { browse: passed.browse - accepted.browse, order: passed.order - accepted.order, bot: passed.bot - accepted.bot };
  const cacheActive = onPath('cache');
  const eligible = cacheActive ? accepted.browse : 0;
  const processed = Math.min(eligible, capacity.cache);
  const hits = processed * .8;
  const misses = processed - hits;
  const overflow = eligible - processed;
  const readDemand = cacheActive ? misses + overflow : accepted.browse;
  const readsAccepted = Math.min(readDemand, capacity.sqlRead);
  const writesAccepted = Math.min(accepted.order, capacity.sqlWrite);
  return {
    offered, app: { capacity: appCapacity, incoming, utilization: incoming / appCapacity, accepted, dropped },
    edge: { active: edgeActive, filtered, passed },
    cache: { active: cacheActive, eligible, processed, hits, misses, overflow, utilization: cacheActive ? eligible / capacity.cache : null, hitRatio: eligible > 0 ? hits / eligible : null },
    sql: { readDemand, writeDemand: accepted.order, readCapacity: capacity.sqlRead, writeCapacity: capacity.sqlWrite,
      readUtilization: readDemand / capacity.sqlRead, writeUtilization: accepted.order / capacity.sqlWrite,
      readsAccepted, writesAccepted, readsDropped: readDemand - readsAccepted, writesDropped: accepted.order - writesAccepted },
    successful: { browse: hits + readsAccepted, order: writesAccepted },
  };
}

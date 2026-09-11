import { number, type Architecture } from '@stack-and-survive/schema';
import { parseArchitecture, validateStart } from '@stack-and-survive/cloud-domain';

export type Traffic = Readonly<{ browse: number; order: number; bot: number }>;
export const capacity = Object.freeze({ appPerInstance: 150, sqlRead: 180, sqlWrite: 70 });
export type BaselineSnapshot = {
  offered: Traffic;
  app: { capacity: number; incoming: number; utilization: number; accepted: Traffic; dropped: Traffic };
  sql: { readDemand: number; writeDemand: number; readCapacity: number; writeCapacity: number;
    readUtilization: number; writeUtilization: number; readsAccepted: number; writesAccepted: number;
    readsDropped: number; writesDropped: number };
  successful: { browse: number; order: number };
};

export function processBaseline(architecture: Architecture, traffic: Traffic): BaselineSnapshot {
  const a = parseArchitecture(architecture);
  const errors = validateStart(a);
  if (errors.length) throw new Error(errors.join('; '));
  if (a.resources.some(r => r.kind === 'cache' || r.kind === 'edge')) {
    throw new Error('Baseline slice supports only Internet, App and SQL');
  }
  const offered = {
    browse: number(traffic.browse, 'browse traffic'), order: number(traffic.order, 'order traffic'), bot: number(traffic.bot, 'bot traffic'),
  };
  const incoming = number(offered.browse + offered.order + offered.bot, 'total traffic', 0, 1000);
  const appCapacity = a.resources.find(r => r.kind === 'compute')!.instances * capacity.appPerInstance;
  const ratio = incoming === 0 ? 1 : Math.min(1, appCapacity / incoming);
  const accepted = { browse: offered.browse * ratio, order: offered.order * ratio, bot: offered.bot * ratio };
  const dropped = { browse: offered.browse - accepted.browse, order: offered.order - accepted.order, bot: offered.bot - accepted.bot };
  const readsAccepted = Math.min(accepted.browse, capacity.sqlRead);
  const writesAccepted = Math.min(accepted.order, capacity.sqlWrite);
  return {
    offered, app: { capacity: appCapacity, incoming, utilization: incoming / appCapacity, accepted, dropped },
    sql: { readDemand: accepted.browse, writeDemand: accepted.order, readCapacity: capacity.sqlRead, writeCapacity: capacity.sqlWrite,
      readUtilization: accepted.browse / capacity.sqlRead, writeUtilization: accepted.order / capacity.sqlWrite,
      readsAccepted, writesAccepted, readsDropped: accepted.browse - readsAccepted, writesDropped: accepted.order - writesAccepted },
    successful: { browse: readsAccepted, order: writesAccepted },
  };
}

import { compare, value } from './economy';
import type { RequestSnapshot } from './index';

export const buckets = ['App Service Saturation', 'Azure SQL Saturation', 'Excessive Rate Limiting', 'WAF False Positives'] as const;
export type Bucket = typeof buckets[number];
export type Cause = Bucket | 'Unfiltered Bot Traffic' | 'Budget Exhaustion' | 'Overprovisioning' | 'Negative Business Value' | 'No Critical Issue';
export type Attribution = {
  losses: Record<Bucket, number>; potential: number; botDisplacement: number;
  ticks: number; offered: number; successful: number; appUtilSum: number;
  botsOffered: number; botsFiltered: number; botStreak: number; botPressure: boolean;
  eligibleReads: number; cacheHits: number;
  peaks: { app: number; cache: number; sqlRead: number; sqlWrite: number };
};
export function emptyAttribution(): Attribution {
  return { losses: { 'App Service Saturation': 0, 'Azure SQL Saturation': 0, 'Excessive Rate Limiting': 0, 'WAF False Positives': 0 },
    potential: 0, botDisplacement: 0, ticks: 0, offered: 0, successful: 0, appUtilSum: 0,
    botsOffered: 0, botsFiltered: 0, botStreak: 0, botPressure: false, eligibleReads: 0, cacheHits: 0,
    peaks: { app: 0, cache: 0, sqlRead: 0, sqlWrite: 0 } };
}
export function accumulateAttribution(previous: Attribution, request: RequestSnapshot): Attribution {
  const next = structuredClone(previous);
  const businessValue = (browse: number, order: number) => browse * value.browse + order * value.order;
  next.losses['App Service Saturation'] += businessValue(request.app.dropped.browse, request.app.dropped.order);
  next.losses['Azure SQL Saturation'] += businessValue(request.sql.readsDropped, request.sql.writesDropped);
  next.losses['Excessive Rate Limiting'] += businessValue(request.rateLimit.rejected.browse, request.rateLimit.rejected.order);
  next.losses['WAF False Positives'] += businessValue(request.edge.filtered.browse, request.edge.filtered.order);
  next.potential += businessValue(request.offered.browse, request.offered.order);
  const legitimate = request.rateLimit.passed.browse + request.rateLimit.passed.order;
  const actual = request.app.accepted.browse + request.app.accepted.order;
  const displacement = Math.max(0, Math.min(legitimate, request.app.capacity) - actual);
  if (legitimate > 0) next.botDisplacement += displacement / legitimate * businessValue(request.rateLimit.passed.browse, request.rateLimit.passed.order);
  next.ticks++; next.offered += request.offered.browse + request.offered.order;
  next.successful += request.successful.browse + request.successful.order;
  next.appUtilSum += request.app.utilization;
  next.botsOffered += request.offered.bot; next.botsFiltered += request.edge.filtered.bot;
  next.botStreak = compare(request.rateLimit.passed.bot / request.app.capacity, .2) > 0 ? next.botStreak + 1 : 0;
  next.botPressure ||= next.botStreak >= 5;
  next.eligibleReads += request.cache.eligible; next.cacheHits += request.cache.hits;
  next.peaks.app = Math.max(next.peaks.app, request.app.utilization);
  next.peaks.cache = Math.max(next.peaks.cache, request.cache.utilization ?? 0);
  next.peaks.sqlRead = Math.max(next.peaks.sqlRead, request.sql.readUtilization);
  next.peaks.sqlWrite = Math.max(next.peaks.sqlWrite, request.sql.writeUtilization);
  return next;
}
export function explain(attribution: Attribution, options: { budgetFailure?: boolean; serviceFailure?: boolean; negativeValue?: boolean; overprovisioned?: boolean } = {}) {
  const ordered = [...buckets].sort((a, b) => compare(attribution.losses[b], attribution.losses[a]) || buckets.indexOf(a) - buckets.indexOf(b));
  const meaningful = (bucket: Bucket) => compare(attribution.losses[bucket], 0) > 0 && compare(attribution.losses[bucket], attribution.potential * .01) >= 0;
  const top = ordered[0];
  let primary: Cause = meaningful(top) || (options.serviceFailure && compare(attribution.losses[top], 0) > 0) ? top : 'No Critical Issue';
  if (primary === 'App Service Saturation' && compare(attribution.botDisplacement, attribution.losses[primary] / 2) > 0) primary = 'Unfiltered Bot Traffic';
  if (primary === 'No Critical Issue' && options.overprovisioned) primary = 'Overprovisioning';
  if (options.negativeValue) primary = 'Negative Business Value';
  if (options.budgetFailure) primary = 'Budget Exhaustion';
  const contributors: Cause[] = ordered.filter(b => meaningful(b) && b !== primary);
  if (attribution.botPressure && primary !== 'Unfiltered Bot Traffic') contributors.push('Unfiltered Bot Traffic');
  if (options.overprovisioned && primary !== 'Overprovisioning') contributors.push('Overprovisioning');
  const bottleneck = primary === 'App Service Saturation' || primary === 'Unfiltered Bot Traffic' ? 'App Service' : primary === 'Azure SQL Saturation' ? 'Azure SQL' : null;
  const insights: Record<Cause, string> = {
    'App Service Saturation': 'App capacity rejected business traffic. Prepare scale-out before the surge.',
    'Azure SQL Saturation': 'SQL capacity rejected business operations. Cache can reduce eligible reads; scaling App does not scale SQL.',
    'Excessive Rate Limiting': 'Rate limiting rejected customers. Reduce its active duration if the latency benefit is not worth the lost business.',
    'WAF False Positives': 'Ingress filtering blocked legitimate traffic. Stronger filtering trades customer access for bot protection.',
    'Unfiltered Bot Traffic': 'Bots displaced legitimate requests at App admission. Protected ingress can reduce this pressure before compute.',
    'Budget Exhaustion': 'Infrastructure and emergency spending exhausted the operational budget. Revenue does not replenish it.',
    'Overprovisioning': 'The service survived with costly, lightly utilized compute. Compare a smaller instance configuration.',
    'Negative Business Value': 'Operating and incident costs exceeded realized business value despite survival.',
    'No Critical Issue': 'No business-loss cause crossed the reporting threshold. Compare target attainment and cost before expanding.',
  };
  return { primary, bottleneck, contributors, insight: insights[primary] };
}

import type { RequestSnapshot } from '@stack-and-survive/simulation';
import { compare } from '@stack-and-survive/simulation/economy';

export const glossary = [
  ['RPS', 'Requests per second: offered traffic, not the number of animated markers.'],
  ['Availability', 'The share of offered legitimate requests successfully served. Bots are excluded; blocked customers still count as failed.'],
  ['Latency', 'Time to serve successful requests in the simplified model. Failed requests affect error rate instead.'],
  ['Utilization', 'Demand divided by active capacity. Above 100% means demand exceeds capacity.'],
  ['Cache hit ratio', 'The share of eligible reads served by Cache. Order writes still go to SQL.'],
  ['Scale out', 'Add an App instance after provisioning. This increases compute capacity and cost, not SQL capacity.'],
  ['WAF', 'Protected ingress filters bots only on its connected path; false positives block some legitimate requests.'],
  ['Rate Limit', 'Rejects all request classes proportionally. It can lower latency, but costs customers and is not a free throughput upgrade.'],
  ['Net business value', 'Revenue minus infrastructure cost, emergency cost, and incident loss.'],
  ['Budget', 'The remaining allowed infrastructure and emergency expenditure. Revenue does not refill it.'],
] as const;

export function pressureHint(snapshot: RequestSnapshot | null): string {
  if (!snapshot) return 'Start with the baseline and watch where pressure appears. You can redesign after the attempt.';
  if (compare(snapshot.app.utilization, 1) > 0) return 'App Service demand exceeds active compute capacity. Scale-out takes time; check whether bots are consuming capacity too.';
  if (compare(snapshot.sql.writeUtilization, 1) > 0) return 'SQL writes exceed capacity. Cache does not remove Order writes, and scaling App does not scale SQL.';
  if (compare(snapshot.sql.readUtilization, 1) > 0) return 'SQL reads exceed capacity while App has enough capacity. A connected Cache can reduce eligible reads.';
  return 'No processing layer is above capacity in this tick. Watch the next traffic phase and the cost of your design.';
}

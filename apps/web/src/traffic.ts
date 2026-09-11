import type { RequestSnapshot } from '@stack-and-survive/simulation';
import type { Kind } from '@stack-and-survive/schema';

export type VisualFlow = {
  from: Kind; to: Kind; kind: 'browse' | 'order' | 'bot'; volume: number;
  end: 'continue' | 'success' | 'filtered' | 'failed';
};
export function visualFlows(s: RequestSnapshot): VisualFlow[] {
  const flows: VisualFlow[] = [];
  const add = (from: Kind, to: Kind, kind: VisualFlow['kind'], volume: number, end: VisualFlow['end']) => {
    if (volume > 0) flows.push({ from, to, kind, volume, end });
  };
  for (const kind of ['browse', 'order', 'bot'] as const) {
    if (s.edge.active) {
      add('internet', 'edge', kind, s.edge.filtered[kind], kind === 'bot' ? 'filtered' : 'failed');
      add('internet', 'edge', kind, s.edge.passed[kind], 'continue');
    }
    const ingress = s.edge.active ? 'edge' : 'internet';
    add(ingress, 'compute', kind, s.rateLimit.rejected[kind], 'filtered');
    add(ingress, 'compute', kind, s.app.dropped[kind], 'failed');
    add(ingress, 'compute', kind, s.app.accepted[kind], kind === 'bot' ? 'success' : 'continue');
  }
  if (s.cache.active) {
    add('compute', 'cache', 'browse', s.cache.hits, 'success');
    add('compute', 'cache', 'browse', s.cache.misses + s.cache.overflow, 'continue');
    add('cache', 'database', 'browse', s.sql.readsAccepted, 'success');
    add('cache', 'database', 'browse', s.sql.readsDropped, 'failed');
  } else {
    add('compute', 'database', 'browse', s.sql.readsAccepted, 'success');
    add('compute', 'database', 'browse', s.sql.readsDropped, 'failed');
  }
  add('compute', 'database', 'order', s.sql.writesAccepted, 'success');
  add('compute', 'database', 'order', s.sql.writesDropped, 'failed');
  return flows;
}
export function representativeCount(volume: number): number {
  return volume <= 0 ? 0 : Math.min(8, Math.ceil(volume / 15));
}

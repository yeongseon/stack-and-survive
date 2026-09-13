import type { Kind, Resource } from '@stack-and-survive/schema';
import { compare } from '@stack-and-survive/simulation/economy';
import type { View } from './controller';

export type BayState = 'active' | 'available' | 'locked' | 'queued' | 'construction';
export type PressureState = 'unmeasured' | 'healthy' | 'warning' | 'overcapacity';
export function pressureState(utilization: number | null): PressureState {
  return utilization === null || !Number.isFinite(utilization) ? 'unmeasured'
    : compare(utilization, 1) > 0 ? 'overcapacity' : compare(utilization, .7) > 0 ? 'warning' : 'healthy';
}
export function appBays(resource: Resource | undefined, pending: boolean, queued = false): BayState[] {
  const count = resource?.kind === 'compute' && resource.remaining === 0 ? resource.instances : 0;
  return Array.from({ length: 4 }, (_, i) => i < count ? 'active'
    : i === count && count > 0 ? pending ? 'construction' : queued ? 'queued' : 'available' : 'locked');
}
export type ResourceVisualState = {
  kind: Kind;
  lifecycle: 'absent' | 'provisioning' | 'active';
  deploymentQueued: boolean;
  remaining: number;
  onPath: boolean;
  pressure: PressureState;
};
export function resourceVisualState(view: View, reducedMotion = false) {
  const runtime = view.state.runtime;
  const request = view.snapshot?.requests;
  const resources = runtime.architecture.resources;
  const get = (kind: Kind) => resources.find(r => r.kind === kind);
  const live = runtime.status === 'RUNNING' && !view.error;
  const canAnimate = !reducedMotion && !view.error && (live || runtime.status === 'PREPARATION');
  const installed = (kind: Kind) => !!get(kind) && get(kind)!.remaining === 0;
  const base = (kind: Kind, utilization: number | null): ResourceVisualState => {
    const resource = get(kind);
    return {
      kind, lifecycle: !resource ? 'absent' : resource.remaining > 0 ? 'provisioning' : 'active',
      deploymentQueued: view.queuedActions.some(a => a.type === 'DEPLOY_RESOURCE' && a.kind === kind),
      remaining: resource?.remaining ?? 0,
      onPath: !!resource && resource.remaining === 0 && runtime.architecture.connections.some(c => c.from === resource.id || c.to === resource.id),
      pressure: pressureState(resource?.remaining === 0 ? utilization : null),
    };
  };
  const scaleDue = runtime.status === 'PREPARATION' ? runtime.preparationScaleDue : runtime.scaleDue;
  const clock = runtime.status === 'PREPARATION' ? runtime.preparationTime : runtime.time;
  const boost = runtime.emergency;
  const boostActive = !!boost && !!view.snapshot && view.snapshot.time >= boost.start && view.snapshot.time < boost.end;
  const edgeOnPath = installed('edge') && !!request?.edge.active;
  const cacheOnPath = installed('cache') && !!request?.cache.active;
  return {
    live, canAnimate, reading: !view.snapshot ? 'unmeasured' : live ? 'current-tick' : 'last-tick',
    app: {
      ...base('compute', request?.app.utilization ?? null),
      bays: appBays(get('compute'), scaleDue !== null, view.queuedActions.some(a => a.type === 'SCALE_OUT')),
      scaleRemaining: scaleDue === null ? null : Math.max(0, scaleDue - clock),
    },
    cache: {
      ...base('cache', request?.cache.utilization ?? null),
      hits: cacheOnPath ? request!.cache.hits : 0,
      misses: cacheOnPath ? request!.cache.misses : 0,
      overflow: cacheOnPath ? request!.cache.overflow : 0,
      showHitEffect: live && cacheOnPath && request!.cache.hits > 0,
    },
    edge: {
      ...base('edge', null),
      boost: !installed('edge') ? 'unavailable' : boost ? boostActive ? 'active' : 'scheduled'
        : view.queuedActions.some(a => a.type === 'EMERGENCY_WAF') ? 'queued' : runtime.emergencyUsed ? 'spent' : 'available',
      filteredBots: edgeOnPath ? request!.edge.filtered.bot : 0,
      filteredCustomers: edgeOnPath ? request!.edge.filtered.browse + request!.edge.filtered.order : 0,
      showFilterEffect: live && edgeOnPath && request!.edge.filtered.bot > 0,
      showBoostEffect: live && edgeOnPath && boostActive && request!.edge.filtered.bot > 0,
    },
    sql: {
      ...base('database', request ? Math.max(request.sql.readUtilization, request.sql.writeUtilization) : null),
      readPressure: pressureState(request?.sql.readUtilization ?? null),
      writePressure: pressureState(request?.sql.writeUtilization ?? null),
      readsDropped: request?.sql.readsDropped ?? 0, writesDropped: request?.sql.writesDropped ?? 0,
    },
    internet: {
      ...base('internet', null),
      offered: request ? request.offered.browse + request.offered.order + request.offered.bot : null,
      rateLimited: request?.rateLimit.active ?? false,
      rateTransition: runtime.rateTransition ? 'pending' : view.queuedActions.some(a => a.type === 'RATE_LIMIT') ? 'queued' : 'none',
      targetRateLimited: runtime.rateTransition?.enabled ?? view.queuedActions.find(a => a.type === 'RATE_LIMIT')?.enabled ?? null,
      rejectedBots: request?.rateLimit.rejected.bot ?? 0,
      rejectedCustomers: request ? request.rateLimit.rejected.browse + request.rateLimit.rejected.order : 0,
    },
  };
}

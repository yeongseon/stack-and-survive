import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { createController } from './controller';
import { appBays, pressureState, resourceVisualState } from './resource-visual-state';

it('projects actual solid modules, a next empty bay, and later locked bays', () => {
  for (let count = 1; count <= 4; count++) {
    const app = baseline(count).resources[1];
    expect(appBays(app, false).filter(b => b === 'active')).toHaveLength(count);
    expect(appBays(app, false).filter(b => b === 'available')).toHaveLength(count < 4 ? 1 : 0);
  }
  expect(appBays(baseline().resources[1], false, true)).toEqual(['active', 'queued', 'locked', 'locked']);
  expect(appBays(baseline().resources[1], true)).toEqual(['active', 'construction', 'locked', 'locked']);
  expect(appBays({ ...baseline().resources[1], remaining: 3 }, true)).not.toContain('active');
});
it('projects deployment and scale before/during/after without early effects or mutation', () => {
  const c = createController({ start: () => () => {} }); c.start(); c.inspectNextTick();
  const initial = c.getSnapshot(); const before = structuredClone(initial);
  expect(resourceVisualState(initial).cache.lifecycle).toBe('absent');
  c.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 0, y: 100 });
  c.queueAction({ type: 'SCALE_OUT' });
  expect(resourceVisualState(c.getSnapshot()).app.bays[1]).toBe('queued');
  expect(resourceVisualState(c.getSnapshot()).cache).toMatchObject({ lifecycle: 'absent', deploymentQueued: true, showHitEffect: false });
  c.inspectNextTick();
  expect(resourceVisualState(c.getSnapshot()).app.bays[1]).toBe('construction');
  expect(resourceVisualState(c.getSnapshot()).cache).toMatchObject({ lifecycle: 'provisioning', onPath: false, hits: 0 });
  for (let i = 0; i < 5; i++) c.inspectNextTick();
  expect(resourceVisualState(c.getSnapshot()).cache).toMatchObject({ lifecycle: 'active', onPath: true, showHitEffect: true });
  for (let i = 0; i < 3; i++) c.inspectNextTick();
  expect(resourceVisualState(c.getSnapshot()).app.bays).toEqual(['active', 'active', 'available', 'locked']);
  c.pause(); expect(resourceVisualState(c.getSnapshot())).toMatchObject({ live: false, reading: 'last-tick', canAnimate: false });
  expect(resourceVisualState(c.getSnapshot()).cache.showHitEffect).toBe(false);
  expect(initial).toEqual(before); c.destroy();
});
it('distinguishes queued scheduled and active filtering and intake policy', () => {
  const c = createController({ start: () => () => {} }, { load: () => baseline(3, true, true), save: () => {}, clear: () => {} });
  c.start(); while (c.getSnapshot().state.runtime.time < 76) c.inspectNextTick();
  c.queueAction({ type: 'EMERGENCY_WAF' }); c.queueAction({ type: 'RATE_LIMIT', enabled: true });
  expect(resourceVisualState(c.getSnapshot()).edge.boost).toBe('queued');
  expect(resourceVisualState(c.getSnapshot()).internet.rateTransition).toBe('queued');
  c.inspectNextTick();
  expect(resourceVisualState(c.getSnapshot()).edge).toMatchObject({ boost: 'scheduled', showBoostEffect: false });
  expect(resourceVisualState(c.getSnapshot()).internet).toMatchObject({ rateLimited: false, rateTransition: 'pending', targetRateLimited: true });
  c.inspectNextTick(); expect(resourceVisualState(c.getSnapshot()).edge).toMatchObject({ boost: 'active', showBoostEffect: true });
  expect(resourceVisualState(c.getSnapshot()).internet.rateLimited).toBe(false);
  c.inspectNextTick(); expect(resourceVisualState(c.getSnapshot()).internet).toMatchObject({ rateLimited: true, rateTransition: 'none' });
  expect(resourceVisualState(c.getSnapshot(), true).canAnimate).toBe(false);
  c.destroy();
});
it('preserves separate SQL pressure and rejects impossible reference assumptions', () => {
  expect(pressureState(.7)).toBe('healthy'); expect(pressureState(.9)).toBe('warning'); expect(pressureState(1.01)).toBe('overcapacity');
  const limited = processRequests(baseline(1), { browse: 176, order: 44, bot: 0 });
  expect(limited.app.utilization).toBeGreaterThan(1);
  expect(limited.sql.readUtilization).toBeLessThan(1); expect(limited.sql.writeUtilization).toBeLessThan(1);
  const c = createController({ start: () => () => {} }); c.start(); c.inspectNextTick();
  const view = structuredClone(c.getSnapshot());
  view.snapshot!.requests = processRequests(baseline(4, true), { browse: 100, order: 100, bot: 0 });
  expect(resourceVisualState(view).sql).toMatchObject({ readPressure: 'healthy', writePressure: 'overcapacity' });
  c.destroy();
});

import { expect, it } from 'vitest';
import { createController } from './controller';
import { activityPose, resourceActivity } from './resource-activity';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';

it('only animates actual active processing and never queued or constructing App capacity', () => {
  const c = createController({ start: () => () => {} });
  expect(resourceActivity(c.getSnapshot())).toEqual([]); c.start(); c.inspectNextTick();
  const before = structuredClone(c.getSnapshot());
  expect(resourceActivity(before).filter(a => a.type === 'server-work')).toHaveLength(1);
  c.queueAction({ type: 'SCALE_OUT' }); c.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 0, y: 100 });
  expect(resourceActivity(c.getSnapshot()).filter(a => a.type === 'server-work')).toHaveLength(1);
  expect(resourceActivity(c.getSnapshot()).some(a => a.type === 'cache-work')).toBe(false);
  c.inspectNextTick();
  expect(resourceActivity(c.getSnapshot()).filter(a => a.type === 'server-work')).toHaveLength(1);
  expect(resourceActivity(c.getSnapshot()).some(a => a.type === 'cache-work')).toBe(false);
  for (let i=0;i<8;i++) c.inspectNextTick();
  expect(resourceActivity(c.getSnapshot()).filter(a => a.type === 'server-work')).toHaveLength(2);
  expect(resourceActivity(c.getSnapshot()).some(a => a.type === 'cache-work')).toBe(true);
  c.pause(); expect(resourceActivity(c.getSnapshot())).toEqual([]);
  expect(before.state.runtime.architecture.resources[1].instances).toBe(1);
  c.destroy();
});
it('independently reports accepted SQL reads and writes, never invented work or error activity', () => {
  const c = createController({ start: () => () => {} }); c.start(); c.inspectNextTick();
  const view = structuredClone(c.getSnapshot());
  for (const [traffic, expected] of [
    [{ browse: 100, order: 0, bot: 0 }, ['sql-read']],
    [{ browse: 0, order: 50, bot: 0 }, ['sql-write']],
    [{ browse: 0, order: 0, bot: 100 }, []],
    [{ browse: 0, order: 0, bot: 0 }, []],
  ] as const) {
    view.snapshot!.requests = processRequests(baseline(), traffic);
    expect(resourceActivity(view).filter(a => a.resource === 'database').map(a => a.type)).toEqual(expected);
  }
  view.snapshot!.requests = processRequests(baseline(), { browse: 100, order: 20, bot: 0 });
  view.error = 'Renderer unavailable'; expect(resourceActivity(view)).toEqual([]);
  view.error = null; view.state.runtime.status = 'FAILED'; expect(resourceActivity(view)).toEqual([]);
  c.destroy();
});
it('keeps a static equivalent for reduced motion and a bounded slow activity loop', () => {
  expect(activityPose(0, false)).toEqual(activityPose(99999, false));
  for (const time of [0,100,1599,3200,15000]) {
    const pose = activityPose(time,true);
    expect(pose.phase).toBeGreaterThanOrEqual(0); expect(pose.phase).toBeLessThan(1);
    expect(pose.alpha).toBeGreaterThanOrEqual(.42); expect(pose.alpha).toBeLessThanOrEqual(.78);
  }
});

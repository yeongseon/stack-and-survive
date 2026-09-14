import { expect, it } from 'vitest';
import { createController } from './controller';
import { constructionProgress, constructionSites } from './construction-art';

it('shows only accepted construction and advances from actual ticks until activation', () => {
  const c = createController({ start: () => () => {} }, undefined, true);
  c.start();
  c.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 190, y: -100 });
  c.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'edge', x: -210, y: 0 });
  c.queueAction({ type: 'SCALE_OUT' });
  expect(constructionSites(c.getSnapshot())).toEqual([]);
  c.inspectNextTick();
  expect(constructionSites(c.getSnapshot()).map(s => [s.resource.kind,s.progress,s.bay])).toEqual([
    ['compute',.125,1], ['cache',0,null], ['edge',0,null],
  ]);
  c.pause(); const paused = constructionSites(c.getSnapshot()); c.inspectNextTick();
  expect(constructionSites(c.getSnapshot())).toEqual(paused);
  c.resume();
  for (let i=0;i<8;i++) c.inspectNextTick();
  expect(constructionSites(c.getSnapshot())).toEqual([]);
  expect(c.getSnapshot().state.runtime.architecture.resources.find(r => r.kind === 'compute')?.instances).toBe(2);
  c.destroy();
});
it('bounds invalid or stale progress without inventing active capacity', () => {
  expect(constructionProgress(5,5)).toBe(0);
  expect(constructionProgress(2,5)).toBe(.6);
  expect(constructionProgress(-1,5)).toBe(1);
  expect(constructionProgress(99,5)).toBe(0);
  expect(constructionProgress(NaN,5)).toBe(0);
  expect(constructionProgress(0,0)).toBe(0);
});

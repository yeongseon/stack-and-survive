import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { createController } from './controller';
import { guideHint, parseGuideRecord } from './world-guide';

function viewFor(instances = 1, cache = false, edge = false) {
  const c = createController({ start: () => () => {} }, { load: () => baseline(instances, cache, edge), save: () => {}, clear: () => {} });
  c.start(); c.inspectNextTick(); const view = structuredClone(c.getSnapshot()); c.destroy();
  return view;
}
it('offers observation and waiting without manufacturing a bottleneck or mutating the view', () => {
  const view = viewFor(); const before = structuredClone(view);
  expect(guideHint(view, 'observe').target).toBe('internet');
  expect(guideHint(view, 'decide').target).toBe(null);
  expect(guideHint(view, 'compare').text).toContain('not guaranteed');
  expect(view).toEqual(before);
});
it('bases expansion suggestions on real pressure and respects read/write separation', () => {
  const app = viewFor(); app.snapshot!.requests = processRequests(baseline(), { browse: 176, order: 44, bot: 0 });
  expect(guideHint(app, 'decide').target).toBe('compute');
  const read = viewFor(4); read.snapshot!.requests = processRequests(baseline(4), { browse: 240, order: 60, bot: 0 });
  expect(guideHint(read, 'decide').target).toBe('cache');
  const write = viewFor(4, true); write.snapshot!.requests = processRequests(baseline(4, true), { browse: 100, order: 100, bot: 0 });
  expect(guideHint(write, 'decide').target).toBe('database');
  expect(guideHint(write, 'decide').text).toContain('does not remove Order writes');
  const bot = viewFor(); bot.snapshot!.requests = processRequests(baseline(), { browse: 80, order: 20, bot: 100 });
  expect(guideHint(bot, 'decide').target).toBe('edge');
});
it('does not direct unavailable actions during pending construction pause failure or low budget', () => {
  const view = viewFor(); view.snapshot!.requests = processRequests(baseline(), { browse: 176, order: 44, bot: 0 });
  view.queuedActions.push({ type: 'SCALE_OUT', time: 1, sequence: 0 });
  expect(guideHint(view, 'decide')).toMatchObject({ title: 'Request sent', target: null });
  view.queuedActions.length = 0; view.state.runtime.scaleDue = 9;
  expect(guideHint(view, 'decide').target).toBe(null);
  view.state.runtime.scaleDue = null; view.state.economy.remainingBudget = 10;
  expect(guideHint(view, 'decide').title).toBe('Upgrade Funds are running low');
  view.state.runtime.status = 'PAUSED'; expect(guideHint(view, 'decide').target).toBe(null);
  view.state.runtime.status = 'FAILED'; expect(guideHint(view, 'decide').title).toBe('Review your decision');
  expect(guideHint({ ...view, error: 'Graphics unavailable' }, 'decide').target).toBe(null);
});
it('only skips future guides after a valid explicit recorded dismissal or completion', () => {
  for (const raw of [null, '{bad', '{}', '{"version":2,"status":"completed"}', '{"version":1,"status":"automatic"}']) expect(parseGuideRecord(raw)).toBe('new');
  expect(parseGuideRecord('{"version":1,"status":"skipped"}')).toBe('skipped');
  expect(parseGuideRecord('{"version":1,"status":"completed"}')).toBe('completed');
});
it('does not suggest waiting when an installed or maximum-capacity resource still overloads', () => {
  const read = viewFor(4, true);
  read.snapshot!.requests = processRequests(baseline(4, true), { browse: 600, order: 0, bot: 0 });
  expect(guideHint(read, 'decide').target).toBe('database');
  expect(guideHint(read, 'decide').title).not.toBe('You do not have to build yet');
  const saturated = viewFor(4, true, true);
  saturated.snapshot!.requests = processRequests(baseline(4, true, true), { browse: 500, order: 0, bot: 500 });
  expect(guideHint(saturated, 'decide').title).toBe('App is at its expansion limit');
  expect(guideHint(saturated, 'decide').target).toBe('internet');
});

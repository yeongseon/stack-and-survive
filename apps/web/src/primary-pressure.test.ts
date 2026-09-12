import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { createController } from './controller';
import { primaryPressure } from './primary-pressure';

function measured() {
  const controller = createController({ start: () => () => {} });
  controller.start(); controller.inspectNextTick();
  const view = structuredClone(controller.getSnapshot()); controller.destroy();
  return view;
}
it('shows preparation and healthy readings without invented demand or forecasts', () => {
  const controller = createController({ start: () => () => {} });
  expect(primaryPressure(controller.getSnapshot()).label).toBe('Awaiting demand'); controller.destroy();
  const view = measured(); const before = structuredClone(view);
  expect(primaryPressure(view)).toMatchObject({ label: 'Within capacity', urgent: false });
  expect(view).toEqual(before);
});
it('chooses the strongest actual App/read/write pressure and preserves action boundaries', () => {
  const view = measured();
  view.snapshot!.requests = processRequests(baseline(), { browse: 176, order: 44, bot: 0 });
  expect(primaryPressure(view)).toMatchObject({ label: 'App over capacity', urgent: true });
  view.snapshot!.requests = processRequests(baseline(4), { browse: 400, order: 100, bot: 0 });
  expect(primaryPressure(view).label).toBe('SQL reads over capacity');
  view.snapshot!.requests = processRequests(baseline(4, true), { browse: 100, order: 100, bot: 0 });
  expect(primaryPressure(view).label).toBe('SQL writes over capacity');
  expect(primaryPressure(view).why).toContain('Cache does not remove writes');
});
it('keeps healthy-at70% and low-budget thresholds aligned with engine rules', () => {
  const view = measured(); view.snapshot!.requests = processRequests(baseline(), { browse: 84, order: 21, bot: 0 });
  expect(primaryPressure(view).label).toBe('Within capacity');
  view.snapshot!.requests = processRequests(baseline(), { browse: 90, order: 22, bot: 0 });
  expect(primaryPressure(view).label).toBe('App busy');
  view.state.economy.remainingBudget = 28;
  expect(primaryPressure(view).label).toBe('App busy');
  view.state.economy.remainingBudget = 27.9;
  expect(primaryPressure(view).label).toBe('Budget running low');
  expect(primaryPressure(view).why).toContain('Revenue does not refill');
  view.state.economy.remainingBudget = 0;
  expect(primaryPressure(view).label).toBe('Budget exhausted');
});

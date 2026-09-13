import { expect, it } from 'vitest';
import { createController } from './controller';
import { businessFeedback } from './business-feedback';

it('shows actual per-tick served business without replaying rewards or spendable balance', () => {
  const controller = createController({ start: () => () => {} });
  expect(businessFeedback(controller.getSnapshot())).toBe(null);
  controller.start(); controller.inspectNextTick();
  const view = controller.getSnapshot(); const before = structuredClone(view);
  expect(businessFeedback(view)).toEqual({ tick: 0, orders: 20, revenue: 1.16 });
  expect(businessFeedback(view)).toEqual(businessFeedback(view)); expect(view).toEqual(before);
  controller.pause(); expect(businessFeedback(controller.getSnapshot())).toBe(null);
  controller.destroy();
});

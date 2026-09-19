import { expect, it } from 'vitest';
import { createController } from './controller';
import { facilityConstruction } from './facility-feedback';

it('projects real build progress, freezes on pause and clears only at activation', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  controller.start(); controller.inspectNextTick();
  controller.queueAction({ type: 'SCALE_OUT' });
  expect(facilityConstruction(controller.getSnapshot(), 'compute')).toBeNull();
  controller.inspectNextTick();
  const view = controller.getSnapshot();
  const before = structuredClone(view);
  const pending = facilityConstruction(view, 'compute');
  expect(pending).toMatchObject({ label: 'EXPANDING', remaining: 7, progress: .125 });
  expect(view).toEqual(before);
  controller.pause();
  expect(facilityConstruction(controller.getSnapshot(), 'compute')).toEqual(pending);
  controller.resume();
  for (let tick = 0; tick < 8; tick++) controller.inspectNextTick();
  expect(facilityConstruction(controller.getSnapshot(), 'compute')).toBeNull();
  expect(controller.getSnapshot().state.runtime.architecture.resources.find(resource => resource.kind === 'compute')?.instances).toBe(2);
  controller.destroy();
});

it('uses authoritative tier and replica transition intervals without changing state', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  controller.start(); controller.inspectNextTick();
  controller.queueAction({ type: 'SCALE_UP_DATABASE' }); controller.inspectNextTick();
  expect(facilityConstruction(controller.getSnapshot(), 'database')).toMatchObject({ label: 'TIER CHANGE', remaining: 9 });
  expect(facilityConstruction(controller.getSnapshot(), 'database')?.progress).toBeCloseTo(.1, 12);
  for (let tick = 0; tick < 10; tick++) controller.inspectNextTick();
  expect(facilityConstruction(controller.getSnapshot(), 'database')).toBeNull();
  controller.queueAction({ type: 'ADD_READ_REPLICA' }); controller.inspectNextTick();
  expect(facilityConstruction(controller.getSnapshot(), 'database')).toMatchObject({ label: 'REPLICA CHANGE', remaining: 7 });
  controller.destroy();
});

import { expect, it } from 'vitest';
import { createController, type Clock } from './controller';
import { objectives, updateEvents } from './observations';

it('records only transitions and keeps provisional goals distinct from final success', () => {
  let tick = () => {}; const clock: Clock = { start(fn) { tick = fn; return () => {}; } };
  const controller = createController(clock);
  expect(objectives(controller.getSnapshot()).every(o => o.status === 'pending')).toBe(true);
  controller.start(); tick();
  expect(objectives(controller.getSnapshot())[0].status).toBe('pending');
  expect(controller.getSnapshot().events.some(e => e.text === 'Black Friday started')).toBe(true);
  for (let i = 1; i < 35; i++) tick();
  expect(controller.getSnapshot().events.filter(e => e.text === 'App Service overloaded')).toHaveLength(1);
  const previous = structuredClone(controller.getSnapshot());
  controller.select('compute'); expect(controller.getSnapshot().events).toEqual(previous.events);
  while (controller.getSnapshot().state.runtime.status === 'RUNNING') tick();
  expect(objectives(controller.getSnapshot())[0].status).toBe('missed');
  expect(controller.getSnapshot().events.at(-1)!.text).toBe('Scenario failed');
  controller.redesign(); expect(controller.getSnapshot().events.every(e => e.clock === 'prep')).toBe(true);
  controller.destroy();
});
it('bounds history and does not mutate projection inputs', () => {
  const controller = createController(); const view = controller.getSnapshot();
  const old = Array.from({ length: 40 }, (_, i) => ({ key: String(i), time: i, clock: 'run' as const, text: `Event ${i}` }));
  const before = structuredClone(view); const result = updateEvents(old, view, view);
  expect(result).toHaveLength(30); expect(old).toHaveLength(40); expect(view).toEqual(before); controller.destroy();
});
it('records pause and resume separately even within the same simulation tick', () => {
  const controller = createController({ start: () => () => {} }); controller.start();
  controller.pause(); controller.resume(); controller.pause(); controller.resume();
  const events = controller.getSnapshot().events;
  expect(events.filter(e => e.text === 'Traffic paused')).toHaveLength(2);
  expect(events.filter(e => e.text === 'Traffic resumed')).toHaveLength(2);
  expect(new Set(events.map(e => e.key)).size).toBe(events.length);
  expect(events.every(e => e.time === 0)).toBe(true); controller.destroy();
});

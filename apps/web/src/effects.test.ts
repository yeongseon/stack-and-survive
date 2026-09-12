import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { createSimulation, advanceSimulation } from '@stack-and-survive/simulation/results';
import { startRuntime } from '@stack-and-survive/simulation/runtime';
import { createController, type View } from './controller';
import { activeEffects, completedResources, effectMotion } from './effects';

it('never invents traffic effects on disconnected resources or during pause', () => {
  const controller = createController(); const view = controller.getSnapshot();
  expect(activeEffects(view)).toEqual([]);
  expect(effectMotion(view, true)).toBe(false);
  expect(effectMotion({ ...view, state: { ...view.state, runtime: { ...view.state.runtime, status: 'PAUSED' } } }, false)).toBe(false);
  controller.destroy();
});
it('completion effects only come from actual preparation or scale completion', () => {
  const controller = createController(); const view = controller.getSnapshot();
  const previous = structuredClone(view); previous.state.runtime.architecture.resources[1].remaining = 1;
  expect(completedResources(previous, view)).toEqual(['compute']);
  expect(completedResources(view, view)).toEqual([]);
  previous.state.runtime.status = 'FAILED';
  expect(completedResources(previous, view)).toEqual([]); controller.destroy();
});
it('projects only recorded cache and bot filtering outcomes and preserves input', () => {
  let state = createSimulation(baseline(3, true, true), blackFriday); state.runtime = startRuntime(state.runtime);
  while (state.runtime.time < 75) state = advanceSimulation(state, blackFriday).nextState;
  const tick = advanceSimulation(state, blackFriday);
  const controller = createController();
  const view: View = { ...controller.getSnapshot(), state: tick.nextState, snapshot: tick.snapshot };
  const before = structuredClone(view);
  expect(activeEffects(view).map(e => e.type)).toEqual(['cache-hit', 'shield']);
  expect(view).toEqual(before);
  const paused: View = { ...view, state: { ...view.state, runtime: { ...view.state.runtime, status: 'PAUSED' } } };
  expect(activeEffects(paused)).toEqual([]); controller.destroy();
});

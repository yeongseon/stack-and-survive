import { expect, it } from 'vitest';
import { createController, type Clock } from './controller';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { simulateScenario } from '@stack-and-survive/simulation/results';

function fixture() {
  let callback = () => {}; let active = 0;
  const timer: Clock = { start(fn) { callback = fn; active++; return () => { active--; }; } };
  return { controller: createController(timer), tick: () => callback(), active: () => active };
}
it('advances only from the orchestration clock, not snapshot reads', () => {
  const f = fixture(); f.controller.start(); f.controller.start();
  expect(f.active()).toBe(1);
  for (let i = 0; i < 200; i++) f.controller.getSnapshot();
  expect(f.controller.getSnapshot().state.runtime.time).toBe(0);
  f.tick(); expect(f.controller.getSnapshot().state.runtime.time).toBe(1);
  f.controller.destroy(); expect(f.active()).toBe(0);
  f.tick(); expect(f.controller.getSnapshot().state.runtime.time).toBe(1);
});
it('matches headless results and stops timer on baseline failure', () => {
  const f = fixture(); f.controller.start();
  for (let i = 0; i < 50; i++) f.tick();
  expect(f.controller.getSnapshot().result).toEqual(simulateScenario(baseline(), blackFriday));
  expect(f.active()).toBe(0);
  f.tick(); expect(f.controller.getSnapshot().state.runtime.time).toBe(50);
});
it('resets timing and stops automatic time when inspecting ticks', () => {
  const f = fixture(); f.controller.start(); f.tick(); f.controller.inspectNextTick();
  expect(f.active()).toBe(0); expect(f.controller.getSnapshot().state.runtime.time).toBe(2);
  f.controller.reset(4); expect(f.controller.getSnapshot().snapshot).toBeNull();
  expect(f.controller.getSnapshot().state.runtime.architecture.resources[1].instances).toBe(4);
  f.controller.start(); expect(f.active()).toBe(1);
  f.controller.reset(); expect(f.active()).toBe(0); f.controller.destroy();
});
it('renderer failure halts the clock without changing simulation totals', () => {
  const f = fixture(); f.controller.start(); f.tick();
  const previous = f.controller.getSnapshot().state;
  f.controller.presentationFailed('Renderer failed'); f.tick();
  expect(f.active()).toBe(0); expect(f.controller.getSnapshot().state).toEqual(previous);
  expect(f.controller.getSnapshot().error).toBe('Renderer failed'); f.controller.destroy();
});

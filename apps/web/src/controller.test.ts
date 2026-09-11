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
it('provisions optional resources only in preparation without charging runtime', () => {
  const f = fixture(); f.controller.build('cache'); f.controller.place({ x: -240, y: 200 });
  expect(f.active()).toBe(1);
  for (let i = 0; i < 5; i++) f.tick();
  expect(f.controller.getSnapshot().state.runtime.architecture.resources.find(r => r.kind === 'cache')!.remaining).toBe(0);
  expect(f.controller.getSnapshot().state.runtime.time).toBe(0);
  expect(f.controller.getSnapshot().state.economy.infrastructureCost).toBe(0);
  expect(f.active()).toBe(0); f.controller.destroy();
});
it('rejects architecture edits while running and safely removes pending compute', () => {
  const f = fixture(); f.controller.scalePreparation(); expect(f.active()).toBe(1);
  f.controller.remove('compute'); f.tick();
  expect(f.active()).toBe(0); expect(f.controller.getSnapshot().state.runtime.preparationScaleDue).toBeNull();
  f.controller.reset(); f.controller.start();
  const architecture = structuredClone(f.controller.getSnapshot().state.runtime.architecture);
  f.controller.move('compute', { x: 600, y: 200 }); f.controller.remove('database'); f.controller.build('cache'); f.controller.scalePreparation();
  expect(f.controller.getSnapshot().state.runtime.architecture).toEqual(architecture);
  f.controller.destroy();
});
it('ignores callbacks from cancelled timer generations after reset and restart', () => {
  const callbacks: (() => void)[] = [];
  const timer: Clock = { start(callback) { callbacks.push(callback); return () => {}; } };
  const controller = createController(timer);
  controller.build('cache'); controller.place({ x: -240, y: 200 });
  const oldPrepare = callbacks[0];
  controller.reset();
  const baselineState = structuredClone(controller.getSnapshot());
  oldPrepare(); expect(controller.getSnapshot()).toEqual(baselineState);
  controller.start(); const oldRun = callbacks[1];
  controller.reset(); controller.start();
  oldPrepare(); oldRun();
  expect(controller.getSnapshot().state.runtime.time).toBe(0);
  callbacks[2](); expect(controller.getSnapshot().state.runtime.time).toBe(1);
  controller.destroy(); callbacks[2]();
  expect(controller.getSnapshot().state.runtime.time).toBe(1);
});

import { expect, it } from 'vitest';
import { createController, type Clock } from './controller';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { simulateScenario } from '@stack-and-survive/simulation/results';
import { pauseRuntime } from '@stack-and-survive/simulation/runtime';

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
  expect(f.active()).toBe(0); expect(f.controller.getSnapshot().state).toEqual({ ...previous, runtime: pauseRuntime(previous.runtime) });
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
it('connects only during preparation and clears stale connection selection', () => {
  const f = fixture(); f.controller.disconnect('compute', 'database');
  f.controller.start(); expect(f.controller.getSnapshot().state.runtime.status).toBe('PREPARATION');
  f.controller.connectMode(true); f.controller.connectNode('compute'); f.controller.connectNode('database');
  expect(f.controller.getSnapshot().state.runtime.architecture.connections).toHaveLength(2);
  f.controller.connectNode('compute'); f.controller.build('cache');
  expect(f.controller.getSnapshot().connectionSource).toBeNull();
  f.controller.start(); const architecture = structuredClone(f.controller.getSnapshot().state.runtime.architecture);
  f.controller.disconnect('compute', 'database'); f.controller.connectMode(true); f.controller.connectNode('database');
  expect(f.controller.getSnapshot().state.runtime.architecture).toEqual(architecture); f.controller.destroy();
});
it('retains invalid connection feedback and clears notices on successful start', () => {
  const f = fixture(); f.controller.connectMode(true); f.controller.connectNode('database'); f.controller.connectNode('compute');
  expect(f.controller.getSnapshot().notice).toContain('Invalid connection direction');
  expect(f.controller.getSnapshot().connectionSource).toBe('database');
  f.controller.connectMode(true); f.controller.connectNode('compute'); f.controller.connectNode('database');
  expect(f.controller.getSnapshot().notice).toContain('already exists');
  expect(f.controller.getSnapshot().connectionSource).toBe('compute');
  f.controller.start(); expect(f.controller.getSnapshot().notice).toBe('');
  expect(f.controller.getSnapshot().connectionSource).toBeNull(); f.controller.destroy();
});
it('pause freezes all state despite stale callbacks and blocks edits and reset', () => {
  const f = fixture(); f.controller.start(); f.tick(); f.controller.pause();
  const paused = structuredClone(f.controller.getSnapshot());
  f.tick(); f.controller.move('compute', { x: 500, y: 200 }); f.controller.remove('database');
  f.controller.build('cache'); f.controller.reset(4); f.controller.scalePreparation();
  expect(f.controller.getSnapshot()).toEqual(paused); expect(f.active()).toBe(0);
  f.controller.resume(); expect(f.active()).toBe(1); f.tick();
  expect(f.controller.getSnapshot().state.runtime.time).toBe(2); f.controller.destroy();
});
it('renderer recovery remounts without advancing or silently resuming runtime', () => {
  const f = fixture(); f.controller.start(); f.tick(); f.controller.presentationFailed('GPU context lost');
  const stopped = structuredClone(f.controller.getSnapshot().state);
  f.controller.recoverRenderer(); expect(f.controller.getSnapshot().state).toEqual(stopped);
  expect(f.controller.getSnapshot().rendererGeneration).toBe(1); expect(f.controller.getSnapshot().error).toBe('GPU context lost');
  expect(f.controller.getSnapshot().recoveringRenderer).toBe(true);
  f.controller.rendererReady(0); f.controller.resume(); f.controller.reset();
  expect(f.controller.getSnapshot().state).toEqual(stopped); expect(f.active()).toBe(0);
  f.controller.rendererReady(1); expect(f.controller.getSnapshot().error).toBeNull();
  expect(f.controller.getSnapshot().recoveringRenderer).toBe(false);
  expect(f.active()).toBe(0); f.controller.resume(); f.tick();
  expect(f.controller.getSnapshot().state.runtime.time).toBe(2); f.controller.destroy();
});
it('queues sequenced live actions without advancing time or spending during preview', () => {
  const f = fixture(); f.controller.start();
  const before = structuredClone(f.controller.getSnapshot().state);
  expect(f.controller.actionReason({ type: 'SCALE_OUT' })).toBeNull();
  expect(f.controller.getSnapshot().state).toEqual(before);
  f.controller.queueAction({ type: 'SCALE_OUT' });
  expect(f.controller.getSnapshot().state).toEqual(before);
  expect(f.controller.actionReason({ type: 'SCALE_OUT' })).toContain('pending');
  f.controller.queueAction({ type: 'RATE_LIMIT', enabled: true });
  expect(f.controller.getSnapshot().queuedActions.map(a => a.sequence)).toEqual([0, 1]);
  f.tick(); expect(f.controller.getSnapshot().queuedActions).toEqual([]);
  expect(f.controller.getSnapshot().state.runtime.scaleDue).toBe(8);
  expect(f.controller.getSnapshot().state.runtime.rateTransition?.due).toBe(2);
  f.controller.pause(); const queued = f.controller.getSnapshot().queuedActions;
  f.controller.queueAction({ type: 'SCALE_OUT' }); expect(f.controller.getSnapshot().queuedActions).toEqual(queued);
  f.controller.destroy();
});
it('controller reactive scale follows the exact accepted action policy', () => {
  const f = fixture(); f.controller.start();
  for (let i = 0; i < 34; i++) f.tick();
  f.controller.queueAction({ type: 'SCALE_OUT' });
  for (let i = 34; i < 43; i++) f.tick();
  expect(f.controller.getSnapshot().snapshot!.requests.app.capacity).toBe(300);
  expect(f.controller.getSnapshot().state.streaks.availability).toBe(0);
  expect(f.controller.getSnapshot().state.runtime.actionLog[0]).toMatchObject({ accepted: true, action: { time: 34, type: 'SCALE_OUT' } });
  f.controller.destroy();
});
it('preserves already queued actions while paused but clears them on reset', () => {
  const f = fixture(); f.controller.start(); f.controller.queueAction({ type: 'SCALE_OUT' });
  f.controller.pause(); const before = structuredClone(f.controller.getSnapshot().state);
  f.tick(); expect(f.controller.getSnapshot().state).toEqual(before);
  expect(f.controller.getSnapshot().queuedActions).toHaveLength(1);
  f.controller.resume(); f.tick();
  expect(f.controller.getSnapshot().state.runtime.scaleDue).toBe(8);
  expect(f.controller.getSnapshot().state.runtime.actionLog).toHaveLength(1);
  f.controller.reset(); expect(f.controller.getSnapshot().queuedActions).toEqual([]); f.controller.destroy();
});
it('uses engine rejection reasons for instance limits and absent WAF paths', () => {
  const f = fixture(); f.controller.reset(4); f.controller.start();
  expect(f.controller.actionReason({ type: 'SCALE_OUT' })).toContain('limit');
  expect(f.controller.actionReason({ type: 'EMERGENCY_WAF' })).toContain('protected ingress');
  f.controller.queueAction({ type: 'EMERGENCY_WAF' });
  expect(f.controller.getSnapshot().queuedActions).toEqual([]); f.controller.destroy();
});

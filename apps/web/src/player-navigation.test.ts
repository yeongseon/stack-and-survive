import { expect, it } from 'vitest';
import { createPlayerNavigation, wheelZoomFactor } from './player-navigation';
import { createController } from './controller';

it('normalizes wheel units and bounds huge high resolution deltas', () => {
  expect(wheelZoomFactor(16, 0, 900)).toBe(wheelZoomFactor(1, 1, 900));
  expect(wheelZoomFactor(900, 0, 900)).toBe(wheelZoomFactor(1, 2, 900));
  expect(wheelZoomFactor(-1e6, 0, 900)).toBeCloseTo(Math.exp(.24));
});

it('keeps identical action schedules and terminal results with navigation between every tick', () => {
  const execute = (navigate: boolean) => {
    const controller = createController({ start: () => () => {} }, undefined, true);
    const navigation = createPlayerNavigation({ width: 1440, height: 900 });
    controller.start();
    while (!controller.getSnapshot().result) {
      const time = controller.getSnapshot().state.runtime.time;
      if (time === 16 || time === 57 || time === 102) controller.queueAction({ type: 'SCALE_OUT' });
      if (time === 17) controller.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 190, y: -100 });
      if (navigate) {
        navigation.zoom(time % 2 ? .75 : 1.8, { x: 500, y: 450 }); navigation.pan({ x: 40, y: -20 });
        if (time % 3 === 0) navigation.fit();
      }
      controller.inspectNextTick();
    }
    const view = controller.getSnapshot();
    const result = { runtime: view.state.runtime, economy: view.state.economy, result: view.result, challenge: view.challenge };
    controller.destroy(); return result;
  };
  const control = execute(false);
  expect(control.result?.status).toBe('COMPLETED');
  expect(execute(true)).toEqual(control);
});
it('keeps one shared stable snapshot and independent camera lifecycle', () => {
  const navigation = createPlayerNavigation({ width: 1440, height: 900 });
  let updates = 0; const unsubscribe = navigation.subscribe(() => updates++);
  const first = navigation.getSnapshot(); navigation.fit();
  expect(navigation.getSnapshot()).toBe(first); expect(updates).toBe(0);
  navigation.step(1); expect(navigation.getSnapshot().state.userZoom).toBe(1.25);
  navigation.step(-1); expect(navigation.getSnapshot().state.userZoom).toBe(1);
  navigation.zoom(1.8); navigation.resize({ width: 390, height: 844 });
  expect(navigation.getSnapshot().state.userZoom).toBe(1.8);
  navigation.focus('compute'); navigation.pan({ x: 50000, y: -50000 });
  expect(Number.isFinite(navigation.getSnapshot().state.centerX)).toBe(true);
  navigation.fit(); expect(navigation.getSnapshot().state.userZoom).toBe(1);
  unsubscribe(); const before = updates; navigation.step(-1); expect(updates).toBe(before);
  expect(createPlayerNavigation().getSnapshot().state.userZoom).toBe(1);
});

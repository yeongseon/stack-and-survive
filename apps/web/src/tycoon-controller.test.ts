import { expect, it } from 'vitest';
import { createController } from './controller';

it('title is inert and countdown starts exactly once without manual setup', () => {
  let callback: (() => void) | undefined; let starts = 0;
  const c = createController({ start(fn) { callback = fn; starts++; return () => {}; } }, undefined, true);
  expect(starts).toBe(0); expect(c.getSnapshot().state.runtime.time).toBe(0);
  c.build('cache'); c.connectMode(true); c.move('compute', { x: 900, y: 600 }); c.scalePreparation();
  expect(c.getSnapshot().building).toBe(null); expect(c.getSnapshot().connecting).toBe(false);
  expect(c.getSnapshot().state.runtime.architecture.resources[1]).toMatchObject({ x: 0, y: 0, instances: 1 });
  c.beginGame(); c.beginGame(); expect(starts).toBe(1);
  for (let i = 0; i < 4; i++) callback!();
  expect(c.getSnapshot().countdown).toBe(1); expect(c.getSnapshot().state.economy.remainingBudget).toBe(140);
  callback!(); expect(c.getSnapshot().state.runtime.status).toBe('RUNNING'); expect(starts).toBe(2);
  callback!(); expect(c.getSnapshot().state.runtime.time).toBe(1);
  const stale = callback!; c.reset(); stale(); expect(c.getSnapshot().state.runtime.time).toBe(0);
  c.beginGame(); const last = callback!; c.destroy(); last(); expect(c.getSnapshot().countdown).toBe(5);
});
it('recovers a countdown renderer failure and restarts safely from paused or error states', () => {
  let callback = () => {};
  const c = createController({ start(fn) { callback = fn; return () => {}; } }, undefined, true);
  c.beginGame(); callback(); expect(c.getSnapshot().countdown).toBe(4);
  c.presentationFailed('context lost'); callback(); expect(c.getSnapshot().countdown).toBe(4);
  c.recoverRenderer(); c.rendererReady(c.getSnapshot().rendererGeneration);
  for (let i = 0; i < 4; i++) callback();
  expect(c.getSnapshot().state.runtime.status).toBe('RUNNING');
  c.pause(); c.reset(); expect(c.getSnapshot().state.runtime.status).toBe('PREPARATION');
  c.beginGame(); c.presentationFailed('failed again'); c.reset();
  expect(c.getSnapshot().error).toBe(null); expect(c.getSnapshot().countdown).toBe(null);
  c.destroy();
});

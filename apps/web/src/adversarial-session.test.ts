import { describe, expect, it } from 'vitest';
import { createController, type Clock } from './controller';

function fixture() {
  let callback = () => {};
  let active = 0;
  const timer: Clock = { start(fn) { callback = fn; active++; return () => { active--; }; } };
  return { controller: createController(timer), tick: () => callback(), active: () => active };
}

describe('repeated session stress (50 cycles)', () => {
  it('reset returns identical baseline state every cycle', () => {
    const f = fixture();
    const baseline = structuredClone(f.controller.getSnapshot());

    for (let cycle = 0; cycle < 50; cycle++) {
      f.controller.start();
      // Run 10 ticks
      for (let t = 0; t < 10; t++) f.tick();
      expect(f.controller.getSnapshot().state.runtime.time).toBe(10);

      // Queue an action
      f.controller.queueAction({ type: 'SCALE_OUT' });
      f.tick();

      // Reset
      f.controller.reset();
      const after = f.controller.getSnapshot();

      // Core state must match baseline
      expect(after.state.runtime.time).toBe(0);
      expect(after.state.runtime.status).toBe('PREPARATION');
      expect(after.state.runtime.scaleDue).toBeNull();
      expect(after.state.runtime.actionLog).toEqual([]);
      expect(after.state.runtime.lastSequence).toBe(-1);
      expect(after.state.runtime.emergency).toBeNull();
      expect(after.state.runtime.emergencyUsed).toBe(false);
      expect(after.state.runtime.rateLimit).toBe(false);
      expect(after.state.runtime.rateTransition).toBeNull();
      expect(after.state.runtime.deployments).toEqual([]);
      expect(after.state.economy.infrastructureCost).toBe(0);
      expect(after.state.economy.remainingBudget).toBe(baseline.state.economy.remainingBudget);
      expect(after.queuedActions).toEqual([]);
      expect(after.result).toBeNull();
      expect(after.error).toBeNull();
      // events may contain transition feedback like "Back to build mode" — that's expected
      expect(after.countdown).toBeNull();
    }
    expect(f.active()).toBe(0);
    f.controller.destroy();
  });

  it('no timer leaks after 50 start-reset cycles', () => {
    const f = fixture();
    for (let cycle = 0; cycle < 50; cycle++) {
      f.controller.start();
      f.tick();
      f.controller.reset();
    }
    // After final reset, no timer should be active
    expect(f.active()).toBe(0);
    f.controller.destroy();
  });

  it('full game-to-completion then reset for 20 cycles', () => {
    const f = fixture();
    for (let cycle = 0; cycle < 20; cycle++) {
      f.controller.start();
      // Run until terminal (failure at ~tick 50 for baseline)
      let ticks = 0;
      while (f.controller.getSnapshot().state.runtime.status === 'RUNNING' && ticks < 200) {
        f.tick();
        ticks++;
      }
      const status = f.controller.getSnapshot().state.runtime.status;
      expect(['COMPLETED', 'FAILED']).toContain(status);
      expect(f.controller.getSnapshot().result).not.toBeNull();
      expect(f.active()).toBe(0); // Timer stopped at terminal

      f.controller.reset();
      expect(f.controller.getSnapshot().state.runtime.time).toBe(0);
      expect(f.controller.getSnapshot().result).toBeNull();
    }
    f.controller.destroy();
  });

  it('redesign then restart for 20 cycles without state drift', () => {
    const f = fixture();
    for (let cycle = 0; cycle < 20; cycle++) {
      f.controller.start();
      while (f.controller.getSnapshot().state.runtime.status === 'RUNNING') f.tick();
      const result = f.controller.getSnapshot().result;
      expect(result).not.toBeNull();

      f.controller.redesign();
      expect(f.controller.getSnapshot().state.runtime.status).toBe('PREPARATION');
      expect(f.controller.getSnapshot().state.runtime.time).toBe(0);
      expect(f.controller.getSnapshot().result).toBeNull();
      expect(f.controller.getSnapshot().previousResult).toEqual(result);

      // Start again — should produce identical result since architecture unchanged
      f.controller.start();
      while (f.controller.getSnapshot().state.runtime.status === 'RUNNING') f.tick();
      const secondResult = f.controller.getSnapshot().result!;
      expect(secondResult.score).toBe(result!.score);
      expect(secondResult.elapsedTime).toBe(result!.elapsedTime);

      f.controller.reset();
    }
    f.controller.destroy();
  });
});

describe('rapid action fuzzing', () => {
  it('queueing many actions on same tick processes without crash', () => {
    const f = fixture();
    f.controller.start();
    f.controller.queueAction({ type: 'SCALE_OUT' });
    f.controller.queueAction({ type: 'RATE_LIMIT', enabled: true });
    f.controller.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 190, y: -100 });
    f.controller.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'edge', x: -210, y: 0 });
    f.controller.queueAction({ type: 'EMERGENCY_WAF' });
    f.tick();

    const snap = f.controller.getSnapshot();
    expect(snap.state.runtime.time).toBe(1);
    expect(Number.isFinite(snap.state.economy.remainingBudget)).toBe(true);
    expect(snap.state.runtime.actionLog.length).toBeGreaterThan(0);
    f.controller.destroy();
  });

  it('rapid start-pause-resume cycles do not leak timers', () => {
    const f = fixture();
    f.controller.start();
    for (let i = 0; i < 20; i++) {
      f.tick();
      f.controller.pause();
      f.controller.resume();
    }
    expect(f.active()).toBe(1);
    expect(f.controller.getSnapshot().state.runtime.time).toBe(20);
    f.controller.destroy();
    expect(f.active()).toBe(0);
  });

  it('rapid reset during countdown does not corrupt state', () => {
    let callback = () => {};
    const timer: Clock = { start(fn) { callback = fn; return () => {}; } };
    const controller = createController(timer, undefined, true);
    controller.beginGame();
    expect(controller.getSnapshot().countdown).toBe(5);
    callback();
    expect(controller.getSnapshot().countdown).toBe(4);
    controller.reset();
    expect(controller.getSnapshot().countdown).toBeNull();
    expect(controller.getSnapshot().state.runtime.status).toBe('PREPARATION');
    controller.destroy();
  });

  it('double start is idempotent', () => {
    const f = fixture();
    f.controller.start();
    const afterFirst = structuredClone(f.controller.getSnapshot());
    f.controller.start();
    expect(f.controller.getSnapshot().state.runtime.time).toBe(afterFirst.state.runtime.time);
    expect(f.active()).toBe(1);
    f.controller.destroy();
  });
});

describe('game-over race conditions', () => {
  it('actions queued at final tick before game-over do not corrupt terminal state', () => {
    const f = fixture();
    f.controller.start();
    while (f.controller.getSnapshot().state.runtime.status === 'RUNNING' &&
           f.controller.getSnapshot().state.runtime.time < 48) {
      f.tick();
    }
    if (f.controller.getSnapshot().state.runtime.status === 'RUNNING') {
      f.controller.queueAction({ type: 'SCALE_OUT' });
      while (f.controller.getSnapshot().state.runtime.status === 'RUNNING') f.tick();
    }
    const snap = f.controller.getSnapshot();
    expect(['COMPLETED', 'FAILED']).toContain(snap.state.runtime.status);
    expect(snap.result).not.toBeNull();
    expect(Number.isFinite(snap.result!.score)).toBe(true);
    expect(f.active()).toBe(0);
    f.controller.destroy();
  });

  it('score freezes at game-over and cannot change afterward', () => {
    const f = fixture();
    f.controller.start();
    while (f.controller.getSnapshot().state.runtime.status === 'RUNNING') f.tick();
    const finalScore = f.controller.getSnapshot().result!.score;
    const finalTime = f.controller.getSnapshot().state.runtime.time;
    for (let i = 0; i < 10; i++) f.tick();
    expect(f.controller.getSnapshot().result!.score).toBe(finalScore);
    expect(f.controller.getSnapshot().state.runtime.time).toBe(finalTime);
    f.controller.destroy();
  });

  it('actions after game-over are ignored', () => {
    const f = fixture();
    f.controller.start();
    while (f.controller.getSnapshot().state.runtime.status === 'RUNNING') f.tick();
    const terminalState = structuredClone(f.controller.getSnapshot().state);
    f.controller.queueAction({ type: 'SCALE_OUT' });
    f.controller.queueAction({ type: 'RATE_LIMIT', enabled: true });
    f.controller.pause();
    f.controller.resume();
    expect(f.controller.getSnapshot().state).toEqual(terminalState);
    f.controller.destroy();
  });

  it('reset immediately after game-over produces clean state', () => {
    const f = fixture();
    f.controller.start();
    while (f.controller.getSnapshot().state.runtime.status === 'RUNNING') f.tick();
    expect(f.controller.getSnapshot().result).not.toBeNull();
    f.controller.reset();
    expect(f.controller.getSnapshot().state.runtime.status).toBe('PREPARATION');
    expect(f.controller.getSnapshot().state.runtime.time).toBe(0);
    expect(f.controller.getSnapshot().result).toBeNull();
    expect(f.controller.getSnapshot().queuedActions).toEqual([]);
    f.controller.start();
    f.tick();
    expect(f.controller.getSnapshot().state.runtime.time).toBe(1);
    f.controller.destroy();
  });
});

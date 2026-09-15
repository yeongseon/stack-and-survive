import { afterEach, expect, it, vi } from 'vitest';
import { createLandscapeClock, requiresLandscape } from './landscape-session';

afterEach(() => vi.useRealTimers());
it('gates small portrait viewports, never supported landscape', () => {
  expect(requiresLandscape(390,844)).toBe(true);
  expect(requiresLandscape(844,390)).toBe(false);
  expect(requiresLandscape(768,1024)).toBe(true);
  expect(requiresLandscape(1440,900)).toBe(false);
});
it('holds countdown and runtime callbacks without producing catch-up ticks', () => {
  vi.useFakeTimers();
  const clock=createLandscapeClock(), callback=vi.fn();
  const stop=clock.start(callback);
  clock.hold(true); vi.advanceTimersByTime(6000); expect(callback).not.toHaveBeenCalled();
  clock.hold(false); vi.advanceTimersByTime(999); expect(callback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1); expect(callback).toHaveBeenCalledTimes(1);
  clock.hold(true); vi.advanceTimersByTime(2500); expect(callback).toHaveBeenCalledTimes(1);
  stop();clock.hold(false);vi.advanceTimersByTime(5000);expect(callback).toHaveBeenCalledTimes(1);
});

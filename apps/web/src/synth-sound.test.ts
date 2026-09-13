import { afterEach, expect, it, vi } from 'vitest';
import { createSynthSound } from './synth-sound';

class FakeParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  setTargetAtTime = vi.fn();
}
class FakeGain {
  gain = new FakeParam();
  connect = vi.fn();
  disconnect = vi.fn();
}
class FakeOscillator {
  frequency = new FakeParam();
  type = 'sine';
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn((at?: number) => { if (at === undefined) this.onended?.(); });
}
class FakeContext {
  static instances: FakeContext[] = [];
  currentTime = 0;
  state = 'running';
  destination = {};
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
  constructor() { FakeContext.instances.push(this); }
  createOscillator() { const node = new FakeOscillator(); this.oscillators.push(node); return node; }
  createGain() { const gain = new FakeGain(); this.gains.push(gain); return gain; }
}
afterEach(() => { vi.unstubAllGlobals(); FakeContext.instances = []; });

it('reserves the whole cue and includes ambience in the eight-oscillator bound', () => {
  vi.stubGlobal('AudioContext', FakeContext);
  const sound = createSynthSound(() => {}); const context = FakeContext.instances[0];
  expect(context.gains[0].gain.value).toBe(0);
  sound.ambient(true); sound.ambient(true);
  expect(context.oscillators).toHaveLength(1);
  sound.play('build'); sound.play('complete'); sound.play('warning');
  expect(context.oscillators).toHaveLength(7);
  sound.play('complete'); expect(context.oscillators).toHaveLength(7);
  sound.play('click'); expect(context.oscillators).toHaveLength(8);
  sound.play('click'); expect(context.oscillators).toHaveLength(8);
  sound.silence();
  for (const node of context.oscillators) expect(node.disconnect).toHaveBeenCalled();
  sound.dispose(); sound.dispose(); expect(context.close).toHaveBeenCalledTimes(1);
});
it('prioritizes a complete terminal cue over occupied channels and schedules short envelopes', () => {
  vi.stubGlobal('AudioContext', FakeContext);
  const sound = createSynthSound(() => {}); const context = FakeContext.instances[0];
  sound.ambient(true); sound.play('build');
  sound.play('success');
  expect(context.oscillators.slice(-3).map(node => node.frequency.value)).toEqual([440, 550, 660]);
  expect(context.oscillators[0].disconnect).toHaveBeenCalled();
  for (const node of context.oscillators.slice(-3)) {
    expect(node.start).toHaveBeenCalledTimes(1);
    expect(node.stop).toHaveBeenCalledWith(expect.any(Number));
  }
  sound.dispose(); const count = context.oscillators.length;
  sound.play('failure'); sound.ambient(true); expect(context.oscillators).toHaveLength(count);
});
it('reports asynchronous close failure rather than leaking an unhandled rejection', async () => {
  vi.stubGlobal('AudioContext', FakeContext);
  const messages: string[] = []; const sound = createSynthSound(m => messages.push(m));
  FakeContext.instances[0].close.mockRejectedValueOnce(new Error('device closed'));
  sound.dispose(); await Promise.resolve();
  expect(messages[0]).toContain('cleanup failed');
});

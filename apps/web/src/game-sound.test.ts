import { expect, it } from 'vitest';
import { createController } from './controller';
import { defaultSoundSettings, GameSound, parseSoundSettings, transitionSound, type SoundCue, type SoundPort } from './game-sound';

function setup() {
  const c = createController({ start: () => () => {} });
  const calls: string[] = []; const messages: string[] = [];
  const port: SoundPort = { resume: async () => { calls.push('resume'); }, volume: v => calls.push(`volume:${v}`),
    ambient: enabled => calls.push(`ambient:${enabled}`), play: cue => calls.push(cue), silence: () => calls.push('silence'), dispose: () => calls.push('dispose') };
  let time = 0;
  const sound = new GameSound(c.getSnapshot(), defaultSoundSettings, () => { calls.push('create'); return port; }, () => time, m => messages.push(m));
  const unsubscribe = c.subscribe(() => sound.update(c.getSnapshot()));
  return { c, calls, messages, port, sound, advanceTime: (ms: number) => { time += ms; }, close: () => { unsubscribe(); sound.dispose(); c.destroy(); } };
}
it('does not create an audio device before a gesture, even when preferences enable it', async () => {
  const s = setup(); s.sound.setSettings({ muted: false, volume: .5, haptics: false });
  s.c.start(); s.c.inspectNextTick(); expect(s.calls).toEqual([]);
  await s.sound.unlockFromGesture(); expect(s.calls).toContain('create'); expect(s.calls).toContain('ambient:true');
  s.close();
});
it('mutes and stops ambience on pause hidden reset and dispose without replaying events', async () => {
  const s = setup(); s.sound.setSettings({ muted: false, volume: .5, haptics: false }); await s.sound.unlockFromGesture();
  s.c.start(); s.c.inspectNextTick(); s.sound.click(); s.sound.click(); expect(s.calls.filter(v => v === 'click')).toHaveLength(1);
  s.advanceTime(500); s.c.pause(); expect(s.calls.at(-1)).toBe('ambient:false');
  s.c.resume(); s.sound.setVisible(false); const at = s.calls.length;
  s.c.queueAction({ type: 'SCALE_OUT' }); s.c.inspectNextTick(); expect(s.calls.slice(at)).not.toContain('build');
  s.sound.setVisible(true); expect(s.calls.filter(v => v === 'build')).toHaveLength(0);
  s.sound.setSettings({ muted: true, volume: .5, haptics: false });
  expect(s.calls.at(-1)).toBe('ambient:false'); s.close(); expect(s.calls.at(-1)).toBe('dispose');
});
it('reports unlock failure and safely ignores late unlock completion after disposal', async () => {
  const s = setup(); s.port.resume = () => Promise.reject(new Error('blocked'));
  s.sound.setSettings({ muted: false, volume: .5, haptics: false }); await s.sound.unlockFromGesture();
  expect(s.messages.at(-1)).toContain('unavailable'); expect(s.calls).toContain('dispose'); s.close();
  const pending = setup(); let complete = () => {};
  pending.port.resume = () => new Promise<void>(resolve => { complete = resolve; });
  pending.sound.setSettings({ muted: false, volume: .5, haptics: false });
  const unlocking = pending.sound.unlockFromGesture(); pending.close(); complete(); await unlocking;
  expect(pending.calls).not.toContain('ambient:true');
});
it('projects actual build and completion once, never queued intent or repeated snapshots', () => {
  const c = createController({ start: () => () => {} }); c.start(); c.inspectNextTick();
  let previous = c.getSnapshot(); c.queueAction({ type: 'SCALE_OUT' });
  expect(transitionSound(previous, c.getSnapshot())).toBe(null);
  previous = c.getSnapshot(); c.inspectNextTick(); expect(transitionSound(previous, c.getSnapshot())).toBe('build');
  const cues: (SoundCue | null)[] = [];
  for (let i=0;i<8;i++) { previous = c.getSnapshot(); c.inspectNextTick(); cues.push(transitionSound(previous, c.getSnapshot())); }
  expect(cues.filter(cue => cue === 'complete')).toHaveLength(1);
  expect(transitionSound(c.getSnapshot(), c.getSnapshot())).toBe(null); c.destroy();
});
it('validates persisted opt-out volume and defaults safely on corrupt versions', () => {
  for (const raw of [null, '{broken', '{}', '{"version":2}', '{"version":1,"muted":false,"haptics":false,"volume":9}']) expect(parseSoundSettings(raw)).toEqual(defaultSoundSettings);
  expect(parseSoundSettings('{"version":1,"muted":false,"haptics":true,"volume":0.4}')).toEqual({ muted: false, volume: .4, haptics: true });
});
it('applies volume when unlock finishes hidden and recovers ambience on return', async () => {
  const s = setup(); let complete = () => {};
  s.port.resume = () => new Promise<void>(resolve => { complete = resolve; });
  s.sound.setSettings({ muted: false, volume: .4, haptics: false });
  s.c.start(); const pending = s.sound.unlockFromGesture();
  s.sound.setVisible(false); complete(); await pending;
  expect(s.calls).toContain('volume:0.4'); expect(s.calls.at(-1)).toBe('ambient:false');
  s.sound.setVisible(true); expect(s.calls.at(-1)).toBe('ambient:true'); s.close();
});
it('does not suppress a build or terminal cue just because a click played', async () => {
  const s = setup(); s.sound.setSettings({ muted: false, volume: .5, haptics: false }); await s.sound.unlockFromGesture();
  s.c.start(); s.c.inspectNextTick(); s.sound.click();
  s.c.queueAction({ type: 'SCALE_OUT' }); s.c.inspectNextTick();
  expect(s.calls).toContain('click'); expect(s.calls).toContain('build');
  s.sound.update({ ...s.c.getSnapshot(), state: { ...s.c.getSnapshot().state, runtime: { ...s.c.getSnapshot().state.runtime, status: 'FAILED' } } });
  expect(s.calls).toContain('failure'); const count = s.calls.filter(cue => cue === 'failure').length;
  s.sound.update({ ...s.c.getSnapshot(), state: { ...s.c.getSnapshot().state, runtime: { ...s.c.getSnapshot().state.runtime, status: 'FAILED' } } });
  expect(s.calls.filter(cue => cue === 'failure')).toHaveLength(count); s.close();
});
it('ignores late failed unlock reports after dispose and contains device failures', async () => {
  const s = setup(); let reject: (error: Error) => void = () => {};
  s.port.resume = () => new Promise<void>((_resolve, fail) => { reject = fail; });
  s.sound.setSettings({ muted: false, volume: .5, haptics: false });
  const pending = s.sound.unlockFromGesture(); s.close(); reject(new Error('late')); await pending;
  expect(s.messages).toEqual([]);
  const broken = setup(); broken.sound.setSettings({ muted: false, volume: .5, haptics: false }); await broken.sound.unlockFromGesture();
  broken.port.play = () => { throw new Error('device disconnected'); };
  broken.c.start(); broken.c.inspectNextTick(); expect(() => broken.sound.click()).not.toThrow();
  expect(broken.messages.at(-1)).toContain('unavailable'); broken.close();
});
it('contains unavailable vibration independently from audio and never creates audio in haptics-only mode', async () => {
  const c = createController({ start: () => () => {} }); const messages: string[] = [];
  const sound = new GameSound(c.getSnapshot(), { muted: true, volume: .5, haptics: true }, () => { throw new Error('must not create'); }, () => 0, m => messages.push(m), () => { throw new Error('vibration denied'); });
  await sound.unlockFromGesture(); c.start(); sound.update(c.getSnapshot());
  expect(() => sound.setVisible(false)).not.toThrow(); expect(messages.at(-1)).toContain('Vibration is unavailable');
  sound.dispose(); c.destroy();
});

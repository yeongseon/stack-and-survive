import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { browserSaveRepository, SAVE_KEY, type KeyValueStorage } from './persistence';

function fixture() {
  const values = new Map<string, string>();
  const storage: KeyValueStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
  return { values, repository: browserSaveRepository(() => storage) };
}
it('round trips only versioned architecture and clears its own key', () => {
  const f = fixture(); expect(f.repository.load()).toBeNull();
  const architecture = baseline(3, true, true); f.repository.save(architecture);
  expect(f.repository.load()).toEqual(architecture);
  const saved = JSON.parse(f.values.get(SAVE_KEY)!);
  expect(Object.keys(saved)).toEqual(['saveVersion', 'architecture']);
  f.values.set('unrelated', 'keep'); f.repository.clear();
  expect(f.repository.load()).toBeNull(); expect(f.values.get('unrelated')).toBe('keep');
});
it('restarts incomplete resource deployments but preserves completed counts', () => {
  const f = fixture(); const architecture = baseline(2, true);
  architecture.resources.find(r => r.kind === 'cache')!.remaining = 1;
  f.repository.save(architecture);
  const loaded = f.repository.load()!;
  expect(loaded.resources.find(r => r.kind === 'cache')!.remaining).toBe(5);
  expect(loaded.resources.find(r => r.kind === 'compute')!.instances).toBe(2);
  expect(architecture.resources.find(r => r.kind === 'cache')!.remaining).toBe(1);
});
it.each(['{', '{"saveVersion":9}', '{"saveVersion":1,"architecture":{}}'])('rejects corrupt or unsupported save %s without deleting it', text => {
  const f = fixture(); f.values.set(SAVE_KEY, text);
  expect(() => f.repository.load()).toThrow(); expect(f.values.get(SAVE_KEY)).toBe(text);
});
it('surfaces unavailable storage and quota failures', () => {
  const unavailable = browserSaveRepository(() => { throw new Error('Storage unavailable'); });
  expect(() => unavailable.load()).toThrow('unavailable'); expect(() => unavailable.clear()).toThrow();
  const full = browserSaveRepository(() => ({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); }, removeItem: () => {} }));
  expect(() => full.save(baseline())).toThrow('Quota');
});

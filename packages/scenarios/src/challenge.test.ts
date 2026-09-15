import { expect, it } from 'vitest';
import { blackFriday } from './index';
import { blackFridayChallenge, blackFridayChallengeV02, parseChallenge, sameChallenge } from './challenge';

it('materializes the current Black Friday unchanged with frozen versioned identity', () => {
  expect(blackFridayChallenge.workload).toEqual(blackFriday);
  expect(Object.isFrozen(blackFridayChallenge)).toBe(true);
  expect(Object.isFrozen(blackFridayChallenge.workload.traffic)).toBe(true);
  expect(blackFridayChallenge.contentHash).toMatch(/^fnv1a64:[a-f0-9]{16}$/);
  expect(blackFridayChallenge.objective.kind).toBe('survive');
});
it('canonicalizes key ordering but distinguishes every condition used for comparisons', () => {
  const original = blackFridayChallenge;
  const reordered = parseChallenge({ workload: { ...blackFriday, targets: { netBusinessValue: 360, latencyMs: 300, availability: .99 } },
    objective: { kind: 'survive', id: 'survive', version: 1 }, rulesVersion: '0.3', seed: 0, seedAlgorithm: 'fixed-v1', version: 1, id: 'black-friday', schemaVersion: 1 });
  expect(sameChallenge(original, reordered)).toBe(true);
  for (const patch of [{ seed: 1 }, { version: 2 }, { workload: { ...blackFriday, budget: 141 } },
    { objective: { kind: 'availability', id: 'availability', version: 1, target: .995 } }]) {
    const changed = parseChallenge({ ...original, ...patch });
    expect(sameChallenge(original, changed)).toBe(false);
    expect(changed.canonical).not.toBe(original.canonical);
  }
});
it('never compares historical rules or accepts mismatched reinvestment identity', () => {
  expect(sameChallenge(blackFridayChallenge, blackFridayChallengeV02)).toBe(false);
  expect(() => parseChallenge({ ...blackFridayChallenge, rulesVersion: '0.2' })).toThrow('match');
});
it('does not let caller-provided identity hashes authorize a different workload', () => {
  const changed = parseChallenge({ ...blackFridayChallenge, workload: { ...blackFriday, budget: 120 } });
  expect(changed.contentHash).not.toBe(blackFridayChallenge.contentHash);
  expect(sameChallenge(blackFridayChallenge, { ...changed, contentHash: blackFridayChallenge.contentHash })).toBe(false);
});
it('rejects malformed versions seeds objectives and unsupported rule overrides', () => {
  for (const patch of [{ version: undefined }, { schemaVersion: 2 }, { seed: -1 }, { seed: 1.5 },
    { seedAlgorithm: 'random' }, { rulesVersion: 'new-prices' }, { id: '' },
    { objective: { kind: 'availability', id: 'a', version: 1, target: 1.1 } },
    { objective: { kind: 'survive', id: 'a', version: 0 } },
    { workload: { ...blackFriday, duration: 0 } }, { modifiers: [{ budget: .5 }] }]) {
    expect(() => parseChallenge({ ...blackFridayChallenge, ...patch })).toThrow();
  }
});
it('preserves canonical identity when reparsing accepted normalized request mixes', () => {
  for (const mix of [{ browse: .2, order: .8000000001 }, { browse: 1/3, order: 2/3 }, { browse: .9999999995, order: 0 }]) {
    const parsed = parseChallenge({ ...blackFridayChallenge, workload: { ...blackFriday, businessMix: mix } });
    expect(parseChallenge(parsed).canonical).toBe(parsed.canonical);
    expect(Object.isFrozen(parsed.workload.businessMix)).toBe(true);
    expect(parsed.workload.traffic.every(Object.isFrozen)).toBe(true);
  }
});

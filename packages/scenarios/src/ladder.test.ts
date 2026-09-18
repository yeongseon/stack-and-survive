import { expect, it } from 'vitest';
import { infrastructureScalingScenario as blackFriday } from './index';
import { blackFridayChallenge } from './challenge';
import { challengeLadder } from './ladder';

it('uses exactly the approved three objectives without changing workload or rules', () => {
  expect(challengeLadder).toHaveLength(3);
  expect(challengeLadder.map(level => level.title)).toEqual(['Survive', 'Reliable Business', 'Customer First']);
  expect(challengeLadder[0].challenge).toEqual(blackFridayChallenge);
  expect(challengeLadder[1].challenge.objective).toMatchObject({ kind: 'availability', target: .99 });
  expect(challengeLadder[2].challenge.objective).toMatchObject({ kind: 'availability', target: .999 });
  for (const level of challengeLadder) {
    expect(level.challenge.workload).toEqual(blackFriday); expect(level.challenge.rulesVersion).toBe('0.4');
    expect(Object.isFrozen(level)).toBe(true);
  }
  expect(new Set(challengeLadder.map(level => level.challenge.canonical)).size).toBe(3);
});

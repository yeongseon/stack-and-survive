import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { simulateScenario } from '@stack-and-survive/simulation/results';
import { compareAttempts } from './comparison';

it('compares Cache redesign without pretending unequal run lengths are equal', () => {
  const before = simulateScenario(baseline(4), blackFriday);
  const after = simulateScenario(baseline(4, true), blackFriday);
  const compared = compareAttempts(before, after);
  expect(compared.sameScenario).toBe(true); expect(compared.sameDuration).toBe(false);
  expect(compared.rows.find(r => r.label === 'SQL read peak (%)')!.delta).toBeLessThan(0);
  expect(compared.phases.map(p => p.start)).toEqual([0, 30, 75]);
});
it('compares both successful security strategies at full duration', () => {
  const before = simulateScenario(baseline(4, true), blackFriday);
  const after = simulateScenario(baseline(3, true, true), blackFriday);
  const compared = compareAttempts(before, after);
  expect(compared.sameDuration).toBe(true);
  expect(compared.rows.find(r => r.label === 'Infrastructure cost')!.delta).toBeCloseTo(-6);
  expect(compared.rows.find(r => r.label === 'Net business value')!.delta).toBeGreaterThan(0);
});
it('does not mutate results or compare unlike scenario versions', () => {
  const before = simulateScenario(baseline(), blackFriday); const copy = structuredClone(before);
  const other = { ...before, scenarioId: 'different' };
  const compared = compareAttempts(before, other);
  expect(compared.rows.every(r => r.delta === null)).toBe(true); expect(compared.phases).toEqual([]);
  expect(before).toEqual(copy);
});

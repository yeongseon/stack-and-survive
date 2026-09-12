import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { glossary, pressureHint } from './help';

it('gives short hints from actual layer pressure without recommending cache for writes', () => {
  expect(pressureHint(null)).toContain('baseline');
  expect(pressureHint(processRequests(baseline(), { browse: 200, order: 20, bot: 0 }))).toContain('compute capacity');
  expect(pressureHint(processRequests(baseline(4), { browse: 200, order: 20, bot: 0 }))).toContain('eligible reads');
  expect(pressureHint(processRequests(baseline(4), { browse: 100, order: 80, bot: 0 }))).toContain('does not remove Order writes');
});
it('explains all core terms without requiring hover or sound', () => {
  expect(glossary.map(([term]) => term)).toEqual(['Pressure markers', 'RPS', 'Availability', 'Latency', 'Utilization', 'Cache hit ratio', 'Scale out', 'WAF', 'Rate Limit', 'Net business value', 'Budget']);
});

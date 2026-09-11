import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { representativeCount, visualFlows } from './traffic';
it('shows cache hits ending at cache and writes going directly to SQL', () => {
  const snapshot = processRequests(baseline(3, true, true), { browse: 240, order: 60, bot: 200 });
  const flows = visualFlows(snapshot);
  expect(flows.find(f => f.to === 'cache' && f.end === 'success')!.volume).toBe(snapshot.cache.hits);
  expect(flows.filter(f => f.kind === 'order' && f.to === 'cache')).toEqual([]);
  expect(flows.find(f => f.from === 'compute' && f.to === 'database' && f.kind === 'order')!.volume).toBe(snapshot.sql.writesAccepted);
  expect(flows.find(f => f.to === 'edge' && f.kind === 'bot' && f.end === 'filtered')!.volume).toBe(140);
  expect(flows.some(f => f.kind === 'bot' && (f.to === 'cache' || f.to === 'database'))).toBe(false);
});
it('maps recorded failures without modifying or inventing simulation output', () => {
  const s = processRequests(baseline(4), { browse: 600, order: 0, bot: 0 });
  const before = structuredClone(s);
  expect(visualFlows(s).find(f => f.to === 'database' && f.end === 'failed')!.volume).toBe(s.sql.readsDropped);
  expect(s).toEqual(before);
});
it('bounds representative rendering even for the maximum traffic input', () => {
  const s = processRequests(baseline(4, true, true), { browse: 600, order: 200, bot: 200 });
  expect(visualFlows(s).reduce((sum, f) => sum + representativeCount(f.volume), 0)).toBeLessThanOrEqual(200);
  expect(representativeCount(0)).toBe(0); expect(representativeCount(1000)).toBe(8);
});

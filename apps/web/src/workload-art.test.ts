import { expect, it } from 'vitest';
import { offeredMarkers, packetPalette, packetEndpoint } from './workload-art';
it('bounds offered workload independently of admitted traffic and keeps semantic colors distinct', () => {
  expect(offeredMarkers(null)).toBe(0); expect(offeredMarkers(NaN)).toBe(0); expect(offeredMarkers(0)).toBe(0);
  expect(offeredMarkers(500)).toBeGreaterThan(offeredMarkers(100)); expect(offeredMarkers(10000)).toBe(12);
  expect(new Set(Object.values(packetPalette)).size).toBe(3);
});
it('separates filtering, limiting, processing failure and actual cache hits', () => {
  const flow = { from: 'internet', to: 'edge', kind: 'bot', volume: 20, end: 'filtered' } as const;
  expect(packetEndpoint(flow)).toBe('edge-filter');
  expect(packetEndpoint({ ...flow, to: 'compute' })).toBe('intake-limit');
  expect(packetEndpoint({ ...flow, end: 'failed' })).toBe('failure');
  expect(packetEndpoint({ ...flow, to: 'cache', end: 'continue' })).toBe('packet');
  expect(packetEndpoint({ ...flow, to: 'cache', end: 'success' })).toBe('cache-hit');
});

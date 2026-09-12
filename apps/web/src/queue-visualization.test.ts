import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { pressureLosses, pressurePositions, pressureQueues, visualQueue } from './queue-visualization';
import { utilizationLabel } from './world';

it('is bounded and monotonic at every pressure threshold', () => {
  let previous = 0;
  for (let i = 0; i <= 3000; i++) {
    const result = visualQueue('compute', i / 1000, 0, 100);
    expect(result.count).toBeGreaterThanOrEqual(previous); expect(result.count).toBeLessThanOrEqual(12); previous = result.count;
  }
  expect(visualQueue('compute', .699, 0, 100).count).toBe(0);
  expect(visualQueue('compute', .7, 0, 100).severity).toBe('busy');
  expect(visualQueue('compute', .9, 0, 100).severity).toBe('warning');
  expect(visualQueue('compute', 1, 0, 100).severity).toBe('warning');
  expect(visualQueue('compute', 1.2, 20, 100).severity).toBe('critical');
});
it('busy marker onset does not change the authoritative healthy-at70% rule', () => {
  expect(visualQueue('compute', .7, 0, 105).severity).toBe('busy');
  expect(utilizationLabel(.7)).toBe('HEALTHY');
});
it('retains both SQL drop paths even when read pressure dominates', () => {
  const s = processRequests(baseline(4), { browse: 400, order: 100, bot: 0 });
  const losses = pressureLosses(s);
  expect(losses).toEqual([
    { from: 'compute', to: 'database', stage: 'sql-read', droppedPerSecond: 220, count: 3 },
    { from: 'compute', to: 'database', stage: 'sql-write', droppedPerSecond: 30, count: 2 },
  ]);
  const cached = processRequests(baseline(4, true), { browse: 500, order: 100, bot: 0 });
  expect(pressureLosses(cached)).toEqual([{ from: 'compute', to: 'database', stage: 'sql-write', droppedPerSecond: 30, count: 2 }]);
  const overflow = processRequests(baseline(4, true), { browse: 600, order: 0, bot: 0 });
  expect(pressureLosses(overflow)[0]).toMatchObject({ from: 'cache', to: 'database', stage: 'sql-read', droppedPerSecond: 20 });
});
it('has no fabricated queue for no demand and no invalid numeric output', () => {
  expect(visualQueue('compute', 2, 0, 0).count).toBe(0);
  for (const value of [NaN, Infinity, -1, null]) {
    expect(visualQueue('compute', value, 0, 100)).toMatchObject({ count: 0, utilization: null, failureMarkers: 0 });
  }
  expect(pressureQueues(null).every(q => q.utilization === null)).toBe(true);
});
it('keeps SQL read/write pressure separate from unrelated App loss', () => {
  const writes = processRequests(baseline(4, true), { browse: 100, order: 100, bot: 0 });
  const before = structuredClone(writes); const queues = pressureQueues(writes);
  expect(queues[1]).toMatchObject({ signal: 'sql-write', severity: 'critical', droppedPerSecond: 30 });
  expect(writes).toEqual(before);
  const app = pressureQueues(processRequests(baseline(), { browse: 120, order: 30, bot: 150 }));
  expect(app[0].failureMarkers).toBeGreaterThan(0); expect(app[1].failureMarkers).toBe(0);
});
it('positions bounded markers near real destination ingress', () => {
  const points = pressurePositions({ x: 0, y: 0 }, { x: 300, y: 0 }, 1000);
  expect(points).toHaveLength(12);
  expect(points.every(p => p.x >= 202 && p.x <= 235 && Math.abs(p.y) <= 10)).toBe(true);
  expect(pressurePositions({ x: 0, y: 0 }, { x: 0, y: 0 }, 3)).toEqual([]);
});

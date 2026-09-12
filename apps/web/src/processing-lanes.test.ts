import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { lanePoint, processingLanes } from './processing-lanes';

it('draws only configured logical lanes and never invents disconnected flow', () => {
  const a = baseline(3, true, true); const before = structuredClone(a);
  const lanes = processingLanes(a, processRequests(a, { browse: 240, order: 60, bot: 200 }));
  expect(lanes.map(({ from, to }) => ({ from, to }))).toEqual(a.connections);
  expect(lanes.find(lane => lane.from === 'compute' && lane.to === 'database')!.volume).toBeCloseTo(59.7);
  expect(lanes.find(lane => lane.from === 'cache')!.volume).toBeCloseTo(47.76);
  expect(a).toEqual(before);
  expect(processingLanes(a, null).every(lane => lane.state === 'idle' && lane.volume === 0)).toBe(true);
});
it('shows failure at the actual downstream stage and routes no bots to SQL', () => {
  const a = baseline(4); const s = processRequests(a, { browse: 240, order: 60, bot: 200 });
  const sql = processingLanes(a, s).find(lane => lane.to === 'database')!;
  expect(sql.dropped).toBe(60); expect(sql.volume).toBe(300); expect(sql.state).toBe('dropping');
});
it('positions representative packets on the same lane without changing time or capacity', () => {
  expect(lanePoint({ x: 10, y: 20 }, { x: 110, y: 70 }, .5)).toEqual({ x: 60, y: 45 });
  expect(lanePoint({ x: 10, y: 20 }, { x: 110, y: 70 }, 2)).toEqual({ x: 110, y: 70 });
});

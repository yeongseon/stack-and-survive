import { expect, it } from 'vitest';
import { validateStart } from '@stack-and-survive/cloud-domain';
import { createPreparation } from '@stack-and-survive/simulation/runtime';
import { slotState, tycoonArchitecture, tycoonPositions, tycoonPoint } from './tycoon-layout';

it('opens a fixed valid business with only Internet App1 and SQL installed', () => {
  const a = tycoonArchitecture();
  expect(validateStart(a)).toEqual([]);
  expect(a.resources.map(r => r.kind)).toEqual(['internet', 'compute', 'database']);
  for (const resource of a.resources) expect(resource).toMatchObject(tycoonPositions[resource.kind]);
  const runtime = createPreparation(a);
  for (const slot of ['edge', 'cache', 'app-2', 'app-3', 'app-4'] as const) expect(slotState(runtime, slot)).toBe('empty');
});
it('presents a left-to-right desktop chain and keeps responsive anchors inside the facility', () => {
  const kinds = ['internet', 'edge', 'compute', 'cache', 'database'] as const;
  for (const width of [320, 390, 1024, 1440, 1920]) {
    const points = kinds.map(kind => tycoonPoint(kind, width, 640));
    for (const point of points) { expect(point.x).toBeGreaterThan(60); expect(point.x).toBeLessThan(width - 60); expect(point.y).toBeGreaterThan(120); expect(point.y).toBeLessThan(550); }
    if (width >= 900) for (let i = 1; i < points.length; i++) expect(points[i].x).toBeGreaterThan(points[i-1].x);
  }
});
it('derives real pending and active slots without promoting later App slots', () => {
  const runtime = createPreparation(tycoonArchitecture());
  runtime.scaleDue = 8;
  expect(slotState(runtime, 'app-2')).toBe('provisioning'); expect(slotState(runtime, 'app-3')).toBe('empty');
  runtime.architecture.resources[1].instances = 2; runtime.scaleDue = null;
  expect(slotState(runtime, 'app-2')).toBe('active');
  runtime.architecture.resources.push({ id: 'cache', kind: 'cache', ...tycoonPositions.cache, instances: 1, remaining: 5 });
  expect(slotState(runtime, 'cache')).toBe('provisioning');
  runtime.architecture.resources.at(-1)!.remaining = 0;
  expect(slotState(runtime, 'cache')).toBe('active');
});

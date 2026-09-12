import { expect, it } from 'vitest';
import { facilityLayout } from './environment-art';

it('creates a bounded deterministic indoor equipment perimeter', () => {
  for (const width of [294, 390, 768, 1440, 1920]) {
    const equipment = facilityLayout(width, 540);
    expect(equipment).toEqual(facilityLayout(width, 540));
    expect(equipment.length).toBeLessThanOrEqual(22);
    expect(equipment.some(e => e.kind === 'rack')).toBe(true);
    expect(equipment.some(e => e.kind === 'cooling')).toBe(true);
    for (const e of equipment) {
      expect(e.x).toBeGreaterThan(0); expect(e.x + e.width / 2 + 10).toBeLessThanOrEqual(width);
      expect(e.y).toBeLessThan(540);
      expect(e.y - e.height - 6).toBeGreaterThanOrEqual(0);
      expect(e.y < 100 || e.x > width - 60).toBe(true);
    }
  }
});
it('does not allocate scenery for invalid or unmeasured dimensions', () => {
  expect(facilityLayout(NaN, 500)).toEqual([]);
  expect(facilityLayout(500, Infinity)).toEqual([]);
  expect(facilityLayout(0, 0)).toEqual([]);
});

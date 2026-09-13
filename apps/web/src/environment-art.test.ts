import { expect, it } from 'vitest';
import { equipmentBounds, facilityLayout, playerFacilityLayout, playerProtectedAreas } from './environment-art';

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
it('frames the player aisle without placing scenery in installed facility or control bounds', () => {
  for (const width of [294, 320, 390, 768, 900, 1024, 1440, 1920]) {
    const height = width < 900 ? 640 : 580;
    const props = playerFacilityLayout(width, height);
    expect(props).toEqual(playerFacilityLayout(width, height));
    expect(props.length, `viewport ${width}x${height}`).toBeGreaterThan(0); expect(props.length).toBeLessThanOrEqual(24);
    for (const prop of props) {
      const b = equipmentBounds(prop);
      expect(b.x).toBeGreaterThanOrEqual(20); expect(b.y).toBeGreaterThanOrEqual(6);
      expect(b.x+b.width).toBeLessThanOrEqual(width-16); expect(b.y+b.height).toBeLessThanOrEqual(height-28);
      for (const p of playerProtectedAreas(width,height)) expect(b.x < p.x+p.width && b.x+b.width>p.x && b.y<p.y+p.height && b.y+b.height>p.y).toBe(false);
    }
  }
  expect(playerFacilityLayout(NaN, 600)).toEqual([]);
  expect(playerFacilityLayout(0, 0)).toEqual([]);
});
it('does not allocate scenery for invalid or unmeasured dimensions', () => {
  expect(facilityLayout(NaN, 500)).toEqual([]);
  expect(facilityLayout(500, Infinity)).toEqual([]);
  expect(facilityLayout(0, 0)).toEqual([]);
});
it('includes the full offset floor shadow and roof stroke in equipment envelopes', () => {
  for (const width of [24, 32, 52, 57]) {
    const prop = { kind: 'rack' as const, x: 100, y: 140, width, height: 84 };
    const bounds = equipmentBounds(prop);
    expect(bounds.x).toBeLessThanOrEqual(prop.x + width / 2 - width * .95);
    expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(prop.x + width / 2 + width * .95);
    expect(bounds.y).toBeLessThanOrEqual(prop.y - prop.height - 6);
    expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(prop.y + 4 + 17 / 2);
  }
});

import { expect, it } from 'vitest';
import { facilityBays, facilityModuleScale } from './facility-bays';
import { moduleAsset, resourceArtBounds } from './building-assets';
it('keeps four physical server bays inside player selection and badge envelope', () => {
  const envelope = resourceArtBounds('compute', 1, true);
  expect(facilityBays).toHaveLength(4);
  expect(new Set(facilityBays.map(p => `${p.x}:${p.y}`)).size).toBe(4);
  for (const point of facilityBays) {
    const art = moduleAsset.visible;
    expect(point.x + art.x * facilityModuleScale).toBeGreaterThanOrEqual(envelope.x);
    expect(point.x + (art.x + art.width) * facilityModuleScale).toBeLessThanOrEqual(envelope.x + envelope.width);
    expect(point.y + art.y * facilityModuleScale).toBeGreaterThanOrEqual(envelope.y);
    expect(point.y + (art.y + art.height) * facilityModuleScale).toBeLessThanOrEqual(envelope.y + envelope.height);
  }
  expect(resourceArtBounds('compute').width).toBe(116);
});

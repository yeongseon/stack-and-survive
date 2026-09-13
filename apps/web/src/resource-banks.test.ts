import { expect, it } from 'vitest';
import { createController } from './controller';
import { resourceVisualState } from './resource-visual-state';
import { facilityBanks, facilityStateKey, gatewayCue } from './resource-banks';

it('keeps SQL bank pressure distinct even when the dominant maximum stays the same', () => {
  const c = createController({ start: () => () => {} });
  const read = resourceVisualState(c.getSnapshot());
  read.sql.readPressure = 'overcapacity'; read.sql.writePressure = 'healthy';
  const write = structuredClone(read); write.sql.readPressure = 'healthy'; write.sql.writePressure = 'overcapacity';
  expect(facilityBanks('database', read).map(b => b.state)).toEqual(['overcapacity', 'healthy']);
  expect(facilityBanks('database', write).map(b => b.state)).toEqual(['healthy', 'overcapacity']);
  expect(facilityStateKey(read)).not.toEqual(facilityStateKey(write));
  c.destroy();
});
it('does not render active Cache banks during absence or construction and separates queued boost', () => {
  const c = createController({ start: () => () => {} });
  const visual = resourceVisualState(c.getSnapshot());
  expect(facilityBanks('cache', visual)).toEqual([]);
  visual.cache.lifecycle = 'provisioning'; expect(facilityBanks('cache', visual)).toEqual([]);
  visual.cache.lifecycle = 'active'; visual.cache.onPath = true; visual.cache.pressure = 'healthy';
  expect(facilityBanks('cache', visual)).toHaveLength(3);
  const scheduled = structuredClone(visual); scheduled.edge.boost = 'scheduled';
  const active = structuredClone(visual); active.edge.boost = 'active';
  expect(facilityStateKey(scheduled)).not.toEqual(facilityStateKey(active));
  expect(gatewayCue(active)).toBe('none');
  scheduled.edge.lifecycle = 'active'; active.edge.lifecycle = 'active';
  expect(gatewayCue(scheduled)).toBe('activation-clock'); expect(gatewayCue(active)).toBe('boost-bars');
  scheduled.edge.boost = 'queued'; expect(gatewayCue(scheduled)).toBe('request-dots');
  c.destroy();
});

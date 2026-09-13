import { expect, it } from 'vitest';
import { createController } from './controller';
import { resourceVisualState } from './resource-visual-state';
import { facilityLight } from './facility-lighting';

it('never lights absent infrastructure as active or a scheduled boost as boosted', () => {
  const c = createController({ start: () => () => {} });
  const visual = resourceVisualState(c.getSnapshot());
  expect(facilityLight('cache', visual)).toBe(null);
  expect(facilityLight('edge', visual)).toBe(null);
  expect(facilityLight('compute', visual)?.mode).toBe('idle');
  visual.edge.lifecycle = 'provisioning'; expect(facilityLight('edge', visual)?.mode).toBe('pending');
  visual.edge.lifecycle = 'active'; visual.edge.onPath = true; visual.reading = 'current-tick';
  visual.edge.boost = 'scheduled'; expect(facilityLight('edge', visual)?.mode).toBe('healthy');
  visual.edge.boost = 'active'; expect(facilityLight('edge', visual)?.mode).toBe('boosted');
  c.destroy();
});
it('reflects only authoritative pressure and preserves frozen state without mutation', () => {
  const c = createController({ start: () => () => {} }); c.start(); c.inspectNextTick();
  const visual = resourceVisualState(c.getSnapshot());
  visual.sql.pressure = 'warning'; expect(facilityLight('database', visual)?.mode).toBe('warning');
  visual.sql.pressure = 'overcapacity'; expect(facilityLight('database', visual)?.mode).toBe('critical');
  visual.reading = 'last-tick'; const before = structuredClone(visual);
  expect(facilityLight('database', visual)?.mode).toBe('critical'); expect(visual).toEqual(before);
  c.destroy();
});

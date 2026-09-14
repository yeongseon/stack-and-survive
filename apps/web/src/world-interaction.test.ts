import { expect, it } from 'vitest';
import { createController } from './controller';
import { hitWorldTarget, worldTargets } from './world-interaction';

it('prioritizes the physical next bay and absent footprints without creating actions', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const view = controller.getSnapshot();
  for (const width of [320,390,1024,1440,1920]) {
    const targets = worldTargets(view,width,900);
    for (const id of ['app-bay','cache','edge']) {
      const target = targets.find(t => t.id === id)!;
      for (const zoom of [.75,1,1.8]) expect(hitWorldTarget(targets,target.point,zoom)?.id).toBe(id);
    }
  }
  expect(controller.getSnapshot()).toBe(view); controller.destroy();
});

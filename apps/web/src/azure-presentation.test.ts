import { describe, expect, it } from 'vitest';
import { createController } from './controller';
import { azureNodePresentations } from './azure-presentation';
describe('read-only Azure presentation adapter', () => {
  it('preserves the authoritative snapshot and labels absent measurements honestly', () => {
    const controller = createController({ start: () => () => undefined }, undefined, true);
    const view = controller.getSnapshot(); const before = JSON.stringify(view);
    const nodes = azureNodePresentations(view);
    expect(JSON.stringify(view)).toBe(before);
    expect(nodes.find(n => n.kind === 'compute')).toMatchObject({ instances: 1, utilization: null, health: 'unknown' });
    expect(nodes.find(n => n.kind === 'cache')).toMatchObject({ instances: 0, lifecycle: 'Not deployed', health: 'offline' });
    expect(nodes).toHaveLength(4); controller.destroy();
  });
});

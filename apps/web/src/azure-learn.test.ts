import { expect, it } from 'vitest';
import { architectureLearnResources, azureLearn, bicepLearnUrl } from './azure-learn';
import { createController } from './controller';

it('offers only fixed official Learn links for resources present in the final architecture', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const architecture = structuredClone(controller.getSnapshot().state.runtime.architecture);
  controller.destroy();
  expect(architectureLearnResources(architecture)).toEqual(['App', 'SQL']);
  architecture.resources.push({ id: 'cache', kind: 'cache', instances: 1, remaining: 3, x: 0, y: 0 });
  expect(architectureLearnResources(architecture)).toEqual(['App', 'SQL', 'Cache']);
  architecture.resources.push({ id: 'edge', kind: 'edge', instances: 1, remaining: 0, x: 0, y: 0 });
  expect(architectureLearnResources(architecture)).toEqual(['App', 'SQL', 'Cache', 'Protected Edge']);
  for (const link of [...Object.values(azureLearn).map(resource => resource.url), bicepLearnUrl]) {
    const url = new URL(link); expect(url.protocol).toBe('https:'); expect(url.hostname).toBe('learn.microsoft.com');
  }
});

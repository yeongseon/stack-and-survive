import { expect, it } from 'vitest';
import { checkCompiledArchitecture } from './architecture-check';
import { exportRequestFixture as request } from './export-bicep.fixture';

it('fails closed on absent, experimental, conditional or extra compiled resources', () => {
  for (const template of [null, {}, { resources: {} }, { resources: [], outputs: {} }, { resources: [{ type: 'Microsoft.Resources/deploymentScripts' }] }, { resources: Array.from({ length: 13 }, () => ({})) }]) expect(checkCompiledArchitecture(template, request).length).toBeGreaterThan(0);
});

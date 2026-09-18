import { describe, expect, it } from 'vitest';
import { azureServices, playableAzureServices } from './azure-service-catalog';
describe('Azure visual service catalog', () => {
  it('keeps unsupported concepts out of gameplay selection', () => {
    expect(playableAzureServices).toHaveLength(4);
    for (const id of ['front-door', 'waf', 'monitor', 'application-insights'] as const) {
      expect(azureServices[id].playable).toBe(false);
      expect(azureServices[id].icon).toBeUndefined();
      expect(azureServices[id].scope).toContain('pending usage review');
    }
  });
  it('reuses original official assets only with full service names', () => {
    for (const id of playableAzureServices) {
      expect(azureServices[id].icon).toMatch(/assets\/azure-icons\/.*\.svg$/);
      expect(azureServices[id].name).toContain('Azure');
    }
    expect(azureServices['protected-edge'].scope).toContain('not a separate gateway action');
  });
});

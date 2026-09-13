import { expect, it, vi } from 'vitest';
import { assetUrl } from './asset-url';
it('resolves dynamic assets under both root and project Pages bases', () => {
  try {
    vi.stubEnv('BASE_URL', '/stack-and-survive/');
    expect(assetUrl('/assets/buildings/app-module.png')).toBe('/stack-and-survive/assets/buildings/app-module.png');
    vi.stubEnv('BASE_URL', '/');
    expect(assetUrl('assets/azure-icons/app-service.svg')).toBe('/assets/azure-icons/app-service.svg');
  } finally { vi.unstubAllEnvs(); }
});

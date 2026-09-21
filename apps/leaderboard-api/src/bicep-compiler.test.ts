import { afterEach, expect, it, vi } from 'vitest';
import { safeCompileSource, localCompiler, artifactHash } from './bicep-compiler';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it.each(['module x', 'import x', 'extension x', 'provider x', 'using x', 'loadTextContent(x)', 'loadJsonContent(x)', 'loadYamlContent(x)', 'loadFileAsBase64(x)', "'''multi'''", '/* comment */', 'listKeys(x)', 'https://example.invalid'])('blocks compiler input capabilities %s', source => {
  expect(safeCompileSource(`targetScope = 'resourceGroup'\n${source}`)).toBe(false);
});
it('rejects relative compiler path and oversized sources without execution', async () => {
  expect(safeCompileSource('x'.repeat(12001))).toBe(false);
  expect((await localCompiler('bicep').compile("targetScope = 'resourceGroup'", 1000)).ok).toBe(false);
});
it('checks configured binary presence without assuming an installed command', async () => {
  vi.stubEnv('BICEP_CLI_PATH', ''); vi.resetModules(); expect(await (await import('./bicep-compiler')).compilerConfigured()).toBe(false);
  vi.stubEnv('BICEP_CLI_PATH', '/nonexistent/bicep'); vi.resetModules(); expect(await (await import('./bicep-compiler')).compilerConfigured()).toBe(false);
});
it('binds verification to both source and parameter bytes', () => {
  expect(artifactHash('a', 'b')).toMatch(/^[a-f0-9]{64}$/); expect(artifactHash('a', 'b')).not.toBe(artifactHash('a', 'c'));
});

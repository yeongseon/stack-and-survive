import { afterEach, expect, it, vi } from 'vitest';
import { validAgentResponse, validAgentSteps } from './export-agent';
import type { ExportRequest } from './export-azure';
const exported = { title: 'Fixture', bicep: 'resource fixture', parametersJson: '{}', resources: [
  { gameResource: 'App', azureService: 'Azure App Service', bicepSymbol: 'app', sku: 'S1', reason: '2 instances.' },
  { gameResource: 'SQL', azureService: 'Azure SQL Database', bicepSymbol: 'sql', sku: 'GP_S_Gen5_2', reason: '1 primary.' },
], caveats: ['Test only.'] };
const steps = ['policy', 'compile', 'architecture'].map(tool => ({ tool, status: 'passed', attempt: 1 }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
it('rejects unsupported traces and successful claims without actual compile and architecture results', () => {
  const response = { export: exported, verification: { artifactSha256: 'a'.repeat(64), attempts: 1, steps } };
  expect(validAgentResponse(response)).toBe(true);
  for (const invalid of [[], [{ tool: 'deploy', status: 'passed', attempt: 1 }], [{ tool: 'compile', status: 'passed', attempt: 3 }]]) expect(validAgentResponse({ ...response, verification: { ...response.verification, steps: invalid } })).toBe(false);
  expect(validAgentSteps([{ tool: 'compile', status: 'failed', attempt: 1 }])).toBe(true);
  expect(validAgentSteps([{ tool: 'mapping', status: 'passed', attempt: -1 }])).toBe(false);
});
it('verifies exact output bytes before returning an artifact and preserves valid failure traces', async () => {
  vi.stubEnv('VITE_LEADERBOARD_API', 'https://api.invalid'); vi.resetModules();
  const { requestAgentExport } = await import('./export-agent');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([exported.bicep, exported.parametersJson])));
  const hash = [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const response = { export: exported, verification: { artifactSha256: hash, attempts: 1, steps } };
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(response)))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...response, export: { ...exported, bicep: 'tampered' } })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'failed', steps: [{ tool: 'compile', status: 'failed', attempt: 1 }] }), { status: 502 }));
  vi.stubGlobal('fetch', fetch);
  const input = {} as ExportRequest;
  expect(await requestAgentExport(input)).toEqual(response);
  expect(await requestAgentExport(input)).toEqual({ export: null, steps: [] });
  expect(await requestAgentExport(input)).toEqual({ export: null, steps: [{ tool: 'compile', status: 'failed', attempt: 1 }] });
  expect(fetch.mock.calls[0][0]).toBe('https://api.invalid/api/export-agent');
});

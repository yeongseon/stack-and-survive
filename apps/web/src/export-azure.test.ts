import { afterEach, describe, expect, it, vi } from 'vitest';
import { createController } from './controller';
import { summarizeRun } from './run-history';
import { buildExportRequest, validExportResponse } from './export-azure';
const exportResponseFixture = { title: 'Test export', bicep: "targetScope = 'resourceGroup'", parametersJson: '{}', resources: [
  { gameResource: 'App', azureService: 'Azure App Service', bicepSymbol: 'app', sku: 'S1', reason: 'Your run used 2 instances.' },
  { gameResource: 'SQL', azureService: 'Azure SQL Database', bicepSymbol: 'sql', sku: 'GP_S_Gen5_2', reason: 'Your tier was 1.' },
], caveats: ['Offline test fixture, not AI evidence.'] };

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });
function finished() {
  const controller = createController({ start: () => () => {} }, undefined, true);
  controller.start(); controller.queueAction({ type: 'SCALE_OUT' });
  while (!controller.getSnapshot().result) controller.inspectNextTick();
  const view = controller.getSnapshot(), result = view.result!, architecture = view.state.runtime.architecture;
  const run = summarizeRun(result, architecture, 'export-test'); controller.destroy();
  return { result, run, architecture };
}
describe('read-only export client', () => {
  it('builds a small canonical request from final state and accepted actions without mutating the run', () => {
    const fixture = finished(), before = structuredClone(fixture);
    const request = buildExportRequest(fixture.result, fixture.run, fixture.architecture);
    expect(request.rulesVersion).toBe('0.4');
    expect(request.finalArchitecture.app.instances).toBe(2);
    expect(request.timeline).toEqual([{ t: 0, action: 'SCALE_OUT' }]);
    expect(request.outcome.peaks).toEqual(fixture.run.peaks);
    expect(request.outcome.objectiveMet).toBe(false);
    expect(fixture).toEqual(before);
  });
  it('limits accepted timeline entries and distinguishes present from active resources', () => {
    const { result, run, architecture } = finished();
    run.actionLog = [
      { action: { type: 'DEPLOY_RESOURCE', kind: 'cache', x: 0, y: 0, time: 2, sequence: 1 }, accepted: true, reason: null },
      { action: { type: 'SCALE_OUT', time: 2, sequence: 2 }, accepted: false, reason: 'Rejected' },
      ...Array.from({ length: 45 }, (_, index) => ({ action: { type: 'RATE_LIMIT' as const, enabled: index % 2 === 0, time: 3, sequence: index + 3 }, accepted: true, reason: null })),
    ];
    architecture.resources.push({ id: 'cache', kind: 'cache', x: 0, y: 0, instances: 1, remaining: 3 });
    const request = buildExportRequest(result, run, architecture);
    expect(request.timeline).toHaveLength(40); expect(request.timeline[0].action).toBe('DEPLOY_CACHE');
    expect(request.timeline[1].action).toBe('RATE_LIMIT_ON'); expect(request.timeline[2].action).toBe('RATE_LIMIT_OFF');
    expect(request.timeline.some(entry => entry.action === 'SCALE_OUT')).toBe(false);
    expect(request.finalArchitecture.cache).toEqual({ present: true, active: false });
    run.actionLog = [{ action: { type: 'DEPLOY_RESOURCE', kind: 'edge', x: 0, y: 0, time: 1, sequence: 0 }, accepted: true, reason: null }];
    expect(buildExportRequest(result, run, architecture).timeline[0].action).toBe('DEPLOY_EDGE');
  });
  it('validates every structural response field and rejects extra/missing/oversize values', () => {
    expect(validExportResponse(exportResponseFixture)).toBe(true);
    for (const response of [null, {}, { ...exportResponseFixture, extra: true }, { ...exportResponseFixture, title: undefined },
      { ...exportResponseFixture, bicep: 'x'.repeat(12001) }, { ...exportResponseFixture, parametersJson: 'null' },
      { ...exportResponseFixture, caveats: [''] }, { ...exportResponseFixture, resources: exportResponseFixture.resources.map(r => ({ ...r, gameResource: 'Front Door' })) },
      { ...exportResponseFixture, resources: exportResponseFixture.resources.map(r => ({ ...r, extra: true })) },
      { ...exportResponseFixture, resources: exportResponseFixture.resources.map(r => ({ ...r, reason: '' })) }]) expect(validExportResponse(response)).toBe(false);
  });
  it('uses configured optional API and returns null on network, HTTP and validation failure', async () => {
    vi.stubEnv('VITE_LEADERBOARD_API', 'https://export.invalid'); vi.resetModules();
    const client = await import('./export-azure'); const fixture = finished(); const request = buildExportRequest(fixture.result, fixture.run, fixture.architecture);
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(exportResponseFixture))); vi.stubGlobal('fetch', fetch);
    expect(await client.requestExport(request)).toEqual(exportResponseFixture);
    expect(fetch).toHaveBeenCalledWith('https://export.invalid/api/export-bicep', expect.objectContaining({ method: 'POST', body: JSON.stringify(request), signal: expect.any(AbortSignal) }));
    fetch.mockResolvedValueOnce(new Response('{}', { status: 503 })); expect(await client.requestExport(request)).toBeNull();
    fetch.mockRejectedValueOnce(new Error('offline')); expect(await client.requestExport(request)).toBeNull();
    fetch.mockResolvedValueOnce(new Response('{}')); expect(await client.requestExport(request)).toBeNull();
  });
  it('does not request anything when the optional API is unconfigured', async () => {
    vi.stubEnv('VITE_LEADERBOARD_API', ''); vi.resetModules(); const client = await import('./export-azure');
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const fixture = finished();
    expect(client.exportConfigured).toBe(false); expect(await client.requestExport(buildExportRequest(fixture.result, fixture.run, fixture.architecture))).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
});

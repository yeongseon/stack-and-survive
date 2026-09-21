import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleAgentExport, type AgentExportResponse } from './export-agent';
import { artifactHash, type BicepCompiler } from './bicep-compiler';
import { checkCompiledArchitecture } from './architecture-check';
import type { AgentClient, ToolCall, ToolTurn } from './azure-openai';
import { exportRequestFixture as request, exportResponseFixture as response } from './export-bicep.fixture';

export function compiledFixture(): unknown {
  const tags = { 'stack-and-survive': 'export', challenge: request.challengeId };
  return { $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#', parameters: { location: { type: 'string' }, namePrefix: { type: 'string' }, sqlAdminObjectId: { type: 'string' }, sqlAdminLogin: { type: 'string' } }, resources: [
    { type: 'Microsoft.Web/serverfarms', name: 'plan', kind: 'linux', apiVersion: '2023-12-01', tags, sku: { name: 'S1', capacity: 2 }, properties: { reserved: true } },
    { type: 'Microsoft.Web/sites', name: 'app', kind: 'app,linux', apiVersion: '2023-12-01', tags, properties: { httpsOnly: true, serverFarmId: "[resourceId('Microsoft.Web/serverfarms', 'plan')]" } },
    { type: 'Microsoft.Sql/servers', name: 'sql', apiVersion: '2023-08-01-preview', tags, properties: { administrators: { administratorType: 'ActiveDirectory', azureADOnlyAuthentication: true, sid: "[parameters('sqlAdminObjectId')]", login: "[parameters('sqlAdminLogin')]", tenantId: '[subscription().tenantId]' } } },
    { type: 'Microsoft.Sql/servers/databases', name: 'sql/db', apiVersion: '2023-08-01-preview', tags, sku: { name: 'GP_S_Gen5_2' }, properties: {} },
  ] };
}
function turn(name: string, args: unknown, id = 'call_1'): ToolTurn {
  const call: ToolCall = { type: 'function_call', call_id: id, name, arguments: JSON.stringify(args) };
  return { calls: [call], continuation: [call] };
}
const candidate = () => turn('validate_export', { candidate: response });
const compiler = (): BicepCompiler => ({ compile: vi.fn().mockResolvedValue({ ok: true, template: compiledFixture(), diagnostics: [] }) });
afterEach(() => vi.useRealTimers());

describe('bounded Architecture Export Agent', () => {
  it('rejects wrong Linux kind, detached SQL database and cross-tenant administrators', () => {
    const template = () => structuredClone(compiledFixture()) as { resources: Record<string, unknown>[] };
    const wrongKind = template(); wrongKind.resources[1].kind = 'app';
    expect(checkCompiledArchitecture(wrongKind, request)).toContain('App plan and site must explicitly use Linux kinds.');
    const detached = template(); detached.resources[3].name = 'unrelated/database';
    expect(checkCompiledArchitecture(detached, request)).toContain('SQL database must belong to the generated SQL server.');
    const tenant = template(); tenant.resources[2].properties = { administrators: { administratorType: 'ActiveDirectory', azureADOnlyAuthentication: true, sid: "[parameters('sqlAdminObjectId')]", login: "[parameters('sqlAdminLogin')]", tenantId: 'wrong-tenant' } };
    expect(checkCompiledArchitecture(tenant, request)).toContain('SQL must use Entra-only parameterized administrators in the current tenant.');
    const expression = template(); expression.resources[2].name = "[parameters('namePrefix')]";
    expression.resources[3].name = "[format('{0}/{1}', parameters('namePrefix'), 'db')]";
    expression.resources[3].dependsOn = ["[resourceId('Microsoft.Sql/servers', parameters('namePrefix'))]"];
    expect(checkCompiledArchitecture(expression, request)).toEqual([]);
    expression.resources[3].dependsOn = [];
    expect(checkCompiledArchitecture(expression, request)).toContain('SQL database must belong to the generated SQL server.');
  });
  it('executes mapping then actual validation and returns only the exact validated artifact', async () => {
    const client: AgentClient = { createToolResponse: vi.fn().mockResolvedValueOnce(turn('lookup_mapping', {})).mockResolvedValueOnce(turn('validate_export', { candidate: response }, 'call_2')) };
    const build = compiler();
    const before = structuredClone(request);
    const result = await handleAgentExport(JSON.stringify(request), client, build);
    expect(result.export).toEqual(response); expect(result.verification.artifactSha256).toBe(artifactHash(response.bicep, response.parametersJson));
    expect(result.verification.steps.map(step => step.tool)).toEqual(['mapping', 'policy', 'compile', 'architecture']);
    expect(build.compile).toHaveBeenCalledWith(response.bicep, expect.any(Number)); expect(request).toEqual(before);
    expect(vi.mocked(client.createToolResponse).mock.calls[1][0].input).toContainEqual(expect.objectContaining({ type: 'function_call_output', call_id: 'call_1' }));
  });
  it('feeds real compiler diagnostics back and validates repaired bytes', async () => {
    const repaired = { ...response, bicep: `${response.bicep}\n// repaired fixture` };
    const client: AgentClient = { createToolResponse: vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(turn('validate_export', { candidate: repaired }, 'call_2')) };
    const build: BicepCompiler = { compile: vi.fn().mockResolvedValueOnce({ ok: false, diagnostics: ['Error BCP018 at line 1, column 1'] }).mockResolvedValueOnce({ ok: true, template: compiledFixture(), diagnostics: [] }) };
    const result = await handleAgentExport(JSON.stringify(request), client, build);
    expect(JSON.stringify(vi.mocked(client.createToolResponse).mock.calls[1][0].input)).toContain('BCP018');
    expect(result.verification.attempts).toBe(2); expect(result.export.bicep).toBe(repaired.bicep);
    expect(result.verification.steps).toContainEqual({ tool: 'compile', status: 'failed', attempt: 1 });
    expect(result.verification.artifactSha256).toBe(artifactHash(repaired.bicep, repaired.parametersJson));
  });
  it('does not accept a compiled but wrong architecture', async () => {
    const client = { createToolResponse: vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(turn('validate_export', { candidate: { ...response, bicep: `${response.bicep}\n// different candidate` } }, 'call_2')) };
    const build = { compile: vi.fn().mockResolvedValue({ ok: true, template: { resources: [] }, diagnostics: [] }) };
    await expect(handleAgentExport(JSON.stringify(request), client, build)).rejects.toMatchObject({ statusCode: 502, message: 'Agent verification limit reached', steps: expect.arrayContaining([{ tool: 'architecture', status: 'failed', attempt: 2 }]) });
    expect(build.compile).toHaveBeenCalledTimes(2);
  });
  it.each([turn('exec', { command: 'printenv' }), turn('lookup_mapping', { service: 'anything' }), { calls: [], continuation: [] }, turn('validate_export', { candidate: response, extra: true })])('rejects unapproved or malformed calls', async result => {
    const build = compiler(); await expect(handleAgentExport(JSON.stringify(request), { createToolResponse: async () => result }, build)).rejects.toMatchObject({ statusCode: 502 }); expect(build.compile).not.toHaveBeenCalled();
  });
  it('never compiles disallowed file access or output and can repair the policy failure', async () => {
    const invalid = { ...response, bicep: `${response.bicep}\nvar leak = loadYamlContent('../private')` };
    const client = { createToolResponse: vi.fn().mockResolvedValueOnce(turn('validate_export', { candidate: invalid })).mockResolvedValueOnce(turn('validate_export', { candidate: response }, 'call_2')) };
    const build = compiler(); const result = await handleAgentExport(JSON.stringify(request), client, build);
    expect(build.compile).toHaveBeenCalledTimes(1); expect(result.verification.steps[0]).toEqual({ tool: 'policy', status: 'failed', attempt: 1 });
  });
  it('bounds repeated mapping and duplicate call identifiers', async () => {
    let index = 0;
    const client = { createToolResponse: vi.fn(async () => turn('lookup_mapping', {}, `call_${++index}`)) };
    await expect(handleAgentExport(JSON.stringify(request), client, compiler())).rejects.toMatchObject({ message: 'Agent verification limit reached' });
    expect(client.createToolResponse).toHaveBeenCalledTimes(4);
    await expect(handleAgentExport(JSON.stringify(request), { createToolResponse: async () => turn('lookup_mapping', {}) }, compiler())).rejects.toMatchObject({ message: 'Agent tool call rejected' });
  });
  it('times out a nonresponsive model without inventing a tool success', async () => {
    vi.useFakeTimers();
    const task = handleAgentExport(JSON.stringify(request), { createToolResponse: () => new Promise(() => {}) }, compiler());
    const check = expect(task).rejects.toMatchObject({ statusCode: 502, steps: [] });
    await vi.advanceTimersByTimeAsync(12001); await check;
  });
  it('does not present identical artifacts as repaired candidates', async () => {
    const client = { createToolResponse: vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(turn('validate_export', { candidate: response }, 'call_2')) };
    const build = { compile: vi.fn().mockResolvedValue({ ok: false, diagnostics: ['Error BCP018 at line 1, column 1'] }) };
    await expect(handleAgentExport(JSON.stringify(request), client, build)).rejects.toMatchObject({ message: 'Repeated candidate rejected' });
    expect(build.compile).toHaveBeenCalledTimes(1);
  });
  it('validates requests before any AI call', async () => {
    const client = { createToolResponse: vi.fn() };
    await expect(handleAgentExport('{}', client, compiler())).rejects.toMatchObject({ statusCode: 400 });
    await expect(handleAgentExport('x'.repeat(20001), client, compiler())).rejects.toMatchObject({ statusCode: 413 }); expect(client.createToolResponse).not.toHaveBeenCalled();
  });
});

export type { AgentExportResponse };

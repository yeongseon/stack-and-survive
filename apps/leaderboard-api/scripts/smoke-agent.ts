import { access, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { localCompiler, artifactHash } from '../src/bicep-compiler';
import { allResourcesFixture, exportRequestFixture, exportResponseFixture } from '../src/export-bicep.fixture';
import { validateExportResponse } from '../src/export-bicep';
import { checkCompiledArchitecture } from '../src/architecture-check';
import assert from 'node:assert/strict';
import { handleAgentExport } from '../src/export-agent';
import type { ToolCall } from '../src/azure-openai';

const binary = process.env.BICEP_CLI_PATH;
if (!binary) throw new Error('Set BICEP_CLI_PATH to the approved absolute local compiler path. No download or deployment is performed.');
await access(binary);
const compiler = localCompiler(binary);
const output = resolve('test-results/agent-compiler'); await mkdir(output, { recursive: true });
for (const [name, fixture] of [['minimal', { request: exportRequestFixture, response: exportResponseFixture }], ['all-resources', allResourcesFixture()]] as const) {
  const candidate = structuredClone(fixture.response);
  candidate.bicep = candidate.bicep.replace("  name: 'default'\n  properties:", "  name: 'default'\n  tags: tags\n  properties:");
  validateExportResponse(candidate, fixture.request);
  const result = await compiler.compile(candidate.bicep, 8000);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error('Compilation failed');
  const errors = checkCompiledArchitecture(result.template, fixture.request);
  assert.deepEqual(errors, []);
  const resources = (structuredClone(result.template) as { resources: Record<string, unknown>[] }).resources;
  const sql = resources.find(resource => resource.type === 'Microsoft.Sql/servers/databases')!;
  sql.name = 'different-server/database';
  assert.ok(checkCompiledArchitecture({ ...(result.template as object), resources }, fixture.request).some(error => error.includes('belong')));
  const wrongPlatform = structuredClone(result.template) as { resources: Record<string, unknown>[] };
  wrongPlatform.resources.find(resource => resource.type === 'Microsoft.Web/sites')!.kind = 'app';
  assert.ok(checkCompiledArchitecture(wrongPlatform, fixture.request).some(error => error.includes('Linux')));
  let turns = 0;
  const agent = await handleAgentExport(JSON.stringify(fixture.request), { createToolResponse: async () => {
    const call: ToolCall = { type: 'function_call', call_id: `fixture_${++turns}`, name: 'validate_export', arguments: JSON.stringify({ candidate: turns === 1 ? { ...candidate, bicep: `${candidate.bicep}\nvar incomplete =` } : candidate }) };
    return { calls: [call], continuation: [call] };
  } }, compiler);
  assert.equal(agent.verification.attempts, 2);
  assert.ok(agent.verification.steps.some(step => step.tool === 'compile' && step.status === 'failed'));
  assert.equal(agent.export.bicep, candidate.bicep);
  const bad = structuredClone(result.template) as { resources: { type: string; sku?: { capacity?: number } }[] };
  const plan = bad.resources.find(resource => resource.type === 'Microsoft.Web/serverfarms'); if (plan?.sku) plan.sku.capacity = 4;
  assert.ok(checkCompiledArchitecture(bad, fixture.request).length > 0);
  await writeFile(resolve(output, `${name}.json`), JSON.stringify({ fixture: true, compiler: binary.split('/').at(-1), artifactSha256: artifactHash(candidate.bicep, candidate.parametersJson), compile: 'passed', architecture: 'passed', wrongCapacityRejected: true }, null, 2));
  console.log(`PASS ${name}: real compiler failed then repaired artifact passed through agent; model is mocked, NOT real AI evidence`);
}
const broken = await compiler.compile("targetScope = 'resourceGroup'\nresource broken", 8000);
assert.equal(broken.ok, false); assert.ok(broken.diagnostics.every(diagnostic => !diagnostic.includes(output)));
console.log('PASS real malformed Bicep rejected with sanitized diagnostics');

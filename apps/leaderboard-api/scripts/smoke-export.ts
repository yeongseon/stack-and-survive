import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { azureOpenAiConfigured, createResponse } from '../src/azure-openai';
import { handleExportBicep, validateExportResponse } from '../src/export-bicep';
import { allResourcesFixture, exportRequestFixture, exportResponseFixture } from '../src/export-bicep.fixture';

const fixture = process.argv.includes('--fixture');
if (!fixture && !azureOpenAiConfigured()) {
  console.error('BLOCKED: server-only Azure OpenAI environment is not configured. No model call or Azure deployment performed.');
  process.exitCode = 2;
} else {
  const directory = resolve('test-results', 'export-smoke'); await mkdir(directory, { recursive: true });
  const sample = process.argv.includes('--all-resources') ? allResourcesFixture() : { request: exportRequestFixture, response: exportResponseFixture };
  const response = fixture ? validateExportResponse(sample.response, sample.request)
    : await handleExportBicep(JSON.stringify(sample.request), { createResponse });
  const file = resolve(directory, 'main.bicep');
  await writeFile(file, response.bicep); await writeFile(resolve(directory, 'main.parameters.json'), response.parametersJson);
  execFileSync('az', ['bicep', 'build', '--file', file], { stdio: 'inherit' });
  console.log(fixture ? 'PASS: hand-authored offline fixture compiles; NOT real AI evidence.' : 'PASS: live model output for the synthetic smoke request compiles; NOT evidence of a real played run.');
}

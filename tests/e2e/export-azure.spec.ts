import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const { createServer } = await import(require.resolve('vite')) as typeof import('../../apps/web/node_modules/vite');
import { exportResponseFixture as baseFixture } from '../../apps/leaderboard-api/src/export-bicep.fixture';
import { createHash } from 'node:crypto';
const exportResponseFixture = { ...baseFixture, title: 'Your one-instance architecture',
  bicep: baseFixture.bicep.replace('capacity: 2', 'capacity: 1'),
  resources: baseFixture.resources.map(resource => ({ ...resource, reason: resource.gameResource === 'App'
    ? 'Your run ended at 45 seconds with 1 App instance. This preserves the final App count.'
    : 'Your SQL primary stayed at tier 1. The stopped run does not demonstrate a full-operation outcome.' })),
  caveats: [...baseFixture.caveats, 'Your objective was not met. This is a mocked UI test, not live agent evidence.'],
};
const agentFixture = { export: exportResponseFixture, verification: {
  artifactSha256: createHash('sha256').update(JSON.stringify([exportResponseFixture.bicep, exportResponseFixture.parametersJson])).digest('hex'),
  attempts: 1, steps: ['policy', 'compile', 'architecture'].map(tool => ({ tool, status: 'passed', attempt: 1 })),
} };

let configured: Awaited<ReturnType<typeof createServer>>, unconfigured: Awaited<ReturnType<typeof createServer>>;
let on: string, off: string;
test.beforeAll(async () => {
  async function start(api: string) {
    const server = await createServer({ root: 'apps/web', cacheDir: `../../node_modules/.vite-export-${api ? 'on' : 'off'}`, define: { 'import.meta.env.VITE_LEADERBOARD_API': JSON.stringify(api) }, server: { host: '127.0.0.1', port: 0 } });
    await server.listen(); const address = server.httpServer?.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture port');
    return { server, url: `http://127.0.0.1:${address.port}/tests/release/export.html` };
  }
  const enabled = await start('https://export-api.invalid'); configured = enabled.server; on = enabled.url;
  const disabled = await start(''); unconfigured = disabled.server; off = disabled.url;
});
test.afterAll(async () => { await configured?.close(); await unconfigured?.close(); });

test('export stays optional, downloads text and remains in the result focus trap', async ({ page }, info) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  let requests = 0;
  await page.route('**/api/export-agent', async route => {
    requests++; const request = route.request().postDataJSON();
    expect(request.outcome.status).toBe('FAILED'); expect(request.outcome.objectiveMet).toBe(false);
    expect(JSON.stringify(request)).not.toContain('nickname');
    await route.fulfill({ json: agentFixture });
  });
  await page.goto(on);
  const report = page.getByRole('region', { name: 'Business result', exact: true });
  await expect(report.getByRole('button', { name: 'Play again', exact: true })).toBeFocused();
  const score = await report.locator('.result-score').textContent();
  await page.getByRole('button', { name: 'Export to Azure', exact: false }).click();
  await expect(page.getByText(exportResponseFixture.title)).toBeVisible(); expect(requests).toBe(1);
  await expect(page.getByRole('region', { name: 'Agent verification steps' })).toContainText('First candidate verified; no repair was needed.');
  await expect(page.getByRole('region', { name: 'Agent verification steps' })).toContainText('Bicep compilation — passed');
  await expect(page.getByText('Review before deploying; nothing was deployed.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Copy Bicep', exact: true }).click(); await expect(page.getByText('Bicep copied.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(exportResponseFixture.bicep);
  for (const name of ['main.bicep', 'main.parameters.json']) {
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: `Download ${name}`, exact: true }).click();
    const file = await download; expect(file.suggestedFilename()).toBe(name);
    expect(await readFile((await file.path())!, 'utf8')).toBe(name === 'main.bicep' ? exportResponseFixture.bicep : exportResponseFixture.parametersJson);
  }
  await page.setViewportSize({ width: 667, height: 375 });
  await page.getByText('main.bicep', { exact: true }).click();
  const pre = page.getByRole('region', { name: 'Export to Azure', exact: true }).locator('pre').first();
  await expect(pre).toBeVisible();
  const bounds = (await pre.boundingBox())!; expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(667);
  await page.screenshot({ path: info.outputPath('export-landscape.png') });
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await report.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await report.getByRole('button', { name: 'Review business', exact: true }).focus(); await page.keyboard.press('Tab');
  expect(await report.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await expect(report.locator('.result-score')).toHaveText(score!);
});
test('unavailable export can retry without hiding the result and resets on a new result', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/export-agent', async route => { attempts++; await route.fulfill(attempts === 1 ? { status: 503, json: { error: 'Export not configured' } } : { json: agentFixture }); });
  await page.goto(on); await page.getByRole('button', { name: 'Export to Azure', exact: false }).click();
  await expect(page.getByText('Export unavailable right now.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OPERATION FAILED', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry Export to Azure', exact: false }).click(); await expect(page.getByText(exportResponseFixture.title)).toBeVisible();
  await page.getByRole('button', { name: 'Play again', exact: true }).click(); await page.getByRole('button', { name: 'Show result again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export to Azure', exact: false })).toBeVisible();
});
test('late model responses cannot populate a restarted result', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/export-agent', async route => { await pending; await route.fulfill({ json: agentFixture }); });
  await page.goto(on);
  await page.getByRole('button', { name: 'Export to Azure', exact: false }).click();
  await expect(page.getByRole('region', { name: 'Export to Azure', exact: true })).toHaveAttribute('aria-busy', 'true');
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await page.getByRole('button', { name: 'Show result again', exact: true }).click();
  const response = page.waitForResponse('**/api/export-agent'); release(); await response;
  await expect(page.getByText(exportResponseFixture.title)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Export to Azure', exact: false })).toBeEnabled();
});
test('panel is absent when the build-time API is empty', async ({ page }) => {
  await page.goto(off); await expect(page.getByRole('region', { name: 'Business result', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Export to Azure', exact: true })).toHaveCount(0);
  const learn = page.getByRole('region', { name: 'Microsoft Learn resources', exact: true });
  await expect(learn).toBeVisible();
  await expect(learn.getByRole('link', { name: /App → Azure App Service/ })).toHaveAttribute('href', 'https://learn.microsoft.com/en-us/azure/app-service/overview');
  await expect(learn.getByRole('link', { name: /SQL → Azure SQL Database/ })).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(learn.getByRole('link', { name: /Cache|Protected Edge/ })).toHaveCount(0);
});
for (const failure of [400, 413, 429, 502, 405, 'malformed', 'network'] as const) {
  test(`export ${failure} failure leaves the finished result usable`, async ({ page }) => {
    await page.route('**/api/export-agent', route => failure === 'network' ? route.abort('failed') : route.fulfill(
      failure === 'malformed' ? { json: { ...agentFixture, unexpected: true } } : { status: failure, json: { error: 'Unavailable' } }));
    await page.goto(on);
    await page.getByRole('button', { name: 'Export to Azure', exact: false }).click();
    await expect(page.getByText('Export unavailable right now.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OPERATION FAILED', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play again', exact: true })).toBeEnabled();
  });
}
test('shows real failed checks and revised success without inventing live progress', async ({ page }, info) => {
  await page.route('**/api/export-agent', route => route.fulfill({ json: { ...agentFixture, verification: { ...agentFixture.verification, attempts: 2,
    steps: [{ tool: 'policy', status: 'passed', attempt: 1 }, { tool: 'compile', status: 'failed', attempt: 1 }, ...agentFixture.verification.steps.map(step => ({ ...step, attempt: 2 }))] } } }));
  await page.goto(on); await page.getByRole('button', { name: 'Export to Azure', exact: false }).click();
  const trace = page.getByRole('region', { name: 'Agent verification steps' });
  await expect(trace).toContainText('Candidate 1 · Bicep compilation — failed');
  await expect(trace).toContainText('Two candidates checked; the revised candidate passed.');
  await trace.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('mocked-agent-repair-trace.png') });
  await expect(page.getByRole('button', { name: 'Download main.bicep', exact: true })).toBeVisible();
});
test('failed verification offers trace but never a downloadable artifact', async ({ page }) => {
  await page.route('**/api/export-agent', route => route.fulfill({ status: 502, json: { error: 'Agent verification limit reached', steps: [
    { tool: 'policy', status: 'passed', attempt: 1 }, { tool: 'compile', status: 'failed', attempt: 1 },
  ] } }));
  await page.goto(on); await page.getByRole('button', { name: 'Export to Azure', exact: false }).click();
  await expect(page.getByRole('region', { name: 'Agent verification steps' })).toContainText('Verification did not complete');
  await expect(page.getByRole('button', { name: 'Download main.bicep', exact: true })).toHaveCount(0);
});

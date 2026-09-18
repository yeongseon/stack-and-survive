import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const web = `${root}apps/web`;
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { preview } = await import(require.resolve('vite'));
const stamp = new Date().toISOString().replaceAll(':', '-');
const output = `${root}test-results-submission/${stamp}`;
const html = await readFile(`${web}/dist/index.html`);
const bundleFiles = [...html.toString().matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map(match => match[1]);
const bundles = await Promise.all(bundleFiles.map(async path => ({ path, sha256: createHash('sha256').update(await readFile(`${web}/dist${path}`)).digest('hex') })));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_MASTER: '1' } }).trim();
await mkdir(output, { recursive: true });
const manifest = { capturedAt: stamp, sourceCommit: git(['rev-parse', 'HEAD']), dirtyTree: !!git(['status', '--porcelain']),
  artifactSha256: createHash('sha256').update(html).digest('hex'), bundles, mode: 'production, real wall-clock ticks; no state injection or time acceleration',
  status: 'incomplete', localBoardOnly: true, operator: 'automated capture, NOT an unfamiliar participant', frames: [], errors: [], blockedExternalRequests: 0 };
let browser, server;
try {
  server = await preview({ root: web, configFile: false, preview: { host: '127.0.0.1', port: 43879, strictPort: true, open: false } });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  // Block external APIs for an isolated local-board capture; never submit automated demonstration scores publicly.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:43879' || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    manifest.blockedExternalRequests++; return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => manifest.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) manifest.errors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => { if (new URL(request.url()).origin === 'http://127.0.0.1:43879') manifest.errors.push(`Local request failed: ${request.url()}`); });
  const readouts = () => page.evaluate(() => Object.fromEntries(['budget','traffic','availability','lost-sales','next-wave'].map(id => [id,document.querySelector(`[data-testid="${id}"]`)?.textContent ?? null])));
  async function shot(name, observation, expectedDemand) {
    await page.evaluate(() => { window.scrollTo(0, 0); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    const before = await readouts();
    await page.screenshot({ path: `${output}/${name}.png` });
    const after = await readouts();
    manifest.frames.push({ file: `${name}.png`, observation, viewport: page.viewportSize(), before, after });
    if (expectedDemand !== undefined) {
      assert.equal(Number.parseFloat(before.traffic ?? ''), expectedDemand, `${name}: intended phase already passed`);
      assert.equal(Number.parseFloat(after.traffic ?? ''), expectedDemand, `${name}: phase changed during capture`);
    }
    console.log(`Captured ${name}`);
  }
  async function build(name) {
    const action = page.getByRole('button', { name, exact: true });
    await action.focus(); await action.press('Enter');
  }
  async function beforePhase(rps, seconds) {
    await page.waitForFunction(({ rps, seconds }) => {
      const el = document.querySelector('[data-testid="next-wave"]');
      const remaining = Number(el?.querySelector('b')?.textContent?.replace('s', ''));
      return Number(el?.querySelector('strong')?.firstChild?.textContent?.trim()) === rps && remaining <= seconds;
    }, { rps, seconds }, { timeout: 90000 });
  }
  await page.goto('http://127.0.0.1:43879/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).waitFor();
  await shot('01-title', 'Fresh isolated browser context; no saved run or fabricated nickname');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.tycoon-header button:last-child')?.disabled);
  const guide = page.getByRole('button', { name: 'Skip guide', exact: true });
  if (await guide.isVisible()) await guide.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="traffic"]')?.textContent?.includes('100'));
  await shot('02-normal', 'Actual initial100RPS operation', 100);
  await beforePhase(260, 11); await build('+ App capacity');
  await page.waitForFunction(() => document.querySelector('.slot-progress')?.textContent?.includes('Expanding'));
  await shot('03-app-construction', 'Actual accepted scale-out; one active App while next bay provisions');
  await build('Deploy Cache — reduces SQL reads');
  await page.waitForFunction(() => document.querySelector('[data-testid="slot-cache"]')?.textContent?.includes('Active'));
  await shot('04-cache-active', 'Cache activated through normal runtime delay');
  await beforePhase(260, 5); await shot('05-first-spike-warning', 'Live countdown to customer spike');
  await page.waitForFunction(() => document.querySelector('[data-testid="traffic"]')?.textContent?.includes('260'));
  await shot('06-first-spike', 'Actual260RPS customer spike, prepared App/Cache', 260);
  await beforePhase(440, 12); await build('+ App capacity'); await build('Deploy Protected Edge — filters bots');
  await page.waitForFunction(() => document.querySelector('[data-testid="slot-edge"]')?.textContent?.includes('Active'));
  await shot('07-edge-active', 'Edge is active; consult observed phase values rather than inferring that bots have already arrived');
  await page.waitForFunction(() => document.querySelector('[data-testid="traffic"]')?.textContent?.includes('440'), null, { timeout: 30000 });
  await shot('08-bot-attack', 'Actual440RPS35%bot phase, live filtering and processing', 440);
  await beforePhase(200, 1);
  await page.waitForFunction(() => document.querySelector('[data-testid="traffic"]')?.textContent?.includes('200'));
  await shot('09-recovery', 'Actual200RPS5%bot recovery phase; HUD values are observed, not patched', 200);
  await beforePhase(600, 5); await shot('10-final-wave-warning', 'Actual final-phase countdown');
  await page.getByRole('region', { name: 'Business result' }).waitFor({ timeout: 60000 });
  assert.equal(await page.locator('.report-heading h2').textContent(), 'CHALLENGE CLEAR', 'Capture strategy must actually complete');
  await shot('11-result', 'Actual completed run; score and objective unmodified');
  const board = page.locator('[aria-label="Leaderboard"]');
  await board.getByRole('textbox', { name: 'Player name', exact: true }).fill('DEMO');
  await board.getByRole('button', { name: 'Join Leaderboard', exact: true }).click();
  await board.locator('.leaderboard-rank-badge').waitFor();
  if (manifest.blockedExternalRequests === 0) assert.equal(await board.getByRole('button', { name: 'Retry server submission' }).count(), 0, 'Unconfigured local mode must not claim a failed server submission');
  await board.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/12-local-leaderboard-detail.png` });
  await shot('12-local-leaderboard', 'DEMO is an automation label for this actual run, not a human participant; no external submission');
  await page.setViewportSize({ width: 844, height: 390 });
  await shot('13-result-landscape', 'Same actual final result in phone landscape');
  assert.equal(await page.locator('[data-testid="diagnostics"]').count(), 0);
  assert.deepEqual(manifest.errors, []);
  manifest.result = await page.locator('.result-score').innerText();
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.history.balance-0.3.v1') ?? 'null'));
  assert.equal(history?.runs.length, 1, 'Capture must contain one real run');
  assert.equal(history.runs[0].status, 'COMPLETED');
  assert.equal(history.runs[0].elapsed, 180);
  assert.equal(history.runs[0].objectiveMet, true);
  await writeFile(`${output}/actual-run.json`, JSON.stringify(history.runs[0], null, 2) + '\n');
  manifest.actualRun = 'actual-run.json';
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.tycoon-header button:last-child')?.disabled);
  await page.waitForFunction(() => Number.parseFloat((document.querySelector('[data-testid="lost-sales"]')?.textContent ?? '0').replace(/[$,]/g, '')) > 0, null, { timeout: 45000 });
  await shot('14-real-overload', 'Separate fresh no-action run: actual customer loss at the first spike, not the earlier winning architecture', 260);
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  const pause = page.getByRole('dialog', { name: 'Game paused', exact: true });
  await pause.waitFor();
  await pause.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
  await shot('15-pause', 'The separate overloaded run is actually paused');
  await pause.getByRole('button', { name: 'Settings', exact: true }).click();
  await shot('16-settings', 'Existing settings on the paused operation; no audio or device acceptance claimed');
  manifest.additionalRun = 'Fresh no-action operation, paused after real first-spike loss; not completed or submitted';
  assert.deepEqual(manifest.errors, []);
  manifest.status = 'complete';
  console.log(`Capture complete: ${output}`);
} catch (error) {
  manifest.status = 'failed'; manifest.errors.push(error instanceof Error ? error.message : String(error)); throw error;
} finally {
  try { await writeFile(`${output}/capture-manifest.json`, JSON.stringify(manifest, null, 2) + '\n'); }
  finally { try { await browser?.close(); } finally { if (server) await new Promise(resolve => server.httpServer.close(resolve)); } }
}

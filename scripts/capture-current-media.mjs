import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_MASTER: '1' } }).trim();
assert.equal(git(['status', '--porcelain', '--', 'apps/web', 'packages']), '', 'Commit runtime changes before capturing');
execFileSync('pnpm', ['build'], { cwd: root, env: { ...process.env, VITE_LEADERBOARD_API: '' }, stdio: 'inherit' });
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { preview } = await import(require.resolve('vite'));
const output = `${root}test-results-submission/current-${new Date().toISOString().replaceAll(':', '-')}`;
await mkdir(output, { recursive: true });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const html = await readFile(`${root}apps/web/dist/index.html`, 'utf8');
const bundles = await Promise.all([...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map(async match => ({ path: match[1], sha256: sha256(await readFile(`${root}apps/web/dist${match[1]}`)) })));
const manifest = { sourceCommit: git(['rev-parse', 'HEAD']), dirtyTree: !!git(['status', '--porcelain']), capturedAt: new Date().toISOString(), bundles,
  runtimeClean: true, status: 'incomplete', viewport: { width: 1440, height: 900 },
  mode: 'Local production build, ordinary real-time controls. No state injection or acceleration. Local board only. AI is unconfigured and never mocked into gameplay.',
  operator: 'Automated capture, not a human participant', frames: [], markers: {}, errors: [], blockedExternalRequests: 0, publicScorePosts: 0 };
let browser, server, context;
try {
  server = await preview({ root: `${root}apps/web`, configFile: false, preview: { host: '127.0.0.1', port: 43878, strictPort: true, open: false } });
  browser = await chromium.launch({ headless: true, args: process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  context = await browser.newContext({ viewport: manifest.viewport, deviceScaleFactor: 1, recordVideo: { dir: output, size: manifest.viewport } });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname.includes('/api/leaderboard')) manifest.publicScorePosts++;
    if (url.origin === 'http://127.0.0.1:43878' || ['blob:', 'data:'].includes(url.protocol)) return route.continue();
    manifest.blockedExternalRequests++; return route.abort();
  });
  const page = await context.newPage(), video = page.video(), started = performance.now();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => manifest.errors.push(error.message));
  page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1:43878/')) manifest.errors.push(request.failure()?.errorText ?? request.url()); });
  page.on('response', response => { if (response.status() >= 400) manifest.errors.push(`${response.status()} ${response.url()}`); });
  const mark = name => { manifest.markers[name] = Number(((performance.now() - started) / 1000).toFixed(3)); };
  const readouts = () => page.evaluate(() => Object.fromEntries(['budget', 'traffic', 'availability', 'lost-sales', 'mission-clock'].map(id => [id, document.querySelector(`[data-testid="${id}"]`)?.textContent ?? null])));
  async function shot(name, observation, demand) {
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    const before = await readouts();
    await page.screenshot({ path: `${output}/${name}.png` });
    const after = await readouts();
    if (demand !== undefined) { assert.equal(parseFloat(before.traffic), demand); assert.equal(parseFloat(after.traffic), demand); }
    manifest.frames.push({ name, observation, viewport: page.viewportSize(), before, after }); mark(name); console.log(`Captured ${name}`);
  }
  async function click(name) { await page.getByRole('button', { name, exact: true }).click(); }
  async function build(name) { const button = page.getByRole('button', { name, exact: true }); await button.focus(); await button.press('Enter'); await button.evaluate(element => element.blur()); }
  const demand = value => expect(page.getByTestId('traffic')).toHaveText(`${value} req/s`, { timeout: 70000 });
  const at = seconds => expect.poll(async () => Number(await page.getByRole('progressbar', { name: 'Operation elapsed time', exact: true }).getAttribute('value')), { timeout: 90000 }).toBeGreaterThanOrEqual(seconds);
  const activeSlot = name => page.waitForFunction(name => document.querySelector(`[data-testid="slot-${name}"]`)?.textContent.includes('Active'), name, { timeout: 15000 });
  const activeApps = count => page.waitForFunction(count => document.querySelector('[data-facility="compute"]')?.textContent.includes(`${count}/4 active`), count, { timeout: 15000 });
  await page.goto('http://127.0.0.1:43878/'); await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
  await shot('title', 'Fresh production title; no saved identity');
  await click('Start Game'); await demand(100); await click('Skip guide');
  await shot('opening', 'Current compact Tier 1 SQL, visible scaling and Azure service guide', 100);
  await at(3); mark('construction-start'); await build('+ App capacity');
  await expect(page.locator('[data-facility="compute"]')).toContainText('EXPANDING');
  await shot('construction', 'Actual accepted App construction; capacity not active yet', 100);
  await build('Deploy Cache — reduces SQL reads');
  await activeSlot('cache');
  await expect(page.getByTestId('slot-cache')).toContainText('Active');
  await shot('cache', 'Cache active after real provisioning', 100);
  await activeApps(2);
  await click('Manage App scaling'); await shot('app-scaling', 'Actual active App tier and instance controls'); await click('Close resource');
  await at(20); await shot('warning', 'Actual countdown approaching the first spike', 100);
  await demand(260); mark('spike-start'); await shot('spike', 'First customer spike with prepared capacity', 260);
  await at(40); await build('+ App capacity'); await activeApps(3);
  await at(54); await build('Deploy Protected Edge — filters bots');
  await activeSlot('edge'); await shot('edge', 'Protected Edge active before the malicious wave');
  await demand(440); mark('bot-start'); await shot('gameplay', 'Actual bot phase, three App instances, Cache and Edge', 440);
  await demand(200); await shot('recovery', 'Actual recovery phase at 200 req/s', 200);
  await click('Manage SQL scaling'); await shot('sql-scaling', 'Compact base SQL with available tier/replica controls'); await click('Close resource');
  await at(156); await shot('final-wave', 'Actual final-wave warning before 600 req/s');
  await demand(600); mark('final-start');
  const result = page.getByRole('region', { name: 'Business result', exact: true });
  await expect(result).toBeVisible({ timeout: 60000 }); await expect(result).toContainText('CHALLENGE CLEAR');
  mark('result-start'); await shot('join', 'Actual completed result before optional local name');
  manifest.score = await result.locator('.result-score').textContent();
  await expect(page.getByRole('region', { name: 'Export to Azure', exact: true })).toHaveCount(0);
  const learn = page.getByRole('region', { name: 'Microsoft Learn resources', exact: true });
  await learn.scrollIntoViewIfNeeded(); await shot('learn', 'Actual curated Learn links, available without AI configuration');
  const board = page.locator('.leaderboard-panel[aria-label="Leaderboard"]');
  await board.getByRole('textbox', { name: 'Player name', exact: true }).fill('DEMO');
  await board.getByRole('button', { name: 'Join Leaderboard', exact: true }).click();
  await expect(board.locator('.leaderboard-rank-badge')).toBeVisible();
  await result.locator('.report-scroll').evaluate(element => { element.scrollTop = 0; }); await page.evaluate(() => window.scrollTo(0, 0));
  await shot('result', 'Actual completed local-only DEMO result; no public submission');
  await page.waitForTimeout(18000);
  await page.setViewportSize({ width: 844, height: 390 }); await shot('landscape-result', 'Same actual result in small landscape');
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.history.balance-0.4.v1') ?? 'null'));
  assert.equal(history?.runs.length, 1); assert.equal(history.runs[0].elapsed, 180); assert.equal(history.runs[0].status, 'COMPLETED');
  await writeFile(`${output}/actual-run.json`, `${JSON.stringify(history.runs[0], null, 2)}\n`);
  manifest.actualRunSha256 = sha256(await readFile(`${output}/actual-run.json`));
  await page.setViewportSize(manifest.viewport); await click('Play again'); await click('Start Game'); await demand(100);
  await demand(260); await expect.poll(async () => parseFloat((await page.getByTestId('lost-sales').textContent()).replace(/[$,]/g, ''))).toBeGreaterThan(0);
  mark('overload-start'); await shot('overload', 'Separate no-action operation, actual App bottleneck', 260);
  await click('Ⅱ Pause');
  const pause = page.getByRole('dialog', { name: 'Game paused', exact: true });
  await expect(pause).toBeVisible();
  await pause.evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)); });
  await shot('pause', 'Separate operation paused by an ordinary action; menu animation finished');
  await page.getByRole('dialog', { name: 'Game paused', exact: true }).getByRole('button', { name: 'Settings', exact: true }).click();
  await shot('settings', 'Existing sound/motion settings; no listening/device acceptance claimed');
  assert.deepEqual(manifest.errors, []); assert.equal(manifest.publicScorePosts, 0);
  assert.equal(await page.getByTestId('diagnostics').count(), 0);
  await context.close(); context = undefined; manifest.rawVideo = await video.path();
  manifest.status = 'complete'; console.log(`Complete: ${output}`);
} catch (error) { manifest.status = 'failed'; manifest.errors.push(String(error)); throw error; }
finally {
  try { await writeFile(`${output}/capture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`); }
  finally { try { await context?.close(); } finally { try { await browser?.close(); } finally { if (server) await new Promise(resolve => server.httpServer.close(resolve)); } } }
}

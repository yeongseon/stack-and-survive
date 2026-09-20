import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { preview } = await import(require.resolve('vite'));
const output = `${root}test-results-submission/tradeoff-${new Date().toISOString().replaceAll(':', '-')}`;
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_MASTER: '1' } }).trim();
assert.equal(git(['status', '--porcelain', '--', 'apps/web', 'packages']), '', 'Commit runtime changes before recording a named source revision');
execFileSync('pnpm', ['build'], { cwd: root, stdio: 'inherit' });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const html = await readFile(`${root}apps/web/dist/index.html`, 'utf8');
const bundles = await Promise.all([...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map(async match => ({ path: match[1], sha256: sha256(await readFile(`${root}apps/web/dist${match[1]}`)) })));
await mkdir(output, { recursive: true });
const manifest = { sourceCommit: git(['rev-parse', 'HEAD']), dirtyTree: !!git(['status', '--porcelain']), bundles,
  capturedAt: new Date().toISOString(), status: 'incomplete', operator: 'Automated ordinary-player input, NOT a human participant',
  mode: 'Continuous real-time local production gameplay; final inspection is paused. No state injection, acceleration, name or score submission.',
  errors: [], blockedExternalRequests: 0, leaderboardPosts: 0, observations: [] };
let browser, server, context;
try {
  server = await preview({ root: `${root}apps/web`, configFile: false, preview: { host: '127.0.0.1', port: 43879, strictPort: true, open: false } });
  browser = await chromium.launch({ headless: true, args: process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, recordVideo: { dir: output, size: { width: 1440, height: 900 } } });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname.includes('/api/leaderboard')) manifest.leaderboardPosts++;
    if (url.origin === 'http://127.0.0.1:43879' || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    manifest.blockedExternalRequests++; return route.abort();
  });
  const page = await context.newPage();
  const video = page.video();
  const started = performance.now();
  page.on('pageerror', error => manifest.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) manifest.errors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1:43879/')) manifest.errors.push(request.failure()?.errorText ?? request.url()); });
  const click = name => page.getByRole('button', { name, exact: true }).click();
  const card = page.getByRole('region', { name: 'Resource actions', exact: true });
  async function observe(name) {
    const readouts = await page.evaluate(() => Object.fromEntries(['traffic', 'availability', 'budget', 'lost-sales', 'mission-clock'].map(id => [id, document.querySelector(`[data-testid="${id}"]`)?.textContent])));
    manifest.observations.push({ name, approximateVideoSeconds: (performance.now() - started) / 1000, readouts, card: await card.count() ? await card.innerText() : null });
    await page.screenshot({ path: `${output}/${name}.png` });
  }
  await page.goto('http://127.0.0.1:43879/');
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
  await observe('01-title'); await click('Start Game');
  await expect(page.getByTestId('traffic')).toContainText('100', { timeout: 30000 });
  await click('Skip guide'); await observe('02-compact-sql');
  await click('Manage App scaling'); await click('Scale out · + Instance');
  await expect(card).toContainText('2/4 instances', { timeout: 15000 });
  await observe('03-more-app'); await click('Close resource');
  await click('Manage SQL scaling');
  await expect(page.getByTestId('traffic')).toContainText('260', { timeout: 30000 });
  await expect(card).toContainText('Reads: 116%');
  await observe('04-sql-bottleneck');
  await page.waitForTimeout(2500);
  await click('Scale up · ↑ SQL tier');
  await expect(card.locator('.scaling-status')).toContainText(/queued|Changing tier/);
  await observe('05-sql-upgrade-pending');
  await expect(card).toContainText('Tier 2 · General Purpose II', { timeout: 15000 });
  await expect(page.getByTestId('traffic')).toContainText('260');
  await expect(card).toContainText('Reads: 69%');
  await expect(page.getByTestId('availability')).toContainText('100');
  await observe('06-same-demand-recovered');
  await click('Close resource');
  await click('Ⅱ Pause'); await click('Inspect paused world');
  await click('Manage SQL scaling');
  await observe('07-paused-review');
  await page.waitForTimeout(5000);
  assert.deepEqual(manifest.errors, []);
  assert.equal(manifest.leaderboardPosts, 0);
  assert.equal(await page.locator('[data-testid="diagnostics"]').count(), 0);
  await context.close(); context = undefined;
  manifest.rawVideo = await video.path();

  // A separate footer preserves every game pixel and makes automation/pause provenance visible.
  const footer = await browser.newPage({ viewport: { width: 1440, height: 100 } });
  await footer.setContent('<body style="margin:0;background:#081c29;color:#eaf6f7;font:18px sans-serif;padding:16px 24px;box-sizing:border-box"><strong style="color:#f2cf93">MORE APP MACHINES DO NOT FIX EVERY BOTTLENECK.</strong><div style="margin-top:12px;font-size:14px">Continuous automated local gameplay · rules 0.4 · source <span id="source"></span> · final review paused · not human validation or Azure benchmarks</div></body>');
  await footer.locator('#source').evaluate((element, text) => { element.textContent = text; }, manifest.sourceCommit.slice(0, 7));
  await footer.screenshot({ path: `${output}/footer.png` }); await footer.close();
  const movie = `${output}/tradeoff.mp4`;
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', manifest.rawVideo, '-loop', '1', '-i', `${output}/footer.png`, '-filter_complex', '[0:v]fps=25,pad=1440:1000:0:0:color=0x081c29[game];[game][1:v]overlay=0:900:shortest=1,format=yuv420p[out]', '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-movflags', '+faststart', movie], { stdio: 'inherit' });
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', movie], { encoding: 'utf8' }));
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', movie, '-f', 'null', '-'], { stdio: 'inherit' });
  assert.equal(probe.streams[0].width, 1440); assert.equal(probe.streams[0].height, 1000);
  assert.ok(Number(probe.format.duration) >= 40 && Number(probe.format.duration) < 90);
  manifest.movie = { file: 'tradeoff.mp4', sha256: sha256(await readFile(movie)), duration: Number(probe.format.duration), width: 1440, height: 1000, audio: 'silent; presenter script in docs/DEMO_VIDEO.md', decode: 'complete decode passed' };
  manifest.status = 'complete';
  console.log(JSON.stringify({ output, ...manifest.movie }, null, 2));
} catch (error) {
  manifest.status = 'failed'; manifest.errors.push(String(error)); throw error;
} finally {
  try { await writeFile(`${output}/capture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`); }
  finally { try { await context?.close(); } finally { try { await browser?.close(); } finally { if (server) await new Promise(resolve => server.httpServer.close(resolve)); } } }
}

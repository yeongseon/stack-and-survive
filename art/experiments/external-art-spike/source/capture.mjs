import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const experiment = fileURLToPath(new URL('../', import.meta.url));
const iteration = process.env.ART_ITERATION;
assert.ok(iteration === undefined || /^\d{2}$/.test(iteration), 'ART_ITERATION must be two digits');
const output = iteration ? `${experiment}iterations/${iteration}/` : experiment;
const require = createRequire(`${root}apps/web/package.json`);
const { createServer } = await import(require.resolve('vite'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const directory of ['current', 'proposed', 'side-by-side']) await mkdir(`${output}comparison/${directory}`, { recursive: true });
const overlay = await readFile(iteration ? `${output}environment.png` : `${experiment}renders/environment/external-overlay.png`);
const server = await createServer({ root: `${root}apps/web`, server: { host: '127.0.0.1', port: 0 }, plugins: [{
  name: 'isolated-spike-scene-access',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/art-v3.ts')) {
      return code.replace(/export const v3 = [\s\S]*? : null;/, 'export const v3 = approvedInventory;');
    }
    if (!id.endsWith('/src/world.ts')) return;
    const marker = "host.dataset.renderer = 'ready';";
    assert.ok(code.includes(marker));
    return code.replace(marker, `globalThis.__spikeScene = this; ${marker}`);
  },
}] });
let browser;
const records = [];
try {
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}/?tycoon`;
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(20000);
    const surface = page.locator('[data-renderer="ready"]');
    const step = page.getByRole('button', { name: 'Step one tick', exact: true });
    const state = async () => surface.evaluate(el => Object.fromEntries(['tick', 'resourceStates', 'playerCamera', 'worldNodes', 'worldTargets', 'flows', 'v3Sprites'].map(key => [key, el.dataset[key]])));
    async function start() {
      await page.goto(url);
      await page.getByRole('button', { name: 'Start Game', exact: true }).click();
      await surface.waitFor();
      const skip = page.getByRole('button', { name: 'Skip guide', exact: true });
      if (await skip.isVisible()) await skip.click();
      await page.locator('.welcome-countdown').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('[data-resource-states]') && JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).live);
      await page.getByText('Tycoon QA', { exact: true }).click();
      await step.click();
      if (await skip.isVisible()) await skip.click();
      await page.waitForFunction(() => !!document.querySelector('[data-resource-states]')?.dataset.resourceStates);
      await page.evaluate(async data => {
        const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
        globalThis.__spikeOverlay = image;
      }, overlay.toString('base64'));
    }
    async function pair(name) {
      await page.mouse.move(0, 0);
      await page.evaluate(() => window.scrollTo(0, 0));
      const before = await state();
      assert.ok(Number(before.tick) > 0, 'Capture must show an actual operating tick, not countdown');
      const visual = JSON.parse(before.resourceStates);
      if (name === 'pressure') assert.equal(visual.app.pressure, 'overcapacity');
      if (name === 'construction') assert.equal(visual.cache.lifecycle, 'provisioning');
      if (name === 'cache-edge-active') { assert.equal(visual.cache.lifecycle, 'active'); assert.equal(visual.edge.lifecycle, 'active'); }
      const filename = `${viewport.width}-${name}.png`;
      const current = await page.screenshot({ path: `${output}comparison/current/current-${filename}` });
      await page.evaluate(() => {
        const scene = globalThis.__spikeScene;
        const texture = scene.textures.get('hall-background');
        const context = texture.getSourceImage().getContext('2d');
        globalThis.__spikeOriginal = context.getImageData(0, 0, 2400, 1350);
        context.drawImage(globalThis.__spikeOverlay, 0, 0);
        texture.source[0].update();
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const proposed = await page.screenshot({ path: `${output}comparison/proposed/proposal-${filename}` });
      const after = await state();
      assert.equal(after.tick, before.tick, 'No simulation tick may advance within a pair');
      assert.equal(after.resourceStates, before.resourceStates);
      assert.equal(after.playerCamera, before.playerCamera);
      assert.equal(after.worldNodes, before.worldNodes);
      assert.equal(after.worldTargets, before.worldTargets);
      assert.equal(after.flows, before.flows);
      await page.evaluate(() => {
        const texture = globalThis.__spikeScene.textures.get('hall-background');
        texture.getSourceImage().getContext('2d').putImageData(globalThis.__spikeOriginal, 0, 0); texture.source[0].update();
      });
      records.push({ name, viewport, current: `current/current-${filename}`, proposed: `proposed/proposal-${filename}`,
        currentSha256: sha(current), proposedSha256: sha(proposed), before, after,
        sourceUrl: url, capturedAt: new Date().toISOString(), renderPath: 'live Phaser; QA manual-step reduced-motion; browser-memory environment canvas overlay only',
        baseCommit: '7e2f145a5458ea1de77e2cf5b0b09550cce9dee4', iteration: iteration ?? '01', overlaySha256: sha(overlay), errors });
      await writeFile(`${output}comparison/captures.json`, JSON.stringify(records, null, 2) + '\n');
    }
    async function build(id) {
      const targets = JSON.parse(await surface.getAttribute('data-world-targets'));
      const target = targets.find(item => item.id === id); assert.ok(target);
      await page.locator('canvas').click({ position: { x: target.x, y: target.y } });
      const confirm = page.getByRole('button', { name: 'Confirm expansion', exact: true });
      if (await confirm.isVisible()) await confirm.click();
    }
    await start(); await pair('normal');
    await page.getByRole('button', { name: 'Fit architecture', exact: true }).click(); await pair('fit');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click(); await pair('close');
    await start();
    for (const id of ['cache', 'edge', 'app-bay']) await build(id);
    await step.click(); await pair('construction');
    for (let n = 0; n < 10; n++) await step.click();
    await pair('cache-edge-active');
    await start();
    for (let n = 1; n < 32; n++) await step.click();
    await pair('pressure');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`Captured ${records.length} matched real Phaser pairs`);
} finally {
  await browser?.close(); await server.close();
}

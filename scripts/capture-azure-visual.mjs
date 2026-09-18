import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const output = new URL('../docs/workstreams/azure-visual-experience/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const [width, height] of [[1440, 900], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:43889/');
    await page.getByRole('button', { name: 'Start Game', exact: true }).waitFor();
    await page.screenshot({ path: new URL(`${phase}-title-${width}.png`, output).pathname });
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.welcome-countdown') && !document.querySelector('.opening-caption'));
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
    const skip = page.getByRole('button', { name: 'Skip guide', exact: true });
    if (await skip.count()) await skip.click();
    if (phase === 'after') await page.getByRole('button', { name: 'Azure services', exact: true }).click();
    await page.screenshot({ path: new URL(`${phase}-architecture-${width}.png`, output).pathname });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(JSON.stringify({ phase, width, height, consoleErrors: errors }));
    await page.close();
  }
} finally { await browser.close(); }

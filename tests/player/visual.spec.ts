import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`ordinary Azure game-world composition at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const architecture = baseline(2, true, true);
    const positions = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 160 }, { x: 130, y: -150 }];
    architecture.resources.forEach((r, i) => Object.assign(r, positions[i]));
    await page.goto('/');
    await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), architecture);
    await page.reload(); const surface = page.locator('[data-renderer="ready"]');
    await expect(surface).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Step one tick' })).toHaveCount(0);
    await expect(page.getByTestId('diagnostics')).toHaveCount(0);
    await expect(page.locator('.world-service-badges img')).toHaveCount(4);
    const images = await page.locator('.world-service-badges img').all();
    for (const image of images) await expect.poll(async () => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const canvas = (await page.locator('canvas').boundingBox())!;
    expect(canvas.width).toBeGreaterThan(250); expect(canvas.height).toBeGreaterThan(200);
    await page.screenshot({ path: info.outputPath(`player-world-${viewport.width}.png`) });
    await page.getByRole('button', { name: 'Start operation', exact: true }).click();
    await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 10000 }).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
    await expect(page.getByTestId('status')).toHaveText('PAUSED');
    expect(errors).toEqual([]);
  });
}

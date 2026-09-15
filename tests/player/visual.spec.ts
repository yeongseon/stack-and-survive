import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`ordinary Azure game-world composition at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const title = page.getByRole('region', { name: 'Game introduction' });
    const scene = page.getByTestId('title-world');
    const titleBounds = (await title.boundingBox())!;
    const sceneBounds = (await scene.boundingBox())!;
    expect(sceneBounds.width).toBeGreaterThanOrEqual(viewport.width - 1);
    if (viewport.width >= 1024) expect(sceneBounds.height).toBeGreaterThanOrEqual(titleBounds.height - 1);
    for (const name of ['Start Game', 'How to Play', 'About']) {
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toBeVisible();
      const bounds = (await button.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: info.outputPath(`title-${viewport.width}.png`) });
    await page.getByRole('button', { name: 'Start Game' }).click();
    if(viewport.width<900){
      await expect(page.getByRole('dialog',{name:'Landscape play required'})).toContainText('Rotate your device');
      await expect(page.locator('canvas')).toHaveCount(0);
      await page.screenshot({path:info.outputPath(`rotate-${viewport.width}.png`)});
      await page.setViewportSize({width:viewport.height,height:viewport.width});
      await page.getByRole('button',{name:'Continue in landscape',exact:true}).click();
    }
    const surface = page.locator('[data-renderer="ready"]');
    await expect(surface).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Step one tick' })).toHaveCount(0);
    await expect(page.getByTestId('diagnostics')).toHaveCount(0);
    await expect(page.locator('.world-service-badges img')).toHaveCount(2);
    const images = await page.locator('.world-service-badges img').all();
    for (const image of images) await expect.poll(async () => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    for (const image of images) {
      const badge = (await image.boundingBox())!;
      const board = (await surface.boundingBox())!;
      expect(badge.y).toBeGreaterThanOrEqual(board.y);
      expect(badge.y + badge.height).toBeLessThanOrEqual(board.y + board.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const canvas = (await page.locator('canvas').boundingBox())!;
    expect(canvas.width).toBeGreaterThan(250); expect(canvas.height).toBeGreaterThan(200);
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 10000 });
    await expect(page.getByTestId('traffic')).toContainText('100', { timeout: 10000 });
    await page.screenshot({ path: info.outputPath(`player-world-${viewport.width}.png`) });
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
    await expect(page.getByRole('button', { name: '▶ Resume', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

import { expect, test, type Page } from '@playwright/test';

async function waitForRenderer(page: Page) {
  await page.waitForFunction(() => {
    const surface = document.querySelector('[data-renderer]');
    if (surface?.getAttribute('data-renderer') === 'error'
      || document.querySelector('[data-testid="status"]')?.textContent?.includes('ERROR')) {
      throw new Error('Renderer failed during initialization');
    }
    return surface?.getAttribute('data-renderer') === 'ready';
  }, undefined, { timeout: 20000 });
  const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-nodes', /compute/);
  return surface;
}

for (const size of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`board and controls fit ${size.width}x${size.height}`, async ({ page }, info) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(size); await page.goto('/');
    const surface = await waitForRenderer(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const world = page.getByTestId('world'); const initialBox = (await world.boundingBox())!;
    expect(initialBox.y).toBeLessThan(size.height - 100);
    if (size.width >= 900) expect(initialBox.y + initialBox.height).toBeLessThanOrEqual(size.height + 10);
    await surface.scrollIntoViewIfNeeded(); const box = (await surface.boundingBox())!;
    const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
    for (const node of nodes) {
      expect(node.x).toBeGreaterThan(34); expect(node.x).toBeLessThan(box.width - 34);
      expect(node.y).toBeGreaterThan(44); expect(node.y).toBeLessThan(box.height - 90);
    }
    const app = nodes.find(n => n.id === 'compute')!;
    await page.mouse.click(box.x + app.x, box.y + app.y);
    await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure App Service');
    await page.getByRole('button', { name: 'Fit view', exact: true }).click();
    await surface.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`responsive-${size.width}.png`) });
    await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
    await expect(page.getByTestId('elapsed')).toHaveText('1', { timeout: 5000 });
    await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
    await expect(page.getByTestId('status')).toHaveText('PAUSED');
    expect(errors).toEqual([]);
  });
}

test('narrow viewport placement and resize preserve architecture and input alignment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const surface = await waitForRenderer(page);
  await expect(page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true })).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Build & connections' }).click();
  await page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true }).click();
  await surface.scrollIntoViewIfNeeded(); const box = (await surface.boundingBox())!;
  const x = box.x + box.width / 2 - 80; const y = box.y + box.height / 2 + 100;
  await page.mouse.move(x, y); await page.mouse.click(x, y);
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure Managed Redis');
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 8000 });
  const before = JSON.parse((await page.getByTestId('diagnostics').textContent())!).architecture;
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(async () => (await surface.boundingBox())!.width).toBeGreaterThan(900);
  const after = JSON.parse((await page.getByTestId('diagnostics').textContent())!).architecture;
  expect(after).toEqual(before);
  await surface.scrollIntoViewIfNeeded();
  const largeBox = (await surface.boundingBox())!;
  const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
  const cache = nodes.find(n => n.id === 'cache')!;
  await page.mouse.click(largeBox.x + cache.x, largeBox.y + cache.y);
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure Managed Redis');
  await expect(page.getByTestId('elapsed')).toHaveText('0');
});

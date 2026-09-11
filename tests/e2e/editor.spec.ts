import { expect, test, type Page } from '@playwright/test';

async function node(page: Page, id: string) {
  const surface = page.locator('[data-renderer="ready"]');
  const box = (await surface.boundingBox())!;
  const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
  const n = nodes.find(n => n.id === id)!; return { x: box.x + n.x, y: box.y + n.y };
}
test('build palette places provisions selects moves and removes a resource', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true }).click();
  await surface.scrollIntoViewIfNeeded();
  const app = await node(page, 'compute'); await page.mouse.move(app.x, app.y); await page.mouse.click(app.x, app.y);
  await expect(page.getByRole('alert')).toContainText('overlap');
  await surface.scrollIntoViewIfNeeded();
  const box = (await surface.boundingBox())!;
  const free = { x: box.x + box.width / 2 - 240, y: box.y + box.height / 2 + 200 };
  await page.mouse.move(free.x, free.y); await expect(surface).toHaveAttribute('data-placement', 'valid');
  await page.mouse.click(free.x, free.y);
  await expect(page.getByTestId('resource-status')).toContainText('Provisioning');
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 8000 });
  await expect(page.getByTestId('elapsed')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true })).toBeDisabled();
  const cache = await node(page, 'cache'); await page.mouse.move(cache.x, cache.y); await page.mouse.down();
  await page.mouse.move(cache.x + 100, cache.y - 20, { steps: 10 }); await page.mouse.up();
  await expect.poll(async () => (await node(page, 'cache')).x).toBeGreaterThan(cache.x + 70);
  await page.screenshot({ path: info.outputPath('cache-placed.png') });
  await page.getByRole('button', { name: 'Remove resource', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});
test('preparation scale delays capacity and runtime editing is blocked', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  const app = await node(page, 'compute'); await page.mouse.click(app.x, app.y);
  await page.getByRole('button', { name: 'Provision instance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start traffic', exact: true })).toBeDisabled();
  await expect(page.getByText(/New instance pending/)).toBeVisible();
  await expect(page.getByLabel('Initial App instances')).toHaveValue('2', { timeout: 11000 });
  await page.getByRole('button', { name: 'Reduce instance', exact: true }).click();
  await expect(page.getByLabel('Initial App instances')).toHaveValue('1');
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove resource', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true })).toBeDisabled();
});

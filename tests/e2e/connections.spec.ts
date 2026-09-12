import { expect, test } from '@playwright/test';

test('repairs missing write path with accessible connection controls', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.locator('summary').filter({ hasText: 'Architecture connections' }).click();
  await page.getByRole('button', { name: 'Remove connection compute to database', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start traffic', exact: true })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'Cannot start:' })).toContainText('write connection');
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Connection selection' });
  await panel.getByRole('button', { name: 'Azure App Service', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Internet', exact: true })).toBeDisabled();
  await panel.getByRole('button', { name: 'Azure SQL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start traffic', exact: true })).toBeEnabled();
  await panel.getByRole('button', { name: 'Azure App Service', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Azure SQL', exact: true })).toBeDisabled();
  await panel.getByRole('button', { name: 'Cancel connection', exact: true }).click();
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Connect resources', exact: true })).toBeDisabled();
});

test('partly connected cache blocks start while complete read and write paths work', async ({ page }) => {
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true }).click();
  await surface.scrollIntoViewIfNeeded();
  const box = (await surface.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 - 240, box.y + box.height / 2 + 200);
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 8000 });
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Connection selection' });
  await panel.getByRole('button', { name: 'Azure App Service', exact: true }).click();
  await panel.getByRole('button', { name: 'Azure Managed Redis', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start traffic', exact: true })).toBeDisabled();
  await panel.getByRole('button', { name: 'Azure Managed Redis', exact: true }).click();
  await panel.getByRole('button', { name: 'Azure SQL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start traffic', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
  const diagnostics = JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  expect(diagnostics.snapshot.requests.cache.active).toBe(true);
  expect(diagnostics.snapshot.requests.sql.readDemand).toBeCloseTo(16);
});

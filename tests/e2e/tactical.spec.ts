import { expect, test } from '@playwright/test';

test('desktop world dominates the playable composition while controls remain reachable', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  const field = (await page.locator('.playfield').boundingBox())!;
  const world = (await page.getByTestId('world').boundingBox())!;
  const ratio = world.width * world.height / (field.width * field.height);
  expect(ratio).toBeGreaterThanOrEqual(.75); expect(ratio).toBeLessThanOrEqual(.9);
  await expect(page.getByRole('complementary', { name: 'Operation analysis' })).not.toBeVisible();
  await expect(page.getByRole('region', { name: 'Build palette' })).toBeVisible();
  await expect(page.getByText('Phase 1 / 4', { exact: true })).toBeVisible();
  await page.getByLabel('Initial App instances').selectOption('3');
  await expect(page.getByLabel('Initial App instances')).toHaveValue('3');
  await page.screenshot({ path: info.outputPath('tactical-desktop.png') });
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('PAUSED');
});
test('mobile inspect closes the construction deck before showing resource details', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Build & connections', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Azure SQL', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Build palette' })).not.toBeVisible();
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure SQL');
  await page.getByRole('button', { name: 'Close details', exact: true }).click();
  await expect(page.locator('#resource-inspector')).not.toBeVisible();
});

import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) test(`analysis is on demand and preserves focus and selection at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  const drawer = page.getByRole('complementary', { name: 'Operation analysis' });
  await expect(drawer).not.toBeVisible();
  const before = await page.getByTestId('world').boundingBox();
  const insights = page.getByRole('button', { name: 'Insights', exact: true });
  await insights.focus(); await page.keyboard.press('Enter');
  await expect(drawer).toBeVisible(); await expect(drawer).toContainText('Live progress is provisional');
  await expect(page.getByRole('button', { name: 'Close details', exact: true })).toBeFocused();
  expect(await page.getByTestId('world').boundingBox()).toEqual(before);
  await page.keyboard.press('Escape'); await expect(drawer).not.toBeVisible(); await expect(insights).toBeFocused();
  if (width < 900) await page.getByRole('button', { name: 'Build & connections', exact: true }).click();
  await page.getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Azure SQL', exact: true }).click();
  await expect(drawer.getByRole('region', { name: 'Selected resource' })).toContainText('Write capacity: 70/s');
  await page.getByRole('button', { name: 'Events', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Simulation event feed' })).toBeVisible();
  await expect(drawer.getByRole('region', { name: 'Selected resource' })).toContainText('Write capacity: 70/s');
  await page.getByRole('button', { name: 'Why', exact: true }).click();
  await expect(page.getByTestId('pressure-hint')).toBeVisible();
  await page.screenshot({ path: info.outputPath(`analysis-drawer-${width}.png`) });
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Why', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

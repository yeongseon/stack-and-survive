import { expect, test } from '@playwright/test';

test('result shows engine score costs cause details and returns to the same design', async ({ page }, info) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 50) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  const result = page.getByRole('region', { name: 'Scenario result' });
  await expect(result).toContainText('SCENARIO FAILED');
  await expect(page.getByTestId('result-score')).toHaveText('1,073');
  await expect(page.getByTestId('result-duration')).toContainText('50 / 180 seconds');
  await result.locator('summary').filter({ hasText: 'View result details' }).click();
  await expect(result).toContainText('Partial (20 ticks)');
  await expect(result).toContainText('App Service Saturation');
  await result.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('baseline-result.png') });
  await page.getByRole('button', { name: 'Redesign & Retry', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('PREPARATION');
  await expect(page.getByTestId('elapsed')).toHaveText('0');
  await expect(page.getByLabel('Initial App instances')).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Start traffic', exact: true })).toBeEnabled();
});

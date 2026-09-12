import { expect, test } from '@playwright/test';

test('ordinary production game cannot expose debug controls and follows real time', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?debug=true&mode=qa');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await expect(page.getByText('Developer inspector', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Step one tick' })).toHaveCount(0);
  await expect(page.getByTestId('diagnostics')).toHaveCount(0);
  await expect(page.locator('[data-frames],[data-nodes],[data-effects]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 10000 }).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  const paused = await page.getByTestId('elapsed').textContent();
  await page.waitForTimeout(1200); expect(await page.getByTestId('elapsed').textContent()).toBe(paused);
  await page.getByRole('button', { name: 'Resume traffic', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('RUNNING');
  await page.getByRole('button', { name: 'Enable Rate Limit', exact: true }).click();
  await expect(page.getByTestId('rate-progress')).toHaveText('Rate Limit ON', { timeout: 10000 });
  await page.getByRole('button', { name: 'Reset baseline', exact: true }).click();
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('FAILED', { timeout: 70000 });
  await expect(page.getByTestId('result-duration')).toContainText('50 / 180');
  await expect(page.getByTestId('result-score')).toHaveText('1,073');
  await page.screenshot({ path: info.outputPath('player-result.png') });
  await page.getByRole('button', { name: 'Redesign & Retry', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('PREPARATION');
  expect(errors).toEqual([]);
});

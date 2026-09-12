import { expect, test } from '@playwright/test';
const key = 'stack-and-survive.architecture.v1';

test('refresh restores architecture but discards pending runtime and totals', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.getByLabel('Initial App instances').selectOption('2');
  await page.getByRole('button', { name: 'Save architecture', exact: true }).click();
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.getByRole('button', { name: 'Scale out App', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm scale-out', exact: true }).click();
  await expect(page.getByTestId('scale-progress')).toContainText('pending');
  await page.reload();
  await expect(page.getByTestId('status')).toHaveText('PREPARATION');
  await expect(page.getByTestId('elapsed')).toHaveText('0');
  await expect(page.getByLabel('Initial App instances')).toHaveValue('2');
  await expect(page.getByTestId('cloud-cost')).toHaveText('0.00');
  await expect(page.getByTestId('scale-progress')).toHaveText('2 active instances');
  await page.getByRole('button', { name: 'Reset baseline', exact: true }).click();
  await expect(page.getByLabel('Initial App instances')).toHaveValue('1');
  await page.getByRole('button', { name: 'Clear local state', exact: true }).click();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await page.reload(); await expect(page.getByLabel('Initial App instances')).toHaveValue('1');
});
test('corrupt save is preserved and recoverable without breaking the game', async ({ page }) => {
  await page.goto('/'); await page.evaluate(k => localStorage.setItem(k, '{broken'), key); await page.reload();
  await expect(page.getByTestId('save-status')).toContainText('Load failed');
  await expect(page.getByRole('button', { name: 'Start operation', exact: true })).toBeEnabled();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken');
  await page.getByRole('button', { name: 'Clear local state', exact: true }).click();
  await expect(page.getByTestId('save-status')).toContainText('cleared');
  await page.getByRole('button', { name: 'Save architecture', exact: true }).click();
  await page.reload(); await expect(page.getByTestId('save-status')).toContainText('Loaded local architecture');
});
test('unavailable browser storage leaves gameplay usable with feedback', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  await page.goto('/'); await expect(page.getByTestId('save-status')).toContainText('Load failed');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
  await page.getByRole('button', { name: 'Save architecture', exact: true }).click();
  await expect(page.getByTestId('save-status')).toContainText('Save failed');
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
  expect(errors).toEqual([]);
});

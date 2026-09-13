import { expect, test } from '@playwright/test';

test('Learn restart preserves focus and tears down only the old player world', async ({ page }) => {
  await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  const canvas = await page.locator('canvas').elementHandle();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'ⓘ Learn', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Write capacity 70/s');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'ⓘ Learn', exact: true })).toBeFocused();
    expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
    await expect(surface).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'ⓘ Learn', exact: true }).click();
  await page.getByRole('button', { name: 'Return to title / restart', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeFocused();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await canvas!.evaluate(node => node.isConnected)).toBe(false);
  await expect(page.getByRole('region', { name: 'Game introduction' })).toHaveAttribute('data-time', '0');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(surface).toHaveCount(1);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  await page.getByText('Tycoon QA', { exact: true }).click();
  await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.getByTestId('elapsed')).toHaveText('1');
});

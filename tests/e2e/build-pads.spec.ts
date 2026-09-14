import { expect, test } from '@playwright/test';
test.use({ hasTouch: true });
test('floor pads disclose real costs before committing and retain keyboard cancellation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 }); await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  const cache = page.getByRole('button', { name: 'Add Cache', exact: true });
  await cache.focus(); await cache.press('Enter'); const details = page.getByRole('region', { name: 'CACHE expansion' });
  await expect(details).toContainText('5s · +8 cr/min');
  await expect(page.getByTestId('slot-cache')).not.toContainText('Provisioning');
  const rect = (await details.boundingBox())!; expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x + rect.width).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape'); await expect(details).not.toBeVisible(); await expect(cache).toBeFocused();
  await cache.press('Enter'); await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
  await expect(cache).toHaveAttribute('aria-disabled', 'true');
});

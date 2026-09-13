import { expect, test } from '@playwright/test';

test('sound stays opt-in and settings persist without changing gameplay', async ({ page }) => {
  await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enable sound', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  await page.getByRole('slider', { name: 'Volume', exact: true }).fill('0.2');
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enable sound', exact: true })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Volume', exact: true })).toHaveValue('0.2');
  await expect(page.getByRole('region', { name: 'Game introduction' })).toHaveAttribute('data-time', '0');
  await expect(page.getByRole('region', { name: 'Game introduction' })).toHaveAttribute('data-budget', '140');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
});

test('unavailable Web Audio and blocked storage leave the game usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true });
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Sound and feedback settings' })).toContainText('Sound is unavailable');
  await page.getByRole('slider', { name: 'Volume', exact: true }).fill('0.4');
  await expect(page.getByRole('region', { name: 'Sound and feedback settings' })).toContainText('could not be saved');
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
});

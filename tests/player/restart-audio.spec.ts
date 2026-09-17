import { expect, test } from '@playwright/test';

test('three fresh starts keep one renderer, paused resources and muted settings stable', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('region', { name: 'Sound and feedback settings' });
  await expect(settings.getByRole('button', { name: '🔇 Enable sound', exact: true })).toBeVisible();
  await settings.getByRole('slider', { name: 'Volume', exact: true }).fill('0');
  await settings.getByRole('button', { name: '🔇 Enable sound', exact: true }).click();
  await expect(settings).toContainText('Sound enabled.');
  await settings.getByRole('button', { name: '🔊 Mute sound', exact: true }).click();
  await page.keyboard.press('Escape');

  for (let run = 0; run < 3; run++) {
    await page.getByRole('button', { name: 'Start Game', exact: true }).dblclick();
    await expect(page.getByTestId('traffic')).toContainText('100');
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
    const fundsText = await page.getByTestId('budget').innerText();
    expect(fundsText).toMatch(/^\$[\d,.]+K$/);
    const funds = Number(fundsText.slice(1, -1).replace(/,/g, ''));
    expect(funds).toBeGreaterThan(74); expect(funds).toBeLessThanOrEqual(75);
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    const paused = await page.getByTestId('budget').innerText();
    const menu = page.getByRole('dialog', { name: 'Game paused', exact: true });
    await menu.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(settings.getByRole('button', { name: '🔇 Enable sound', exact: true })).toBeVisible();
    await expect(settings.getByRole('slider', { name: 'Volume', exact: true })).toHaveValue('0');
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('budget')).toHaveText(paused);
    await menu.getByRole('button', { name: 'Back', exact: true }).click();
    await menu.getByRole('button', { name: 'Return to Title', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

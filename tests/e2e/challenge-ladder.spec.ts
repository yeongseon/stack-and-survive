import { expect, test } from '@playwright/test';

test('approved ladder unlocks sequentially from real successful runs and ends without a phantom level', async ({ page }) => {
  test.setTimeout(600000);
  await page.goto('/?tycoon');
  const select = page.getByRole('combobox', { name: 'Challenge level', exact: true });
  await expect(select).toHaveValue('0');
  await expect(select.locator('option[value="1"]')).toHaveJSProperty('disabled', true);
  const finish = async () => {
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
    const guide = page.getByRole('button', { name: 'Skip guide', exact: true });
    if (await guide.isVisible()) await guide.click();
    await page.getByText('Tycoon QA', { exact: true }).click();
    const step = page.getByRole('button', { name: 'Step one tick', exact: true });
    await step.click();
    for (const name of ['Add Cache', '+ App capacity']) {
      await page.getByRole('button', { name, exact: true }).focus();
      await page.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
    }
    for (let i = 0; i < 9; i++) await step.click();
    for (let expansion = 0; expansion < 2; expansion++) {
      { await page.getByRole('button', { name: '+ App capacity', exact: true }).focus(); await page.getByRole('button', { name: '+ App capacity', exact: true }).press('Enter'); };
      await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
      for (let i = 0; i < 9; i++) await step.click();
    }
    while (Number(await page.getByTestId('elapsed').textContent()) < 180) await step.click();
    await expect(page.getByRole('region', { name: 'Business result' })).toContainText('CHALLENGE CLEAR');
    await expect(page.getByTestId('challenge-outcome')).toContainText('— met');
  };
  for (let level = 0; level < 3; level++) {
    await expect(select).toHaveValue(String(level));
    await finish();
    const next = page.getByRole('button', { name: 'Next level', exact: true });
    if (level < 2) {
      await expect(next).toBeVisible(); await expect(next).toBeFocused(); await next.click();
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Game introduction' })).toHaveAttribute('data-budget', '75');
    } else await expect(next).toHaveCount(0);
  }
  await page.reload(); await expect(select.locator('option')).toHaveCount(3);
  await expect(select.locator('option[value="2"]')).toHaveJSProperty('disabled', false);
  await page.getByRole('button', { name: 'Continue challenge', exact: true }).click();
  await expect(select).toHaveValue('2');
  await page.getByText('Progress settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Reset challenge progress', exact: true }).click();
  await expect(select).toHaveValue('0'); await expect(select.locator('option[value="1"]')).toHaveJSProperty('disabled', true);
});

test('corrupt or unavailable progression storage does not unlock levels or block play', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('stack-and-survive.progress.balance-0.4.v1', '{corrupt');
    Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
  });
  await page.goto('/?tycoon');
  const select = page.getByRole('combobox', { name: 'Challenge level', exact: true });
  await expect(select.locator('option[value="1"]')).toHaveJSProperty('disabled', true);
  await page.getByText('Progress settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Reset challenge progress', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Challenge selection' })).toContainText('could not be saved');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
});

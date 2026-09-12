import { expect, test } from '@playwright/test';

test('four primary concepts retain real metrics behind a keyboard-accessible explanation', async ({ page }, info) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  const hud = page.getByRole('region', { name: 'Live service and business metrics' });
  await expect(hud.locator(':scope > div')).toHaveCount(4);
  await expect(hud).toContainText('Operational budget');
  await expect(page.getByTestId('traffic')).toHaveText('—');
  await expect(page.getByTestId('dominant-pressure')).toHaveText('Awaiting demand');
  await expect(page.getByTestId('cloud-cost')).not.toBeVisible();
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 31) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.getByTestId('traffic')).toHaveText('220');
  await expect(page.getByTestId('dominant-pressure')).toHaveText('App over capacity');
  const before = await page.getByTestId('budget').textContent();
  const trigger = page.getByRole('button', { name: 'Why & metrics', exact: true });
  await trigger.focus();
  const worldBefore = await page.getByTestId('world').boundingBox();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Operation insights' });
  await expect(dialog).toBeVisible(); await expect(dialog).toContainText('Revenue does not refill');
  await expect.poll(async () => page.getByTestId('world').boundingBox()).toEqual(worldBefore);
  await expect(page.getByTestId('latency')).toBeVisible();
  await expect(page.getByTestId('cloud-cost')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close metrics', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
  await expect(page.getByTestId('budget')).toHaveText(before!);
  await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
  await expect(hud).toContainText('Last tick pressure');
  await trigger.click(); await expect(dialog).toContainText('Readings are frozen');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: info.outputPath('compact-hud.png') });
});

test.describe('touch insights', () => {
test.use({ hasTouch: true });
test('metrics dialog stays usable at 320px without hiding the close action', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 }); await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Why & metrics', exact: true }).click();
  const box = (await page.getByRole('dialog').boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(320);
  await expect(page.getByRole('button', { name: 'Close metrics', exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath('compact-hud-mobile-metrics.png') });
  await page.getByRole('button', { name: 'Close metrics', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Why & metrics', exact: true });
  await trigger.tap(); await page.touchscreen.tap(2, 2);
  await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(trigger).toBeFocused();
});
});

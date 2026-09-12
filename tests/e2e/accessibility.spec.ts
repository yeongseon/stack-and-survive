import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`desktop clarity and keyboard inspection at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await page.goto('/');
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to scenario controls' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Inspect Azure SQL', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Write capacity: 70/s');
    await page.locator('summary').filter({ hasText: 'How to play' }).click();
    await expect(page.getByText('Revenue does not refill it.', { exact: false })).toBeVisible();
    await expect(page.getByText('No sound is required.', { exact: false })).toBeVisible();
    const unnamed = await page.getByRole('button').evaluateAll(buttons => buttons.filter(b => !(b.getAttribute('aria-label') || b.textContent || '').trim()).length);
    expect(unnamed).toBe(0);
    await page.locator('summary').filter({ hasText: 'How to play' }).click();
    await page.getByRole('button', { name: 'Start operation', exact: true }).click();
    await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
    while (Number(await page.getByTestId('elapsed').textContent()) < 31) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
    await expect(page.getByTestId('pressure-hint')).toContainText('compute capacity');
    await expect(page.getByTestId('app-pressure')).toContainText('! OVERLOADED');
    await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
    await expect(page.getByTestId('status')).toHaveText('PAUSED');
    await page.getByTestId('world').scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`desktop-${viewport.width}.png`) });
  });
}

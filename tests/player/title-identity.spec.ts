import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }, { width: 667, height: 375 }]) {
  test(`optional title name uses existing store without blocking Start at ${viewport.width}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const start = page.getByRole('button', { name: 'Start Game', exact: true });
    await expect(start).toBeEnabled();
    await page.getByRole('button', { name: 'Add player name', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Player name', exact: true });
    await expect(input).toBeFocused();
    await input.fill('!');
    await expect(page.getByRole('button', { name: 'Save name', exact: true })).toBeDisabled();
    await expect(start).toBeEnabled();
    await input.fill('YS'); await input.press('Enter');
    await expect(page.getByText('Playing as', { exact: false })).toContainText('YS');
    expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.nickname'))).toBe('YS');
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    await input.fill('MIN'); await input.press('Escape');
    await expect(page.getByRole('button', { name: 'Change', exact: true })).toBeFocused();
    await expect(page.getByText('Playing as', { exact: false })).toContainText('YS');
    await page.screenshot({ path: info.outputPath('title-player-name.png') });
    const rect = await start.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0); expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height);
    await start.click();
    await expect(page.getByTestId('traffic')).toContainText('100');
  });
}

import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1024, 1440, 1920]) {
  test(`player Fit projection aligns actual facility inspection at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?tycoon');
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    const surface = page.locator('[data-renderer="ready"]');
    const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
    const sql = nodes.find(node => node.id === 'database')!;
    await page.locator('canvas').click({ position: { x: sql.x, y: sql.y - 32 } });
    const card = page.getByRole('region', { name: 'Resource actions' });
    await expect(card).toContainText('Reads:'); await expect(card).toContainText('Writes:');
    const before = await surface.getAttribute('data-tick');
    await page.getByRole('button', { name: 'Close resource', exact: true }).click();
    await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 900 });
    await expect(surface).toHaveAttribute('data-tick', before!);
    await expect(page.getByRole('button', { name: '▶ Resume', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

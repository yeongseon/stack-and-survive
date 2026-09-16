import { expect, test } from '@playwright/test';

for (const width of [740, 844, 1024, 1440, 1920]) {
  test(`player Fit projection aligns actual facility inspection at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width<900?390:900 });
    await page.goto('/?tycoon');
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
    await page.getByRole('button', { name: 'Skip guide', exact: true }).click();
    await page.getByRole('button', { name: 'Fit architecture', exact: true }).click();
    const surface = page.locator('[data-renderer="ready"]');
    await expect(surface).toHaveAttribute('data-player-camera', /"userZoom":1\}/);
    const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
    const sql = nodes.find(node => node.id === 'database')!;
    const scale=Math.min(width/2400,(width<900?390:900)/1350);
    await page.locator('canvas').click({ position: { x: sql.x, y: sql.y - 100*scale } });
    const card = page.getByRole('region', { name: 'Resource actions' });
    await expect(card).toContainText('Reads:'); await expect(card).toContainText('Writes:');
    const before = await surface.getAttribute('data-tick');
    await page.getByRole('button', { name: 'Close resource', exact: true }).click();
    await page.setViewportSize({ width: width === 844 ? 1440 : 844, height: 390 });
    await expect(surface).toHaveAttribute('data-tick', before!);
    await expect(page.getByRole('button', { name: '▶ Resume', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

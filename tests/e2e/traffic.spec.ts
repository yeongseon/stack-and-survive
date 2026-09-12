import { expect, test, type Page } from '@playwright/test';

async function place(page: Page, name: string, x: number, y: number) {
  await page.getByRole('button', { name: `Place ${name}`, exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]'); await surface.scrollIntoViewIfNeeded();
  const box = (await surface.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 + x, box.y + box.height / 2 + y);
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 9000 });
}
test('protected cached design shows actual class paths and live accounting', async ({ page }, info) => {
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByLabel('Initial App instances').selectOption('4'); await expect(surface).toHaveCount(1);
  await place(page, 'Azure Managed Redis', -220, 200);
  await place(page, 'Protected Edge / WAF', 100, -200);
  await page.locator('summary').filter({ hasText: 'Architecture connections' }).click();
  await page.getByRole('button', { name: 'Remove connection internet to compute', exact: true }).click();
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Connection selection' });
  for (const [from, to] of [['Internet', 'Protected Edge / WAF'], ['Protected Edge / WAF', 'Azure App Service'], ['Azure App Service', 'Azure Managed Redis'], ['Azure Managed Redis', 'Azure SQL']]) {
    await panel.getByRole('button', { name: from, exact: true }).click();
    await panel.getByRole('button', { name: to, exact: true }).click();
  }
  await panel.getByRole('button', { name: 'Cancel connection', exact: true }).click();
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 121) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.getByTestId('filtered-bots')).toHaveText('140.0');
  await expect(page.getByTestId('bots-at-app')).toHaveText('60.0');
  await expect(page.getByTestId('cache-hit')).toHaveText('80.0%');
  await expect(page.getByTestId('availability')).toHaveText('99.50%');
  await expect(surface).toHaveAttribute('data-tick', '121');
  const flows: { from: string; to: string; kind: string; volume: number; end: string }[] = JSON.parse((await surface.getAttribute('data-flows'))!);
  expect(flows.some(f => f.to === 'edge' && f.kind === 'bot' && f.end === 'filtered' && f.volume === 140)).toBe(true);
  expect(flows.some(f => f.to === 'cache' && f.kind === 'browse' && f.end === 'success')).toBe(true);
  expect(flows.some(f => f.from === 'compute' && f.to === 'database' && f.kind === 'order')).toBe(true);
  expect(flows.some(f => f.to === 'database' && f.kind === 'bot')).toBe(false);
  expect(Number(await surface.getAttribute('data-packets'))).toBeLessThanOrEqual(200);
  const state = JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  expect(Number(await page.getByTestId('cloud-cost').textContent())).toBeCloseTo(state.snapshot.economy.infrastructureCost, 2);
  await surface.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('protected-traffic.png') });
});

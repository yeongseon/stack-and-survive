import { expect, test, type Page } from '@playwright/test';

async function finish(page: Page) {
  const inspector = page.locator('summary').filter({ hasText: 'Developer inspector' });
  if (!(await page.getByRole('button', { name: 'Step one tick', exact: true }).isVisible())) await inspector.click();
  while (await page.getByRole('button', { name: 'Step one tick', exact: true }).isEnabled()) {
    await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  }
}
test('Cache redesign changes failure to survival and WAF redesign improves full-run economics', async ({ page }, info) => {
  test.setTimeout(300000);
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByLabel('Initial App instances').selectOption('4');
  await page.getByRole('button', { name: 'Start operation', exact: true }).click(); await finish(page);
  await expect(page.getByTestId('result-score')).toHaveText('5,172');
  await page.getByRole('button', { name: 'Redesign & Retry', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Previous attempt context' })).toContainText('Azure SQL Saturation');
  await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true }).click();
  await surface.scrollIntoViewIfNeeded(); let box = (await surface.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 - 220, box.y + box.height / 2 + 200);
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 8000 });
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Connection selection' });
  for (const [a, b] of [['Azure App Service', 'Azure Managed Redis'], ['Azure Managed Redis', 'Azure SQL']]) {
    await panel.getByRole('button', { name: a, exact: true }).click(); await panel.getByRole('button', { name: b, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Start operation', exact: true }).click(); await finish(page);
  await expect(page.getByTestId('result-score')).toHaveText('8,500');
  let comparison = page.getByRole('region', { name: 'Previous and current comparison' });
  await expect(comparison).toContainText('Different run lengths');
  await expect(comparison).toContainText('140s'); await expect(comparison).toContainText('180s');
  await page.getByRole('button', { name: 'Redesign & Retry', exact: true }).click(); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Place Protected Edge / WAF', exact: true }).click();
  await surface.scrollIntoViewIfNeeded(); box = (await surface.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 + 100, box.y + box.height / 2 - 200);
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Protected Edge / WAF');
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 8000 });
  await page.locator('summary').filter({ hasText: 'Architecture connections' }).click();
  await page.getByRole('button', { name: 'Remove connection internet to compute', exact: true }).click();
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  for (const [a, b] of [['Internet', 'Protected Edge / WAF'], ['Protected Edge / WAF', 'Azure App Service']]) {
    await panel.getByRole('button', { name: a, exact: true }).click(); await panel.getByRole('button', { name: b, exact: true }).click();
  }
  await panel.getByRole('button', { name: 'Cancel connection', exact: true }).click();
  await surface.scrollIntoViewIfNeeded(); box = (await surface.boundingBox())!;
  const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
  const app = nodes.find(n => n.id === 'compute')!; await page.mouse.click(box.x + app.x, box.y + app.y);
  await page.getByRole('button', { name: 'Reduce instance', exact: true }).click();
  await page.getByRole('button', { name: 'Start operation', exact: true }).click(); await finish(page);
  await expect(page.getByTestId('result-score')).toHaveText('9,450');
  comparison = page.getByRole('region', { name: 'Previous and current comparison' });
  await expect(comparison).not.toContainText('Different run lengths');
  await expect(comparison.getByRole('row', { name: /Infrastructure cost/ })).toContainText('-6.00');
  await expect(comparison.getByRole('row', { name: /Net business value/ })).toContainText('2.98');
  await comparison.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('redesign-comparison.png') });
});

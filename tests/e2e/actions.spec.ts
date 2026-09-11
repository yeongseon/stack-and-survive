import { expect, test, type Page } from '@playwright/test';

async function stepUntil(page: Page, target: number) {
  while (Number(await page.getByTestId('elapsed').textContent()) < target) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
}
test('live scale confirmation buys capacity only after the provisioning delay', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click(); await stepUntil(page, 34);
  await page.getByRole('button', { name: 'Scale out App', exact: true }).click();
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm scale-out' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume traffic', exact: true }).click();
  await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm scale-out' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset baseline', exact: true }).click();
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await stepUntil(page, 34);
  await page.getByRole('button', { name: 'Scale out App', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm scale-out' })).toContainText('after 8 seconds');
  await page.getByRole('button', { name: 'Confirm scale-out', exact: true }).click();
  await stepUntil(page, 35);
  await expect(page.getByTestId('scale-progress')).toContainText('not contributing capacity');
  await expect(page.getByRole('button', { name: 'Scale out App', exact: true })).toBeDisabled();
  await stepUntil(page, 43);
  await expect(page.getByTestId('scale-progress')).toHaveText('2 active instances');
  await expect(page.getByTestId('app-pressure')).toContainText('73.3%');
  await page.getByRole('button', { name: 'Enable Rate Limit', exact: true }).click(); await stepUntil(page, 46);
  await expect(page.getByTestId('rate-progress')).toHaveText('Rate Limit ON');
  await expect(page.getByRole('button', { name: 'Disable Rate Limit', exact: true })).toBeDisabled();
  await stepUntil(page, 48);
  await page.getByRole('button', { name: 'Disable Rate Limit', exact: true }).click(); await stepUntil(page, 51);
  await expect(page.getByTestId('rate-progress')).toHaveText('Rate Limit OFF');
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Scale out App', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Enable Rate Limit', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Activate Emergency WAF', exact: true })).toBeDisabled();
});

test('emergency WAF on active ingress charges once and expires to normal filtering', async ({ page }) => {
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByLabel('Initial App instances').selectOption('4'); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Place Protected Edge / WAF', exact: true }).click();
  await surface.scrollIntoViewIfNeeded(); const box = (await surface.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 + 100, box.y + box.height / 2 - 200);
  await expect(page.getByTestId('resource-status')).toHaveText('Active', { timeout: 8000 });
  await page.locator('summary').filter({ hasText: 'Architecture connections' }).click();
  await page.getByRole('button', { name: 'Remove connection internet to compute', exact: true }).click();
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Connection selection' });
  for (const [a, b] of [['Internet', 'Protected Edge / WAF'], ['Protected Edge / WAF', 'Azure App Service']]) {
    await panel.getByRole('button', { name: a, exact: true }).click(); await panel.getByRole('button', { name: b, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click(); await stepUntil(page, 75);
  await page.getByRole('button', { name: 'Activate Emergency WAF', exact: true }).click(); await stepUntil(page, 76);
  await expect(page.getByTestId('filtered-bots')).toHaveText('42.0');
  await expect(page.getByRole('button', { name: 'Activate Emergency WAF', exact: true })).toBeDisabled();
  await stepUntil(page, 77); await expect(page.getByTestId('filtered-bots')).toHaveText('54.0');
  await stepUntil(page, 107); await expect(page.getByTestId('filtered-bots')).toHaveText('42.0');
  await expect(page.getByTestId('waf-progress')).toHaveText('Emergency use consumed');
  const snapshot = JSON.parse((await page.getByTestId('diagnostics').textContent())!).snapshot;
  expect(snapshot.economy.emergencyCost).toBe(8);
});

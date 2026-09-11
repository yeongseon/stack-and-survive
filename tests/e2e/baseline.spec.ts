import { expect, test, type Page } from '@playwright/test';

async function stepUntil(page: Page, target: number) {
  const button = page.getByRole('button', { name: 'Step one tick' });
  while (Number(await page.getByTestId('elapsed').textContent()) < target) await button.click();
}
test('real baseline reaches compute pressure and fails at the verified tick', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
  const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Start traffic' }).click();
  await expect(page.getByTestId('elapsed')).toHaveText('1', { timeout: 5000 });
  await expect(surface).toHaveAttribute('data-tick', '1');
  await expect.poll(async () => Number(await surface.getAttribute('data-packets'))).toBeGreaterThan(0);
  await page.locator('summary').click();
  await stepUntil(page, 31);
  await expect(page.getByTestId('app-pressure')).toContainText('OVERLOADED');
  await expect(surface).toHaveAttribute('data-app-state', '! OVERLOADED');
  await expect(page.getByTestId('traffic')).toHaveText('220');
  await page.screenshot({ path: info.outputPath('compute-pressure.png') });
  await stepUntil(page, 50);
  await expect(page.getByTestId('status')).toHaveText('FAILED');
  await expect(page.getByRole('heading', { name: 'App Service Saturation' })).toBeVisible();
  await expect(surface).toHaveAttribute('data-packets', '0');
  const previousFrames = Number(await surface.getAttribute('data-frames'));
  await expect.poll(async () => Number(await surface.getAttribute('data-frames'))).toBeGreaterThan(previousFrames + 10);
  await expect(page.getByTestId('elapsed')).toHaveText('50');
  await page.getByRole('button', { name: 'Reset baseline' }).click();
  await expect(page.getByTestId('status')).toHaveText('PREPARATION');
  await expect(page.getByTestId('elapsed')).toHaveText('0');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('more compute leaves SQL capacity unchanged and exposes read bottleneck', async ({ page }, info) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.getByLabel('Initial App instances').selectOption('4');
  await page.getByRole('button', { name: 'Start traffic' }).click();
  await page.locator('summary').click();
  await stepUntil(page, 76);
  await expect(page.getByTestId('sql-pressure')).toContainText('OVERLOADED');
  await expect(page.getByTestId('app-pressure')).toContainText('HEALTHY');
  await expect(page.locator('[data-renderer="ready"]')).toHaveAttribute('data-sql-state', '! OVERLOADED');
  await page.screenshot({ path: info.outputPath('sql-pressure.png') });
  await page.setViewportSize({ width: 1000, height: 850 });
  await expect.poll(async () => page.locator('canvas').evaluate(c => c.clientWidth)).toBeGreaterThan(500);
  await expect(page.getByTestId('elapsed')).toHaveText('76');
});

import { expect, test } from '@playwright/test';

test('briefing start pause inspect and resume preserve real simulation state', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Black Friday briefing' })).toContainText('140 game credits');
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  const previous = await page.getByTestId('diagnostics').textContent();
  const pausedTime = Number(await page.getByTestId('elapsed').textContent());
  await expect(page.getByTestId('status')).toHaveText('PAUSED');
  await expect(page.getByRole('button', { name: 'Reset baseline', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Connect resources', exact: true })).toBeDisabled();
  await page.waitForTimeout(2200);
  expect(await page.getByTestId('diagnostics').textContent()).toBe(previous);
  await page.getByRole('button', { name: 'Resume traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThan(pausedTime);
});
test('graphics context failure stops time and renderer rebuild preserves runtime', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
  await page.locator('canvas').evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2') ?? (canvas as HTMLCanvasElement).getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension unavailable');
    extension.loseContext();
  });
  await expect(page.getByTestId('status')).toHaveText('STOPPED · ERROR');
  const time = await page.getByTestId('elapsed').textContent();
  await page.getByRole('button', { name: 'Rebuild renderer', exact: true }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('status')).toHaveText('PAUSED');
  expect(await page.getByTestId('elapsed').textContent()).toBe(time);
  await page.getByRole('button', { name: 'Resume traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent())).toBeGreaterThan(Number(time));
});

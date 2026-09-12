import { expect, test } from '@playwright/test';

for (const size of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 768, height: 900 }, { width: 767, height: 900 }, { width: 390, height: 844 }]) {
  test(`board and live actions share the viewport at ${size.width}x${size.height}`, async ({ page }, info) => {
    await page.setViewportSize(size); await page.goto('/');
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
    const world = (await page.getByTestId('world').boundingBox())!;
    expect(world.height).toBeGreaterThan(250);
    expect(world.y).toBeGreaterThanOrEqual(0);
    expect(world.y + world.height).toBeLessThanOrEqual(size.height);
    for (const name of ['Start operation', 'Scale out App', 'Enable Rate Limit', 'Activate Emergency WAF']) {
      const box = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    await page.screenshot({ path: info.outputPath(`playable-viewport-${size.width}.png`) });
    await expect(page.getByRole('button', { name: 'Scale out App', exact: true })).toHaveAttribute('aria-describedby', 'scale-reason');
    await page.getByRole('button', { name: 'Action costs & explanations', exact: true }).click();
    await expect(page.locator('#scale-reason')).toBeVisible();
    await page.getByRole('button', { name: 'Hide action explanations', exact: true }).click();
    if (size.width < 1100) {
      await expect(page.locator('#resource-inspector')).not.toBeVisible();
      await page.getByRole('button', { name: 'Show details', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Close details', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close details', exact: true }).click();
      await expect(page.locator('#resource-inspector')).not.toBeVisible();
    }
    await page.getByRole('button', { name: 'Build & connections', exact: true }).click();
    await page.getByRole('button', { name: 'Build & connections', exact: true }).click();
    await page.getByRole('button', { name: 'Start operation', exact: true }).click();
    await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
    await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
    await expect(page.getByTestId('status')).toHaveText('PAUSED');
    await expect.poll(async () => {
      const box = (await page.getByRole('button', { name: 'Activate Emergency WAF', exact: true }).boundingBox())!;
      return box.y + box.height;
    }).toBeLessThanOrEqual(size.height);
  });
}

test('critical pressure and queued actions do not push controls below the laptop screen', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 }); await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 31) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByTestId('app-pressure')).toContainText('OVERLOADED');
  for (const name of ['Pause operation', 'Scale out App', 'Enable Rate Limit', 'Activate Emergency WAF']) {
    const box = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(768);
  }
  await page.getByRole('button', { name: 'Scale out App', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm scale-out' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm scale-out', exact: true }).click();
  await expect.poll(async () => {
    const box = (await page.getByRole('button', { name: 'Activate Emergency WAF', exact: true }).boundingBox())!;
    return box.y + box.height;
  }).toBeLessThanOrEqual(768);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

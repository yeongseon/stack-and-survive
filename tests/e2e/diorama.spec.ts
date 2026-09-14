import { expect, test } from '@playwright/test';

for (const width of [1440, 390, 1920, 320, 1024]) test(`direct diorama operations at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]');
  const canvas = page.locator('canvas');
  async function target(id: string) {
    const targets: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-world-targets'))!);
    const t = targets.find(item => item.id === id)!;
    await canvas.click({ position: { x: t.x, y: t.y } });
  }
  await target('cache');
  await expect(page.getByRole('region', { name: 'CACHE expansion' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).cache.lifecycle).toBe('provisioning');
  await page.screenshot({ path: info.outputPath(`diorama-construction-${width}.png`) });
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).cache.lifecycle).toBe('active');
  await target('app-bay');
  await expect(page.getByRole('region', { name: 'APP expansion' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).app.bays.filter((state: string) => state === 'active').length).toBe(2);
  await target('edge');
  await expect(page.getByRole('region', { name: 'EDGE expansion' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).edge.lifecycle).toBe('active');
  await target('edge');
  await expect(page.getByRole('region', { name: 'Resource actions' })).toContainText('Filtering normal');
  await page.getByRole('button', { name: 'Boost filtering · 8 cr', exact: true }).click();
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).edge.boost).toBe('active');
  await page.getByRole('button', { name: 'Close resource', exact: true }).click();
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await page.screenshot({ path: info.outputPath(`diorama-active-${width}.png`) });
  const world = (await page.getByTestId('world').boundingBox())!;
  expect(world.height).toBeGreaterThanOrEqual(890);
  await page.getByRole('button', { name: 'SQL processing', exact: true }).focus();
  await expect(page.getByRole('button', { name: 'SQL processing', exact: true })).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resource actions' })).toContainText('Reads:');
});

import { expect, test } from '@playwright/test';

for (const width of [1440, 844, 1920, 740, 1024]) test(`direct diorama operations at ${width}px`, async ({ page }, info) => {
  const height=width<900?390:900;
  await page.setViewportSize({ width, height });
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
  await expect(page.getByRole('status').filter({hasText:'Cache requested'})).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).cache.lifecycle).toBe('provisioning');
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-construction-sites'))!).some((s: {id:string}) => s.id === 'cache')).toBe(true);
  await page.screenshot({ path: info.outputPath(`diorama-construction-${width}.png`) });
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).cache.lifecycle).toBe('active');
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-construction-sites'))!).some((s: {id:string}) => s.id === 'cache')).toBe(false);
  await target('app-bay');
  await expect(page.getByRole('status').filter({hasText:'App expansion requested'})).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).app.bays.filter((state: string) => state === 'active').length).toBe(2);
  await target('edge');
  await expect(page.getByRole('status').filter({hasText:'Protected Edge requested'})).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).edge.lifecycle).toBe('active');
  await target('edge');
  await expect(page.getByRole('region', { name: 'Resource actions' })).toContainText('Filtering normal');
  await page.getByRole('button', { name: 'Boost filtering · $8K', exact: true }).click();
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-resource-states'))!).edge.boost).toBe('active');
  await page.getByRole('button', { name: 'Close resource', exact: true }).click();
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  await page.screenshot({ path: info.outputPath(`diorama-active-${width}.png`) });
  const world = (await page.getByTestId('world').boundingBox())!;
  expect(world.height).toBeGreaterThanOrEqual(height-10);
  await page.getByRole('button', { name: 'SQL processing', exact: true }).focus();
  await expect(page.getByRole('button', { name: 'SQL processing', exact: true })).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resource actions' })).toContainText('Reads:');
});

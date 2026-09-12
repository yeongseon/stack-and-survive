import { expect, test } from '@playwright/test';

test('indoor equipment remains decorative through camera movement resize and offscreen updates', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-environment', /indoor-data-center/);
  const original = JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  const box = (await surface.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 45);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 40, box.y + 65, { steps: 6 }); await page.mouse.up();
  await page.mouse.wheel(0, -80);
  const moved = JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  expect(moved.architecture).toEqual(original.architecture);
  expect(moved.camera).not.toEqual(original.camera);
  await page.getByRole('button', { name: 'Fit view', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Azure App Service', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure App Service');
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(surface).toHaveAttribute('data-environment', /indoor-data-center/);
  await page.screenshot({ path: info.outputPath('indoor-environment.png') });
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(surface).toHaveAttribute('data-tick', /[1-9]/);
  expect(errors).toEqual([]);
});

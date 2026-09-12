import { expect, test } from '@playwright/test';

test('offscreen rendering stops without pausing authoritative ticks and restores latest scene', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveCount(1, { timeout: 20000 });
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await page.locator('.help').evaluate(element => { (element as HTMLElement).style.minHeight = '100vh'; });
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-render-visible', 'false');
  const frames = await surface.getAttribute('data-frames');
  const before = Number(await page.getByTestId('elapsed').textContent());
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(surface).toHaveAttribute('data-tick', String(before + 5));
  expect(await surface.getAttribute('data-frames')).toBe(frames);
  expect(JSON.parse((await surface.getAttribute('data-flows'))!).length).toBeGreaterThan(0);
  expect(Number(await surface.getAttribute('data-packets'))).toBeGreaterThan(0);
  await surface.scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-render-visible', 'true');
  await expect.poll(async () => Number(await surface.getAttribute('data-frames'))).toBeGreaterThan(Number(frames));
  await expect(surface).toHaveAttribute('data-tick', String(before + 5));
  expect(errors).toEqual([]);
});

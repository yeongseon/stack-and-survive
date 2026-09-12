import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';

test('real filtering and cache effects stop on pause and respect reduced motion', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const a = baseline(3, true, true);
  const points = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 180 }, { x: 130, y: -180 }];
  a.resources.forEach((r, i) => Object.assign(r, points[i]));
  await page.goto('/'); await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), a);
  await page.reload(); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveCount(1, { timeout: 20000 });
  await expect(surface).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 76) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(surface).toHaveAttribute('data-effects', /cache-hit/); await expect(surface).toHaveAttribute('data-effects', /shield/);
  await page.getByRole('button', { name: 'Activate Emergency WAF', exact: true }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(surface).toHaveAttribute('data-effects', /emergency/);
  await surface.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('reduced-motion-emergency.png') });
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  await expect(surface).toHaveAttribute('data-effects', '[]');
  await expect(surface).toHaveAttribute('data-packets', '0');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(surface).toHaveAttribute('data-reduced-motion', 'false');
});
test('reduced motion keeps a static preparation completion cue', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1, { timeout: 20000 });
  await page.getByRole('button', { name: 'Inspect Azure App Service', exact: true }).click();
  await page.getByRole('button', { name: 'Provision instance', exact: true }).click();
  await expect(surface).toHaveAttribute('data-completions', /compute/, { timeout: 10000 });
  await expect(page.getByLabel('Initial App instances')).toHaveValue('2');
});

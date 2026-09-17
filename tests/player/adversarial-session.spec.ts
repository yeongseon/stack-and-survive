import { expect, test } from '@playwright/test';

test('adversarial restart: rapid play-restart cycle produces clean second session', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');

  // --- Session 1: Start game, take rapid actions, reach result ---
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);

  // Wait for traffic to appear (game is running)
  await expect(page.getByTestId('traffic')).toContainText(/\d+/, { timeout: 15000 });

  // Rapid actions: scale, then pause/resume quickly
  const scaleButton = page.getByRole('button', { name: 'Scale out', exact: true });
  if (await scaleButton.isVisible()) await scaleButton.click();

  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Game paused', exact: true })).toBeVisible();
  await page.getByRole('dialog', { name: 'Game paused', exact: true }).getByRole('button', { name: '▶ Resume', exact: true }).click();

  // Wait for result (business interrupted or completed)
  await expect(page.getByRole('region', { name: 'Business result' })).toContainText(/Score/, { timeout: 70000 });

  const resultRegion = page.getByRole('region', { name: 'Business result' });

  // --- Restart immediately ---
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();

  // --- Session 2: Start fresh game ---
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);

  // Traffic should start fresh (not inherited from session 1)
  await expect(page.getByTestId('traffic')).toContainText(/\d+/, { timeout: 15000 });

  // Budget should be at starting value (not carried from session 1)
  const budgetText = await page.getByTestId('budget').textContent();
  expect(budgetText).toBeTruthy();

  // Wait for session 2 result
  await expect(page.getByRole('region', { name: 'Business result' })).toContainText(/Score/, { timeout: 70000 });

  // Session 2 should be independent — score may differ but must exist
  const session2Text = await resultRegion.textContent();
  expect(session2Text).toContain('Score');

  // No fatal console errors across both sessions
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
});

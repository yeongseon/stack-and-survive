import { expect, test } from '@playwright/test';

test('build and manage separate placement from topology without changing runtime locks', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  const build = page.getByRole('button', { name: 'Build', exact: true });
  const manage = page.getByRole('button', { name: 'Manage', exact: true });
  await expect(build).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Build palette' })).toContainText('Running: 8 credits / min');
  await expect(page.getByRole('region', { name: 'Manage infrastructure' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true }).click();
  await manage.click(); await expect(manage).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Build palette' })).not.toBeVisible();
  await expect(page.getByRole('region', { name: 'Manage infrastructure' })).toBeVisible();
  await page.getByRole('button', { name: 'Connect resources', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Connection selection' })).toBeVisible();
  await build.click(); await expect(page.getByRole('region', { name: 'Connection selection' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cancel placement', exact: true })).toBeDisabled();
  await manage.click(); await page.getByRole('button', { name: 'Reset design', exact: true }).click();
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reset design', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Connect resources', exact: true })).toBeDisabled();
  await build.click(); await expect(page.getByRole('button', { name: 'Place Azure Managed Redis', exact: true })).toBeDisabled();
});

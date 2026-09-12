import { expect, test } from '@playwright/test';

test('mission reports provisional goals and real phase pressure events', async ({ page }, info) => {
  await page.goto('/'); await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  const goals = page.getByRole('region', { name: 'Scenario objectives' });
  await expect(goals).toContainText('Latency ≤ 300 ms');
  await expect(goals).toContainText('pending');
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 31) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  const events = page.getByRole('region', { name: 'Simulation event feed' });
  await expect(events).toContainText('App Service overloaded');
  await expect(events).toContainText('Traffic phase 2 / 4');
  await expect(goals).toContainText('at-risk');
  await expect(goals.locator('li').first()).toHaveAttribute('data-objective-state', 'pending');
  await page.getByTestId('world').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('mission-pressure.png') });
});

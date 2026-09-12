import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';

test('App pressure falls only when scale capacity actually activates', async ({ page }, info) => {
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  const advance = async (target: number) => {
    while (Number(await page.getByTestId('elapsed').textContent()) < target) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
    await expect(surface).toHaveAttribute('data-tick', String(target));
  };
  const queues = async () => JSON.parse((await surface.getAttribute('data-pressure-queues'))!) as { resource: string; count: number; severity: string; signal: string }[];
  await advance(34); const overloaded = (await queues())[0]; expect(overloaded.severity).toBe('critical'); expect(overloaded.count).toBeGreaterThan(8);
  await page.getByRole('button', { name: 'Scale out App', exact: true }).click(); await page.getByRole('button', { name: 'Confirm scale-out', exact: true }).click();
  await advance(42); expect((await queues())[0].count).toBe(overloaded.count);
  await advance(43); expect((await queues())[0].count).toBeLessThan(overloaded.count);
  await surface.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('app-pressure-recovered.png') });
  await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
  const frozen = await surface.getAttribute('data-pressure-queues'); await page.waitForTimeout(1200);
  expect(await surface.getAttribute('data-pressure-queues')).toBe(frozen);
});

test('SQL pressure is destination-local and Cache decreases eligible read pressure', async ({ page }, info) => {
  await page.goto('/'); await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), baseline(4));
  await page.reload(); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 76) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(surface).toHaveAttribute('data-tick', '76');
  const queues = JSON.parse((await surface.getAttribute('data-pressure-queues'))!);
  expect(queues[0].count).toBe(0); expect(queues[1]).toMatchObject({ signal: 'sql-read', severity: 'critical', droppedPerSecond: 12 });
  await page.getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Azure SQL', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('not a count of waiting requests');
  await surface.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('sql-pressure.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(surface).toHaveAttribute('data-reduced-motion', 'true');
  expect(JSON.parse((await surface.getAttribute('data-pressure-queues'))!)[1].count).toBe(queues[1].count);
  await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), baseline(4, true));
  await page.reload(); await expect(surface).toHaveCount(1);
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 76) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(surface).toHaveAttribute('data-tick', '76');
  const cached = JSON.parse((await surface.getAttribute('data-pressure-queues'))!);
  expect(cached[1].count).toBe(0); expect(cached[1].droppedPerSecond).toBe(0);
  expect(cached[1].utilization).toBeLessThan(queues[1].utilization);
});

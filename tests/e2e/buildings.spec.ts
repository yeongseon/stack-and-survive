import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';

test('five original building identities keep official badges separate and remain editable', async ({ page }, info) => {
  const architecture = baseline(3, true, true);
  const positions = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 180 }, { x: 130, y: -180 }];
  architecture.resources.forEach((r, i) => Object.assign(r, positions[i]));
  await page.goto('/');
  await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), architecture);
  await page.reload(); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-buildings', /layered-data-vault/, { timeout: 20000 });
  const states: { id: string; silhouette: string; completedModules: number }[] = JSON.parse((await surface.getAttribute('data-buildings'))!);
  expect(new Set(states.map(s => s.silhouette)).size).toBe(5);
  expect(states.find(s => s.id === 'compute')!.completedModules).toBe(3);
  await expect(page.getByLabel('Initial App instances')).toHaveValue('3');
  await expect(page.locator('.world-service-badges img')).toHaveCount(4);
  await page.getByTestId('world').scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('cloud-base-structures.png') });
  const box = (await surface.boundingBox())!;
  const nodes: { id: string; x: number; y: number }[] = JSON.parse((await surface.getAttribute('data-nodes'))!);
  const sql = nodes.find(n => n.id === 'database')!;
  await page.mouse.click(box.x + sql.x + 52, box.y + sql.y);
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure SQL');
  await page.getByRole('button', { name: 'Inspect Azure App Service', exact: true }).click();
  await page.getByRole('button', { name: 'Provision instance', exact: true }).click();
  await expect(surface).toHaveAttribute('data-buildings', /"pendingModule":true/);
  await expect(page.getByLabel('Initial App instances')).toHaveValue('4', { timeout: 10000 });
  await expect.poll(async () => {
    const data = JSON.parse((await surface.getAttribute('data-buildings'))!);
    return data.find((s: { id: string }) => s.id === 'compute').completedModules;
  }).toBe(4);
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThanOrEqual(1);
});

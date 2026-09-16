import { expect, test } from '@playwright/test';

test('light pools follow installed capacity and real pressure without illuminating empty pads', async ({ page }, info) => {
  await page.goto('/?tycoon'); await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  await page.getByText('Tycoon QA', { exact: true }).click();
  const step = page.getByRole('button', { name: 'Step one tick', exact: true });
  const lights = async () => JSON.parse((await surface.getAttribute('data-facility-lights'))!);
  await step.click();
  await expect.poll(async () => (await lights()).length).toBe(3);
  expect((await lights()).some((light: {id: string}) => light.id === 'cache' || light.id === 'edge')).toBe(false);
  { await page.getByRole('button', { name: 'Add Cache', exact: true }).focus(); await page.getByRole('button', { name: 'Add Cache', exact: true }).press('Enter'); };
  await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0); await step.click();
  await expect.poll(async () => (await lights()).find((light: {id: string}) => light.id === 'cache')?.mode).toBe('pending');
  for (let i = 0; i < 5; i++) await step.click();
  await expect.poll(async () => (await lights()).find((light: {id: string}) => light.id === 'cache')?.mode).toBe('healthy');
  while (Number(await page.getByTestId('elapsed').textContent()) < 31) await step.click();
  await expect.poll(async () => (await lights()).find((light: {id: string}) => light.id === 'compute')?.mode).toBe('critical');
  const snapshot = await lights();
  expect(snapshot.every((light: {glowDepth: number; shadowDepth: number}) => light.glowDepth < 100 && light.shadowDepth < 100)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  await expect.poll(async () => (await lights()).find((light: {id: string}) => light.id === 'compute')?.mode).toBe('critical');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: info.outputPath('real-pressure-lighting.png') });
});

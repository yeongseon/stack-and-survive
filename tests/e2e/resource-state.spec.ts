import { expect, test } from '@playwright/test';

test('App bays show only real active servers before during and after expansion', async ({ page }, info) => {
  await page.goto('/?tycoon'); await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 10000 });
  await page.getByText('Tycoon QA', { exact: true }).click();
  const step = page.getByRole('button', { name: 'Step one tick', exact: true }); await step.click();
  const surface = page.locator('[data-renderer="ready"]');
  const app = async () => JSON.parse((await surface.getAttribute('data-sprite-views'))!).find((s: { id: string }) => s.id === 'compute');
  await expect.poll(async () => (await app()).bays).toEqual(['active', 'available', 'locked', 'locked']);
  expect((await app()).modules).toHaveLength(1);
  await page.getByRole('button', { name: /App capacity/ }).click();
  await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
  await expect.poll(async () => (await app()).bays).toEqual(['active', 'queued', 'locked', 'locked']);
  expect((await app()).modules).toHaveLength(1);
  await step.click();
  await expect.poll(async () => (await app()).bays).toEqual(['active', 'construction', 'locked', 'locked']);
  expect((await app()).modules).toHaveLength(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('app-construction-bay.png') });
  for (let i = 0; i < 8; i++) await step.click();
  await expect.poll(async () => (await app()).bays).toEqual(['active', 'active', 'available', 'locked']);
  expect((await app()).modules).toHaveLength(2);
  await page.screenshot({ path: info.outputPath('app-two-active-bays.png') });
});

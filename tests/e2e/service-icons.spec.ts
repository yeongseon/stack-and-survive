import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

const hashes = {
  'app-service.svg': '529d83fc80637a96b6d27f6cfac7536e1c5f9b1b67f58aef4e2e3d6f47fd4925',
  'azure-sql.svg': 'a26124a2b188ccf910520c935c726f7364e0f5935d7a4319ebcab9c80a40e475',
  'managed-redis.svg': 'fa4b65d5946115084be1e842ecb934ab7f01b3019a450d19640ea3c3eaf9bab0',
  'application-gateway.svg': '531e668e47cf61872b2811ec67dcc103cee2ecc1d272f07132d6196d68ba6c19',
};

test('served official assets match archive bytes and load as separate identity images', async ({ page, request }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const [name, expected] of Object.entries(hashes)) {
    const response = await request.get(`/assets/azure-icons/${name}`);
    expect(response.ok()).toBe(true);
    const bytes = await response.body();
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected);
    expect(bytes.toString()).not.toMatch(/<script|<foreignObject|https?:\/\/(?!www.w3.org)/i);
  }
  await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
  const palette = page.getByRole('region', { name: 'Build palette' });
  await expect(palette.locator('img')).toHaveCount(4);
  for (const image of await palette.locator('img').all()) {
    await expect.poll(async () => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const css = await image.evaluate(e => { const s = getComputedStyle(e); return { transform: s.transform, filter: s.filter, opacity: s.opacity, ratio: e.clientWidth / e.clientHeight }; });
    expect(css).toEqual({ transform: 'none', filter: 'none', opacity: '1', ratio: 1 });
  }
  await expect(page.locator('.world-service-badges img')).toHaveCount(2);
  await page.getByRole('button', { name: 'Inspect Azure App Service', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Selected resource' }).locator('img')).toHaveAttribute('src', '/assets/azure-icons/app-service.svg');
  await page.getByTestId('world').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('azure-identity.png') });
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 50) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.getByTestId('result-score')).toHaveText('1,073');
  await expect(page.getByRole('region', { name: 'Scenario result' }).locator('.result-service img')).toHaveAttribute('src', '/assets/azure-icons/app-service.svg');
  expect(errors).toEqual([]);
});

test('missing icons show neutral fallbacks without disabling gameplay or labels', async ({ page }) => {
  await page.route('**/assets/azure-icons/*.svg', route => route.fulfill({ status: 404, body: 'Not found' }));
  await page.goto('/');
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
  await expect(page.getByRole('region', { name: 'Build palette' }).locator('[data-fallback="true"]')).toHaveCount(4);
  await expect(page.locator('.world-service-badges [data-fallback="true"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Inspect Azure SQL', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Selected resource' })).toContainText('Azure SQL');
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await expect(page.getByTestId('elapsed')).toHaveText('1', { timeout: 5000 });
});

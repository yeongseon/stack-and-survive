import { expect, test } from '@playwright/test';

test('project-path Pages build loads real facilities and never exposes QA', async ({ page }, info) => {
  const errors: string[] = [], failures: string[] = [], v3Assets = new Set<string>();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  page.on('response', r => { if (r.url().includes('/assets/v3/')) v3Assets.add(new URL(r.url()).pathname); });
  await page.goto('./?debug=true&mode=qa');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
  expect(v3Assets.size).toBe(61);
  expect([...v3Assets].every(path => path.startsWith('/stack-and-survive/assets/v3/'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  { await page.getByRole('button', { name: 'Add Cache', exact: true }).focus(); await page.getByRole('button', { name: 'Add Cache', exact: true }).press('Enter'); };
  await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('slot-cache')).toContainText('Active');
  for (const image of await page.locator('.world-service-badges img').all()) {
    await expect(image).toHaveAttribute('src', /^\/stack-and-survive\/assets\//);
    expect(await image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await expect(page.getByTestId('diagnostics')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Step one tick', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await page.screenshot({ path: info.outputPath('pages-game.png') });
  expect(errors).toEqual([]); expect(failures).toEqual([]);
});

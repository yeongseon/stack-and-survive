import { expect, test } from '@playwright/test';

const title = 'Stack & Survive — Cloud Architecture Strategy Game';
test('share metadata is available without JavaScript and approved artwork resolves at the project path', async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /three-minute cloud architecture/);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#102a39');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://yeongseon.github.io/stack-and-survive/');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
    const image = new URL((await page.locator('meta[property="og:image"]').getAttribute('content'))!);
    expect(image.origin).toBe('https://yeongseon.github.io');
    expect(image.pathname).toBe('/stack-and-survive/assets/v3/azure-sql.png');
    const served = await request.get(image.pathname);
    expect(served.ok()).toBe(true);
    expect(served.headers()['content-type']).toContain('image/png');
    const png = await served.body();
    expect(png.readUInt32BE(16)).toBe(640); expect(png.readUInt32BE(20)).toBe(640);
    const favicon = (await page.locator('link[rel="icon"]').getAttribute('href'))!;
    expect(favicon).toMatch(/^data:image\/svg\+xml,/);
    expect(decodeURIComponent(favicon)).toContain('viewBox=\'0 0 64 64\'');
    expect(decodeURIComponent(favicon)).not.toMatch(/<script|<image|foreignObject/i);
  } finally { await context.close(); }
});

test('project entry reload and explicit 404 recovery preserve safe production boundaries', async ({ page }) => {
  await page.goto('./index.html?debug=true&mode=qa');
  await expect(page).toHaveTitle(title);
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
  await expect(page.getByTestId('diagnostics')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
  await page.goto('./404.html');
  await expect(page).toHaveTitle('Page not found — Stack & Survive');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('script')).toHaveCount(0);
  await page.getByRole('link', { name: 'Return to the game' }).click();
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
});

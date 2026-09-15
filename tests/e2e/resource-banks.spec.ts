import { expect, test } from '@playwright/test';

test('resource anatomy follows live construction, separate SQL pressure and actual boost state', async ({ page }, info) => {
  test.setTimeout(180000);
  await page.goto('/?tycoon'); await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  await page.getByText('Tycoon QA', { exact: true }).click();
  const step = page.getByRole('button', { name: 'Step one tick', exact: true });
  const state = async () => JSON.parse((await surface.getAttribute('data-resource-states'))!);
  const banks = async (id: string) => JSON.parse((await surface.getAttribute('data-facility-banks'))!).find((r: { id: string }) => r.id === id)?.banks ?? [];
  const edgeCue = async () => JSON.parse((await surface.getAttribute('data-facility-banks'))!).find((r: { id: string }) => r.id === 'edge')?.cue;
  await step.click();
  await expect.poll(async () => (await state()).cache.lifecycle).toBe('absent');
  expect(await banks('cache')).toEqual([]);
  for (const name of ['Add Cache', 'Add Protected Edge', '+ App capacity']) {
    await page.getByRole('button', { name, exact: true }).focus();
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
  }
  await step.click();
  await expect.poll(async () => (await state()).cache.lifecycle).toBe('provisioning');
  expect(await banks('cache')).toEqual([]);
  await expect(page.getByRole('button', { name: 'Add Cache', exact: true })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: info.outputPath('resource-construction.png') });
  for (let i = 0; i < 8; i++) await step.click();
  await expect.poll(async () => (await state()).cache.lifecycle).toBe('active');
  await expect.poll(async () => (await banks('cache')).length).toBe(3);
  await expect.poll(async () => (await state()).app.bays.filter((b: string) => b === 'active').length).toBe(2);
  for (const count of [3, 4]) {
    { await page.getByRole('button', { name: '+ App capacity', exact: true }).focus(); await page.getByRole('button', { name: '+ App capacity', exact: true }).press('Enter'); };
    await expect(page.getByRole('button', { name: 'Confirm expansion', exact: true })).toHaveCount(0);
    for (let i = 0; i < 9; i++) await step.click();
    await expect.poll(async () => (await state()).app.bays.filter((b: string) => b === 'active').length).toBe(count);
  }
  await page.screenshot({ path: info.outputPath('four-active-modules.png') });
  while (Number(await page.getByTestId('elapsed').textContent()) < 76) await step.click();
  await expect(surface).toHaveAttribute('data-tick', '76');
  const measured = await state();
  expect((await banks('database')).map((b: { state: string }) => b.state)).toEqual([measured.sql.readPressure, measured.sql.writePressure]);
  await page.getByTestId('slot-edge').getByRole('button').focus(); await page.getByTestId('slot-edge').getByRole('button').press('Enter');
  await page.getByRole('button', { name: 'Boost filtering · 8 cr', exact: true }).click();
  await expect.poll(edgeCue).toBe('request-dots');
  await step.click(); await expect.poll(async () => (await state()).edge.boost).toBe('scheduled');
  await expect.poll(edgeCue).toBe('activation-clock');
  expect((await state()).edge.showBoostEffect).toBe(false);
  await step.click(); await expect.poll(async () => (await state()).edge.boost).toBe('active');
  await expect.poll(edgeCue).toBe('boost-bars');
  expect((await state()).edge.showBoostEffect).toBe(true);
  await page.getByRole('button', { name: 'Close resource', exact: true }).click();
  await page.screenshot({ path: info.outputPath('active-gateway-banks.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await state()).canAnimate).toBe(false);
  await expect.poll(edgeCue).toBe('boost-bars');
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await expect.poll(async () => (await state()).live).toBe(false);
  const frozen = await surface.getAttribute('data-facility-banks');
  await step.click(); expect(await surface.getAttribute('data-facility-banks')).toBe(frozen);
  expect((await state()).edge.showBoostEffect).toBe(false);
  await page.getByRole('button', {name:'Fit architecture',exact:true}).click();
  for (const width of [740, 844, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width<900?390:900 });
    await page.evaluate(() => window.scrollTo(0,0));
    await expect.poll(async () => Math.round((await surface.boundingBox())!.width)).toBe(width);
    await expect.poll(async () => Math.round((await surface.boundingBox())!.height)).toBe(width<900?390:900);
    const frame=Number(await surface.getAttribute('data-frames'));
    await expect.poll(async()=>Number(await surface.getAttribute('data-frames'))).toBeGreaterThan(frame);
    for (const badge of await page.locator('.world-service-badges .service-icon').all()) {
      await expect(badge).toBeVisible();
      const a = (await badge.boundingBox())!, b = (await surface.boundingBox())!;
      expect(a.y).toBeGreaterThanOrEqual(b.y); expect(a.y+a.height).toBeLessThanOrEqual(b.y+b.height);
    }
    await surface.screenshot({ path: info.outputPath(`installed-facilities-${width}.png`) });
  }
});

test('player resource bank state survives missing SQL texture and badge', async ({ page }) => {
  await page.route('**/assets/buildings/azure-sql.png', route => route.abort());
  await page.route('**/assets/azure-icons/azure-sql.svg', route => route.abort());
  await page.goto('/?tycoon'); await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  await page.getByText('Tycoon QA', { exact: true }).click();
  await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.locator('.world-service-badges [data-service="database"]')).toHaveAttribute('data-fallback', 'true');
  await expect.poll(async () => JSON.parse((await surface.getAttribute('data-facility-banks'))!).find((r: { id: string }) => r.id === 'database').banks.length).toBe(2);
  { await page.getByRole('button', { name: 'SQL processing', exact: true }).focus(); await page.getByRole('button', { name: 'SQL processing', exact: true }).press('Enter'); };
  await expect(page.getByRole('region', { name: 'Resource actions' })).toContainText('Writes:');
});

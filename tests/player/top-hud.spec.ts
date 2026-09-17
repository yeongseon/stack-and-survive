import { expect, test, type Page } from '@playwright/test';

async function expectContainedHud(page: Page, maxHeight: number) {
  const geometry = await page.locator('.game-command-hud').evaluate(hud => {
    const box = hud.getBoundingClientRect();
    const strip = hud.querySelector('[aria-label="Business status"]')!.getBoundingClientRect();
    const items = [...hud.querySelector('[aria-label="Business status"]')!.children].map(item => {
      const rect = item.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, overflow: item.scrollWidth > item.clientWidth + 1 };
    });
    const brand = hud.querySelector('h1')!.getBoundingClientRect();
    const actions = hud.querySelector('nav')!.getBoundingClientRect();
    return { height: box.height, bottom: box.bottom, stripTop: strip.top, stripBottom: strip.bottom, items,
      brandCenter: brand.height ? brand.top + brand.height / 2 : null, actionsCenter: actions.top + actions.height / 2 };
  });
  expect(geometry.height).toBeLessThanOrEqual(maxHeight);
  expect(geometry.items).toHaveLength(6);
  for (const item of geometry.items) {
    expect(item.top).toBeGreaterThanOrEqual(geometry.stripTop);
    expect(item.bottom).toBeLessThanOrEqual(geometry.stripBottom + 1);
    expect(item.bottom).toBeLessThanOrEqual(geometry.bottom);
    expect(item.overflow).toBe(false);
  }
  for (let index = 1; index < geometry.items.length; index++) {
    expect(geometry.items[index].left).toBeGreaterThanOrEqual(geometry.items[index - 1].right);
  }
  if (geometry.brandCenter !== null) expect(Math.abs(geometry.brandCenter - geometry.actionsCenter)).toBeLessThan(2);
  await expect(page.getByTestId('mission-clock')).toBeVisible();
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }, { width: 667, height: 375 }]) {
  test(`two-row HUD contains every metric and preserves controls at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.getByTestId('traffic')).toContainText('100');
    const skip = page.getByRole('button', { name: 'Skip guide', exact: true });
    if (await skip.isVisible()) await skip.click();
    await expectContainedHud(page, 130);
    if (viewport.width === 1920) {
      const strip = await page.getByRole('region', { name: 'Business status' }).boundingBox();
      expect(strip!.width).toBeLessThanOrEqual(1400);
      expect(strip!.x).toBeGreaterThan(200);
    }
    await page.screenshot({ path: info.outputPath('normal.png') });
    const learn = page.getByRole('button', { name: 'ⓘ Learn', exact: true });
    await learn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(learn).toBeFocused();
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    const pause = page.getByRole('dialog', { name: 'Game paused', exact: true });
    const clock = await page.getByTestId('mission-clock').innerText();
    await page.waitForTimeout(1100);
    await expect(page.getByTestId('mission-clock')).toHaveText(clock);
    await pause.getByRole('button', { name: '▶ Resume', exact: true }).click();
    if (viewport.width === 1440) {
      const build = async (name: string) => { const button = page.getByRole('button', { name, exact: true }); await button.focus(); await button.press('Enter'); };
      await build('Add Cache'); await build('Add Protected Edge'); await build('+ App capacity');
      await expect(page.getByTestId('next-wave')).toHaveClass(/imminent/, { timeout: 30000 });
      await expectContainedHud(page, 130);
      await page.screenshot({ path: info.outputPath('imminent.png') });
      await expect(page.getByRole('button', { name: '+ App capacity', exact: true })).toContainText('2/4 active');
      await build('+ App capacity');
      await expect(page.getByTestId('traffic')).toContainText('440', { timeout: 70000 });
      await expect(page.locator('.mission-phase')).toContainText('Bot attack');
      await expectContainedHud(page, 130);
      await page.screenshot({ path: info.outputPath('bot-attack.png') });
      await page.setViewportSize({ width: 844, height: 390 });
      await expectContainedHud(page, 130);
      await page.screenshot({ path: info.outputPath('bot-attack-landscape.png') });
    }
    if (viewport.width === 844) {
      const risk = page.getByTestId('mission-risk');
      await expect(risk).toBeVisible({ timeout: 35000 });
      const missionBox = await page.getByRole('region', { name: 'Operation progress' }).boundingBox();
      const riskBox = await risk.boundingBox();
      const controlsBox = await page.getByRole('navigation', { name: 'Game controls' }).boundingBox();
      expect(riskBox!.x + riskBox!.width).toBeLessThanOrEqual(controlsBox!.x);
      expect(missionBox!.y + missionBox!.height).toBeLessThanOrEqual(58);
      expect(await risk.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await expectContainedHud(page, 130);
      await page.screenshot({ path: info.outputPath('service-risk-landscape.png') });
    }
    expect(errors).toEqual([]);
  });
}

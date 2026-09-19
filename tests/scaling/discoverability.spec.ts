import { expect, test } from '@playwright/test';

for (const width of [1440, 667]) {
  test(`visible scaling controls work with ${width === 667 ? 'touch' : 'mouse'} at ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 667 ? 375 : 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const activate = async (name: string) => {
      const button = page.getByRole('button', { name, exact: true });
      if (width === 667) await button.tap(); else await button.click();
    };
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await activate('Start Game');
    await expect(page.getByTestId('traffic')).toContainText('100');
    await activate('Skip guide');
    const cache = page.getByRole('button', { name: 'Deploy Cache — reduces SQL reads', exact: true });
    await cache.focus(); await cache.press('Enter');
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).focus();
    const appShortcut = page.getByRole('button', { name: 'Manage App scaling', exact: true });
    const sqlShortcut = page.getByRole('button', { name: 'Manage SQL scaling', exact: true });
    for (const button of [appShortcut, sqlShortcut]) {
      await expect(button).toBeInViewport();
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(await button.evaluate(el => {
        const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      })).toBe(true);
    }
    await page.screenshot({ path: info.outputPath('compact-sql-and-controls.png') });
    await activate('Manage App scaling');
    const card = page.getByRole('region', { name: 'Resource actions', exact: true });
    await expect(card.getByRole('button', { name: '− Instance', exact: true })).toBeDisabled();
    await expect(card.getByRole('button', { name: '− Instance', exact: true })).toHaveAccessibleDescription(/minimum|one|1/i);
    await activate('+ Instance');
    await expect(card.locator('.scaling-status')).toContainText(/queued|Expanding/);
    await expect(card).toContainText('2/4 instances');
    await activate('− Instance');
    await expect(card.locator('.scaling-status')).toContainText(/queued|Draining/);
    await expect(card).toContainText('1/4 instances');
    await activate('↑ App tier');
    await expect(card).toContainText('Tier 2 · Standard II');
    await expect(card).toContainText('240 req/s');
    await activate('↓ App tier');
    await expect(card).toContainText('Tier 1 · Standard I');
    await activate('+ Instance');
    await expect(card).toContainText('2/4 instances');
    await activate('Close resource');
    await expect(appShortcut).toBeFocused();
    await activate('Manage SQL scaling');
    await expect(card.getByRole('button', { name: '↓ SQL tier', exact: true })).toBeDisabled();
    await activate('↑ SQL tier');
    await expect(card.locator('.scaling-status')).toContainText(/queued|Changing tier/);
    await expect(card).toContainText('Tier 2 · General Purpose II');
    await page.screenshot({ path: info.outputPath('sql-tier-two.png') });
    await activate('↓ SQL tier');
    await expect(card).toContainText('Tier 1 · General Purpose I');
    await activate('Ⅱ Pause'); await activate('Inspect paused world');
    await expect(card.getByRole('button', { name: '↑ SQL tier', exact: true })).toBeDisabled();
    await expect(card.getByRole('button', { name: '↑ SQL tier', exact: true })).toHaveAccessibleDescription(/running|paused/i);
    expect(errors).toEqual([]);
  });
}
test.use({ hasTouch: true });

import { expect, test } from '@playwright/test';
import workload from '../../packages/scenarios/src/black-friday.json' with { type: 'json' };

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 844, height: 390 }]) {
  test(`mission is visible before Learn and first waves are understandable at ${viewport.width}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: viewport.width === 844 ? 'reduce' : 'no-preference' });
    await page.goto('/');
    const brief = page.getByRole('region', { name: 'Mission briefing' });
    await expect(brief).toContainText('Black Friday');
    await expect(brief).toContainText(`${workload.duration} seconds`);
    const final = workload.traffic[workload.traffic.length - 1];
    await expect(brief).toContainText(`${final.rps} req/s · ${Math.round(final.botRatio * 100)}% bots`);
    await expect(brief).toContainText('App · Cache · Protected Edge');
    const start = page.getByRole('button', { name: 'Start Game', exact: true });
    for (const element of [brief, start]) {
      const bounds = await element.boundingBox();
      if (!bounds) throw new Error('Missing title element');
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
    const options = page.getByRole('combobox', { name: 'Challenge level' }).locator('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(1)).toHaveJSProperty('disabled', true);
    await expect(options.nth(2)).toHaveJSProperty('disabled', true);
    await page.screenshot({ path: info.outputPath('title.png') });
    await start.click();
    await expect(page.locator('.welcome-countdown')).toContainText(`${workload.traffic[0].rps} req/s`, { timeout: 30000 });
    await expect(page.locator('.welcome-countdown')).toContainText(`${final.rps} req/s`);
    await page.screenshot({ path: info.outputPath('countdown.png') });
    await expect(page.getByTestId('traffic')).toContainText('100');
    const guide = page.getByRole('region', { name: 'World guide' });
    await expect(guide).toContainText('Internet intake');
    await expect(guide).toContainText('Next');
    await page.screenshot({ path: info.outputPath('guide.png') });
    await guide.getByRole('button', { name: 'Skip guide', exact: true }).click();
    for (const name of ['Add Cache', 'Add Protected Edge', '+ App capacity']) {
      const button = page.getByRole('button', { name, exact: true });
      await button.focus(); await button.press('Enter');
    }
    await expect(page.getByRole('button', { name: '+ App capacity', exact: true })).toContainText('2/4 active');
    await page.getByRole('button', { name: '+ App capacity', exact: true }).press('Enter');
    const notice = page.getByTestId('phase-arrival');
    await expect(notice).toContainText('Traffic spike', { timeout: 30000 });
    await expect(notice).toContainText('260 req/s');
    const announcement = page.getByRole('status', { name: 'Phase arrival', exact: true });
    await expect(announcement).toHaveCount(1);
    await expect(announcement).toHaveAttribute('aria-live', 'polite');
    await expect(announcement.locator('button, a, input, [tabindex]')).toHaveCount(0);
    expect(await notice.evaluate(el => getComputedStyle(el.parentElement ?? el).pointerEvents)).toBe('none');
    if (viewport.width === 844) expect(await notice.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await page.screenshot({ path: info.outputPath('spike.png') });
    await expect(notice).toHaveCount(0, { timeout: 5000 });
    await expect(notice).toContainText('Recovery window', { timeout: 30000 });
    await page.screenshot({ path: info.outputPath('recovery.png') });
    await expect(notice).toContainText('Bot attack', { timeout: 20000 });
    await expect(notice).toContainText('35% bots');
    await expect(notice).toContainText('Red packets');
    await page.screenshot({ path: info.outputPath('bots.png') });
  });
}

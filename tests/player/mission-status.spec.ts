import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }, { width: 667, height: 375 }]) {
  test(`mission progress stays readable and freezes on pause at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    const mission = page.getByRole('region', { name: 'Operation progress' });
    await expect(page.getByTestId('traffic')).toContainText('100');
    await expect(mission).toContainText('Opening traffic');
    await expect(mission).toContainText('Phase 1/8');
    await expect(mission.getByRole('progressbar')).toHaveAttribute('max', '180');
    const missionBox = await mission.boundingBox();
    const controlsBox = await page.getByRole('navigation', { name: 'Game controls' }).boundingBox();
    const readingsBox = await page.getByRole('region', { name: 'Business status' }).boundingBox();
    expect(missionBox).not.toBeNull(); expect(controlsBox).not.toBeNull(); expect(readingsBox).not.toBeNull();
    expect(missionBox!.y).toBeGreaterThanOrEqual(0);
    expect(missionBox!.x + missionBox!.width).toBeLessThanOrEqual(controlsBox!.x);
    expect(missionBox!.y + missionBox!.height).toBeLessThanOrEqual(readingsBox!.y);
    expect(readingsBox!.x + readingsBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(await page.locator('body').evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: info.outputPath('mission-opening.png') });
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
    const clock = await page.getByTestId('mission-clock').textContent();
    await expect(mission).toContainText('Paused');
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('mission-clock')).toHaveText(clock!);
    await expect(mission).toHaveAttribute('data-held', 'true');
    await page.getByRole('button', { name: '▶ Resume', exact: true }).click();
    await expect(mission).toContainText('Live');
    if (viewport.width === 1440) {
      await expect(mission).toContainText('Phase 2/8', { timeout: 35000 });
      await expect(mission.locator('.mission-phase')).toContainText('Traffic spike');
      await expect(page.getByTestId('traffic')).toContainText('260');
      await expect(page.getByTestId('mission-risk')).toContainText('if losses continue');
      await expect(mission.locator('.mission-phase strong')).toHaveCSS('animation-name', 'none');
      await page.screenshot({ path: info.outputPath('mission-spike.png') });
    }
    expect(errors).toEqual([]);
  });
}

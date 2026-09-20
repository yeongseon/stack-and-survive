import { expect, test, type Page } from '@playwright/test';
async function start(page: Page) {
  await page.goto('/'); await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await expect(page.locator('.welcome-countdown')).toHaveCount(0);
  const skip = page.getByRole('button', { name: 'Skip guide', exact: true });
  if (await skip.count()) await skip.click();
}
test('four-step tutorial completion persists and can be reopened from Help', async ({ page }) => {
  await page.goto('/');
  const invite = page.getByRole('button', { name: 'Explore Azure architecture · 4 steps', exact: true });
  await invite.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Build an Azure architecture', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.locator('.azure-tutorial-map')).toHaveAttribute('data-highlight', 'tiers');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Finish tutorial', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.azure-tutorial.v1'))).toBe('completed');
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Replay Azure tutorial', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.reload(); await expect(page.getByRole('button', { name: 'Replay Azure tutorial', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  const help = page.getByRole('dialog');
  await help.getByRole('button', { name: 'Replay Azure tutorial', exact: true }).click();
  await expect(help).toContainText('1 / 4');
  await help.getByRole('button', { name: 'Skip tutorial', exact: true }).click();
  await expect(help.getByRole('button', { name: 'Replay Azure tutorial', exact: true })).toBeFocused();
  await help.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeEnabled();
});

test('tutorial can be skipped and navigated on 320px and landscape without starting gameplay', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport); await page.goto('/');
    await page.getByRole('button', { name: /Explore Azure architecture|Replay Azure tutorial/ }).first().click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await page.getByRole('button', { name: 'Skip tutorial', exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.azure-tutorial.v1'))).toBe('skipped');
    const tutorial = page.getByRole('region', { name: 'Azure architecture tutorial', exact: true }).first();
    expect(await tutorial.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const bounds = (await tutorial.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    await page.getByRole('button', { name: 'Start Game', exact: true }).click({ trial: true });
    await expect(page.getByRole('region', { name: 'Business status' })).toHaveCount(0);
  }
});

test('resource catalog uses real status, unchanged actions and accessible keyboard selection', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page);
  const guide = page.getByRole('button', { name: 'Azure service guide', exact: true });
  await expect(guide).toHaveAccessibleDescription('Resource roles & status');
  await guide.click();
  const panel = page.getByRole('region', { name: 'Azure services panel', exact: true });
  await expect(panel.getByRole('button', { name: 'Close services', exact: true })).toBeFocused();
  await expect(panel).toContainText('Use App scaling or SQL scaling');
  await expect(panel).toContainText('explicit action buttons below change the game');
  await expect(page.locator('[data-facility="compute"]')).toContainText('1/4 active');
  await expect(page.locator('[data-facility="compute"] .facility-build-track')).toHaveCount(0);
  const app = panel.getByRole('button', { name: /^Azure App Service,/ });
  expect(await app.evaluate(el => ({ animation: getComputedStyle(el).animationName, duration: getComputedStyle(el).transitionDuration }))).toEqual({ animation: 'none', duration: '0s' });
  await expect(panel).not.toContainText('Offline · Not deployed');
  await expect(app).toContainText('1 instance');
  await expect(app.locator('img')).toHaveJSProperty('naturalWidth', 18);
  await panel.getByRole('button', { name: 'Scale out App', exact: true }).click();
  await expect(page.locator('.facility-plaques')).toContainText('2/4 active', { timeout: 15_000 });
  await app.focus(); await page.keyboard.press('Enter');
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Resource actions', exact: true })).toContainText('Azure App Service');
  await page.getByRole('button', { name: 'Close resource', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Azure service guide', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Traffic key', exact: false }).click();
  await expect(page.getByRole('region', { name: 'Traffic direction and legend' })).toContainText('database writes');
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  await page.getByRole('button', { name: 'Azure service guide', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Scale out App', exact: true })).toBeDisabled();
  await expect(panel).toContainText('Paused · last measured state');
  await panel.getByText('Other Azure concepts · not selectable', { exact: true }).click();
  await expect(panel).toContainText('Azure Front Door');
  await expect(panel.getByRole('button', { name: /Deploy Azure Front Door|Deploy Azure Monitor/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('responsive service drawer preserves HUD, camera and pause access', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page);
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 844, height: 390 }, { width: 700, height: 390 }]) {
    await page.setViewportSize(viewport);
    const guide = page.getByRole('button', { name: 'Azure service guide', exact: true });
    await expect(guide).toHaveAccessibleDescription('Resource roles & status');
    await expect(guide).toBeInViewport();
    expect((await guide.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: info.outputPath(`guide-closed-${viewport.width}.png`) });
    await guide.click();
    const panel = page.getByRole('region', { name: 'Azure services panel', exact: true });
    const bounds = (await panel.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 55);
    await expect(page.getByRole('region', { name: 'Business status' })).toBeVisible();
    await page.getByRole('button', { name: 'Fit architecture', exact: true }).click({ trial: true });
    await page.getByRole('button', { name: '▶ Resume', exact: true }).click({ trial: true });
    await panel.getByRole('button', { name: 'Close services', exact: true }).focus(); await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Azure service guide', exact: true })).toBeFocused();
  }
});

test('unchanged no-upgrade failure result and restart remain accessible', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page);
  const result = page.getByRole('region', { name: 'Business result', exact: true });
  await expect(result).toBeVisible({ timeout: 55_000 });
  await expect(result).toContainText('Score 810');
  await result.getByRole('button', { name: 'Play again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test('missing service icon retains adjacent name and usable resource controls', async ({ page }) => {
  await page.route('**/assets/azure-icons/app-service.svg', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page);
  await page.getByRole('button', { name: 'Azure service guide', exact: true }).click();
  const node = page.getByRole('button', { name: /^Azure App Service,/ });
  await expect(node.locator('.azure-node-fallback')).toHaveText('APP');
  await expect(node).toContainText('Azure App Service');
  await node.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resource actions', exact: true })).toBeVisible();
});

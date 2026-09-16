import { expect, test } from '@playwright/test';

test('demo readiness: empty board → first entry → second run updates rank → refresh persists', async ({ page }) => {
  // Clean state
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('stack-and-survive.leaderboard.v1');
    localStorage.removeItem('stack-and-survive.nickname');
    localStorage.removeItem('stack-and-survive.history.balance-0.3.v1');
  });

  // --- Run 1: first entry on empty board ---
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
  await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 200000 });

  const leaderboard = page.locator('[aria-label="Leaderboard"]');
  await expect(leaderboard).toBeVisible();

  const heading = await page.locator('.report-heading h2').textContent();
  const objectiveMet = heading === 'CHALLENGE CLEAR';
  const score1 = Number(await page.locator('.result-score strong').textContent());

  if (objectiveMet) {
    // Enter nickname and join
    await leaderboard.getByRole('button', { name: 'Enter name' }).click();
    await leaderboard.getByRole('textbox', { name: 'Nickname' }).fill('DEMO');
    await leaderboard.getByRole('button', { name: 'Join' }).click();

    // Verify first entry
    await expect(leaderboard.locator('.leaderboard-rank-badge')).toContainText('#1');
    await expect(leaderboard.locator('.leaderboard-entry')).toHaveCount(1);
    await expect(leaderboard.locator('.leaderboard-name').first()).toContainText('DEMO');
    await expect(leaderboard.getByText('NEW PERSONAL BEST')).toBeVisible();

    // Verify Copy result button exists
    await expect(leaderboard.getByRole('button', { name: 'Copy result' })).toBeVisible();

    // Verify device disclaimer
    await expect(leaderboard.getByText('Local scores')).toBeVisible();
  }

  // --- Run 2: second entry changes rank ---
  await page.getByRole('button', { name: 'Play again' }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
  await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 200000 });

  const board2 = page.locator('[aria-label="Leaderboard"]');
  await expect(board2).toBeVisible();
  const score2 = Number(await page.locator('.result-score strong').textContent());
  const heading2 = await page.locator('.report-heading h2').textContent();
  const met2 = heading2 === 'CHALLENGE CLEAR';

  if (objectiveMet && met2) {
    // Should have 2 entries now (or 1 if duplicate prevention)
    const entryCount = await board2.locator('.leaderboard-entry').count();
    expect(entryCount).toBeGreaterThanOrEqual(1);
    expect(entryCount).toBeLessThanOrEqual(2);

    // If scores differ, ranking should reflect it
    if (entryCount === 2) {
      const firstScore = Number(await board2.locator('.leaderboard-score').first().textContent());
      const secondScore = Number(await board2.locator('.leaderboard-score').nth(1).textContent());
      expect(firstScore).toBeGreaterThanOrEqual(secondScore);
    }

    // Check PB status
    if (score2 > score1) {
      await expect(board2.getByText('NEW PERSONAL BEST')).toBeVisible();
    }
  }

  // --- Refresh persistence ---
  await page.reload();
  await page.goto('/');

  // Verify nickname persisted
  const storedNick = await page.evaluate(() => localStorage.getItem('stack-and-survive.nickname'));
  if (objectiveMet) expect(storedNick).toBe('DEMO');

  // Verify leaderboard data persisted
  const storedBoard = await page.evaluate(() => localStorage.getItem('stack-and-survive.leaderboard.v1'));
  if (objectiveMet) {
    expect(storedBoard).toBeTruthy();
    const parsed = JSON.parse(storedBoard!);
    expect(parsed.entries.length).toBeGreaterThanOrEqual(1);
  }
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }]) {
  test(`leaderboard is visible and usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => { localStorage.removeItem('stack-and-survive.leaderboard.v1'); localStorage.removeItem('stack-and-survive.nickname'); });
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    if (viewport.width < 900 && viewport.height > viewport.width) {
      await expect(page.getByRole('dialog', { name: 'Landscape play required' })).toBeVisible();
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await page.getByRole('button', { name: 'Continue in landscape', exact: true }).click();
    }
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
    await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 200000 });

    const board = page.locator('[aria-label="Leaderboard"]');
    await expect(board).toBeVisible();

    // Leaderboard should not overflow viewport
    const bounds = (await board.boundingBox())!;
    const vw = await page.evaluate(() => innerWidth);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(vw + 1);
  });
}

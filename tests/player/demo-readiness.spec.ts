import { expect, test } from '@playwright/test';

test('demo readiness: empty board → first entry → second run updates rank → refresh persists', async ({ page }) => {
  test.setTimeout(540000);
  // Clean state
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('stack-and-survive.leaderboard.v1');
    localStorage.removeItem('stack-and-survive.nickname');
    localStorage.removeItem('stack-and-survive.history.balance-0.4.v1');
  });

  const play = async (protectedIngress: boolean) => {
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
    const skip = page.getByRole('button', { name: 'Skip guide', exact: true });
    if (await skip.isVisible()) await skip.click();
    const build = async (name: string) => {
      const button = page.getByRole('button', { name, exact: true });
      await button.focus(); await button.press('Enter');
    };
    await build('Deploy Cache — reduces SQL reads');
    if (protectedIngress) await build('Deploy Protected Edge — filters bots');
    const instances = protectedIngress ? 3 : 4;
    for (let active = 2; active <= instances; active++) {
      await build('+ App capacity');
      await expect(page.getByRole('button', { name: '+ App capacity', exact: true })).toContainText(`${active}/4 active`, { timeout: 15000 });
    }
    await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 200000 });
    await expect(page.locator('.report-heading h2')).toHaveText('CHALLENGE CLEAR');
  };

  // Two real, unaccelerated completions exercise both manual and automatic submission.
  await page.goto('/');
  await play(false);

  const leaderboard = page.locator('[aria-label="Leaderboard"]');
  await expect(leaderboard).toBeVisible();

  const score1 = Number(await page.locator('.result-score strong').textContent());
  expect(score1).toBe(8500);
   await expect(leaderboard.getByRole('textbox', { name: 'Player name', exact: true })).toBeVisible();
     await leaderboard.getByRole('textbox', { name: 'Player name', exact: true }).fill('DEMO');
     await leaderboard.getByRole('button', { name: 'Join Leaderboard', exact: true }).click();

    // Verify first entry
    await expect(leaderboard.locator('.leaderboard-rank-badge')).toContainText('#1');
    await expect(leaderboard.locator('.leaderboard-entry')).toHaveCount(1);
    await expect(leaderboard.locator('.leaderboard-name').first()).toContainText('DEMO');
    await expect(leaderboard.getByText('NEW PERSONAL BEST')).toBeVisible();

    // Verify Copy result button exists
    await expect(leaderboard.getByRole('button', { name: 'Copy result' })).toBeVisible();

    // Verify device disclaimer
    await expect(leaderboard.getByText('This device · Local scores', { exact: true })).toBeVisible();
    await expect(leaderboard.getByRole('button', { name: 'Retry server submission' })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.pending-global-submission'))).toBeNull();

  // --- Run 2: second entry changes rank ---
  await page.getByRole('button', { name: 'Play again' }).click();
  await play(true);

  const board2 = page.locator('[aria-label="Leaderboard"]');
  await expect(board2).toBeVisible();
  const score2 = Number(await page.locator('.result-score strong').textContent());
  expect(score2).toBeGreaterThan(score1);
  await expect(board2.locator('.leaderboard-entry')).toHaveCount(2);
      const firstScore = Number((await board2.locator('.leaderboard-score').first().innerText()).replace(/,/g, ''));
      const secondScore = Number((await board2.locator('.leaderboard-score').nth(1).innerText()).replace(/,/g, ''));
      expect(firstScore).toBe(score2);
      expect(secondScore).toBe(score1);
      await expect(board2.locator('.leaderboard-rank-badge')).toHaveText('#1');
      await expect(board2.getByText('NEW PERSONAL BEST')).toBeVisible();

  // --- Refresh persistence ---
  await page.reload();
  await page.goto('/');

  // Verify nickname persisted
  const storedNick = await page.evaluate(() => localStorage.getItem('stack-and-survive.nickname'));
  expect(storedNick).toBe('DEMO');

  // Verify leaderboard data persisted
  const storedBoard = await page.evaluate(() => localStorage.getItem('stack-and-survive.leaderboard.v1'));
    expect(storedBoard).toBeTruthy();
    const parsed = JSON.parse(storedBoard!);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries.map((entry: {score: number}) => entry.score)).toEqual([score2, score1]);
    expect(new Set(parsed.entries.map((entry: {runId: string}) => entry.runId)).size).toBe(2);
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

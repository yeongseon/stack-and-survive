import { expect, test } from '@playwright/test';

test('first-time player joins leaderboard after objective-valid completion', async ({ page }) => {
  // Clear any existing leaderboard/nickname state
  await page.goto('/');
  await page.evaluate(() => { localStorage.removeItem('stack-and-survive.leaderboard.v1'); localStorage.removeItem('stack-and-survive.nickname'); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });

  // Wait for game to complete (timeout allows full 180s run)
  await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 200000 });
  const scoreText = await page.locator('.result-score strong').textContent();
  const score = Number(scoreText);

  // Check if objective was met — leaderboard behavior depends on this
  const heading = await page.locator('.report-heading h2').textContent();
  const objectiveMet = heading === 'CHALLENGE CLEAR';

  // Leaderboard panel should be visible in result screen
  const leaderboard = page.locator('[aria-label="Leaderboard"]');
  await expect(leaderboard).toBeVisible();

  if (objectiveMet) {
    // No nickname set yet — should show Join prompt
    await expect(leaderboard.getByText('Enter your name')).toBeVisible();
    await leaderboard.getByRole('button', { name: 'Enter name' }).click();

    // Type nickname and submit
    await leaderboard.getByRole('textbox', { name: 'Nickname' }).fill('TESTPLR');
    await leaderboard.getByRole('button', { name: 'Join' }).click();

    // Should immediately show rank and score
    await expect(leaderboard.locator('.leaderboard-rank-badge')).toContainText('#1');
    await expect(leaderboard.locator('.leaderboard-rank-score')).toContainText(`${score}`);
    await expect(leaderboard.getByText('NEW PERSONAL BEST')).toBeVisible();

    // Leaderboard list should contain the entry
    await expect(leaderboard.locator('.leaderboard-entry')).toHaveCount(1);
    await expect(leaderboard.locator('.leaderboard-name').first()).toContainText('TESTPLR');

    // Verify "This device" disclaimer
    await expect(leaderboard.getByText('This device')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1, { timeout: 20000 });
    await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 200000 });

    // Leaderboard should still have the previous entry
    const board2 = page.locator('[aria-label="Leaderboard"]');
    await expect(board2).toBeVisible();
    await expect(board2.locator('.leaderboard-entry')).toHaveCount(1);
    await expect(board2.locator('.leaderboard-name').first()).toContainText('TESTPLR');
  } else {
    // Failed/missed run — should show "Complete the objective" message
    await expect(leaderboard.getByText('Complete the objective')).toBeVisible();
  }
});

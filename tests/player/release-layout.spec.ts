import { expect, test } from '@playwright/test';
import originalWorkload from '../../packages/scenarios/src/black-friday.json' with { type: 'json' };

test('test-fixture Top 10 and long nickname remain accessible at laptop and landscape sizes', async ({ page }, info) => {
  // Layout fixture only: these are not real run records or submission screenshots.
  const workload = { ...originalWorkload, balanceVersion: '0.4' };
  const canonical = JSON.stringify({ schemaVersion: 1, id: 'black-friday', version: 2, rulesVersion: workload.balanceVersion,
    seedAlgorithm: 'fixed-v1', seed: 0, workload, objective: { id: 'survive', version: 1, kind: 'survive' } });
  const entries = Array.from({ length: 10 }, (_, i) => ({ nickname: `LongPlayerName${i.toString().padStart(2, '0')}`,
    score: 9000 - i * 100, availability: .99, timestamp: i, runId: `layout-fixture-${i}`, challengeCanonical: canonical }));
  await page.addInitScript(entries => {
    localStorage.setItem('stack-and-survive.leaderboard.v1', JSON.stringify({ version: 1, entries }));
    localStorage.setItem('stack-and-survive.nickname', 'LongPlayerName00');
    localStorage.setItem('stack-and-survive.pending-global-submission', JSON.stringify({ nickname: 'SavedUser', challengeContentHash: 'preserved-previous-challenge', clientRunId: 'pending-fixture', actions: [] }));
  }, entries);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const result = page.getByRole('region', { name: 'Business result' });
  await expect(result).toBeVisible({ timeout: 80000 });
  await expect(result.locator('.leaderboard-entry')).toHaveCount(10);
  await expect(result).toContainText('Saved submission preserved');
  await expect(result.getByRole('button', { name: 'Retry server submission' })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.pending-global-submission')!).clientRunId)).toBe('pending-fixture');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1366, height: 600 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const rect = (await result.boundingBox())!;
    expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
    expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
    expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await result.getByRole('button', { name: 'Play again', exact: true }).click({ trial: true });
    await result.locator('.leaderboard-entry').last().scrollIntoViewIfNeeded();
    await expect(result.locator('.leaderboard-name').last()).toHaveText('LongPlayerName09');
    await result.getByRole('button', { name: 'Change for future runs', exact: true }).click();
    const input = result.getByRole('textbox', { name: 'Player name', exact: true });
    await expect(input).toBeFocused(); await input.fill('SixteenCharsName');
    await page.keyboard.press('Shift+Tab');
    await expect(result.getByRole('button', { name: 'Review business', exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(input).toBeFocused();
    await result.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.screenshot({ path: info.outputPath(`fixture-top10-${viewport.width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const zoom of [1.25, 1.5]) {
    await page.setViewportSize({ width: Math.floor(1440 / zoom), height: Math.floor(900 / zoom) });
    await result.getByRole('button', { name: 'Play again', exact: true }).click({ trial: true });
    expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const bounds = (await result.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(Math.floor(900 / zoom));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await result.getByRole('button', { name: 'Review business', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(result.getByRole('button', { name: 'Review business', exact: true })).toBeFocused();
});

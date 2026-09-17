import { expect, test, type Page } from '@playwright/test';
const fixture = '/tests/release/identity.html';

async function mockApi(page: Page, fail = false) {
  const posts: { nickname: string; clientRunId: string; challengeContentHash: string; actions: unknown[] }[] = [];
  await page.route('https://release-api.invalid/**', async route => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON(); posts.push(payload);
      await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ status: fail ? 503 : 200, json: fail ? {} : { accepted: true,
        rankContext: { rank: 2, totalEntries: 2, score: 9451, availability: .995, nextRank: { rank: 1, score: 9700, availability: .999 }, pointsToNextRank: 249, tieBreakReason: null },
        top: [{ rank: 1, nickname: 'LEADER', score: 9700, availability: .999, submittedAt: 1 }, { rank: 2, nickname: payload.nickname, score: 9451, availability: .995, submittedAt: 2 }] } });
    }
    return route.fulfill({ status: fail ? 503 : 200, json: { available: true, challengeHash: new URL(route.request().url()).searchParams.get('challenge'), entries: [] } });
  });
  return posts;
}

test('first qualifying result exposes validated name input and only Join posts once', async ({ page }, info) => {
  const posts = await mockApi(page);
  await page.goto(fixture);
  await page.getByRole('button', { name: 'Show actual engine result' }).click();
  const input = page.getByRole('textbox', { name: 'Player name', exact: true });
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await page.screenshot({ path: info.outputPath('first-player-input.png') });
  const join = page.getByRole('button', { name: 'Join Leaderboard', exact: true });
  await expect(join).toBeDisabled();
  await input.fill('!'); await expect(page.getByRole('status')).toContainText('Player name');
  await expect(join).toBeDisabled(); expect(posts).toHaveLength(0);
  await input.fill('YS'); await input.press('Enter');
  await expect(page.getByText('Verifying with server...')).toBeVisible();
  await expect(page.locator('.leaderboard-you')).toContainText('YS');
  await expect(page.locator('.leaderboard-you')).toContainText('← YOU');
  await expect(page.getByText('249 pts to #1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Global Leaderboard' })).toBeFocused();
  expect(posts).toHaveLength(1); expect(posts[0].nickname).toBe('YS');
  expect(Object.keys(posts[0]).sort()).toEqual(['actions','challengeContentHash','clientRunId','nickname']);
  expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.nickname'))).toBe('YS');
  await page.screenshot({ path: info.outputPath('saved-global-name.png') });
  await page.getByRole('button', { name: 'Change for future runs' }).click();
  await page.getByRole('textbox', { name: 'Player name', exact: true }).fill('MIN');
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  await expect(page.locator('.leaderboard-submitted-name')).toContainText('YS');
  await expect(page.locator('.leaderboard-you')).toContainText('YS');
  expect(posts).toHaveLength(1);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.leaderboard.v1')!));
  expect(stored.entries[0].nickname).toBe('YS');
  expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.nickname'))).toBe('MIN');
});

test('saved title identity changes before play and auto-submits using only the new name', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('stack-and-survive.nickname', 'YS'));
  const posts = await mockApi(page);
  await page.goto(fixture);
  await expect(page.getByText('Playing as')).toContainText('YS');
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Player name', exact: true });
  await expect(input).toBeFocused(); await input.fill('MIN'); await input.press('Enter');
  await page.getByRole('button', { name: 'Show actual engine result' }).click();
  await expect(page.locator('.leaderboard-submitted-name')).toContainText('MIN');
  await expect(page.locator('.leaderboard-you')).toContainText('MIN');
  expect(posts.map(p => p.nickname)).toEqual(['MIN']);
});

test('saved name can change on an unsubmitted result and local fallback keeps the real score', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('stack-and-survive.nickname', 'YS'));
  const posts = await mockApi(page, true);
  await page.goto(`${fixture}?manual`);
  await page.getByRole('button', { name: 'Show actual engine result' }).click();
  await expect(page.getByText('Change for this and future runs.', { exact: false })).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Player name', exact: true });
  await expect(input).toHaveValue('YS'); await input.fill('MIN');
  await page.getByRole('button', { name: 'Join Leaderboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Local Leaderboard' })).toBeVisible();
  await expect(page.locator('.leaderboard-you')).toContainText('MIN');
  await expect(page.getByText('Verifying with server...')).toHaveCount(0);
  expect(posts.map(p => p.nickname)).toEqual(['MIN']);
  await expect(page.getByText('This device · Local scores', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('local-fallback.png') });
});

test('nonqualifying result never requests a new name or posts a score', async ({ page }) => {
  const posts = await mockApi(page);
  await page.goto(`${fixture}?failed`);
  await page.getByRole('button', { name: 'Show actual engine result' }).click();
  await expect(page.getByText('Complete the objective to enter the leaderboard.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Player name', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Join Leaderboard', exact: true })).toHaveCount(0);
  expect(posts).toHaveLength(0);
});

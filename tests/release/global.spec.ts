import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const harness = `/@fs${fileURLToPath(new URL('../../apps/web/tests/release/harness.html', import.meta.url))}`;
const entry = { rank: 1, nickname: 'TEST', score: 9000, availability: .99, submittedAt: 1 };
const accepted = { accepted: true, top: [entry], rankContext: { rank: 1, totalEntries: 1, score: 9000, availability: .99, nextRank: null, pointsToNextRank: null, tieBreakReason: null } };

test('late previous-challenge responses and invalid refresh cannot become current server scores', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  let malformed = false;
  let first: string | null = null;
  await page.route('https://release-api.invalid/**', async route => {
    const hash = new URL(route.request().url()).searchParams.get('challenge');
    first ??= hash;
    if (hash === first) await held;
    await route.fulfill({ json: malformed ? { entries: [null] } : { challengeHash: hash, available: true, entries: hash === first ? [entry] : [] } });
  });
  await page.goto(harness);
  await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
  const state = page.getByTestId('state');
  await expect(state).toContainText('"available":true');
  expect(JSON.parse(await state.innerText()).challengeHash).not.toBe(first);
  release();
  await page.waitForTimeout(200);
  await expect(state).toContainText('"globalEntries":[]');
  await expect(state).not.toContainText('TEST');
  malformed = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(state).toContainText('"available":false');
  await expect(state).toContainText('"globalEntries":null');
});

test('failed duplicate submission persists across reload and retries exactly once', async ({ page }) => {
  let posts = 0, succeed = false;
  await page.route('https://release-api.invalid/**', async route => {
    if (route.request().method() === 'POST') {
      posts++;
      await new Promise(resolve => setTimeout(resolve, 250));
      return route.fulfill({ status: succeed ? 200 : 503, json: succeed ? accepted : {} });
    }
    const challengeHash = new URL(route.request().url()).searchParams.get('challenge');
    return route.fulfill({ json: { challengeHash, available: true, entries: [] } });
  });
  await page.goto(harness);
  const state = page.getByTestId('state');
  await expect(state).toContainText('"available":true');
  await page.getByRole('button', { name: 'Submit', exact: true }).dblclick();
  await expect(state).toContainText('"loading":true');
  await expect(state).toContainText('"loading":false');
  expect(posts).toBe(1);
  await expect(state).toContainText('"hasPending":true');
  await expect(state).toContainText('"available":false');
  await page.reload();
  await expect(state).toContainText('"hasPending":true');
  succeed = true;
  await page.getByRole('button', { name: 'Retry', exact: true }).dblclick();
  await expect(state).toContainText('"hasPending":false');
  await expect(state).toContainText('"globalRankContext":{"rank":1');
  expect(posts).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.pending-global-submission'))).toBeNull();
});

test('refresh started during submission cannot overwrite its newer verified top', async ({ page }) => {
  let holdReads = false;
  let releaseRead = () => {}, releaseSubmit = () => {};
  const readGate = new Promise<void>(resolve => { releaseRead = resolve; });
  const submitGate = new Promise<void>(resolve => { releaseSubmit = resolve; });
  await page.route('https://release-api.invalid/**', async route => {
    if (route.request().method() === 'POST') { await submitGate; return route.fulfill({ json: accepted }); }
    if (holdReads) await readGate;
    return route.fulfill({ json: { challengeHash: new URL(route.request().url()).searchParams.get('challenge'), available: true, entries: [] } });
  });
  await page.goto(harness);
  const state = page.getByTestId('state');
  await expect(state).toContainText('"available":true');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  holdReads = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  releaseSubmit();
  await expect(state).toContainText('"nickname":"TEST"');
  releaseRead();
  await page.waitForTimeout(200);
  await expect(state).toContainText('"nickname":"TEST"');
});

test('old accepted submission clears only its saved retry without marking the new challenge verified', async ({ page }) => {
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://release-api.invalid/**', async route => {
    if (route.request().method() === 'POST') { await gate; return route.fulfill({ json: accepted }); }
    return route.fulfill({ json: { challengeHash: new URL(route.request().url()).searchParams.get('challenge'), available: true, entries: [] } });
  });
  await page.goto(harness);
  const state = page.getByTestId('state');
  await expect(state).toContainText('"available":true');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(state).toContainText('"loading":true');
  await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
  await expect(state).toContainText('"loading":false');
  release();
  await page.waitForTimeout(200);
  await expect(state).toContainText('"globalRankContext":null');
  await expect(state).toContainText('"globalEntries":[]');
  await expect(state).toContainText('"hasPending":false');
});

for (const failure of ['malformed', 'unavailable']) {
  test(`actual game can finish and restart with ${failure} configured API`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://release-api.invalid/**', route => route.fulfill({ status: failure === 'unavailable' ? 503 : 200,
      json: { available: true, entries: [null] } }));
    await page.goto('/?tycoon');
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Business result' })).toBeVisible({ timeout: 70000 });
    await expect(page.locator('[aria-label="Leaderboard"]')).toContainText('This device · Local scores');
    await expect(page.locator('[aria-label="Leaderboard"]')).not.toContainText('Verified server replay');
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start Game', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('late acceptance of a previous challenge cannot delete a newer failed submission', async ({ page }) => {
  let posts = 0, release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://release-api.invalid/**', async route => {
    if (route.request().method() === 'POST') {
      posts++;
      if (posts === 1) { await gate; return route.fulfill({ json: accepted }); }
      return route.fulfill({ status: 503, json: {} });
    }
    return route.fulfill({ json: { challengeHash: new URL(route.request().url()).searchParams.get('challenge'), available: true, entries: [] } });
  });
  await page.goto(harness);
  const state = page.getByTestId('state');
  await expect(state).toContainText('"available":true');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect.poll(() => posts).toBe(1);
  await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect.poll(() => posts).toBe(2);
  await expect(state).toContainText('"loading":false');
  release();
  await page.waitForTimeout(200);
  await expect(state).toContainText('"hasPending":true');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.pending-global-submission')!));
  expect(saved.challengeContentHash).toBe(JSON.parse(await state.innerText()).challengeHash);
});

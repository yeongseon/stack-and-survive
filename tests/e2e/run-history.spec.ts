import { expect, test } from '@playwright/test';

test('real failed and successful attempts persist separately and only success sets best records', async ({ page }, testInfo) => {
  test.setTimeout(360000);
  await page.goto('/?tycoon');
  const start = async () => {
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.locator('[data-renderer="ready"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
    if (await page.getByRole('button', { name: 'Skip guide', exact: true }).isVisible()) await page.getByRole('button', { name: 'Skip guide', exact: true }).click();
    await page.getByText('Tycoon QA', { exact: true }).click();
  };
  const step = page.getByRole('button', { name: 'Step one tick', exact: true });
  const data = () => page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.history.v1')!));
  await start(); while (Number(await page.getByTestId('elapsed').textContent()) < 50) await step.click();
  await expect.poll(async () => (await data())?.runs.length).toBe(1);
  expect((await data()).bests).toHaveLength(0);
  await page.getByRole('region', { name: 'Business result' }).getByText('Run records & personal best', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('No objective-valid completion yet');
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await start(); await step.click();
  for (const name of ['Add Cache', '+ App capacity']) {
    await page.getByRole('button', { name, exact: true }).focus();
    await page.getByRole('button', { name, exact: true }).click(); await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
  }
  for (let i=0;i<9;i++) await step.click();
  for (let expansion=0;expansion<2;expansion++) {
    { await page.getByRole('button', { name: '+ App capacity', exact: true }).focus(); await page.getByRole('button', { name: '+ App capacity', exact: true }).press('Enter'); }; await page.getByRole('button', { name: 'Confirm expansion', exact: true }).click();
    for (let i=0;i<9;i++) await step.click();
  }
  while (Number(await page.getByTestId('elapsed').textContent()) < 180) await step.click();
  await expect.poll(async () => (await data())?.runs.length).toBe(2);
  const saved = await data(); expect(saved.bests).toHaveLength(1);
  expect(saved.bests[0].lowestCost.id).toBe(saved.runs[1].id);
  await expect(page.getByRole('region', { name: 'Architecture profile' })).toContainText('Cache-led expansion');
  await expect(page.getByRole('region', { name: 'Run comparison' })).toContainText('Different duration or outcome — no efficiency comparison');
  await expect(page.getByRole('region', { name: 'Run comparison' })).toContainText('New personal best');
  await page.getByRole('region', { name: 'Business result' }).getByText('Run records & personal best', { exact: true }).click();
  await page.setViewportSize({ width: 320, height: 568 });
  const records = page.getByRole('region', { name: 'Local run records' });
  await expect(records).toContainText('Highest business value');
  expect(await records.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await records.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('history-result-320.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Review business', exact: true }).click(); await page.keyboard.press('Escape');
  expect((await data()).runs).toHaveLength(2);
  await page.reload(); await page.getByText('Run history', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('Highest business value');
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('Failed · 50s');
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await records.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await records.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('history-title-320.png') });
  const progress = await page.evaluate(() => localStorage.getItem('stack-and-survive.progress.v1'));
  await page.getByRole('button', { name: 'Clear run history', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('No recorded runs yet');
  expect(await page.evaluate(() => localStorage.getItem('stack-and-survive.progress.v1'))).toBe(progress);
});

test('corrupt history and failed writes preserve current results and support retry saving', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('stack-and-survive.history.v1', '{broken');
    const original = Storage.prototype.setItem;
    Object.defineProperty(window, '__restoreHistoryStorage', { value: () => { Storage.prototype.setItem = original; } });
    Storage.prototype.setItem = function(key, value) { if (key === 'stack-and-survive.history.v1') throw new Error('QuotaExceeded'); original.call(this, key, value); };
  });
  await page.goto('/?tycoon'); await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await page.getByText('Tycoon QA', { exact: true }).click(); const step = page.getByRole('button', { name: 'Step one tick', exact: true });
  while (Number(await page.getByTestId('elapsed').textContent()) < 50) await step.click();
  await page.getByRole('region', { name: 'Business result' }).getByText('Run records & personal best', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('could not be saved');
  await page.evaluate(() => { const restore = Reflect.get(window, '__restoreHistoryStorage'); if (typeof restore === 'function') restore(); });
  await page.getByRole('button', { name: 'Retry saving records', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).not.toContainText('could not be saved');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.history.v1')!).runs.length)).toBe(1);
  await page.evaluate(() => {
    const original = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) { if (key === 'stack-and-survive.history.v1') throw new Error('SecurityError'); original.call(this, key); };
  });
  await page.getByRole('button', { name: 'Clear run history', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('Existing records were preserved');
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('Failed · 50s');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.history.v1')!).runs.length)).toBe(1);
});

test('unavailable history reads do not prevent starting the game', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) { if (key === 'stack-and-survive.history.v1') throw new Error('SecurityError'); return original.call(this, key); };
  });
  await page.goto('/?tycoon');
  await page.getByText('Run history', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Local run records' })).toContainText('No recorded runs yet');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
});

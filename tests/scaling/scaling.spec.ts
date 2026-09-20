import { expect, test, type Page } from '@playwright/test';
const card = (page: Page) => page.getByRole('region', { name: 'Resource actions', exact: true });
async function openSQL(page: Page) {
  const close = page.getByRole('button', { name: 'Close resource', exact: true }); if (await close.count()) await close.click();
  const button = page.getByRole('button', { name: 'SQL processing', exact: true }); await button.focus(); await button.press('Enter');
}
async function openApp(page: Page) {
  const close = page.getByRole('button', { name: 'Close resource', exact: true }); if (await close.count()) await close.click();
  const app = page.getByRole('button', { name: 'Inspect App scaling', exact: true }); await app.focus(); await app.press('Enter');
  await expect(card(page).getByRole('heading', { name: 'Azure App Service' })).toBeVisible();
}
test('real 180-second architecture evolves through horizontal, vertical and read scaling', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByTestId('traffic')).toContainText('100');
  const skip = page.getByRole('button', { name: 'Skip guide', exact: true }); if (await skip.count()) await skip.click();
  const at = async (seconds: number) => {
    await expect.poll(async () => Number(await page.getByRole('progressbar', {name:'Operation elapsed time',exact:true}).getAttribute('value')), {timeout:180000}).toBeGreaterThanOrEqual(seconds);
  };
  const shot = async (name: string) => {
    if (process.env.CAPTURE_SCALING !== '1') return;
    if (await page.getByRole('region', {name:'Business result',exact:true}).isVisible()) return;
    await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
    await page.getByRole('button',{name:'Inspect paused world',exact:true}).click();
    await page.screenshot({path:info.outputPath(name)});
    await page.getByRole('button',{name:'▶ Resume',exact:true}).click();
  };
  await shot('01-initial.png');
  await at(15);
  const expand = page.getByRole('button', { name: '+ App capacity', exact: true }); await expand.focus(); await expand.press('Enter');
  await at(16);
  const cache = page.getByRole('button', { name: 'Deploy Cache — reduces SQL reads', exact: true }); await cache.focus(); await cache.press('Enter');
  await at(56);
  const edge = page.getByRole('button', { name: 'Deploy Protected Edge — filters bots', exact: true }); await edge.focus(); await edge.press('Enter');
  await expand.focus(); await expand.press('Enter');
  await at(119); await expand.focus(); await expand.press('Enter');
  await expect(page.locator('.facility-plaques')).toContainText('4/4 active');
  await shot('02-app-x4.png');
  await at(129); await openApp(page);
  await card(page).getByRole('button', { name: 'Scale in · − Instance', exact: true }).click();
  await expect(card(page)).toContainText('Draining last App bay');
  await expect(card(page)).toContainText('3/4 instances');
  await at(139); await card(page).getByRole('button', { name: 'Scale up · ↑ App tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 2 · Standard II');
  await shot('03-app-tier2.png');
  await openSQL(page); await card(page).getByRole('button', { name: 'Scale up · ↑ SQL tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 2 · General Purpose II');
  await shot('04-sql-tier2.png');
  await card(page).getByRole('button', { name: 'Scale up · ↑ SQL tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 3 · Business Critical');
  await shot('05-sql-tier3.png');
  await card(page).getByRole('button', { name: 'Add replica · + Read replica', exact: true }).click();
  await expect(card(page)).toContainText('Read replicas 1/2');
  await shot('06-sql-read-replica.png');
  await page.getByRole('button', { name: 'Close resource', exact: true }).click();
  await shot('07-late-architecture.png');
  const result = page.getByRole('region', { name: 'Business result' }); await expect(result).toBeVisible({ timeout: 25000 });
  await expect(result).toContainText('CHALLENGE CLEAR');
  await expect(result.getByRole('region', { name: 'Final Architecture' })).toContainText('Business Critical + 1 read replicas');
  if (process.env.CAPTURE_SCALING === '1') await page.screenshot({ path: info.outputPath('08-result.png') });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('stack-and-survive.history.balance-0.4.v1')!).runs[0]);
  expect(saved.elapsed).toBe(180); expect(saved.actions.some((a: { type: string }) => a.type === 'SCALE_IN')).toBe(true);
  expect(errors).toEqual([]);
});

test('SQL bottleneck remains distinct from App capacity and downgrade controls obey limits', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByTestId('traffic')).toContainText('100');
  const skip = page.getByRole('button', { name: 'Skip guide', exact: true }); if (await skip.count()) await skip.click();
  const expand = page.getByRole('button', { name: '+ App capacity', exact: true }); await expand.focus(); await expand.press('Enter');
  await expect(page.locator('.facility-plaques')).toContainText('2/4 active');
  await openSQL(page);
  await expect(card(page).getByRole('button', { name: 'Scale down · ↓ SQL tier', exact: true })).toBeDisabled();
  await expect(card(page).getByRole('button', { name: 'Remove replica · − Read replica', exact: true })).toBeDisabled();
  await expect(page.getByTestId('traffic')).toContainText('260', { timeout: 30000 });
  await expect(card(page)).toContainText('Reads: 116%');
  if (process.env.CAPTURE_SCALING === '1') await page.screenshot({ path: info.outputPath('sql-bottleneck.png') });
  await card(page).getByRole('button', { name: 'Scale up · ↑ SQL tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 2 · General Purpose II');
  await card(page).getByRole('button', { name: 'Scale down · ↓ SQL tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 1 · General Purpose I');
});

test('landscape scaling card keeps downgrades and replica removal usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByTestId('traffic')).toContainText('100');
  const skip = page.getByRole('button', { name: 'Skip guide', exact: true }); if (await skip.count()) await skip.click();
  await openApp(page);
  await expect(card(page).getByRole('button', { name: 'Scale in · − Instance', exact: true })).toBeDisabled();
  await card(page).getByRole('button', { name: 'Scale up · ↑ App tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 2 · Standard II');
  await page.setViewportSize({width:844,height:390});
  await card(page).getByRole('button', { name: 'Scale down · ↓ App tier', exact: true }).click();
  await expect(card(page)).toContainText('Tier 1 · Standard I');
  await openSQL(page);
  await card(page).getByRole('button', { name: 'Add replica · + Read replica', exact: true }).click();
  await expect(card(page)).toContainText('Read replicas 1/2');
  await card(page).getByRole('button', { name: 'Remove replica · − Read replica', exact: true }).click();
  await expect(card(page)).toContainText('Read replicas 0/2');
  const bounds = (await card(page).boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x+bounds.width).toBeLessThanOrEqual(844);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(390);
  await page.getByRole('button', {name:'Ⅱ Pause',exact:true}).click();
  await page.getByRole('button',{name:'Inspect paused world',exact:true}).click();
  await openSQL(page);
  await expect(card(page).getByRole('button',{name:'Scale up · ↑ SQL tier',exact:true})).toBeDisabled();
});

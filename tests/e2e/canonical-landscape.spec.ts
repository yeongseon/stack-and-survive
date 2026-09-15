import { expect, test } from '@playwright/test';

test('opening establishes fixed geography without ticking and phone portrait requires explicit continuation', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByTestId('opening-reveal')).toBeVisible();
  const state = async () => JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  expect((await state()).state.runtime.time).toBe(0);
  expect((await state()).state.economy.remainingBudget).toBe(75);
  expect((await state()).countdown).toBeNull();
  const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-world-nodes', /compute/);
  const geography = await surface.getAttribute('data-world-nodes');
  await page.screenshot({ path: info.outputPath('whole-map-1440.png') });
  await expect(page.getByTestId('opening-reveal')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Camera zoom' })).toHaveText('145%');
  await page.screenshot({ path: info.outputPath('operational-1440.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('dialog', { name: 'Landscape play required' })).toContainText('Rotate your device');
  const frozen = (await state()).state;
  await page.waitForTimeout(1200);
  expect((await state()).state).toEqual(frozen);
  await page.screenshot({ path: info.outputPath('portrait-gate.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('button', { name: 'Continue in landscape', exact: true })).toBeVisible();
  expect((await state()).state.runtime.status).toBe('PAUSED');
  await page.getByRole('button', { name: 'Continue in landscape', exact: true }).click();
  await expect(page.getByRole('button', { name: '▶ Resume', exact: true })).toBeEnabled();
  expect((await state()).state.runtime.status).toBe('PAUSED');
  await page.getByRole('button', { name: '▶ Resume', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  await expect(surface).toHaveAttribute('data-world-nodes', geography!);
  await page.getByRole('button', { name: 'Fit architecture', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Camera zoom' })).toHaveText('100%');
  await page.screenshot({ path: info.outputPath('whole-map-844.png') });
  for (const viewport of [{width:1440,height:900},{width:1920,height:1080}]) {
    await page.setViewportSize(viewport);
    await expect(surface).toHaveAttribute('data-world-nodes', geography!);
    await page.screenshot({ path: info.outputPath(`fit-${viewport.width}.png`) });
  }
});

test('portrait Start never starts a run and rejected enhancements do not block landscape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(() => {
    const original=window.matchMedia.bind(window);
    window.matchMedia=query=>{const result=original(query);if(query==='(pointer: coarse)')Object.defineProperty(result,'matches',{value:true});return result;};
    Element.prototype.requestFullscreen = () => Promise.reject(new Error('Fullscreen denied'));
    Object.defineProperty(screen.orientation, 'lock', { value: () => Promise.reject(new Error('Lock denied')), configurable: true });
  });
  await page.goto('/?tycoon');
  await page.getByRole('button', {name:'Start Game',exact:true}).click();
  await expect(page.getByRole('dialog', {name:'Landscape play required'})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Automatic rotation/fullscreen is unavailable');
  await page.waitForTimeout(1300);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.title-screen')).toHaveAttribute('data-time','0');
  await expect(page.locator('.title-screen')).toHaveAttribute('data-budget','75');
  await page.setViewportSize({width:844,height:390});
  await page.getByRole('button', {name:'Continue in landscape',exact:true}).click();
  await expect(page.getByRole('button', {name:'Ⅱ Pause',exact:true})).toBeEnabled();
  await expect(page.getByRole('status', {name:'Camera zoom'})).toHaveText('145%');
});

test('interrupted overview and held countdown never advance hidden or portrait gameplay', async ({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/?tycoon');
  await page.getByRole('button',{name:'Start Game',exact:true}).click();
  await expect(page.getByTestId('opening-reveal')).toBeVisible();
  const state=async()=>JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(2000);
  expect((await state()).countdown).toBeNull();expect((await state()).state.runtime.time).toBe(0);
  await page.evaluate(()=>{delete (document as Document & {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(async()=>(await state()).countdown).not.toBeNull();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenCountdown=(await state()).countdown;
  await page.waitForTimeout(1500);
  expect((await state()).countdown).toBe(hiddenCountdown);
  expect((await state()).state.runtime.time).toBe(0);
  await page.evaluate(()=>{delete (document as Document & {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('dialog',{name:'Landscape play required'})).toBeVisible();
  const before=await state();
  await page.waitForTimeout(1500);
  expect((await state()).countdown).toBe(before.countdown);expect((await state()).state).toEqual(before.state);
  await page.getByRole('button',{name:'Return to title',exact:true}).click();
  await page.waitForTimeout(2000);
  await expect(page.locator('.title-screen')).toHaveAttribute('data-time','0');
  await expect(page.locator('.title-screen')).toHaveAttribute('data-budget','75');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('rotation interrupts a running operation and Continue alone resumes it',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?tycoon');
  await page.getByRole('button',{name:'Start Game',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ⅱ Pause',exact:true})).toBeEnabled();
  const state=async()=>JSON.parse((await page.getByTestId('diagnostics').textContent())!).state;
  await expect.poll(async()=>(await state()).runtime.time).toBeGreaterThan(0);
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('dialog',{name:'Landscape play required'})).toBeVisible();
  const paused=await state();expect(paused.runtime.status).toBe('PAUSED');
  await page.waitForTimeout(1200);expect(await state()).toEqual(paused);
  await page.setViewportSize({width:844,height:390});
  await page.waitForTimeout(1200);expect(await state()).toEqual(paused);
  await page.getByRole('button',{name:'Continue in landscape',exact:true}).click();
  await expect.poll(async()=>(await state()).runtime.time).toBeGreaterThan(paused.runtime.time);
});

import { expect, test } from '@playwright/test';

test('merged pause menu handles Escape once and contains focus while preserving manual pause', async ({ page }, info) => {
  await page.setViewportSize({width:844,height:390});
  await page.goto('/');
  await page.getByRole('button',{name:'Start Game',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ⅱ Pause',exact:true})).toBeEnabled();
  await page.keyboard.press('Escape');
  const menu=page.getByRole('dialog',{name:'Game paused',exact:true});
  await expect(menu).toBeVisible();await expect(menu.getByRole('button',{name:'▶ Resume',exact:true})).toBeFocused();
  const funds=await page.getByTestId('budget').textContent();
  await menu.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(menu.getByRole('button',{name:'Back',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await menu.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(menu.getByRole('button',{name:'▶ Resume',exact:true})).toBeFocused();
  await page.waitForTimeout(1200);expect(await page.getByTestId('budget').textContent()).toBe(funds);
  await menu.getByRole('button',{name:'How to Play',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'How to Play',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(menu).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('dialog',{name:'Landscape play required'})).toBeVisible();
  await page.setViewportSize({width:844,height:390});
  await page.getByRole('button',{name:'Continue in landscape',exact:true}).click();
  await expect(menu).toBeVisible();await expect(menu.getByRole('button',{name:'▶ Resume',exact:true})).toBeFocused();
  await menu.evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); });
  await page.screenshot({path:info.outputPath('merged-pause-landscape.png')});
  const rect=(await menu.locator('.pause-menu').boundingBox())!;
  expect(rect.width).toBeGreaterThanOrEqual(280);expect(rect.height).toBeGreaterThan(200);
  await expect(menu).toHaveCSS('opacity','1');
  expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(390);
  await menu.getByRole('button',{name:'Inspect paused world',exact:true}).click();
  await expect(menu).toHaveCount(0);await expect(page.getByRole('button',{name:'▶ Resume',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');await expect(menu).toHaveCount(0);
  await expect.poll(()=>page.getByTestId('budget').textContent()).not.toBe(funds);
  await expect(page.getByRole('button',{name:'Ⅱ Pause',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
  await menu.getByRole('button',{name:'How to Play',exact:true}).click();
  await page.locator('canvas').evaluate(canvas=>{
    const gl=(canvas as HTMLCanvasElement).getContext('webgl2')??(canvas as HTMLCanvasElement).getContext('webgl');
    const loss=gl?.getExtension('WEBGL_lose_context');if(!loss)throw new Error('Context-loss extension unavailable');loss.loseContext();
  });
  await expect(page.getByRole('button',{name:'Rebuild graphics',exact:true})).toBeFocused();
  await expect(page.getByRole('dialog',{name:'How to Play',exact:true})).not.toBeVisible();
  await page.getByRole('button',{name:'Return to title',exact:true}).click();
  await expect(page.getByRole('button',{name:'Start Game',exact:true})).toBeFocused();
});

test('existing title settings report fullscreen rejection and restore focus on Escape',async({page},info)=>{
  await page.addInitScript(()=>{
    Object.defineProperty(document,'fullscreenEnabled',{value:true,configurable:true});
    Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Denied'));
  });
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  const opener=page.getByRole('button',{name:'Settings',exact:true});await opener.click();
  const settings=page.getByRole('region',{name:'Player settings'});
  await expect(settings.getByRole('button',{name:'🔇 Enable sound',exact:true})).toBeFocused();
  await settings.getByRole('button',{name:'Fullscreen',exact:true}).click();
  await expect(settings).toContainText('Automatic rotation/fullscreen is unavailable');
  await settings.getByRole('slider',{name:'Volume'}).fill('0.35');
  await page.screenshot({path:info.outputPath('merged-title-settings.png')});
  await page.keyboard.press('Escape');await expect(opener).toBeFocused();
  await expect(settings).toHaveCount(0);await expect(page.locator('canvas')).toHaveCount(0);
});

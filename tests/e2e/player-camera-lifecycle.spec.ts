import { expect, test } from '@playwright/test';

type Camera = { centerX: number; centerY: number; userZoom: number };
function fitBounds(width: number, height: number) {
  return { width:2400, height:1350, fitZoom:Math.min(width/2400,height/1350), viewportWidth:width, viewportHeight:height };
}
function clampCenter(value: number, length: number, visible: number) {
  const inset = visible * .4;
  return inset >= length / 2 ? length / 2 : Math.max(inset, Math.min(length - inset, value));
}

test('zoomed camera survives resize pause and renderer recovery but resets on a fresh run', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?tycoon');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click();
  await page.getByRole('button', { name: 'Fit architecture', exact: true }).click();
  const surface = page.locator('[data-renderer="ready"]');
  const zoom = page.getByRole('status', { name: 'Camera zoom' });
  const camera = async (): Promise<Camera> => JSON.parse((await surface.getAttribute('data-player-camera'))!);
  const canvasSize = () => page.locator('canvas').evaluate(c => ({ width: c.clientWidth, height: c.clientHeight }));
  const tick = async () => Number(JSON.parse((await page.getByTestId('diagnostics').textContent())!).state.runtime.time);
  const initialTick = await tick();
  // Deliberately wait longer than one fixed tick: no advancement is the assertion.
  await page.waitForTimeout(1200);
  expect(await tick()).toBe(initialTick);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(async () => (await camera()).userZoom).toBe(1.5);
  const beforePause = await camera();
  await page.getByRole('button', { name: '▶ Resume', exact: true }).click();
  await expect.poll(tick).toBeGreaterThan(initialTick);
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click(); await page.getByRole('button', { name: 'Inspect paused world', exact: true }).click();
  expect(await camera()).toEqual(beforePause);
  const resumedTick = await tick();
  expect(resumedTick).toBeGreaterThan(initialTick);
  await page.waitForTimeout(1200); expect(await tick()).toBe(resumedTick);
  await page.locator('.player-camera-controls > details > summary').click();
  await page.getByRole('button', { name: 'Pan right', exact: true }).click();
  await page.getByRole('button', { name: 'Pan down', exact: true }).click();
  await expect.poll(async () => (await camera()).centerX).toBeGreaterThan(beforePause.centerX);
  await expect.poll(async () => (await camera()).centerY).toBeGreaterThan(beforePause.centerY);
  await page.locator('.player-camera-controls > details > summary').click();
  const panned = await camera();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(zoom).toHaveText('150%');
  await expect.poll(async () => page.locator('canvas').evaluate(c => c.clientWidth)).toBe(844);
  await expect(surface).toHaveAttribute('data-reduced-motion', 'true');
  await expect.poll(async () => (await canvasSize()).height).toBe(390);
  const newSize = await canvasSize(), portrait = fitBounds(newSize.width, newSize.height);
  const resized: Camera = {
    centerX: clampCenter(panned.centerX, portrait.width, newSize.width/(portrait.fitZoom*1.5)),
    centerY: clampCenter(panned.centerY, portrait.height, newSize.height/(portrait.fitZoom*1.5)), userZoom: 1.5,
  };
  await expect.poll(async () => Math.abs((await camera()).centerX - resized.centerX)).toBeLessThan(1e-6);
  await expect.poll(async () => Math.abs((await camera()).centerY - resized.centerY)).toBeLessThan(1e-6);
  expect((await camera()).userZoom).toBe(resized.userZoom);
  expect(await tick()).toBe(resumedTick);
  await page.getByRole('button', { name: 'SQL processing', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resource actions' })).toContainText('Writes:');
  await page.locator('.player-camera-controls > details > summary').click();
  const beforeFocus = await camera();
  await page.getByRole('button', { name: 'Focus selected', exact: true }).click();
  const sql = { x: 1830, y: 825 };
  const focused: Camera = { centerX: clampCenter(sql.x, portrait.width, newSize.width/(portrait.fitZoom*1.5)), centerY: clampCenter(sql.y, portrait.height, newSize.height/(portrait.fitZoom*1.5)), userZoom: 1.5 };
  await expect.poll(async () => Math.abs((await camera()).centerX - focused.centerX)).toBeLessThan(1e-6);
  await expect.poll(async () => Math.abs((await camera()).centerY - focused.centerY)).toBeLessThan(1e-6);
  const afterFocus = await camera();
  expect(afterFocus.centerX).not.toBe(beforeFocus.centerX);
  expect(afterFocus.centerY).not.toBe(beforeFocus.centerY);
  expect(Math.hypot(sql.x - afterFocus.centerX, sql.y - afterFocus.centerY)).toBeLessThan(Math.hypot(sql.x - beforeFocus.centerX, sql.y - beforeFocus.centerY));
  await page.getByRole('button', { name: 'Close resource', exact: true }).click();
  await page.locator('.player-camera-controls > details > summary').click();
  const beforeRecovery = await camera();
  const renderedTick = await surface.getAttribute('data-tick');
  await page.locator('canvas').evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2') ?? (canvas as HTMLCanvasElement).getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension unavailable');
    extension.loseContext();
  });
  await expect(page.getByRole('button', { name: 'Rebuild graphics', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rebuild graphics', exact: true }).click();
  await expect(surface).toHaveCount(1);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect.poll(camera).toEqual(beforeRecovery);
  await expect(surface).toHaveAttribute('data-tick', renderedTick!);
  expect(await tick()).toBe(resumedTick);
  await expect(zoom).toHaveText('150%');
  await page.getByRole('button', { name: 'ⓘ Learn', exact: true }).click();
  await page.getByRole('button', { name: 'Return to title / restart', exact: true }).click();
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled();
  await expect.poll(camera).toEqual({ centerX:1210, centerY:620, userZoom:1.45 });
  await page.getByRole('button', { name: 'Fit architecture', exact: true }).click();
  await expect.poll(camera).toEqual({ centerX:1200, centerY:675, userZoom:1 });
});

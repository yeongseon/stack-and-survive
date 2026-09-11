import { expect, test, type Page } from '@playwright/test';

type Diagnostics = {
  engine: string; frames: number; packets: number; generation: number; fps: number;
  selected: string | null; overloaded: boolean; links: string[][];
  camera: { x: number; y: number; zoom: number };
  viewport: { width: number; height: number };
  nodes: { id: string; x: number; y: number; screen: { x: number; y: number } }[];
};
async function state(page: Page): Promise<Diagnostics> {
  return JSON.parse((await page.getByTestId('diagnostics').textContent())!) as Diagnostics;
}
async function point(page: Page, id: string) {
  const node = (await state(page)).nodes.find(n => n.id === id)!;
  const box = (await page.getByTestId('engine-host').boundingBox())!;
  return { x: box.x + node.screen.x, y: box.y + node.screen.y };
}

for (const engine of ['phaser', 'playcanvas']) {
  test(`${engine}: render, real pointer actions, fixture and cleanup`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('/');
    await page.getByLabel('Renderer', { exact: true }).selectOption(engine);
    await expect(page.getByTestId('engine-status')).toHaveText('Ready');
    await expect.poll(async () => (await state(page)).frames).toBeGreaterThan(30);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect((await state(page)).packets).toBe(120);
    const before = await state(page);
    await page.screenshot({ path: testInfo.outputPath(`${engine}-baseline.png`) });
    const app = await point(page, 'app');
    await page.mouse.click(app.x, app.y);
    await expect(page.getByTestId('selected')).toHaveText('app');
    await page.mouse.move(app.x, app.y); await page.mouse.down();
    await page.mouse.move(app.x + 60, app.y - 35, { steps: 12 }); await page.mouse.up();
    await expect.poll(async () => (await state(page)).nodes[1].x).toBeCloseTo(60, 0);
    const box = (await page.getByTestId('engine-host').boundingBox())!;
    await page.mouse.move(box.x + 90, box.y + 60); await page.mouse.down();
    await page.mouse.move(box.x + 130, box.y + 90, { steps: 8 }); await page.mouse.up();
    await expect.poll(async () => (await state(page)).camera.x).toBeCloseTo(40, 0);
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => (await state(page)).camera.zoom).toBeGreaterThan(1);
    await page.getByRole('button', { name: 'SQL overload', exact: true }).click();
    await expect(page.getByTestId('sql-state')).toHaveText('! OVERLOADED');
    await page.getByRole('button', { name: 'Clear connections' }).click();
    await expect.poll(async () => (await state(page)).packets).toBe(0);
    await page.getByRole('button', { name: 'Connect nodes' }).click();
    const internet = await point(page, 'internet');
    await page.mouse.click(internet.x, internet.y);
    await page.getByRole('button', { name: 'Clear connections' }).click();
    const target = await point(page, 'app');
    await page.mouse.click(target.x, target.y);
    expect((await state(page)).links).toHaveLength(0);
    await page.getByRole('button', { name: 'Clear connections' }).click();
    for (const id of ['sql', 'app']) { const p = await point(page, id); await page.mouse.click(p.x, p.y); }
    await expect(page.locator('output')).toContainText('Invalid direction');
    for (const id of ['internet', 'app', 'app', 'sql']) { const p = await point(page, id); await page.mouse.click(p.x, p.y); }
    await expect.poll(async () => (await state(page)).links.length).toBe(2);
    for (const id of ['app', 'sql']) { const p = await point(page, id); await page.mouse.click(p.x, p.y); }
    await expect(page.locator('output')).toContainText('already exists');
    await page.screenshot({ path: testInfo.outputPath(`${engine}-overloaded.png`) });
    const samples: number[] = [];
    for (let i = 0; i < 8; i++) {
      const frame = (await state(page)).frames;
      await expect.poll(async () => (await state(page)).frames).toBeGreaterThan(frame);
      samples.push((await state(page)).fps);
    }
    await page.getByRole('button', { name: 'Reset / remount' }).click();
    await expect.poll(async () => (await state(page)).generation).toBe(1);
    await expect.poll(async () => (await state(page)).nodes[1].x).toBe(0);
    await expect(page.getByTestId('engine-status')).toHaveText('Ready');
    await expect.poll(async () => (await state(page)).frames).toBeGreaterThan(10);
    expect((await state(page)).nodes[1].x).toBe(0);
    expect((await state(page)).overloaded).toBe(false);
    for (const alternate of [engine === 'phaser' ? 'playcanvas' : 'phaser', engine]) {
      await page.getByLabel('Renderer', { exact: true }).selectOption(alternate);
      await expect(page.getByTestId('engine-status')).toHaveText('Ready');
      await expect.poll(async () => (await state(page)).frames).toBeGreaterThan(10);
      await expect(page.locator('canvas')).toHaveCount(1);
    }
    await page.setViewportSize({ width: 1000, height: 850 });
    await expect.poll(async () => page.locator('canvas').evaluate(c => c.clientWidth)).toBeGreaterThan(500);
    await expect.poll(async () => (await state(page)).viewport.width).toBeLessThan(800);
    const resizedApp = await point(page, 'app');
    await page.mouse.click(resizedApp.x, resizedApp.y);
    await expect(page.getByTestId('selected')).toHaveText('app');
    expect(errors).toEqual([]);
    await testInfo.attach('observations', { body: JSON.stringify({ engine, initial: before, fpsSamples: samples, errors }, null, 2), contentType: 'application/json' });
  });
}

test('rapid switching cleans pending async mounts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  for (const engine of ['playcanvas', 'phaser', 'playcanvas', 'phaser']) {
    await page.getByLabel('Renderer', { exact: true }).selectOption(engine);
  }
  await expect(page.getByTestId('engine-status')).toHaveText('Ready');
  await expect.poll(async () => (await state(page)).frames).toBeGreaterThan(15);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

for (const engine of ['phaser', 'playcanvas']) {
  test(`${engine}: touch pointer drag uses the same coordinate adapter`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.goto('http://127.0.0.1:43871/');
      await page.getByLabel('Renderer', { exact: true }).selectOption(engine);
      await expect(page.getByTestId('engine-status')).toHaveText('Ready');
      await expect.poll(async () => (await state(page)).frames).toBeGreaterThan(10);
      const app = await point(page, 'app');
      const session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: app.x, y: app.y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: app.x + 50, y: app.y + 20 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(async () => (await state(page)).nodes[1].x).toBeCloseTo(50, 0);
      await testInfo.attach('touch-result', { body: JSON.stringify(await state(page)), contentType: 'application/json' });
    } finally { await context.close(); }
  });
}

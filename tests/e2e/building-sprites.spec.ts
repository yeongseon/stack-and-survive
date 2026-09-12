import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';
import bounds from '../../art/buildings/bounds.json' with { type: 'json' };
import { buildingAssets } from '../../apps/web/src/building-assets';
import { createHash } from 'node:crypto';

test('original PNG textures load with transparent anchors and real instance modules', async ({ page, request }, info) => {
  await page.goto('/');
  const architecture = baseline(3, true, true);
  const points = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 160 }, { x: 130, y: -150 }];
  architecture.resources.forEach((r, i) => Object.assign(r, points[i]));
  await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), architecture);
  await page.reload(); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-texture-status', /loaded/);
  const textures: { kind: string; loaded: boolean }[] = JSON.parse((await surface.getAttribute('data-texture-status'))!);
  expect(textures.every(texture => texture.loaded)).toBe(true);
  await expect(surface).toHaveAttribute('data-sprite-views', /building-app-service/);
  const spriteViews: { id: string; visible: boolean; depth: number; bodyWidth: number; bodyHeight: number; originX: number; originY: number; modules: { alpha: number }[] }[] = JSON.parse((await surface.getAttribute('data-sprite-views'))!);
  const layers = JSON.parse((await surface.getAttribute('data-sprite-layers'))!);
  for (const sprite of spriteViews) {
    expect(sprite.visible).toBe(true); expect(sprite.depth).toBeGreaterThan(0); expect(sprite.depth).toBeLessThan(layers.state);
  }
  expect(spriteViews.find(s => s.id === 'compute')!.modules).toHaveLength(3);
  expect(spriteViews.find(s => s.id === 'compute')!.modules.every(m => m.alpha === 1)).toBe(true);
  for (const name of ['app-service', 'app-module', 'azure-sql', 'redis', 'protected-edge'] as const) {
    const response = await request.get(`/assets/buildings/${name}.png`);
    expect(response.ok()).toBe(true);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(bounds[name].sha256);
    const metadata = await page.evaluate(async filename => {
      const image = new Image(); image.src = `/assets/buildings/${filename}.png`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, image.width, image.height).data;
      let left = image.width, right = 0, top = image.height, bottom = 0;
      for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        if (pixels[(y * image.width + x) * 4 + 3] > 0) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
      return { width: image.width, height: image.height, cornerAlpha: pixels[3], left, right, top, bottom };
    }, name);
    expect(metadata.width).toBe(512); expect(metadata.height).toBe(512); expect(metadata.cornerAlpha).toBe(0);
    expect(metadata.left).toBeGreaterThan(0); expect(metadata.right).toBeLessThan(511);
    expect(metadata.top).toBeGreaterThan(0); expect(metadata.bottom).toBeLessThan(511);
    expect(metadata.left).toBe(bounds[name].left); expect(metadata.top).toBe(bounds[name].top);
    expect(metadata.right - metadata.left + 1).toBe(bounds[name].width);
    expect(metadata.bottom - metadata.top + 1).toBe(bounds[name].height);
  }
  for (const [kind, asset] of Object.entries(buildingAssets)) {
    const sprite = spriteViews.find(s => s.id === kind)!;
    expect(sprite.bodyWidth).toBeCloseTo(asset.width); expect(sprite.bodyHeight).toBeCloseTo(asset.height);
    expect(sprite.originX).toBeCloseTo(asset.originX); expect(sprite.originY).toBeCloseTo(asset.originY);
  }
  await expect(page.locator('.world-service-badges img')).toHaveCount(4);
  await page.screenshot({ path: info.outputPath('production-building-sprites.png') });
  await page.getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Azure App Service', exact: true }).click();
  await page.getByRole('button', { name: 'Provision instance', exact: true }).click();
  await expect(surface).toHaveAttribute('data-buildings', /"pendingModule":true/);
  await expect.poll(async () => {
    const sprites = JSON.parse((await surface.getAttribute('data-sprite-views'))!);
    return sprites.find((s: { id: string }) => s.id === 'compute').modules.filter((m: { alpha: number }) => m.alpha < 1).length;
  }).toBe(1);
  await expect(page.getByLabel('Initial App instances')).toHaveValue('4', { timeout: 15000 });
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThan(0);
});

test('missing sprite files retain playable procedural fallback', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/assets/buildings/*.png', route => route.fulfill({ status: 404, body: 'Missing fixture' }));
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-texture-status', /loaded/);
  const textures: { loaded: boolean }[] = JSON.parse((await surface.getAttribute('data-texture-status'))!);
  expect(textures.every(texture => !texture.loaded)).toBe(true);
  await expect(surface).toHaveAttribute('data-buildings', /modular-processing-hub/);
  await expect(surface).toHaveAttribute('data-sprite-views', '[]');
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 50) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await expect(page.getByTestId('result-score')).toHaveText('1,073');
  expect(errors).toEqual([]);
});

test('corrupt module image degrades only compute to its procedural renderer', async ({ page }) => {
  await page.route('**/assets/buildings/app-module.png', route => route.fulfill({ status: 200, contentType: 'image/png', body: 'not a PNG' }));
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-sprite-views', /building-azure-sql/);
  const views: { id: string }[] = JSON.parse((await surface.getAttribute('data-sprite-views'))!);
  expect(views.some(s => s.id === 'compute')).toBe(false);
  await expect(surface).toHaveAttribute('data-buildings', /modular-processing-hub/);
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('elapsed').textContent()), { timeout: 5000 }).toBeGreaterThan(0);
});

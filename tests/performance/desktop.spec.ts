import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';

test('measure a real peak workload and disclose actual graphics backend', async ({ page, browser }, info) => {
  const architecture = baseline(3, true, true);
  const positions = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 200 }, { x: 100, y: -200 }];
  architecture.resources.forEach((r, i) => { Object.assign(r, positions[i]); });
  await page.goto('/');
  await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), architecture);
  await page.reload(); const surface = page.locator('[data-renderer="ready"]'); await expect(surface).toHaveCount(1);
  const graphics = await page.locator('canvas').evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2') ?? (canvas as HTMLCanvasElement).getContext('webgl');
    if (!gl) throw new Error('No active WebGL context');
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return { renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), vendor: extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR) };
  });
  await page.getByRole('button', { name: 'Start traffic', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 121) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  await page.getByRole('button', { name: 'Resume traffic', exact: true }).click();
  await surface.scrollIntoViewIfNeeded();
  const measured = await surface.evaluate(async element => {
    const start = performance.now(); let previous = start; const intervals: number[] = [];
    const framesBefore = Number(element.getAttribute('data-frames'));
    const tickBefore = Number(element.getAttribute('data-tick'));
    let maxPackets = 0;
    await new Promise<void>(resolve => {
      const sample = (now: number) => {
        intervals.push(now - previous); previous = now;
        maxPackets = Math.max(maxPackets, Number(element.getAttribute('data-packets')));
        if (now - start >= 20000) resolve(); else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const durationMs = performance.now() - start;
    const renderedFrames = Number(element.getAttribute('data-frames')) - framesBefore;
    intervals.sort((a, b) => a - b);
    return { durationMs, renderedFrames, rendererFps: renderedFrames * 1000 / durationMs,
      frameIntervalP50Ms: intervals[Math.floor(intervals.length * .5)], frameIntervalP95Ms: intervals[Math.floor(intervals.length * .95)],
      maxPackets, tickBefore, tickAfter: Number(element.getAttribute('data-tick')), devicePixelRatio: window.devicePixelRatio };
  });
  expect(measured.tickAfter - measured.tickBefore).toBeGreaterThanOrEqual(19);
  expect(measured.maxPackets).toBeLessThanOrEqual(200);
  await page.getByRole('button', { name: 'Pause traffic', exact: true }).click();
  const evidence = { browser: browser.version(), graphics, viewport: { width: 1440, height: 900 }, fixture: 'Black Friday v0.2, App3 + Cache + WAF, peak500RPS/40%bots', mode: 'headless full Chromium with requested ANGLE Metal; inspect actual renderer before interpreting', measured };
  console.log(JSON.stringify(evidence));
  await info.attach('performance-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});

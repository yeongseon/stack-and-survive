import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';
import { overlaps, type AnnotationRect } from '../../apps/web/src/annotations';

for (const width of [320, 390]) {
  test(`all five service labels avoid each other and official badges at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const architecture = baseline(2, true, true);
    const positions = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 160 }, { x: 130, y: -150 }];
    architecture.resources.forEach((r, i) => Object.assign(r, positions[i]));
    await page.goto('/');
    await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), architecture);
    await page.reload(); const surface = page.locator('[data-renderer="ready"]');
    await expect(surface).toHaveAttribute('data-labels', /width/);
    const box = (await surface.boundingBox())!;
    const labels: AnnotationRect[] = JSON.parse((await surface.getAttribute('data-labels'))!);
    expect(labels).toHaveLength(5);
    const badges = await page.locator('.world-service-badges > .service-icon:not([hidden])').evaluateAll((elements, origin) => elements.map(e => {
      const r = e.getBoundingClientRect(); return { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height };
    }), { x: box.x, y: box.y });
    for (let i = 0; i < labels.length; i++) {
      expect(labels.slice(0, i).some(r => overlaps(r, labels[i]))).toBe(false);
      expect(badges.some(r => overlaps(r, labels[i]))).toBe(false);
      expect(labels[i].x + labels[i].width).toBeLessThanOrEqual(box.width);
      expect(labels[i].y + labels[i].height).toBeLessThanOrEqual(box.height);
    }
  });
}

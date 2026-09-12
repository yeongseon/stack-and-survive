import { expect, it } from 'vitest';
import { overlaps, placeCaptions } from './annotations';

it('places compact labels without overlap or leaving the viewport', () => {
  const points = [{ x: 65, y: 145 }, { x: 184, y: 190 }, { x: 303, y: 235 }, { x: 83, y: 263 }, { x: 244, y: 121 }];
  const size = points.map(() => ({ width: 70, height: 26 }));
  const obstacles = points.map(p => ({ x: p.x - 16, y: p.y - 80, width: 32, height: 32 }));
  const labels = placeCaptions(points, size, { width: 370, height: 430 }, obstacles);
  labels.forEach((label, i) => {
    expect(label.x).toBeGreaterThanOrEqual(0); expect(label.y + label.height).toBeLessThanOrEqual(430);
    expect(obstacles.some(o => overlaps(label, o))).toBe(false);
    expect(labels.slice(0, i).some(o => overlaps(label, o))).toBe(false);
  });
});

import { expect, it } from 'vitest';
import { tycoonPoint } from './tycoon-layout';
import { createPlayerProjection, fitPlayerCamera, panPlayerCamera, resizePlayerCamera, zoomPlayerCamera, focusPlayerCamera } from './player-camera';
import { createController } from './controller';

const widths = [320, 390, 1024, 1440, 1920];
it.each(widths)('preserves existing Fit anchors and inverse projection at width %s', width => {
  const viewport = { width, height: 640 };
  const fit = fitPlayerCamera(viewport);
  for (const userZoom of [.75, 1, 1.8]) {
    const projection = createPlayerProjection({ ...fit, userZoom }, viewport);
    expect(projection.effectiveZoom).toBe(projection.fitZoom * userZoom);
    for (const kind of ['internet', 'edge', 'compute', 'cache', 'database'] as const) {
      const world = projection.resourceWorld(kind);
      const screen = projection.worldToScreen(world);
      const roundtrip = projection.screenToWorld(screen);
      expect(roundtrip.x).toBeCloseTo(world.x, 9); expect(roundtrip.y).toBeCloseTo(world.y, 9);
      if (userZoom === 1) {
        const existing = tycoonPoint(kind, width, 640);
        expect(screen.x).toBeCloseTo(existing.x, 9); expect(screen.y).toBeCloseTo(existing.y, 9);
      }
    }
  }
});
it('clamps finite zoom and pan, rejects invalid inputs, and prevents losing the architecture', () => {
  const viewport = { width: 1024, height: 768 };
  const fit = fitPlayerCamera(viewport);
  expect(createPlayerProjection({ ...fit, userZoom: 99 }, viewport).state.userZoom).toBe(1.8);
  expect(createPlayerProjection({ ...fit, userZoom: -1 }, viewport).state.userZoom).toBe(.75);
  const clamped = createPlayerProjection({ centerX: 1e9, centerY: -1e9, userZoom: 1.8 }, viewport);
  expect(clamped.state.centerX).toBeLessThan(clamped.worldBounds.width);
  expect(clamped.state.centerY).toBeGreaterThan(0);
  for (const width of [0, -1, NaN, Infinity]) expect(() => fitPlayerCamera({ width, height: 640 })).toThrow();
  expect(() => createPlayerProjection({ ...fit, centerX: NaN }, viewport)).toThrow();
  expect(() => createPlayerProjection({ ...fit, userZoom: Infinity }, viewport)).toThrow();
});
it('keeps pointer world point stable through zoom unless pan bounds must clamp', () => {
  const viewport = { width: 1440, height: 900 }, pointer = { x: 820, y: 420 };
  const fit = fitPlayerCamera(viewport), before = createPlayerProjection(fit, viewport).screenToWorld(pointer);
  const after = createPlayerProjection(zoomPlayerCamera(fit, viewport, 1.5, pointer), viewport);
  expect(after.screenToWorld(pointer).x).toBeCloseTo(before.x, 9);
  expect(after.screenToWorld(pointer).y).toBeCloseTo(before.y, 9);
  const moved = createPlayerProjection(panPlayerCamera(after.state, viewport, { x: 20, y: -10 }), viewport);
  expect(moved.worldToScreen(before).x).toBeCloseTo(pointer.x + 20, 9);
  expect(moved.worldToScreen(before).y).toBeCloseTo(pointer.y - 10, 9);
});
it('preserves normalized center on resize and focuses a resource without changing zoom', () => {
  const from = { width: 1440, height: 900 }, to = { width: 390, height: 844 };
  const old = { ...fitPlayerCamera(from), userZoom: 1.5 };
  const resized = resizePlayerCamera(old, from, to);
  expect(resized.userZoom).toBe(1.5);
  expect(resized.centerX).toBeCloseTo(fitPlayerCamera(to).centerX);
  expect(resized.centerY).toBeCloseTo(fitPlayerCamera(to).centerY);
  const focused = focusPlayerCamera(resized, to, 'compute');
  expect(focused.userZoom).toBe(1.5);
  const projection = createPlayerProjection(focused, to);
  expect(projection.resourceScreen('compute').x).toBeCloseTo(to.width / 2);
  expect(projection.resourceScreen('compute').y).toBeCloseTo(to.height / 2);
});
it('100 pure camera operations cannot publish controller state or change runtime provenance', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const before = controller.getSnapshot(); let publications = 0;
  const unsubscribe = controller.subscribe(() => publications++);
  const viewport = { width: 1024, height: 768 }; let state = fitPlayerCamera(viewport);
  for (let i = 0; i < 100; i++) {
    state = zoomPlayerCamera(state, viewport, i % 2 ? .75 : 1.8, { x: 300, y: 400 });
    state = panPlayerCamera(state, viewport, { x: 10, y: -10 });
  }
  expect(controller.getSnapshot()).toBe(before); expect(publications).toBe(0);
  expect(JSON.stringify(before.state)).not.toContain('userZoom');
  expect(JSON.stringify(before.challenge)).not.toContain('centerX');
  unsubscribe(); controller.destroy();
});

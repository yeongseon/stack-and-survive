import { expect, it } from 'vitest';
import { tycoonPoint, playerMap } from './tycoon-layout';
import { createPlayerProjection, fitPlayerCamera, panPlayerCamera, resizePlayerCamera, zoomPlayerCamera, focusPlayerCamera } from './player-camera';
import { createController } from './controller';

const widths = [320, 390, 1024, 1440, 1920];
it.each(widths)('preserves canonical geography and inverse projection at width %s', width => {
  const viewport = { width, height: 640 };
  const fit = fitPlayerCamera(viewport);
  for (const userZoom of [.75, 1, 1.8]) {
    const projection = createPlayerProjection({ ...fit, userZoom }, viewport);
    expect(projection.effectiveZoom).toBe(projection.fitZoom * userZoom);
    for (const kind of ['internet', 'edge', 'compute', 'cache', 'database'] as const) {
      const world = projection.resourceWorld(kind);
      expect(world).toEqual(tycoonPoint(kind));
      expect(projection.worldBounds).toEqual({x:0,y:0,...playerMap});
      const screen = projection.worldToScreen(world);
      const roundtrip = projection.screenToWorld(screen);
      expect(roundtrip.x).toBeCloseTo(world.x, 9); expect(roundtrip.y).toBeCloseTo(world.y, 9);
      if (userZoom === 1) {
        expect(screen.x).toBeCloseTo(width/2+(world.x-playerMap.width/2)*projection.fitZoom,9);
        expect(screen.y).toBeCloseTo(320+(world.y-playerMap.height/2)*projection.fitZoom,9);
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
it('preserves canonical center on landscape resize and focuses without changing zoom', () => {
  const from = { width: 1440, height: 900 }, to = { width: 844, height: 390 };
  const old = { centerX: 1300, centerY: 750, userZoom: 1.5 };
  const resized = resizePlayerCamera(old, from, to);
  expect(resized.userZoom).toBe(1.5);
  expect(resized.centerX).toBeCloseTo(old.centerX);
  expect(resized.centerY).toBeCloseTo(old.centerY);
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

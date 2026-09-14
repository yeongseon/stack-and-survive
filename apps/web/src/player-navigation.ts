import type { Kind } from '@stack-and-survive/schema';
import type { Point } from './editor';
import { createPlayerProjection, fitPlayerCamera, focusPlayerCamera, panPlayerCamera, resizePlayerCamera, zoomPlayerCamera, type PlayerCameraState, type PlayerViewport } from './player-camera';

export const zoomPresets = [.75, .9, 1, 1.25, 1.5, 1.8] as const;
export function wheelZoomFactor(delta: number, mode: number, height: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
  return Math.exp(-Math.max(-120, Math.min(120, pixels)) * .002);
}
export function createPlayerNavigation(initial: PlayerViewport = { width: 1, height: 1 }) {
  let viewport = initial;
  let projection = createPlayerProjection(fitPlayerCamera(viewport), viewport);
  const listeners = new Set<() => void>();
  const update = (state: PlayerCameraState) => {
    const next = createPlayerProjection(state, viewport);
    if (next.state.centerX === projection.state.centerX && next.state.centerY === projection.state.centerY && next.state.userZoom === projection.state.userZoom
      && next.fitZoom === projection.fitZoom && next.worldBounds.width === projection.worldBounds.width && next.worldBounds.height === projection.worldBounds.height) return;
    projection = next; listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => projection,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    resize(next: PlayerViewport) {
      if (next.width <= 0 || next.height <= 0 || next.width === viewport.width && next.height === viewport.height) return;
      const state = resizePlayerCamera(projection.state, viewport, next); viewport = next; update(state);
    },
    zoom(value: number, anchor: Point = { x: viewport.width / 2, y: viewport.height / 2 }) { update(zoomPlayerCamera(projection.state, viewport, value, anchor)); },
    step(direction: -1 | 1) {
      const zoom = projection.state.userZoom;
      const next = direction > 0 ? zoomPresets.find(value => value > zoom + 1e-6) ?? 1.8 : [...zoomPresets].reverse().find(value => value < zoom - 1e-6) ?? .75;
      this.zoom(next);
    },
    pan(delta: Point) { update(panPlayerCamera(projection.state, viewport, delta)); },
    fit() { update(fitPlayerCamera(viewport)); },
    focus(kind: Kind) { update(focusPlayerCamera(projection.state, viewport, kind)); },
  };
}
export type PlayerNavigation = ReturnType<typeof createPlayerNavigation>;

/** Pointer release is the only tap path; navigation/cancellation suppresses every remaining finger. */
export function attachPlayerNavigation(canvas: HTMLCanvasElement, navigation: PlayerNavigation, tap: (point: Point) => void) {
  const pointers = new Map<number, { start: Point; last: Point }>();
  let navigated = false;
  const point = (event: PointerEvent | WheelEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.clientWidth / rect.width, y: (event.clientY - rect.top) * canvas.clientHeight / rect.height };
  };
  const pair = () => [...pointers.values()].slice(0, 2).map(p => p.last);
  const distance = (points: Point[]) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  const midpoint = (points: Point[]) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || pointers.size >= 2) return;
    if (!pointers.size) navigated = false;
    const p = point(event); pointers.set(event.pointerId, { start: p, last: p });
    if (pointers.size > 1) navigated = true;
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    const pointer = pointers.get(event.pointerId); if (!pointer) return;
    const p = point(event), previous = pointer.last;
    if (pointers.size === 2) {
      const before = pair(); pointer.last = p; const after = pair();
      const length = distance(before);
      if (length >= 2) navigation.zoom(navigation.getSnapshot().state.userZoom * distance(after) / length, midpoint(before));
      const a = midpoint(before), b = midpoint(after); navigation.pan({ x: b.x - a.x, y: b.y - a.y });
    } else {
      const wasNavigation = navigated;
      if (Math.hypot(p.x - pointer.start.x, p.y - pointer.start.y) > 6) navigated = true;
      if (navigated) {
        const from = wasNavigation ? previous : pointer.start;
        navigation.pan({ x: p.x - from.x, y: p.y - from.y });
      }
      pointer.last = p;
    }
  };
  const release = (event: PointerEvent) => {
    const pointer = pointers.get(event.pointerId); if (!pointer) return;
    const p = point(event);
    const isTap = event.type === 'pointerup' && !navigated && pointers.size === 1 && Math.hypot(p.x - pointer.start.x, p.y - pointer.start.y) <= 6
      && p.x >= 0 && p.y >= 0 && p.x <= canvas.clientWidth && p.y <= canvas.clientHeight;
    pointers.delete(event.pointerId); if (event.type !== 'pointerup') navigated = true;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (isTap) tap(p);
  };
  const cancel = () => {
    const ids = [...pointers.keys()]; pointers.clear(); navigated = true;
    for (const id of ids) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    navigation.zoom(navigation.getSnapshot().state.userZoom * wheelZoomFactor(event.deltaY, event.deltaMode, canvas.clientHeight), point(event));
  };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release); canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', cancel);
  return () => {
    cancel(); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', release); canvas.removeEventListener('pointercancel', release); canvas.removeEventListener('lostpointercapture', release);
    canvas.removeEventListener('wheel', wheel); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', cancel);
  };
}

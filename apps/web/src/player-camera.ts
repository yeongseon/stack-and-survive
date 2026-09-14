import type { Kind } from '@stack-and-survive/schema';
import { project, unproject, type Point } from './editor';
import { tycoonPoint } from './tycoon-layout';

export type PlayerViewport = Readonly<{ width: number; height: number }>;
export type PlayerCameraState = Readonly<{ centerX: number; centerY: number; userZoom: number }>;
export const playerZoomRange = Object.freeze({ min: .75, max: 1.8 });
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function dimensions(viewport: PlayerViewport) {
  if (![viewport.width, viewport.height].every(value => Number.isFinite(value) && value > 0)) throw new Error('Player viewport must have finite positive dimensions');
  const fitZoom = Math.min(viewport.width / 1440, viewport.height / 900);
  return { fitZoom, width: viewport.width / fitZoom, height: viewport.height / fitZoom };
}
function finite(...values: number[]) {
  if (!values.every(Number.isFinite)) throw new Error('Player camera coordinates must be finite');
}
export function fitPlayerCamera(viewport: PlayerViewport): PlayerCameraState {
  const bounds = dimensions(viewport);
  return { centerX: bounds.width / 2, centerY: bounds.height / 2, userZoom: 1 };
}

/** The Fit plane is responsive presentation geometry, not simulation resource coordinates. */
export function createPlayerProjection(input: PlayerCameraState, viewport: PlayerViewport) {
  finite(input.centerX, input.centerY, input.userZoom);
  const bounds = dimensions(viewport);
  const userZoom = clamp(input.userZoom, playerZoomRange.min, playerZoomRange.max);
  const effectiveZoom = bounds.fitZoom * userZoom;
  const clampAxis = (center: number, length: number, visible: number) => {
    const inset = visible * .4;
    return inset >= length / 2 ? length / 2 : clamp(center, inset, length - inset);
  };
  const state: PlayerCameraState = {
    centerX: clampAxis(input.centerX, bounds.width, viewport.width / effectiveZoom),
    centerY: clampAxis(input.centerY, bounds.height, viewport.height / effectiveZoom), userZoom,
  };
  const camera = { x: -state.centerX, y: -state.centerY, zoom: effectiveZoom };
  const worldToScreen = (point: Point) => { finite(point.x, point.y); return project(point, camera, viewport.width, viewport.height); };
  const screenToWorld = (point: Point) => { finite(point.x, point.y); return unproject(point, camera, viewport.width, viewport.height); };
  const resourceWorld = (kind: Kind) => {
    const fitted = tycoonPoint(kind, viewport.width, viewport.height);
    return { x: fitted.x / bounds.fitZoom, y: fitted.y / bounds.fitZoom };
  };
  return { state, fitZoom: bounds.fitZoom, effectiveZoom, worldBounds: { x: 0, y: 0, width: bounds.width, height: bounds.height },
    worldToScreen, screenToWorld, resourceWorld, resourceScreen: (kind: Kind) => worldToScreen(resourceWorld(kind)),
    fitToScreen: (point: Point) => worldToScreen({ x: point.x / bounds.fitZoom, y: point.y / bounds.fitZoom }),
    screenToFit: (point: Point) => { const world = screenToWorld(point); return { x: world.x * bounds.fitZoom, y: world.y * bounds.fitZoom }; },
  };
}
export function zoomPlayerCamera(state: PlayerCameraState, viewport: PlayerViewport, userZoom: number, anchor: Point): PlayerCameraState {
  finite(userZoom);
  const before = createPlayerProjection(state, viewport);
  const world = before.screenToWorld(anchor);
  const zoom = before.fitZoom * clamp(userZoom, playerZoomRange.min, playerZoomRange.max);
  return createPlayerProjection({ userZoom, centerX: world.x - (anchor.x - viewport.width / 2) / zoom,
    centerY: world.y - (anchor.y - viewport.height / 2) / zoom }, viewport).state;
}
export function panPlayerCamera(state: PlayerCameraState, viewport: PlayerViewport, delta: Point): PlayerCameraState {
  finite(delta.x, delta.y);
  const current = createPlayerProjection(state, viewport);
  return createPlayerProjection({ ...current.state, centerX: current.state.centerX - delta.x / current.effectiveZoom,
    centerY: current.state.centerY - delta.y / current.effectiveZoom }, viewport).state;
}
export function resizePlayerCamera(state: PlayerCameraState, from: PlayerViewport, to: PlayerViewport): PlayerCameraState {
  const before = createPlayerProjection(state, from), after = dimensions(to);
  return createPlayerProjection({ userZoom: before.state.userZoom,
    centerX: before.state.centerX / before.worldBounds.width * after.width,
    centerY: before.state.centerY / before.worldBounds.height * after.height }, to).state;
}
export function focusPlayerCamera(state: PlayerCameraState, viewport: PlayerViewport, kind: Kind): PlayerCameraState {
  const current = createPlayerProjection(state, viewport), target = current.resourceWorld(kind);
  return createPlayerProjection({ ...current.state, centerX: target.x, centerY: target.y }, viewport).state;
}

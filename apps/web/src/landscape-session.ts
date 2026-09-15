import type { Clock } from './controller';

export function requiresLandscape(width: number, height: number) { return width <= 900 && height > width; }

export function createLandscapeClock(): Clock & { hold(value: boolean): void } {
  let held = false;
  return {
    hold(value) { held = value; },
    start(callback) {
      const timer = globalThis.setInterval(() => { if (!held) callback(); }, 1000);
      return () => globalThis.clearInterval(timer);
    },
  };
}

export async function enhanceLandscape(element: HTMLElement): Promise<string | null> {
  try {
    if (!document.fullscreenElement && element.requestFullscreen) await element.requestFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (direction: string) => Promise<void> };
    if (orientation?.lock) await orientation.lock('landscape');
    return null;
  } catch {
    return 'Automatic rotation/fullscreen is unavailable. Rotate manually; landscape play still works.';
  }
}

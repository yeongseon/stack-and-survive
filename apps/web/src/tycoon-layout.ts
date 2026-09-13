import { baseline } from '@stack-and-survive/cloud-domain';
import type { Architecture, Kind } from '@stack-and-survive/schema';
import type { Runtime } from '@stack-and-survive/simulation/runtime';

export const tycoonPositions: Record<Kind, { x: number; y: number }> = {
  internet: { x: -400, y: 0 }, edge: { x: -210, y: 0 },
  compute: { x: 0, y: 0 }, cache: { x: 190, y: -100 }, database: { x: 390, y: 20 },
};
// Canvas, hit testing and DOM controls share these visual-only viewport anchors.
export function tycoonPoint(kind: Kind, width: number, height: number) {
  const anchors: Record<Kind, [number, number]> = width >= 900 ? {
    internet: [.10, .58], edge: [.28, .58], compute: [.48, .58], cache: [.68, .40], database: [.88, .58],
  } : {
    internet: [.24, .23], edge: [.73, .33], compute: [.43, .52], cache: [.24, .76], database: [.76, .79],
  };
  const [x, y] = anchors[kind];
  return { x: width * x, y: height * y };
}
export type TycoonSlot = 'edge' | 'cache' | 'app-2' | 'app-3' | 'app-4';
export type SlotState = 'empty' | 'provisioning' | 'active';
export function tycoonArchitecture(): Architecture {
  const architecture = baseline();
  for (const resource of architecture.resources) Object.assign(resource, tycoonPositions[resource.kind]);
  return architecture;
}
export function slotState(runtime: Runtime, slot: TycoonSlot): SlotState {
  if (slot === 'edge' || slot === 'cache') {
    const resource = runtime.architecture.resources.find(r => r.kind === slot);
    return !resource ? 'empty' : resource.remaining > 0 ? 'provisioning' : 'active';
  }
  const instance = Number(slot.slice(4));
  const count = runtime.architecture.resources.find(r => r.kind === 'compute')?.instances ?? 0;
  return instance <= count ? 'active' : instance === count + 1 && runtime.scaleDue !== null ? 'provisioning' : 'empty';
}

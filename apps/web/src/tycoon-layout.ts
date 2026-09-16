import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import type { Architecture, Kind } from '@stack-and-survive/schema';
import type { Runtime } from '@stack-and-survive/simulation/runtime';

export const tycoonPositions: Record<Kind, { x: number; y: number }> = {
  internet: { x: -400, y: 0 }, edge: { x: -210, y: 0 },
  compute: { x: 0, y: 0 }, cache: { x: 190, y: -100 }, database: { x: 390, y: 20 },
};
export const playerMap = Object.freeze({ width: 2400, height: 1350 });
const geography: Readonly<Record<Kind, Readonly<{ x: number; y: number }>>> = Object.freeze({
  internet: Object.freeze({ x: 580, y: 640 }), edge: Object.freeze({ x: 875, y: 725 }),
  compute: Object.freeze({ x: 1190, y: 790 }), cache: Object.freeze({ x: 1510, y: 600 }), database: Object.freeze({ x: 1830, y: 825 }),
});
// Legacy dimensions are accepted for callers; player geography never depends on them.
export function tycoonPoint(kind: Kind, _width?: number, _height?: number) { void _width; void _height; return { ...geography[kind] }; }
export type TycoonSlot = 'edge' | 'cache' | 'app-2' | 'app-3' | 'app-4';
export type SlotState = 'empty' | 'provisioning' | 'active';
export function tycoonArchitecture(): Architecture {
  return canonicalPlayerStart();
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

import { baseline } from '@stack-and-survive/cloud-domain';
import type { Architecture, Kind } from '@stack-and-survive/schema';
import type { Runtime } from '@stack-and-survive/simulation/runtime';

export const tycoonPositions: Record<Kind, { x: number; y: number }> = {
  internet: { x: -260, y: -100 }, edge: { x: 0, y: -160 },
  compute: { x: 0, y: 30 }, cache: { x: -240, y: 180 }, database: { x: 240, y: 180 },
};
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

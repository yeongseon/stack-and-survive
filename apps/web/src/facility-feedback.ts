import { appHorizontalScaling, definitions } from '@stack-and-survive/cloud-domain';
import type { Kind } from '@stack-and-survive/schema';
import type { View } from './controller';

export const facilityRoles: Record<Kind, string> = {
  internet: 'INTAKE', edge: 'PROTECTED EDGE', compute: 'APP', cache: 'CACHE', database: 'SQL',
};

export function facilityConstruction(view: View, kind: Kind) {
  const runtime = view.state.runtime;
  const resource = runtime.architecture.resources.find(item => item.kind === kind);
  const change = runtime.infrastructureChanges.find(item => item.kind === kind);
  let label = 'BUILDING';
  let remaining: number;
  let duration: number;
  if (kind === 'compute' && runtime.scaleDue !== null) {
    remaining = Math.max(0, runtime.scaleDue - runtime.time);
    duration = appHorizontalScaling.addDelay;
    label = 'EXPANDING';
  } else if (change) {
    remaining = Math.max(0, change.due - runtime.time);
    duration = change.due - change.started;
    label = change.type === 'SCALE_IN' ? 'DRAINING' : change.type.includes('REPLICA') ? 'REPLICA CHANGE' : 'TIER CHANGE';
  } else if (resource && resource.remaining > 0) {
    remaining = resource.remaining;
    duration = definitions[kind].provisioning;
  } else return null;
  return { label, remaining, progress: duration > 0 ? Math.max(0, Math.min(1, 1 - remaining / duration)) : 0 };
}

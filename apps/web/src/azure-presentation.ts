import type { View } from './controller';
import type { Kind } from '@stack-and-survive/schema';
import { resourceVisualState } from './resource-visual-state';
import type { AzureHealth } from './AzureResourceNode';
import type { AzureServiceId } from './azure-service-catalog';

export interface AzureNodePresentation {
  id: string; service: AzureServiceId; kind: Exclude<Kind, 'internet'>;
  instances: number; health: AzureHealth; utilization: number | null;
  lifecycle: string; bottleneck: boolean;
}
const mappings = [
  ['compute', 'app-service', 'app'], ['database', 'sql-database', 'sql'],
  ['cache', 'managed-redis', 'cache'], ['edge', 'protected-edge', 'edge'],
] as const;
/** Presentation-only projection: reuse established pressure states, never infer CPU or p95. */
export function azureNodePresentations(view: View): AzureNodePresentation[] {
  const visual = resourceVisualState(view);
  const requests = view.snapshot?.requests;
  return mappings.map(([kind, service, key]) => {
    const resource = view.state.runtime.architecture.resources.find(r => r.kind === kind);
    const state = visual[key];
    const utilization = state.lifecycle !== 'active' ? null : kind === 'compute' ? requests?.app.utilization ?? null
      : kind === 'database' ? requests ? Math.max(requests.sql.readUtilization, requests.sql.writeUtilization) : null
        : kind === 'cache' ? requests?.cache.utilization ?? null : null;
    const health: AzureHealth = state.lifecycle !== 'active' ? 'unknown' : state.pressure === 'overcapacity' ? 'critical'
      : state.pressure === 'warning' ? 'warning' : state.pressure === 'healthy' ? 'healthy' : 'unknown';
    return { id: resource?.id ?? kind, service, kind, instances: resource?.instances ?? 0, health, utilization,
      lifecycle: state.lifecycle === 'absent' ? 'Not deployed' : state.lifecycle === 'provisioning' ? `Construction · ${state.remaining}s` : 'Active',
      bottleneck: state.pressure === 'overcapacity' };
  });
}

import type { Resource } from '@stack-and-survive/schema';
import { appTiers, databaseTiers, readReplica, appHorizontalScaling, resourceTier, resourceRunningCost } from '@stack-and-survive/cloud-domain';
import type { ActionRequest, Controller, View } from './controller';
import { formatMoneyRate, formatMoneyReason } from './money';
import './scaling-controls.css';
export function ScalingControls({ resource, view, controller }: { resource: Resource; view: View; controller: Controller }) {
  const tier = resourceTier(resource), app = resource.kind === 'compute';
  const definition = app ? appTiers[tier - 1] : databaseTiers[tier - 1];
  const pending = view.state.runtime.infrastructureChanges.find(change => change.kind === resource.kind);
  const actions: { label: string; request: ActionRequest }[] = app ? [
    { label: '− Instance', request: { type: 'SCALE_IN' } }, { label: '+ Instance', request: { type: 'SCALE_OUT' } },
    { label: '↓ App tier', request: { type: 'SCALE_DOWN_APP' } }, { label: '↑ App tier', request: { type: 'SCALE_UP_APP' } },
  ] : [
    { label: '↓ SQL tier', request: { type: 'SCALE_DOWN_DATABASE' } }, { label: '↑ SQL tier', request: { type: 'SCALE_UP_DATABASE' } },
    { label: '− Read replica', request: { type: 'REMOVE_READ_REPLICA' } }, { label: '+ Read replica', request: { type: 'ADD_READ_REPLICA' } },
  ];
  const requests = view.snapshot?.requests;
  return <div className="scaling-controls" aria-label={app ? 'App scaling controls' : 'SQL scaling controls'}>
    <strong>Tier {tier} · {definition.name}</strong>
    {app ? <p aria-label={`${resource.instances} of 4 App instances`}>{'■'.repeat(resource.instances)}{'□'.repeat(4 - resource.instances)} · {resource.instances}/4 instances</p>
      : <p>Primary ×1 · Read replicas {resource.readReplicas ?? 0}/{readReplica.maximum}</p>}
    {app ? <p>App pressure: {requests ? `${Math.round(requests.app.utilization * 100)}%` : 'Not measured'}<br/>Capacity: {appTiers[tier - 1].capacity * resource.instances} req/s</p>
      : <p>Reads: {requests ? `${Math.round(requests.sql.readUtilization * 100)}%` : 'Not measured'} · {databaseTiers[tier - 1].reads + (resource.readReplicas ?? 0) * readReplica.capacity}/s<br/>Writes: {requests ? `${Math.round(requests.sql.writeUtilization * 100)}%` : 'Not measured'} · {databaseTiers[tier - 1].writes}/s</p>}
    <p>Running {formatMoneyRate(resourceRunningCost(resource), 'min')}</p>
    {pending && <p role="status">{pending.type === 'SCALE_IN' ? 'Draining last App bay' : pending.type.includes('REPLICA') ? 'Changing read replicas' : 'Changing tier'} · {Math.max(0, pending.due - view.state.runtime.time)}s</p>}
    <div className="scaling-action-grid">{actions.map(({ label, request }) => {
      const reason = controller.actionReason(request);
      return <button key={request.type} type="button" disabled={reason !== null} title={reason ? formatMoneyReason(reason) ?? reason : label} onClick={() => controller.queueAction(request)}>{label}</button>;
    })}</div>
    <small>{app ? `More machines: +${appHorizontalScaling.addDelay}s / −${appHorizontalScaling.removeDelay}s. Stronger machines: ${appTiers[tier-1].delay}s tier change, higher cost per instance.` : `Tier change: ${databaseTiers[tier-1].delay}s. Read replica: +${readReplica.addDelay}s / −${readReplica.removeDelay}s, +${formatMoneyRate(readReplica.cost, 'min')} each. Replicas never add write capacity.`} Current capacity and cost remain until activation.</small>
  </div>;
}

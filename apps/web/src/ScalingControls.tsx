import type { Resource } from '@stack-and-survive/schema';
import { useId } from 'react';
import { appTiers, databaseTiers, readReplica, appHorizontalScaling, resourceTier, resourceRunningCost } from '@stack-and-survive/cloud-domain';
import type { ActionRequest, Controller, View } from './controller';
import { formatMoneyRate, formatMoneyReason } from './money';
import './scaling-controls.css';
import { facilityConstruction } from './facility-feedback';
export function ScalingControls({ resource, view, controller }: { resource: Resource; view: View; controller: Controller }) {
  const id = useId();
  const tier = resourceTier(resource), app = resource.kind === 'compute';
  const definition = app ? appTiers[tier - 1] : databaseTiers[tier - 1];
  const pending = view.state.runtime.infrastructureChanges.find(change => change.kind === resource.kind);
  const construction = facilityConstruction(view, resource.kind);
  const actions: { label: string; name: string; detail: string; request: ActionRequest }[] = app ? [
    { label: '− Instance', name: 'Scale in', detail: `Remove one machine · ${appHorizontalScaling.removeDelay}s`, request: { type: 'SCALE_IN' } },
    { label: '+ Instance', name: 'Scale out', detail: `Add one machine · ${appHorizontalScaling.addDelay}s`, request: { type: 'SCALE_OUT' } },
    { label: '↓ App tier', name: 'Scale down', detail: `Lower capacity and cost · ${definition.delay}s`, request: { type: 'SCALE_DOWN_APP' } },
    { label: '↑ App tier', name: 'Scale up', detail: `Stronger machines · ${definition.delay}s`, request: { type: 'SCALE_UP_APP' } },
  ] : [
    { label: '↓ SQL tier', name: 'Scale down', detail: `Lower reads/writes and cost · ${definition.delay}s`, request: { type: 'SCALE_DOWN_DATABASE' } },
    { label: '↑ SQL tier', name: 'Scale up', detail: `More reads and writes · ${definition.delay}s`, request: { type: 'SCALE_UP_DATABASE' } },
    { label: '− Read replica', name: 'Remove replica', detail: `Reduce read capacity · ${readReplica.removeDelay}s`, request: { type: 'REMOVE_READ_REPLICA' } },
    { label: '+ Read replica', name: 'Add replica', detail: `Reads only · ${readReplica.addDelay}s`, request: { type: 'ADD_READ_REPLICA' } },
  ];
  const queued = view.queuedActions.some(action => actions.some(({ request }) => request.type === action.type));
  const requests = view.snapshot?.requests;
  return <section className="scaling-controls" aria-label={app ? 'App scaling controls' : 'SQL scaling controls'}>
    <strong>Tier {tier} · {definition.name}</strong>
    {app ? <p aria-label={`${resource.instances} of 4 App instances`}>{'■'.repeat(resource.instances)}{'□'.repeat(4 - resource.instances)} · {resource.instances}/4 instances</p>
      : <p>Primary ×1 · Read replicas {resource.readReplicas ?? 0}/{readReplica.maximum}</p>}
    <output className="scaling-status" aria-live="polite">{queued ? 'Request queued · starts next tick' : construction ? `${pending?.type === 'SCALE_IN' ? 'Draining last App bay' : pending?.type.includes('REPLICA') ? 'Changing read replicas' : pending ? 'Changing tier' : 'Expanding App'} · ${construction.remaining > 0 ? `${construction.remaining}s remaining` : 'Activating next tick'}` : 'No change pending'}</output>
    <div className="scaling-action-grid">{actions.map(({ label, name, detail, request }) => {
      const reason = view.state.runtime.status === 'PREPARATION' ? 'Available when opening traffic starts.' : controller.actionReason(request);
      const description = `${id}-${request.type}`;
      return <div key={request.type} className="scaling-action">
        <button type="button" aria-label={`${name} · ${label}`} aria-describedby={description} disabled={reason !== null} onClick={() => controller.queueAction(request)}><strong>{name}</strong><span>{label}</span></button>
        <small id={description}>{reason ? formatMoneyReason(reason) ?? reason : detail}</small>
      </div>;
    })}</div>
    {app ? <p>App pressure: {requests ? `${Math.round(requests.app.utilization * 100)}%` : 'Not measured'}<br/>Capacity: {appTiers[tier - 1].capacity * resource.instances} req/s</p>
      : <p>Reads: {requests ? `${Math.round(requests.sql.readUtilization * 100)}%` : 'Not measured'} · {databaseTiers[tier - 1].reads + (resource.readReplicas ?? 0) * readReplica.capacity}/s<br/>Writes: {requests ? `${Math.round(requests.sql.writeUtilization * 100)}%` : 'Not measured'} · {databaseTiers[tier - 1].writes}/s</p>}
    <p>Running {formatMoneyRate(resourceRunningCost(resource), 'min')}</p>
    <small>{app ? `More machines: +${appHorizontalScaling.addDelay}s / −${appHorizontalScaling.removeDelay}s. Stronger machines: ${appTiers[tier-1].delay}s tier change, higher cost per instance.` : `Tier change: ${databaseTiers[tier-1].delay}s. Read replica: +${readReplica.addDelay}s / −${readReplica.removeDelay}s, +${formatMoneyRate(readReplica.cost, 'min')} each. Replicas never add write capacity.`} Current capacity and cost remain until activation.</small>
  </section>;
}

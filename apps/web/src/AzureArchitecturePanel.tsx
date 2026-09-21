import { useEffect, useId, useRef, useState } from 'react';
import type { Controller, View } from './controller';
import type { PlayerNavigation } from './player-navigation';
import { definitions, appTiers, databaseTiers, resourceTier, resourceRunningCost, readReplica } from '@stack-and-survive/cloud-domain';
import { AzureResourceNode } from './AzureResourceNode';
import { azureServices } from './azure-service-catalog';
import { azureNodePresentations } from './azure-presentation';
import { tycoonPositions } from './tycoon-layout';
import { formatMoneyRate, formatMoneyReason } from './money';
import './azure-architecture.css';

export function AzureArchitecturePanel({ controller, view, navigation, onInspect }: { controller: Controller; view: View; navigation: PlayerNavigation; onInspect: (id: string, opener: HTMLElement | null) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) close.current?.focus({ preventScroll: true }); }, [open]);
  const dismiss = () => { setOpen(false); trigger.current?.focus(); };
  const nodes = azureNodePresentations(view);
  return <aside className="azure-catalog" aria-label="Azure architecture catalog">
    <button ref={trigger} type="button" className="azure-catalog-toggle" aria-label="Azure service guide" aria-describedby={`${id}-hint`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><span aria-hidden="true">ⓘ </span>Azure service guide<small id={`${id}-hint`}>Resource roles &amp; status</small></button>
    {open && <section id={id} className="azure-services-panel" aria-label="Azure services panel" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); } }}>
      <header><div><small>SERVICE GUIDE</small><h2>Service roles</h2></div><button ref={close} type="button" onClick={dismiss}>Close services</button></header>
      <p className="azure-catalog-note">Select a service to inspect it. Use App scaling or SQL scaling at the bottom of the world for tier and capacity controls.</p>
      <p className="azure-catalog-note">{view.state.runtime.status === 'PAUSED' ? 'Paused · last measured state.' : 'Live status; explicit action buttons below change the game.'} Utilization is request pressure, not CPU. Costs are simulated.</p>
      {nodes.map(node => {
        const service = azureServices[node.service];
        const resource = view.state.runtime.architecture.resources.find(r => r.kind === node.kind);
        const action = node.kind === 'compute' ? { type: 'SCALE_OUT' as const } : !resource && (node.kind === 'cache' || node.kind === 'edge') ? { type: 'DEPLOY_RESOURCE' as const, kind: node.kind, ...tycoonPositions[node.kind] } : null;
        const reason = action ? controller.actionReason(action) : null;
        return <div key={node.id} className="azure-catalog-item">
          <AzureResourceNode {...node} selected={view.selected === resource?.id} onSelect={resource ? () => { setOpen(false); onInspect(resource.id, trigger.current); navigation.focus(node.kind); } : undefined} actionHint={resource ? 'Inspect this resource' : 'Use the deployment action below'} />
          <p>{service.role}</p><small>{service.scope}</small>
          <small>Running effect: {formatMoneyRate(resource ? resourceRunningCost(resource) : definitions[node.kind].cost, 'min')}{resource ? ' currently active' : ' after deployment'}.</small>
          {node.kind === 'database' && resource && <small>Tier {resourceTier(resource)} · {databaseTiers[resourceTier(resource)-1].reads + (resource.readReplicas ?? 0)*readReplica.capacity} reads/s · {databaseTiers[resourceTier(resource)-1].writes} writes/s. Select SQL for tier/replica actions.</small>}
          {node.kind === 'compute' && resource && <small>Tier {resourceTier(resource)} · Capacity: {appTiers[resourceTier(resource)-1].capacity * node.instances} requests/s when active. Select App for tier/instance actions.</small>}
          {node.kind === 'cache' && <small>Eligible reads only; writes stay on the SQL path.</small>}
          {action && <><button type="button" disabled={reason !== null} onClick={() => controller.queueAction(action)}>{node.kind === 'compute' ? 'Scale out App' : node.kind === 'cache' ? 'Deploy Cache' : 'Deploy Protected Edge'}</button>{reason && <small>{formatMoneyReason(reason)}</small>}</>}
        </div>;
      })}
      <details className="azure-concepts"><summary>Other Azure concepts · not selectable</summary>
        {(['front-door', 'waf', 'monitor', 'application-insights'] as const).map(service => <div key={service}><strong>{azureServices[service].name}</strong><p>{azureServices[service].role}</p><small>{azureServices[service].scope}</small></div>)}
      </details>
    </section>}
  </aside>;
}

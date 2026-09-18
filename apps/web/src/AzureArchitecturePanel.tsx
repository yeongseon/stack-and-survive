import { useEffect, useId, useRef, useState } from 'react';
import type { Controller, View } from './controller';
import type { PlayerNavigation } from './player-navigation';
import { definitions } from '@stack-and-survive/cloud-domain';
import { AzureResourceNode } from './AzureResourceNode';
import { azureServices } from './azure-service-catalog';
import { azureNodePresentations } from './azure-presentation';
import { tycoonPositions } from './tycoon-layout';
import { formatMoneyRate, formatMoneyReason } from './money';
import './azure-architecture.css';

export function AzureArchitecturePanel({ controller, view, navigation }: { controller: Controller; view: View; navigation: PlayerNavigation }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) close.current?.focus({ preventScroll: true }); }, [open]);
  const dismiss = () => { setOpen(false); trigger.current?.focus(); };
  const nodes = azureNodePresentations(view);
  return <aside className="azure-catalog" aria-label="Azure architecture catalog">
    <button ref={trigger} type="button" className="azure-catalog-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Azure services</button>
    {open && <section id={id} className="azure-services-panel" aria-label="Azure services panel" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); } }}>
      <header><div><small>ARCHITECTURE</small><h2>Service roles</h2></div><button ref={close} type="button" onClick={dismiss}>Close services</button></header>
      <p className="azure-catalog-note">{view.state.runtime.status === 'PAUSED' ? 'Paused · last measured state.' : 'Read-only status; actions below use the existing game rules.'} Utilization is request pressure, not CPU. Costs are simulated.</p>
      {nodes.map(node => {
        const service = azureServices[node.service];
        const resource = view.state.runtime.architecture.resources.find(r => r.kind === node.kind);
        const action = node.kind === 'compute' ? { type: 'SCALE_OUT' as const } : !resource && (node.kind === 'cache' || node.kind === 'edge') ? { type: 'DEPLOY_RESOURCE' as const, kind: node.kind, ...tycoonPositions[node.kind] } : null;
        const reason = action ? controller.actionReason(action) : null;
        return <div key={node.id} className="azure-catalog-item">
          <AzureResourceNode {...node} selected={view.selected === resource?.id} onSelect={resource ? () => { controller.select(resource.id); navigation.focus(node.kind); dismiss(); } : undefined} actionHint={resource ? 'Inspect this resource' : 'Use the deployment action below'} />
          <p>{service.role}</p><small>{service.scope}</small>
          <small>Running effect: {formatMoneyRate(definitions[node.kind].cost * Math.max(1, node.instances), 'min')}{resource ? ' when active' : ' after deployment'}.</small>
          {node.kind === 'database' && <small>Capacity: 180 reads/s · 70 writes/s (game limits).</small>}
          {node.kind === 'compute' && <small>Capacity: {150 * node.instances} requests/s when active (150 per instance).</small>}
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

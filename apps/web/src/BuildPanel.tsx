import { definitions } from '@stack-and-survive/cloud-domain';
import type { Kind } from '@stack-and-survive/schema';
import type { Controller, View } from './controller';
import { positionError, snap, validTargets } from './editor';
import { ServiceIcon } from './ServiceIcon';

export function BuildPanel({ view, controller, open, setOpen, inspect }: {
  view: View; controller: Controller; open: boolean; setOpen: (open: boolean) => void; inspect: () => void;
}) {
  const architecture = view.state.runtime.architecture;
  const preparing = view.state.runtime.status === 'PREPARATION' && !view.error;
  const placementError = view.preview ? positionError(architecture, snap(view.preview)) : null;
  return <details id="build-panel" className="build-panel" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Build &amp; connections</summary>
    <button type="button" className="close-build" onClick={() => setOpen(false)}>Close build tools</button>
    <p className="panel-kicker">AZURE RESOURCE DECK</p>
    <section className="build-tools" aria-label="Build palette">
      {(['compute', 'database', 'cache', 'edge'] as Kind[]).map(kind => <button type="button" key={kind}
        disabled={!preparing || architecture.resources.some(r => r.kind === kind)}
        aria-pressed={view.building === kind} onClick={() => { controller.build(kind); if (window.innerWidth < 900) setOpen(false); }}>
        <ServiceIcon kind={kind} decorative /><span>Place {definitions[kind].name}</span>
        <small aria-hidden="true">{architecture.resources.some(r => r.kind === kind) ? 'DEPLOYED' : `${definitions[kind].cost} credits / min`}</small>
      </button>)}
      <button type="button" disabled={!view.building} onClick={() => controller.build(null)}>Cancel placement</button>
      <button type="button" disabled={!preparing} aria-pressed={view.connecting} onClick={() => controller.connectMode(!view.connecting)}>Connect resources</button>
      <p>Place a service. Connect its path. Make the traffic work for you.</p>
    </section>
    {view.building && <p role="status">Placing {definitions[view.building].name}: {placementError ?? 'click a free footprint on the board.'}</p>}
    <nav aria-label="Inspect resources" className="resource-list">{architecture.resources.map(resource => <button type="button" key={resource.id}
      aria-pressed={view.selected === resource.id} onClick={() => { controller.select(resource.id); inspect(); if (window.innerWidth < 900) setOpen(false); }}>
      <ServiceIcon kind={resource.kind} decorative />Inspect {definitions[resource.kind].name}
    </button>)}</nav>
    {view.connecting && <section className="connection-panel" aria-label="Connection selection">
      <p>{view.connectionSource ? `Source: ${view.connectionSource}. Select a highlighted valid target.` : 'Select a source on the board or below.'}</p>
      {architecture.resources.map(resource => <button type="button" key={resource.id}
        disabled={view.connectionSource !== null && !validTargets(architecture, view.connectionSource).includes(resource.id)}
        onClick={() => controller.connectNode(resource.id)}>{definitions[resource.kind].name}</button>)}
      <button type="button" onClick={() => controller.connectMode(false)}>Cancel connection</button>
    </section>}
    <details className="connections"><summary>Architecture connections ({architecture.connections.length})</summary>
      {architecture.connections.map(c => <p key={`${c.from}:${c.to}`}>{c.from} → {c.to} <button type="button"
        aria-label={`Remove connection ${c.from} to ${c.to}`} disabled={!preparing} onClick={() => controller.disconnect(c.from, c.to)}>Remove connection</button></p>)}
    </details>
  </details>;
}

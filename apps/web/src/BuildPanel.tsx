import { useState } from 'react';
import { definitions } from '@stack-and-survive/cloud-domain';
import type { Kind } from '@stack-and-survive/schema';
import type { Controller, View } from './controller';
import { positionError, snap, validTargets } from './editor';
import { ServiceIcon } from './ServiceIcon';

export function BuildPanel({ view, controller, open, setOpen, inspect }: {
  view: View; controller: Controller; open: boolean; setOpen: (open: boolean) => void; inspect: () => void;
}) {
  const architecture = view.state.runtime.architecture;
  const [mode, setMode] = useState<'build' | 'manage'>('build');
  const preparing = view.state.runtime.status === 'PREPARATION' && !view.error;
  const placementError = view.preview ? positionError(architecture, snap(view.preview)) : null;
  return <details id="build-panel" className="build-panel" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Infrastructure</summary>
    <button type="button" className="close-build" onClick={() => setOpen(false)}>Close build tools</button>
    <div className="mode-switch" role="group" aria-label="Infrastructure mode">
      <button type="button" aria-pressed={mode === 'build'} onClick={() => { setMode('build'); controller.connectMode(false); }}>Build</button>
      <button type="button" aria-pressed={mode === 'manage'} onClick={() => { setMode('manage'); controller.build(null); }}>Manage</button>
    </div>
    <p className="panel-kicker">{mode === 'build' ? 'BUILD RESOURCES' : 'MANAGE TOPOLOGY'}</p>
    <section className="build-tools" aria-label="Build palette" hidden={mode !== 'build'}>
      {(['compute', 'database', 'cache', 'edge'] as Kind[]).map(kind => <button type="button" key={kind}
        aria-label={`Place ${definitions[kind].name}`} aria-describedby={`build-cost-${kind}`}
        disabled={!preparing || architecture.resources.some(r => r.kind === kind)}
        aria-pressed={view.building === kind} onClick={() => { controller.build(kind); if (window.innerWidth < 900) setOpen(false); }}>
        <ServiceIcon kind={kind} decorative /><span>Place {definitions[kind].name}</span>
        <small id={`build-cost-${kind}`}>{architecture.resources.some(r => r.kind === kind) ? 'DEPLOYED' : `Running: ${definitions[kind].cost} credits / min`}</small>
      </button>)}
      <button type="button" disabled={!view.building} onClick={() => controller.build(null)}>Cancel placement</button>
      <p>Preparation is free. Running costs begin when active during operation. Connect paths in Manage.</p>
    </section>
    {view.building && <p role="status">Placing {definitions[view.building].name}: {placementError ?? 'click a free footprint on the board.'}</p>}
    <section aria-label="Manage infrastructure" hidden={mode !== 'manage'}>
    <button type="button" disabled={!preparing} aria-pressed={view.connecting} onClick={() => controller.connectMode(!view.connecting)}>Connect resources</button>
    <p className="manage-help">Select a resource to inspect, resize or remove it. Drag buildings on the floor to move them during preparation; placement never changes throughput.</p>
    <button type="button" disabled={!preparing} onClick={() => controller.reset()}>Reset design</button>
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
    </section>
  </details>;
}

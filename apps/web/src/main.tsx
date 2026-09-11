import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createController, type Controller } from './controller';
import { mountWorld, utilizationLabel } from './world';
import './style.css';
import { definitions, validateStart } from '@stack-and-survive/cloud-domain';
import type { Kind } from '@stack-and-survive/schema';
import { positionError, snap, validTargets } from './editor';

function World({ controller }: { controller: Controller }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false; let cleanup: (() => void) | undefined;
    const surface = document.createElement('div'); surface.className = 'surface'; surface.dataset.renderer = 'loading';
    host.current!.append(surface);
    mountWorld(surface, controller).then(destroy => { if (disposed) destroy(); else cleanup = destroy; })
      .catch(error => { if (!disposed) controller.presentationFailed(error instanceof Error ? error.message : 'Renderer failed to load'); });
    return () => { disposed = true; cleanup?.(); surface.remove(); };
  }, [controller]);
  return <div className="world" ref={host} data-testid="world" aria-label="Internet to App Service to Azure SQL architecture" />;
}
function App() {
  const [controller] = useState(() => createController());
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [inspecting, setInspecting] = useState(false);
  useEffect(() => () => controller.destroy(), [controller]);
  const running = view.state.runtime.status === 'RUNNING';
  const r = view.snapshot?.requests;
  const appU = r?.app.utilization ?? null;
  const sqlU = r ? Math.max(r.sql.readUtilization, r.sql.writeUtilization) : null;
  const instances = view.state.runtime.architecture.resources.find(n => n.kind === 'compute')?.instances ?? 1;
  const architecture = view.state.runtime.architecture;
  const selected = architecture.resources.find(r => r.id === view.selected);
  const preparing = view.state.runtime.status === 'PREPARATION';
  const readyErrors = validateStart(architecture);
  if (view.state.runtime.preparationScaleDue !== null) readyErrors.push('Scale-out is provisioning');
  const placementError = view.preview ? positionError(architecture, snap(view.preview)) : null;
  return <main>
    <header><div><p className="eyebrow">STACK &amp; SURVIVE / FIRST PLAYABLE SLICE</p><h1>Your architecture<br />is your defense.</h1></div><div className="scenario"><span>BLACK FRIDAY</span><strong data-testid="status">{view.error ? 'STOPPED · ERROR' : inspecting && running ? 'MANUAL INSPECTION' : view.state.runtime.status}</strong><span><b data-testid="elapsed">{view.state.runtime.time}</b> / 180 seconds</span></div></header>
    <section className="controls" aria-label="Scenario controls">
      <label>Initial App instances <select aria-label="Initial App instances" value={instances} disabled={running} onChange={e => { controller.reset(Number(e.target.value)); setInspecting(false); }}><option>1</option><option>2</option><option>4</option></select></label>
      <button type="button" disabled={!preparing || !!view.error || readyErrors.length > 0} onClick={() => controller.start()}>Start traffic</button>
      <button type="button" onClick={() => { controller.reset(instances); setInspecting(false); }}>Reset baseline</button>
      <p>Real simulation · 1 tick / second · Representative traffic, not one sprite per request</p>
    </section>
    <section className="build-tools" aria-label="Build palette">
      {(['compute', 'database', 'cache', 'edge'] as Kind[]).map(kind => <button type="button" key={kind} disabled={!preparing || architecture.resources.some(r => r.kind === kind)} aria-pressed={view.building === kind} onClick={() => controller.build(kind)}>Place {definitions[kind].name}</button>)}
      <button type="button" disabled={!view.building} onClick={() => controller.build(null)}>Cancel placement</button>
      <button type="button" disabled={!preparing} aria-pressed={view.connecting} onClick={() => controller.connectMode(!view.connecting)}>Connect resources</button>
      <p>Click to select · Drag a building to move · Drag empty ground to pan · Scroll to zoom</p>
    </section>
    {view.building && <p role="status">Placing {definitions[view.building].name}: {placementError ?? 'click a free footprint on the board.'}</p>}
    {view.notice && <p role="alert">{view.notice}</p>}
    {view.connecting && <section className="connection-panel" aria-label="Connection selection"><p>{view.connectionSource ? `Source: ${view.connectionSource}. Select a highlighted valid target.` : 'Select a source on the board or below.'}</p>
      {architecture.resources.map(resource => <button type="button" key={resource.id} disabled={view.connectionSource !== null && !validTargets(architecture, view.connectionSource).includes(resource.id)} onClick={() => controller.connectNode(resource.id)}>{definitions[resource.kind].name}</button>)}
      <button type="button" onClick={() => controller.connectMode(false)}>Cancel connection</button>
    </section>}
    <details className="connections"><summary>Architecture connections ({architecture.connections.length})</summary>
      {architecture.connections.map(c => <p key={`${c.from}:${c.to}`}>{c.from} → {c.to} <button type="button" aria-label={`Remove connection ${c.from} to ${c.to}`} disabled={!preparing} onClick={() => controller.disconnect(c.from, c.to)}>Remove connection</button></p>)}
    </details>
    {preparing && readyErrors.length > 0 && <p role="status">Cannot start: {readyErrors.join('; ')}</p>}
    {view.error && <p className="error" role="alert">{view.error} — simulation clock stopped. Reset or reload to recover.</p>}
    <section className="playfield"><World controller={controller} /><aside>
      <p className="eyebrow">CURRENT PRESSURE</p>
      <h2>App Service</h2><p className="reading" data-testid="app-pressure">{utilizationLabel(appU)} {appU === null ? '' : `${(appU * 100).toFixed(1)}%`}</p>
      <h2>Azure SQL</h2><p className="reading" data-testid="sql-pressure">{utilizationLabel(sqlU)} {sqlU === null ? '' : `${(sqlU * 100).toFixed(1)}%`}</p>
      <dl><dt>Incoming requests/s</dt><dd data-testid="traffic">{r ? r.offered.browse + r.offered.order + r.offered.bot : '—'}</dd>
        <dt>Tick availability</dt><dd>{view.snapshot ? `${(view.snapshot.metrics.availability * 100).toFixed(2)}%` : '—'}</dd>
        <dt>App dropped/s</dt><dd>{r ? (r.app.dropped.browse + r.app.dropped.order + r.app.dropped.bot).toFixed(1) : '—'}</dd>
        <dt>SQL dropped/s</dt><dd>{r ? (r.sql.readsDropped + r.sql.writesDropped).toFixed(1) : '—'}</dd></dl>
      <p className="hint">Adding App instances changes compute capacity, not SQL capacity. Try a different initial configuration after resetting.</p>
      {selected && <section aria-label="Selected resource" className="resource-details">
        <h2>{definitions[selected.kind].name}</h2>
        <p data-testid="resource-status">{selected.remaining > 0 ? `Provisioning: ${selected.remaining}s` : 'Active'}</p>
        <p>{architecture.connections.some(c => c.from === selected.id || c.to === selected.id) ? 'Connected' : 'Disconnected — no traffic effect'}</p>
        <p>Runtime cost: {definitions[selected.kind].cost * selected.instances} credits/min when active. Build Mode is free.</p>
        <p>{selected.kind === 'compute' ? `${selected.instances} instances · ${selected.instances * 150} req/s` : selected.kind === 'database' ? 'Reads: 180/s · Writes: 70/s' : selected.kind === 'cache' ? 'Eligible reads: 500/s · Hit ratio: 80%' : selected.kind === 'edge' ? 'Bot filter: 70% · False positives: 0.5%' : 'External workload source'}</p>
        {selected.kind === 'compute' && <><button type="button" disabled={!preparing || selected.remaining > 0 || selected.instances >= 4 || view.state.runtime.preparationScaleDue !== null} onClick={() => controller.scalePreparation()}>Provision instance</button><button type="button" disabled={!preparing || selected.instances <= 1 || view.state.runtime.preparationScaleDue !== null} onClick={() => controller.reduceInstances()}>Reduce instance</button>
          {view.state.runtime.preparationScaleDue !== null && <p>New instance pending: {view.state.runtime.preparationScaleDue - view.state.runtime.preparationTime}s · not contributing capacity</p>}</>}
        <button type="button" disabled={!preparing || selected.kind === 'internet'} onClick={() => controller.remove(selected.id)}>Remove resource</button>
      </section>}
    </aside></section>
    {view.result && <section className="outcome" role="status"><p className="eyebrow">SCENARIO OUTCOME</p><h2>{view.result.primary}</h2><p>{view.result.insight}</p></section>}
    <details><summary>Developer inspector (not a player speed control)</summary><button type="button" disabled={!running || !!view.error} onClick={() => { setInspecting(true); controller.inspectNextTick(); }}>Step one tick</button><p>{inspecting ? 'Manual stepping: automatic clock stopped. Reset to return to 1×.' : 'Stepping stops automatic time; each click advances exactly one real simulation tick.'}</p><pre data-testid="diagnostics">{JSON.stringify({ time: view.state.runtime.time, status: view.state.runtime.status, snapshot: view.snapshot, architecture, selected: view.selected, camera: view.camera }, null, 2)}</pre></details>
    <footer>BUILD THE CLOUD. SURVIVE THE TRAFFIC.<span>Baseline only · Editing and live actions arrive in subsequent issues.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);

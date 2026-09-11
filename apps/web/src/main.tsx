import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createController, type Controller } from './controller';
import { mountWorld, utilizationLabel } from './world';
import './style.css';
import { definitions, validateStart } from '@stack-and-survive/cloud-domain';
import type { Kind } from '@stack-and-survive/schema';
import { positionError, snap, validTargets } from './editor';
import { activeCostPerMinute } from '@stack-and-survive/simulation/economy';
import { ResultPanel } from './ResultPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { browserSaveRepository } from './persistence';
import { glossary, pressureHint } from './help';

function World({ controller, generation }: { controller: Controller; generation: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false; let cleanup: (() => void) | undefined;
    const surface = document.createElement('div'); surface.className = 'surface'; surface.dataset.renderer = 'loading';
    host.current!.append(surface);
    mountWorld(surface, controller, generation).then(destroy => { if (disposed) destroy(); else cleanup = destroy; })
      .catch(error => { if (!disposed) controller.presentationFailed(error instanceof Error ? error.message : 'Renderer failed to load'); });
    return () => { disposed = true; cleanup?.(); surface.remove(); };
  }, [controller, generation]);
  return <div className="world" ref={host} data-testid="world" aria-label="Internet to App Service to Azure SQL architecture" />;
}
function App() {
  const [controller] = useState(() => createController(undefined, browserSaveRepository(() => window.localStorage)));
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [inspecting, setInspecting] = useState(false);
  const [scaleConfirmation, setScaleConfirmation] = useState<{ generation: number; epoch: number } | null>(null);
  useEffect(() => () => controller.destroy(), [controller]);
  const running = view.state.runtime.status === 'RUNNING';
  const r = view.snapshot?.requests;
  const appU = r?.app.utilization ?? null;
  const sqlU = r ? Math.max(r.sql.readUtilization, r.sql.writeUtilization) : null;
  const instances = view.state.runtime.architecture.resources.find(n => n.kind === 'compute')?.instances ?? 1;
  const architecture = view.state.runtime.architecture;
  const selected = architecture.resources.find(r => r.id === view.selected);
  const preparing = view.state.runtime.status === 'PREPARATION' && !view.error;
  const paused = view.state.runtime.status === 'PAUSED';
  const readyErrors = validateStart(architecture);
  if (view.state.runtime.preparationScaleDue !== null) readyErrors.push('Scale-out is provisioning');
  const placementError = view.preview ? positionError(architecture, snap(view.preview)) : null;
  const metrics = view.snapshot?.metrics;
  const economy = view.state.economy;
  const runtime = view.state.runtime;
  const scaleReason = controller.actionReason({ type: 'SCALE_OUT' });
  const rateReason = controller.actionReason({ type: 'RATE_LIMIT', enabled: !runtime.rateLimit });
  const wafReason = controller.actionReason({ type: 'EMERGENCY_WAF' });
  const confirmScale = scaleConfirmation?.generation === view.rendererGeneration && scaleConfirmation.epoch === view.confirmationEpoch;
  return <main>
    <a href="#scenario-controls" className="skip-link">Skip to scenario controls</a>
    <header><div><p className="eyebrow">STACK &amp; SURVIVE / HACKATHON MVP</p><h1>Your architecture<br />is your defense.</h1></div><div className="scenario"><span>BLACK FRIDAY</span><strong data-testid="status">{view.error ? 'STOPPED · ERROR' : inspecting && running ? 'MANUAL INSPECTION' : view.state.runtime.status}</strong><span><b data-testid="elapsed">{view.state.runtime.time}</b> / 180 seconds</span></div></header>
    <section id="scenario-controls" tabIndex={-1} className="controls" aria-label="Scenario controls">
      <label>Initial App instances <select aria-label="Initial App instances" value={instances} disabled={!preparing} onChange={e => { controller.reset(Number(e.target.value)); setInspecting(false); }}><option>1</option><option>2</option><option>4</option></select></label>
      <button type="button" disabled={!preparing || !!view.error || readyErrors.length > 0} onClick={() => controller.start()}>Start traffic</button>
      <button type="button" disabled={paused || !!view.error} onClick={() => { controller.reset(instances); setInspecting(false); }}>Reset baseline</button>
      <button type="button" disabled={(!running && !paused) || !!view.error} onClick={() => { if (paused) controller.resume(); else controller.pause(); setInspecting(false); }}>{paused ? 'Resume traffic' : 'Pause traffic'}</button>
      <p>Real simulation · 1 tick / second · Representative traffic, not one sprite per request</p>
    </section>
    <details className="help"><summary>How to play &amp; glossary</summary><p>Your application is online. Black Friday traffic is approaching. Keep the service available while protecting business value.</p><ol><li>Select a resource to inspect its role and cost.</li><li>Place and connect resources before starting; wait for required provisioning.</li><li>Start traffic, observe pressure, and use live actions deliberately.</li><li>Review the result, redesign, and retry the same workload.</li></ol><p>Click or tap controls; the resource list below also supports keyboard selection. Drag buildings to move, drag empty ground to pan, and scroll to zoom. Pause is for inspection, not free recovery. No sound is required.</p><dl>{glossary.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl></details>
    <section aria-label="Local architecture save" className="save-controls"><button type="button" onClick={() => controller.saveArchitecture()}>Save architecture</button><button type="button" disabled={!preparing} onClick={() => controller.clearLocalState()}>Clear local state</button><p role="status" data-testid="save-status">{view.saveMessage}</p></section>
    {preparing && <section aria-label="Black Friday briefing" className="briefing"><h2>Black Friday is approaching</h2><p>Read-heavy business traffic will increase. Unusual automated traffic may consume capacity. Keep customers served without overspending.</p><p>Availability target: 99% · Latency target: 300 ms · Budget: 140 game credits · Duration: 180 seconds</p><p>Preparation is free. Your connections determine request paths; physical distance does not change performance.</p></section>}
    {paused && <p role="status">Paused — inspect the architecture and metrics. Time, costs, provisioning and failure counters are frozen; editing is disabled.</p>}
    {preparing && view.previousResult && <section className="briefing" aria-label="Previous attempt context"><h2>Previous issue: {view.previousResult.primary}</h2><p>{view.previousResult.insight}</p><p>Previous attempt: {view.previousResult.status} at {view.previousResult.elapsedTime}s. Edit your existing architecture, then retry the same workload.</p></section>}
    <section aria-label="Live service and business metrics" className="metrics-bar">
      <div><span>Availability</span><strong data-testid="availability">{metrics ? `${(metrics.availability * 100).toFixed(2)}%` : '—'}</strong></div>
      <div><span>Latency</span><strong data-testid="latency">{metrics?.averageLatency == null ? '—' : `${metrics.averageLatency.toFixed(0)} ms`}</strong></div>
      <div><span>Error rate</span><strong>{metrics ? `${(metrics.errorRate * 100).toFixed(2)}%` : '—'}</strong></div>
      <div><span>Cloud cost</span><strong data-testid="cloud-cost">{economy.infrastructureCost.toFixed(2)}</strong></div>
      <div><span>Revenue</span><strong>{economy.revenue.toFixed(2)}</strong></div>
      <div><span>Net value</span><strong>{economy.netBusinessValue.toFixed(2)}</strong></div>
      <div><span>Budget left</span><strong>{economy.remainingBudget.toFixed(2)}</strong></div>
    </section>
    {(running || paused) && view.snapshot?.critical && <p role="status" className="critical">! CRITICAL — {view.state.streaks.availability > 0 ? `${view.snapshot.failureCountdown.availability} consecutive bad seconds until availability failure.` : 'Resource overload or budget pressure.'} {view.state.streaks.order > 0 ? `Order-flow failure in ${view.snapshot.failureCountdown.order} bad seconds.` : ''}</p>}
    <section className="build-tools" aria-label="Build palette">
      {(['compute', 'database', 'cache', 'edge'] as Kind[]).map(kind => <button type="button" key={kind} disabled={!preparing || architecture.resources.some(r => r.kind === kind)} aria-pressed={view.building === kind} onClick={() => controller.build(kind)}>Place {definitions[kind].name}</button>)}
      <button type="button" disabled={!view.building} onClick={() => controller.build(null)}>Cancel placement</button>
      <button type="button" disabled={!preparing} aria-pressed={view.connecting} onClick={() => controller.connectMode(!view.connecting)}>Connect resources</button>
      <p>Click to select · Drag a building to move · Drag empty ground to pan · Scroll to zoom</p>
    </section>
    {view.building && <p role="status">Placing {definitions[view.building].name}: {placementError ?? 'click a free footprint on the board.'}</p>}
    <nav aria-label="Inspect resources" className="resource-list">{architecture.resources.map(resource => <button type="button" key={resource.id} aria-pressed={view.selected === resource.id} onClick={() => controller.select(resource.id)}>Inspect {definitions[resource.kind].name}</button>)}</nav>
    {view.notice && <p role="alert">{view.notice}</p>}
    {view.connecting && <section className="connection-panel" aria-label="Connection selection"><p>{view.connectionSource ? `Source: ${view.connectionSource}. Select a highlighted valid target.` : 'Select a source on the board or below.'}</p>
      {architecture.resources.map(resource => <button type="button" key={resource.id} disabled={view.connectionSource !== null && !validTargets(architecture, view.connectionSource).includes(resource.id)} onClick={() => controller.connectNode(resource.id)}>{definitions[resource.kind].name}</button>)}
      <button type="button" onClick={() => controller.connectMode(false)}>Cancel connection</button>
    </section>}
    <details className="connections"><summary>Architecture connections ({architecture.connections.length})</summary>
      {architecture.connections.map(c => <p key={`${c.from}:${c.to}`}>{c.from} → {c.to} <button type="button" aria-label={`Remove connection ${c.from} to ${c.to}`} disabled={!preparing} onClick={() => controller.disconnect(c.from, c.to)}>Remove connection</button></p>)}
    </details>
    {preparing && readyErrors.length > 0 && <p role="status">Cannot start: {readyErrors.join('; ')}</p>}
    {view.error && <section className="error" role="alert"><p>{view.error} — simulation clock stopped; saved runtime metrics remain intact.</p><button type="button" disabled={view.recoveringRenderer} onClick={() => controller.recoverRenderer()}>Rebuild renderer</button>{view.recoveringRenderer && <p>Rebuilding — waiting for the renderer to report ready.</p>}<p>If recovery fails again, reload to return to the baseline; browser persistence arrives in its own issue.</p></section>}
    <section className="playfield"><World controller={controller} generation={view.rendererGeneration} /><aside>
      <p className="eyebrow">CURRENT PRESSURE</p>
      <h2>App Service</h2><p className="reading" data-testid="app-pressure">{utilizationLabel(appU)} {appU === null ? '' : `${(appU * 100).toFixed(1)}%`}</p>
      <h2>Azure SQL</h2><p className="reading" data-testid="sql-pressure">{utilizationLabel(sqlU)} {sqlU === null ? '' : `${(sqlU * 100).toFixed(1)}%`}</p>
      <dl><dt>Incoming requests/s</dt><dd data-testid="traffic">{r ? r.offered.browse + r.offered.order + r.offered.bot : '—'}</dd>
        <dt>Tick availability</dt><dd>{view.snapshot ? `${(view.snapshot.metrics.availability * 100).toFixed(2)}%` : '—'}</dd>
        <dt>App dropped/s</dt><dd>{r ? (r.app.dropped.browse + r.app.dropped.order + r.app.dropped.bot).toFixed(1) : '—'}</dd>
        <dt>SQL dropped/s</dt><dd>{r ? (r.sql.readsDropped + r.sql.writesDropped).toFixed(1) : '—'}</dd></dl>
      <dl><dt>Bots reaching App/s</dt><dd data-testid="bots-at-app">{r ? r.rateLimit.passed.bot.toFixed(1) : '—'}</dd><dt>WAF-filtered bots/s</dt><dd data-testid="filtered-bots">{r ? r.edge.filtered.bot.toFixed(1) : '—'}</dd>
        <dt>Cache hit ratio</dt><dd data-testid="cache-hit">{r?.cache.hitRatio == null ? 'N/A' : `${(r.cache.hitRatio * 100).toFixed(1)}%`}</dd><dt>SQL reads avoided/s</dt><dd>{r?.cache.hits.toFixed(1) ?? '—'}</dd>
        <dt>Running cost/min</dt><dd>{activeCostPerMinute(architecture)} credits</dd></dl>
      <p className="hint" data-testid="pressure-hint">{view.result ? view.result.insight : pressureHint(r ?? null)}</p>
      {selected && <section aria-label="Selected resource" className="resource-details">
        <h2>{definitions[selected.kind].name}</h2>
        <p data-testid="resource-status">{selected.remaining > 0 ? `Provisioning: ${selected.remaining}s` : 'Active'}</p>
        <p>{architecture.connections.some(c => c.from === selected.id || c.to === selected.id) ? 'Connected' : 'Disconnected — no traffic effect'}</p>
        <p>Runtime cost: {definitions[selected.kind].cost * selected.instances} credits/min when active. Build Mode is free.</p>
        <p>Base game capability (not live throughput or Azure specifications): {selected.kind === 'compute' ? `${selected.instances} configured instances · ${selected.instances * 150} req/s capacity when active` : selected.kind === 'database' ? 'Read capacity: 180/s · Write capacity: 70/s' : selected.kind === 'cache' ? 'Eligible read capacity: 500/s · Configured hit ratio: 80%' : selected.kind === 'edge' ? 'Normal mode: bot filter 70% · False positives 0.5%; emergency mode differs' : 'External workload source'}</p>
        {selected.kind === 'compute' && <><button type="button" disabled={!preparing || selected.remaining > 0 || selected.instances >= 4 || view.state.runtime.preparationScaleDue !== null} onClick={() => controller.scalePreparation()}>Provision instance</button><button type="button" disabled={!preparing || selected.instances <= 1 || view.state.runtime.preparationScaleDue !== null} onClick={() => controller.reduceInstances()}>Reduce instance</button>
          {view.state.runtime.preparationScaleDue !== null && <p>New instance pending: {view.state.runtime.preparationScaleDue - view.state.runtime.preparationTime}s · not contributing capacity</p>}</>}
        <button type="button" disabled={!preparing || selected.kind === 'internet'} onClick={() => controller.remove(selected.id)}>Remove resource</button>
      </section>}
    </aside></section>
    <p className="traffic-legend">● Browse · ■ Order / write · ▲ Bot · × Dropped / filtered · ○ Cache response. Representative markers; hits stop at Cache, filtered bots stop at Edge.</p>
    <section className="live-actions" aria-label="Live interventions">
      <div><h2>Scale out App</h2><p>+150 req/s after 8 seconds · +5 credits/min when active.</p>
        <button type="button" disabled={!!scaleReason} aria-describedby="scale-reason" onClick={() => setScaleConfirmation({ generation: view.rendererGeneration, epoch: view.confirmationEpoch })}>Scale out App</button>
        {confirmScale && !scaleReason && <div role="group" aria-label="Confirm scale-out"><p>Provision one additional instance? Capacity and cost begin after 8 seconds.</p><button type="button" onClick={() => { controller.queueAction({ type: 'SCALE_OUT' }); setScaleConfirmation(null); }}>Confirm scale-out</button><button type="button" onClick={() => setScaleConfirmation(null)}>Cancel scale-out</button></div>}
        <p id="scale-reason">{scaleReason ?? 'Ready to request.'}</p>
        <p data-testid="scale-progress">{runtime.scaleDue === null ? `${instances} active instances` : `${instances} active · additional instance pending: ${runtime.scaleDue - runtime.time}s · not contributing capacity`}</p>
      </div>
      <div><h2>Rate Limit</h2><p>Reject 5% of remaining traffic, including customers. Lower pressure can cost revenue and availability.</p>
        <button type="button" disabled={!!rateReason} aria-describedby="rate-reason" onClick={() => controller.queueAction({ type: 'RATE_LIMIT', enabled: !runtime.rateLimit })}>{runtime.rateLimit ? 'Disable Rate Limit' : 'Enable Rate Limit'}</button>
        <p id="rate-reason">{rateReason ?? '2-second activation/deactivation delay; 5-second toggle interval.'}</p>
        <p data-testid="rate-progress">{runtime.rateTransition ? `Transition pending: ${runtime.rateTransition.due - runtime.time}s` : runtime.rateLimit ? 'Rate Limit ON' : 'Rate Limit OFF'}</p>
      </div>
      <div><h2>Emergency WAF</h2><p>8 credits once per attempt · 1-second delay · 30 seconds of 90% bot filtering with 3% false positives.</p>
        <button type="button" disabled={!!wafReason} aria-describedby="waf-reason" onClick={() => controller.queueAction({ type: 'EMERGENCY_WAF' })}>Activate Emergency WAF</button>
        <p id="waf-reason">{wafReason ?? 'Requires active protected ingress; filtering returns to normal after expiry.'}</p>
        <p data-testid="waf-progress">{runtime.emergency ? runtime.time <= runtime.emergency.start ? 'Emergency activation pending' : `Emergency mode: ${Math.max(0, runtime.emergency.end - runtime.time)}s remaining` : runtime.emergencyUsed ? 'Emergency use consumed' : 'Normal WAF mode'}</p>
      </div>
    </section>
    {view.queuedActions.length > 0 && <p role="status">Queued for the next simulation tick: {view.queuedActions.map(a => a.type).join(', ')}. {paused ? 'Preserved while paused; executes after resume.' : 'No capacity or charge applied until the tick accepts the action.'}</p>}
    {view.result && <ResultPanel result={view.result} onRedesign={() => { controller.redesign(); setInspecting(false); setScaleConfirmation(null); }} />}
    {view.result && view.previousResult && <ComparisonPanel previous={view.previousResult} current={view.result} />}
    <details><summary>Developer inspector (not a player speed control)</summary><button type="button" disabled={!running || !!view.error} onClick={() => { setInspecting(true); controller.inspectNextTick(); }}>Step one tick</button><p>{inspecting ? 'Manual stepping: automatic clock stopped. Reset to return to 1×.' : 'Stepping stops automatic time; each click advances exactly one real simulation tick.'}</p><pre data-testid="diagnostics">{JSON.stringify({ time: view.state.runtime.time, status: view.state.runtime.status, snapshot: view.snapshot, architecture, selected: view.selected, camera: view.camera }, null, 2)}</pre></details>
    <footer>BUILD THE CLOUD. SURVIVE THE TRAFFIC.<span>Simplified game values, not Azure performance or pricing. Human playtesting and hosted deployment are still pending.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);

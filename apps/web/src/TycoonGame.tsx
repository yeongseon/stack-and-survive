import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createController, type ActionRequest, type Controller, type View } from './controller';
import { mountWorld } from './world';
import { tycoonPositions, tycoonPoint } from './tycoon-layout';
import { definitions } from '@stack-and-survive/cloud-domain';
import { primaryPressure } from './primary-pressure';
import { MissionPanel } from './MissionPanel';
import { glossary } from './help';
import { diagnosticsEnabled } from './mode';
import { businessFeedback } from './business-feedback';
import { BuildPad } from './BuildPad';
import { resourceVisualState } from './resource-visual-state';
import { GameHUD } from './GameHUD';
import { GameResult } from './GameResult';
import { TitleWorld } from './TitleWorld';

function LocalAction({ controller, action, children }: { controller: Controller; action: ActionRequest; children: React.ReactNode }) {
  const reason = controller.actionReason(action);
  return <button type="button" disabled={reason !== null} title={reason ?? undefined} onClick={() => controller.queueAction(action)}>{children}</button>;
}

function Floor({ controller, view }: { controller: Controller; view: View }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const cardClose = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const select = useCallback((id: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    controller.select(id);
  }, [controller]);
  const inspect = useCallback(() => { opener.current = null; }, []);
  useEffect(() => { if (view.selected) cardClose.current?.focus({ preventScroll: true }); }, [view.selected]);
  const closeCard = () => {
    controller.select(null);
    if (opener.current?.isConnected) opener.current.focus();
    else host.current?.querySelector<HTMLButtonElement>('.intake-control')?.focus();
  };
  useEffect(() => {
    const root = host.current!;
    const surface = document.createElement('div'); surface.className = 'surface'; root.prepend(surface);
    let disposed = false; let cleanup: (() => void) | undefined;
    mountWorld(surface, controller, view.rendererGeneration, inspect).then(destroy => { if (disposed) destroy(); else cleanup = destroy; })
      .catch(error => { if (!disposed) controller.presentationFailed(String(error)); });
    const observer = new ResizeObserver(() => setSize({ width: root.clientWidth, height: root.clientHeight })); observer.observe(root);
    return () => { disposed = true; observer.disconnect(); cleanup?.(); surface.remove(); };
  }, [controller, view.rendererGeneration, inspect]);
  const at = (kind: keyof typeof tycoonPositions) => {
    const point = tycoonPoint(kind, size.width, size.height);
    return { left: point.x, top: point.y + 42 };
  };
  const runtime = view.state.runtime;
  const app = runtime.architecture.resources.find(r => r.kind === 'compute')!;
  const visual = resourceVisualState(view);
  const feedback = businessFeedback(view);
  const selected = runtime.architecture.resources.find(r => r.id === view.selected);
  return <div className="tycoon-floor world" ref={host} data-testid="world" aria-label="Living cloud business">
    <div className="world-controls">
      {(['edge', 'cache'] as const).map(kind => {
        const resource = runtime.architecture.resources.find(r => r.kind === kind);
        return <div className={`world-slot ${resource ? 'installed' : 'empty'}`} key={kind} style={at(kind)} data-testid={`slot-${kind}`}>
          {!resource ? <BuildPad controller={controller} action={{ type: 'DEPLOY_RESOURCE', kind, ...tycoonPositions[kind] }} label={kind === 'cache' ? 'Add Cache' : 'Add Protected Edge'} role={kind === 'cache' ? 'CACHE' : 'EDGE'} detail={`${definitions[kind].name} · ${definitions[kind].provisioning}s · +${definitions[kind].cost} cr/min`} />
            : <button type="button" onClick={() => select(resource.id)}>{kind === 'cache' ? 'Cache' : 'Protected Edge'}<small>{resource.remaining > 0 ? `Provisioning ${resource.remaining}s` : 'Active'}</small></button>}
        </div>;
      })}
      <div className="world-slot app-expansion" style={at('compute')}>
        <div className="instance-slots" aria-label="App instance slots">{visual.app.bays.map((bay, i) => <span key={i} data-state={bay} aria-label={`Bay ${i+1}: ${bay}`}>{bay === 'active' ? '■' : bay === 'construction' ? '▧' : '□'}</span>)}</div>
        {runtime.scaleDue !== null ? <span className="slot-progress">Expanding · {visual.app.scaleRemaining}s</span> : <BuildPad controller={controller} action={{ type: 'SCALE_OUT' }} label="+ App capacity" role="APP" detail={`${app.instances}/4 active · 8s · +5 cr/min`} />}
      </div>
      <button type="button" className="intake-control" style={at('internet')} onClick={() => select('internet')}>Traffic intake</button>
      <button type="button" className="intake-control" style={at('database')} onClick={() => select('database')}>SQL processing</button>
      {selected && <section className="resource-action-card" aria-label="Resource actions" onKeyDown={event => { if (event.key === 'Escape') closeCard(); }}>
        <button ref={cardClose} type="button" className="card-close" onClick={closeCard}>Close resource</button>
        <h2>{definitions[selected.kind].name}</h2>
        {selected.kind === 'internet' && <><p className="resource-state">{visual.internet.rateLimited ? 'Intake limited' : 'Normal intake'}{visual.internet.rateTransition !== 'none' ? ` · ${visual.internet.rateTransition}` : ''}</p><LocalAction controller={controller} action={{ type: 'RATE_LIMIT', enabled: !runtime.rateLimit }}>{runtime.rateLimit ? 'Restore intake' : 'Limit intake'}</LocalAction><small>Limits 5% of all traffic, including customers.</small></>}
        {selected.kind === 'edge' && <><p className="resource-state">{visual.edge.lifecycle === 'provisioning' ? 'Provisioning' : visual.edge.boost === 'active' ? 'Filtering boosted' : visual.edge.boost === 'scheduled' || visual.edge.boost === 'queued' ? `Boost ${visual.edge.boost}` : 'Filtering normal'}</p><LocalAction controller={controller} action={{ type: 'EMERGENCY_WAF' }}>Boost filtering · 8 cr</LocalAction><small>30s · once per run · rejects 3% of legitimate customers</small></>}
        {selected.kind === 'compute' && <><p className="resource-state">{app.instances} active instances{visual.app.scaleRemaining !== null ? ` · expanding ${visual.app.scaleRemaining}s` : ''}</p><LocalAction controller={controller} action={{ type: 'SCALE_OUT' }}>+ App capacity · +5 cr/min</LocalAction><small>8 seconds to activate</small></>}
        {selected.kind === 'cache' && <p className="resource-state">{visual.cache.lifecycle === 'provisioning' ? `Provisioning ${visual.cache.remaining}s` : 'Active · serving eligible reads'}</p>}
        {selected.kind === 'database' && <><p className="resource-state">Reads: {visual.sql.readPressure}<br/>Writes: {visual.sql.writePressure}</p><small>Capacity and routing explained in Learn</small></>}
      </section>}
    </div>
    {feedback && <div key={feedback.tick} className="business-feedback" data-testid="business-feedback">✓ Orders served · {feedback.orders.toFixed(1)}/s <span>+{feedback.revenue.toFixed(2)} cr revenue this tick · not spendable budget</span></div>}
  </div>;
}

export function TycoonGame() {
  const [controller] = useState(() => createController(undefined, undefined, true));
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState<'how' | 'about' | 'learn'>('how');
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const learnButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!entered) startButton.current?.focus(); else learnButton.current?.focus(); }, [entered]);
  useEffect(() => () => controller.destroy(), [controller]);
  const open = (next: typeof page) => { dialogOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setPage(next); dialog.current?.showModal(); };
  const runtime = view.state.runtime;
  const r = view.snapshot?.requests;
  const pressure = primaryPressure(view);
  const start = () => { setEntered(true); controller.beginGame(); };
  const restart = () => { controller.reset(); setEntered(false); };
  return <main className="tycoon-game">
    {!entered ? <section className="title-screen" aria-label="Game introduction" data-time={diagnosticsEnabled ? runtime.time : undefined} data-budget={diagnosticsEnabled ? view.state.economy.remainingBudget : undefined}>
      <div className="title-mark" aria-hidden="true">S<span>+</span></div><p className="title-eyebrow">A CLOUD BUSINESS UNDER PRESSURE</p>
      <h1>STACK <em>&amp;</em><br/>SURVIVE</h1><p className="title-tagline">Build. Scale. Keep the business flowing.</p>
      <p className="title-description">Your customers are arriving. Grow your data center where the pressure builds.</p>
      <TitleWorld />
      <button ref={startButton} type="button" className="start-game" onClick={start}>Start Game <span aria-hidden="true">→</span></button>
      <nav aria-label="Introduction"><button type="button" onClick={() => open('how')}>How to Play</button><button type="button" onClick={() => open('about')}>About</button></nav>
      <p className="title-footnote">One business. Three minutes. Your infrastructure decisions.</p>
    </section> : <>
      <header className="tycoon-header"><h1>STACK <em>&amp;</em> SURVIVE</h1><nav aria-label="Game controls"><button ref={learnButton} type="button" onClick={() => open('learn')}>ⓘ Learn</button><button type="button" disabled={runtime.status !== 'RUNNING' && runtime.status !== 'PAUSED'} onClick={() => runtime.status === 'PAUSED' ? controller.resume() : controller.pause()}>{runtime.status === 'PAUSED' ? '▶ Resume' : 'Ⅱ Pause'}</button></nav></header>
      <GameHUD view={view} />
      <Floor controller={controller} view={view} />
      {view.countdown !== null && <div className="welcome-countdown" role="status">Black Friday begins in <strong>{view.countdown}</strong></div>}
      {view.notice && diagnosticsEnabled && <p className="tycoon-notice">{view.notice}</p>}
      {view.result && <GameResult result={view.result} restart={restart} review={() => open('learn')} />}
      {view.error && <section role="alert" className="tycoon-result"><p>{view.error}</p><button type="button" onClick={() => controller.recoverRenderer()}>Rebuild graphics</button><button type="button" onClick={restart}>Return to title</button></section>}
      {diagnosticsEnabled && <details className="tycoon-qa"><summary>Tycoon QA</summary><button onClick={() => controller.inspectNextTick()}>Step one tick</button><output data-testid="elapsed">{runtime.time}</output><pre data-testid="diagnostics">{JSON.stringify(view)}</pre></details>}
    </>}
    <dialog ref={dialog} className="learn-dialog" aria-labelledby="learn-title" onClose={() => { if (dialogOpener.current?.isConnected) dialogOpener.current.focus(); else startButton.current?.focus(); }}><form method="dialog"><button autoFocus>Close</button></form><h2 id="learn-title">{page === 'how' ? 'How to Play' : page === 'about' ? 'About Stack & Survive' : 'Learn'}</h2>
      {page === 'learn' && <section aria-label="Resource capacities"><h3>Resource capacities</h3><p>App: 150 requests/s per active instance, up to four. SQL: Read capacity 180/s · Write capacity 70/s. Cache handles eligible reads; Order writes remain direct to SQL. Fixed SQL has no upgrade action. New App capacity costs +5 cr/min after 8s; Cache +8 cr/min after 5s; Edge +3 cr/min after 4s.</p></section>}
      {page === 'how' ? <><p>Watch traffic reach your App and SQL. When pressure builds, click the + controls on the data-center floor.</p><ol><li>Add App capacity when compute is overloaded. New instances need 8 seconds.</li><li>Add Cache to reduce SQL reads. It does not remove Order writes.</li><li>Add Protected Edge to filter bots before they reach App.</li></ol><p>Costs are running credits, not purchase prices. Revenue does not refill budget. Pressure markers are not requests waiting to be served later.</p></> : page === 'about' ? <p>A browser game about Azure infrastructure decisions. All capacities and costs are game assumptions, not Azure prices or specifications. The game does not deploy real resources. Official service icons identify Microsoft Azure services; no endorsement is implied.</p> : <><h3>Why is this happening?</h3><p>{pressure.why}</p><p>Representative pressure markers are not a buffered queue. Dropped requests do not succeed later.</p><MissionPanel view={view} /><h3>Detailed metrics</h3><dl><dt>Revenue</dt><dd>{view.state.economy.revenue.toFixed(2)}</dd><dt>Net business value</dt><dd>{view.state.economy.netBusinessValue.toFixed(2)}</dd><dt>Infrastructure cost</dt><dd>{view.state.economy.infrastructureCost.toFixed(2)}</dd><dt>Latency</dt><dd>{view.snapshot?.metrics.averageLatency?.toFixed(0) ?? '—'} ms</dd><dt>SQL reads dropped/s</dt><dd>{r?.sql.readsDropped.toFixed(1) ?? '—'}</dd><dt>SQL writes dropped/s</dt><dd>{r?.sql.writesDropped.toFixed(1) ?? '—'}</dd></dl><h3>Azure concepts</h3>{glossary.map(([name, text]) => <p key={name}><strong>{name}</strong> — {text}</p>)}<button onClick={() => { dialog.current?.close(); restart(); }}>Return to title / restart</button></>}
    </dialog>
  </main>;
}

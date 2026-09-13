import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionRequest, Controller, View } from './controller';
import { mountWorld } from './world';
import { tycoonPositions, tycoonPoint } from './tycoon-layout';
import { definitions } from '@stack-and-survive/cloud-domain';
import { businessFeedback } from './business-feedback';
import { BuildPad } from './BuildPad';
import { resourceVisualState } from './resource-visual-state';

function LocalAction({ controller, action, children }: { controller: Controller; action: ActionRequest; children: React.ReactNode }) {
  const reason = controller.actionReason(action);
  return <button type="button" disabled={reason !== null} title={reason ?? undefined} onClick={() => controller.queueAction(action)}>{children}</button>;
}

export function GameFloor({ controller, view, guideTarget = null }: { controller: Controller; view: View; guideTarget?: string | null }) {
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
  return <div className="tycoon-floor world" ref={host} data-testid="world" data-guide-target={guideTarget ?? undefined} aria-label="Living cloud business">
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

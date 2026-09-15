import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ActionRequest, Controller, View } from './controller';
import { mountWorld } from './world';
import { tycoonPositions } from './tycoon-layout';
import { type PlayerNavigation } from './player-navigation';
import { definitions } from '@stack-and-survive/cloud-domain';
import type { WorldTarget } from './world-interaction';
import { resourceVisualState } from './resource-visual-state';
import { playerBuildingScale, resourceArtBounds } from './building-assets';
import { recoveryFeedback, type Recovery } from './wave-feedback';

function LocalAction({ controller, action, children }: { controller: Controller; action: ActionRequest; children: React.ReactNode }) {
  const reason = controller.actionReason(action);
  return <button type="button" disabled={reason !== null} title={reason ?? undefined} onClick={() => controller.queueAction(action)}>{children}</button>;
}

export function GameFloor({ controller, view, navigation, onReady, blocked = false, guideTarget = null }: { controller: Controller; view: View; navigation: PlayerNavigation; onReady: () => void; blocked?: boolean; guideTarget?: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const projection = useSyncExternalStore(navigation.subscribe, navigation.getSnapshot);
  const cardClose = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [actionFeedback,setActionFeedback]=useState<{kind:'compute'|'cache'|'edge';text:string;rejected:boolean}|null>(null);
  const [recovery,setRecovery]=useState<Recovery|null>(null);
  const previousView=useRef(view);
  const lastRecovery=useRef(-Infinity);
  const beginBuild = useCallback((kind: 'compute' | 'cache' | 'edge') => {
    const action:ActionRequest=kind==='compute'?{type:'SCALE_OUT'}:{type:'DEPLOY_RESOURCE',kind,...tycoonPositions[kind]};
    const reason=controller.actionReason(action);
    if(!reason)controller.queueAction(action);
    setActionFeedback({kind,rejected:!!reason,text:reason??`${kind==='compute'?'App expansion':kind==='cache'?'Cache':'Protected Edge'} requested · ${kind==='compute'?8:definitions[kind].provisioning}s to activate`});
  }, [controller]);
  const worldBuild = useCallback((target: WorldTarget) => { if (target.kind === 'compute' || target.kind === 'cache' || target.kind === 'edge') beginBuild(target.kind); }, [beginBuild]);
  useEffect(()=>{if(!actionFeedback)return;const timer=setTimeout(()=>setActionFeedback(null),2600);return()=>clearTimeout(timer);},[actionFeedback]);
  useEffect(()=>{
    const found=recoveryFeedback(previousView.current,view);previousView.current=view;
    if(found&&found.time-lastRecovery.current>=4){lastRecovery.current=found.time;setRecovery(found);}
    if(view.state.runtime.status!=='RUNNING'||view.error)setRecovery(null);
  },[view]);
  useEffect(()=>{if(!recovery)return;const timer=setTimeout(()=>setRecovery(null),2200);return()=>clearTimeout(timer);},[recovery]);
  const select = useCallback((id: string) => {
    setActionFeedback(null);
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    controller.select(id);
  }, [controller]);
  const inspect = useCallback(() => { opener.current = null; setActionFeedback(null); }, []);
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
    navigation.resize({ width: root.clientWidth, height: root.clientHeight });
    mountWorld(surface, controller, view.rendererGeneration, inspect, navigation, worldBuild, () => { if (!disposed) onReady(); }).then(destroy => { if (disposed) destroy(); else cleanup = destroy; })
      .catch(error => { if (!disposed) controller.presentationFailed(String(error)); });
    const observer = new ResizeObserver(() => navigation.resize({ width: root.clientWidth, height: root.clientHeight })); observer.observe(root);
    return () => { disposed = true; observer.disconnect(); cleanup?.(); surface.remove(); };
  }, [controller, view.rendererGeneration, inspect, navigation, worldBuild, onReady]);
  const at = (kind: keyof typeof tycoonPositions) => {
    const point = projection.resourceScreen(kind);
    return { left: point.x, top: point.y + 42 * projection.effectiveZoom };
  };
  const runtime = view.state.runtime;
  const app = runtime.architecture.resources.find(r => r.kind === 'compute')!;
  const visual = resourceVisualState(view);
  const selected = runtime.architecture.resources.find(r => r.id === view.selected);
  const localPosition = (kind: keyof typeof tycoonPositions) => {
    const p = projection.resourceScreen(kind);
    const width = host.current?.clientWidth ?? 320, height = host.current?.clientHeight ?? 568;
    const art = resourceArtBounds(kind, playerBuildingScale(kind), true);
    const right = p.x + (art.x + art.width) * projection.effectiveZoom + 14;
    const left = p.x + art.x * projection.effectiveZoom - 294;
    const preferred = right + 280 <= width - 12 ? right : left >= 12 ? left : p.x + 32;
    return { left: Math.max(12, Math.min(width - 292, preferred)), top: Math.max(height < 500 ? 70 : 100, Math.min(height - 320, p.y - 180)) };
  };
  const messagePosition=(kind:keyof typeof tycoonPositions)=>{const p=projection.resourceScreen(kind);return {left:Math.max(125,Math.min((host.current?.clientWidth??1440)-125,p.x)),top:Math.max(155,p.y-45)};};
  return <div className="tycoon-floor world" inert={!!view.result || blocked} ref={host} data-testid="world" data-guide-target={guideTarget ?? undefined} aria-label="Living cloud business">
    <div className="facility-plaques" aria-hidden="true">
      {(['internet', 'edge', 'compute', 'cache', 'database'] as const).map(kind => {
        const resource = runtime.architecture.resources.find(r => r.kind === kind);
        const p = projection.resourceScreen(kind);
        const width = host.current?.clientWidth ?? 320, height = host.current?.clientHeight ?? 568;
        const art = resourceArtBounds(kind, playerBuildingScale(kind, width), true);
        const top = p.y + (resource ? art.y : -24) * projection.effectiveZoom - (kind === 'internet' || !resource ? 38 : 76);
        const pressure = kind === 'compute' ? visual.app.pressure : kind === 'database' ? visual.sql.pressure : kind === 'cache' ? visual.cache.pressure : null;
        const warning = pressure === 'warning' || pressure === 'overcapacity';
        const detail = !resource ? 'Build here +' : resource.remaining > 0 ? `Construction · ${resource.remaining}s`
          : kind === 'compute' ? `${app.instances}/4 active${warning ? ' · ! pressure' : ''}`
          : kind === 'database' ? visual.sql.writePressure === 'overcapacity' || visual.sql.writePressure === 'warning' ? '! Write pressure' : visual.sql.readPressure === 'overcapacity' || visual.sql.readPressure === 'warning' ? '! Read pressure' : 'Read / write core'
          : kind === 'internet' ? visual.internet.rateLimited ? 'Intake limited' : 'Traffic origin'
          : kind === 'edge' ? visual.edge.boost === 'active' ? 'Filtering boosted' : 'Protected ingress' : 'Read cache';
        return <div key={kind} className={`facility-plaque${warning ? ' pressure' : ''}`} hidden={p.x < 35 || p.x > width-35 || top < 0 || top > height-50} style={{ left: p.x, top }}>
          <strong>{({ internet: 'INTAKE', edge: 'EDGE', compute: 'APP SERVICE', cache: 'CACHE', database: 'SQL' })[kind]}</strong><span>{detail}</span>
        </div>;
      })}
    </div>
    <div className="player-camera-controls" role="group" aria-label="Camera navigation" onKeyDown={event => {
      if (event.key === '+' || event.key === '=') navigation.step(1);
      else if (event.key === '-') navigation.step(-1);
      else if (event.key === '0') navigation.fit();
      else if (event.key.startsWith('Arrow')) navigation.pan({ x: event.key === 'ArrowLeft' ? 60 : event.key === 'ArrowRight' ? -60 : 0, y: event.key === 'ArrowUp' ? 60 : event.key === 'ArrowDown' ? -60 : 0 });
      else return;
      event.preventDefault();
    }}>
      <button type="button" aria-label="Zoom out" disabled={projection.state.userZoom <= .75} onClick={() => navigation.step(-1)}>−</button>
      <output aria-label="Camera zoom">{Math.round(projection.state.userZoom * 100)}%</output>
      <button type="button" aria-label="Zoom in" disabled={projection.state.userZoom >= 1.8} onClick={() => navigation.step(1)}>+</button>
      <button type="button" aria-label="Fit architecture" onClick={() => navigation.fit()}>Fit</button>
      <details><summary aria-label="More camera controls">Move</summary><div className="camera-pan-controls">
        <button type="button" aria-label="Pan left" onClick={() => navigation.pan({ x: 80, y: 0 })}>←</button>
        <button type="button" aria-label="Pan up" onClick={() => navigation.pan({ x: 0, y: 80 })}>↑</button>
        <button type="button" aria-label="Pan down" onClick={() => navigation.pan({ x: 0, y: -80 })}>↓</button>
        <button type="button" aria-label="Pan right" onClick={() => navigation.pan({ x: -80, y: 0 })}>→</button>
        <button type="button" disabled={!selected} onClick={() => { if (selected) navigation.focus(selected.kind); }}>Focus selected</button>
      </div></details>
    </div>
    <div className="world-controls">
      <div className="world-keyboard-controls" role="group" aria-label="Infrastructure keyboard controls">
      {(['edge', 'cache'] as const).map(kind => {
        const resource = runtime.architecture.resources.find(r => r.kind === kind);
        return <div className={`world-slot ${resource ? 'installed' : 'empty'}`} key={kind} style={at(kind)} data-testid={`slot-${kind}`}>
          {!resource ? <button type="button" aria-label={kind === 'cache' ? 'Add Cache' : 'Add Protected Edge'} aria-disabled={controller.actionReason({ type: 'DEPLOY_RESOURCE', kind, ...tycoonPositions[kind] }) !== null} onClick={() => beginBuild(kind)}>Build {kind === 'cache' ? 'Cache' : 'Edge'}</button>
            : <button type="button" onClick={() => select(resource.id)}>{kind === 'cache' ? 'Cache' : 'Protected Edge'}<small>{resource.remaining > 0 ? `Provisioning ${resource.remaining}s` : 'Active'}</small></button>}
        </div>;
      })}
      <div className="world-slot app-expansion" style={at('compute')}>
        <div className="instance-slots" aria-label="App instance slots">{visual.app.bays.map((bay, i) => <span key={i} data-state={bay} aria-label={`Bay ${i+1}: ${bay}`}>{bay === 'active' ? '■' : bay === 'construction' ? '▧' : '□'}</span>)}</div>
        {runtime.scaleDue !== null ? <span className="slot-progress">Expanding · {visual.app.scaleRemaining}s</span> : <button type="button" aria-label="+ App capacity" aria-disabled={controller.actionReason({type:'SCALE_OUT'})!==null} title={controller.actionReason({type:'SCALE_OUT'})??'8s to activate · +5 cr/min'} onClick={() => beginBuild('compute')}>Expand App<small>{app.instances}/4 active · 8s · +5 cr/min</small></button>}
      </div>
      <button type="button" className="intake-control" style={at('internet')} onClick={() => select('internet')}>Traffic intake</button>
      <button type="button" className="intake-control" style={at('database')} onClick={() => select('database')}>SQL processing</button>
      </div>
      {actionFeedback&&<div className={`action-feedback${actionFeedback.rejected?' rejected':''}`} role="status" style={messagePosition(actionFeedback.kind)}>{actionFeedback.text}</div>}
      {recovery&&<div className="recovery-feedback" role="status" style={messagePosition(recovery.kind)}>{recovery.text}</div>}
      {selected && <section className="resource-action-card" style={localPosition(selected.kind)} aria-label="Resource actions" onKeyDown={event => { if (event.key === 'Escape') closeCard(); }}>
        <button ref={cardClose} type="button" className="card-close" onClick={closeCard}>Close resource</button>
        <h2>{definitions[selected.kind].name}</h2>
        {selected.kind === 'internet' && <><p className="resource-state">{visual.internet.rateLimited ? 'Intake limited' : 'Normal intake'}{visual.internet.rateTransition !== 'none' ? ` · ${visual.internet.rateTransition}` : ''}</p><LocalAction controller={controller} action={{ type: 'RATE_LIMIT', enabled: !runtime.rateLimit }}>{runtime.rateLimit ? 'Restore intake' : 'Limit intake'}</LocalAction><small>Limits 5% of all traffic, including customers.</small></>}
        {selected.kind === 'edge' && <><p className="resource-state">{visual.edge.lifecycle === 'provisioning' ? 'Provisioning' : visual.edge.boost === 'active' ? 'Filtering boosted' : visual.edge.boost === 'scheduled' || visual.edge.boost === 'queued' ? `Boost ${visual.edge.boost}` : 'Filtering normal'}</p><LocalAction controller={controller} action={{ type: 'EMERGENCY_WAF' }}>Boost filtering · 8 cr</LocalAction><small>30s · once per run · rejects 3% of legitimate customers</small></>}
        {selected.kind === 'compute' && <><p className="resource-state">{app.instances} active instances{visual.app.scaleRemaining !== null ? ` · expanding ${visual.app.scaleRemaining}s` : ''}</p><LocalAction controller={controller} action={{ type: 'SCALE_OUT' }}>+ App capacity · +5 cr/min</LocalAction><small>8 seconds to activate</small></>}
        {selected.kind === 'cache' && <p className="resource-state">{visual.cache.lifecycle === 'provisioning' ? `Provisioning ${visual.cache.remaining}s` : 'Active · serving eligible reads'}</p>}
        {selected.kind === 'database' && <><p className="resource-state">Reads: {visual.sql.readPressure}<br/>Writes: {visual.sql.writePressure}</p><small>Capacity and routing explained in Learn</small></>}
      </section>}
    </div>
  </div>;
}

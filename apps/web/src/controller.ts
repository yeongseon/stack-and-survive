import { baseline, validateStart } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { advanceSimulation, createSimulation, simulationResult } from '@stack-and-survive/simulation/results';
import { advancePreparation, pauseRuntime, requestPreparationScale, resumeRuntime, startRuntime, type Action } from '@stack-and-survive/simulation/runtime';
import type { Architecture, Kind } from '@stack-and-survive/schema';
import { connectResources, disconnectResources, moveResource, placeResource, removeResource, type Camera, type Point } from './editor';

export type View = Readonly<{
  state: ReturnType<typeof createSimulation>;
  snapshot: ReturnType<typeof advanceSimulation>['snapshot'];
  result: ReturnType<typeof simulationResult> | null;
  error: string | null;
  selected: string | null;
  building: Kind | null;
  preview: Point | null;
  camera: Camera;
  notice: string;
  connecting: boolean;
  connectionSource: string | null;
  rendererGeneration: number;
  recoveringRenderer: boolean;
  queuedActions: Action[];
  confirmationEpoch: number;
}>;
export interface Clock {
  start(callback: () => void): () => void;
}
export type ActionRequest = { type: 'SCALE_OUT' } | { type: 'RATE_LIMIT'; enabled: boolean } | { type: 'EMERGENCY_WAF' };
const clock: Clock = {
  start(callback) { const id = globalThis.setInterval(callback, 1000); return () => globalThis.clearInterval(id); },
};

export function createController(timer: Clock = clock) {
  const initial = (instances = 1): View => {
    const architecture = baseline(instances);
    architecture.resources.forEach((r, i) => { r.x = (i - 1) * 260; r.y = (i - 1) * 100; });
    return { state: createSimulation(architecture, blackFriday), snapshot: null, result: null, error: null,
      selected: null, building: null, preview: null, camera: { x: 0, y: 0, zoom: 1 }, notice: '', connecting: false, connectionSource: null, rendererGeneration: 0, recoveringRenderer: false, queuedActions: [], confirmationEpoch: 0 };
  };
  let view: View = initial();
  let cancel: (() => void) | undefined;
  let destroyed = false;
  let timerGeneration = 0;
  const listeners = new Set<() => void>();
  const publish = (next: View) => { view = next; listeners.forEach(listener => listener()); };
  const stop = () => { timerGeneration++; cancel?.(); cancel = undefined; };
  const schedule = (callback: () => void) => {
    stop();
    const generation = timerGeneration;
    cancel = timer.start(() => { if (!destroyed && generation === timerGeneration) callback(); });
  };
  const advance = () => {
    if (destroyed || view.error || view.state.runtime.status !== 'RUNNING') return;
    try {
      const transition = advanceSimulation(view.state, blackFriday, view.queuedActions);
      const terminal = transition.nextState.runtime.status !== 'RUNNING';
      if (terminal) stop();
      publish({ ...view, queuedActions: [], notice: transition.outcomes.length ? transition.outcomes.map(o => o.accepted ? `${o.action.type} accepted at ${o.action.time}s.` : o.reason).join(' ') : view.notice, state: transition.nextState, snapshot: transition.snapshot,
        result: terminal ? simulationResult(transition.nextState, blackFriday) : null, error: null });
    } catch (error) {
      stop(); publish({ ...view, error: error instanceof Error ? error.message : 'Simulation could not advance' });
    }
  };
  const prepare = () => {
    if (destroyed || view.state.runtime.status !== 'PREPARATION') return;
    const runtime = advancePreparation(view.state.runtime);
    publish({ ...view, state: { ...view.state, runtime } });
    if (!runtime.architecture.resources.some(r => r.remaining > 0) && runtime.preparationScaleDue === null) stop();
  };
  const edit = (operation: (a: Architecture) => Architecture): boolean => {
    if (destroyed || view.error || view.state.runtime.status !== 'PREPARATION') return false;
    try {
      const architecture = operation(view.state.runtime.architecture);
      publish({ ...view, state: { ...view.state, runtime: { ...view.state.runtime, architecture } }, notice: '' });
      if (architecture.resources.some(r => r.remaining > 0) && !cancel) schedule(prepare);
      return true;
    } catch (error) { publish({ ...view, notice: error instanceof Error ? error.message : 'Invalid edit' }); return false; }
  };
  const candidate = (request: ActionRequest): Action => ({ ...request, time: view.state.runtime.time,
    sequence: Math.max(view.state.runtime.lastSequence, ...view.queuedActions.map(a => a.sequence)) + 1 });
  const actionReason = (request: ActionRequest): string | null => {
    if (destroyed || view.error) return 'Simulation is unavailable.';
    if (view.state.runtime.status !== 'RUNNING') return 'Live actions require running traffic; resume first if paused.';
    try {
      const next = candidate(request);
      const preview = advanceSimulation(view.state, blackFriday, [...view.queuedActions, next]);
      return preview.outcomes.find(o => o.action.sequence === next.sequence)?.reason ?? null;
    } catch (error) { return error instanceof Error ? error.message : 'Action is unavailable.'; }
  };
  return {
    getSnapshot: () => view,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    actionReason,
    queueAction(request: ActionRequest) {
      const reason = actionReason(request);
      if (reason) { if (!destroyed) publish({ ...view, notice: reason }); return; }
      publish({ ...view, queuedActions: [...view.queuedActions, candidate(request)], notice: `${request.type} queued for tick ${view.state.runtime.time}.` });
    },
    start() {
      if (destroyed || view.state.runtime.status !== 'PREPARATION' || view.error) return;
      const errors = validateStart(view.state.runtime.architecture);
      if (view.state.runtime.preparationScaleDue !== null) errors.push('Scale-out is provisioning');
      if (errors.length) { publish({ ...view, notice: errors.join('; ') }); return; }
      stop(); publish({ ...view, notice: '', building: null, preview: null, connecting: false, connectionSource: null, state: { ...view.state, runtime: startRuntime(view.state.runtime) } });
      schedule(advance);
    },
    reset(instances = 1) {
      if (destroyed || view.error || view.state.runtime.status === 'PAUSED') return;
      if (!Number.isInteger(instances) || instances < 1 || instances > 4) throw new Error('Invalid instance configuration');
      stop(); publish({ ...initial(instances), rendererGeneration: view.rendererGeneration + 1 });
    },
    pause() {
      if (destroyed || view.error || view.state.runtime.status !== 'RUNNING') return;
      stop(); publish({ ...view, confirmationEpoch: view.confirmationEpoch + 1, state: { ...view.state, runtime: pauseRuntime(view.state.runtime) } });
    },
    resume() {
      if (destroyed || view.error || view.state.runtime.status !== 'PAUSED') return;
      publish({ ...view, state: { ...view.state, runtime: resumeRuntime(view.state.runtime) } }); schedule(advance);
    },
    recoverRenderer() {
      if (destroyed || !view.error || view.recoveringRenderer) return;
      publish({ ...view, recoveringRenderer: true, rendererGeneration: view.rendererGeneration + 1 });
    },
    rendererReady(generation: number) {
      if (destroyed || generation !== view.rendererGeneration || !view.recoveringRenderer) return;
      publish({ ...view, error: null, recoveringRenderer: false });
      if (view.state.runtime.status === 'PREPARATION' && (view.state.runtime.preparationScaleDue !== null || view.state.runtime.architecture.resources.some(r => r.remaining > 0))) schedule(prepare);
    },
    select(id: string | null) { if (!destroyed) publish({ ...view, selected: id }); },
    build(kind: Kind | null) { if (!destroyed && view.state.runtime.status === 'PREPARATION') publish({ ...view, building: kind, preview: null, notice: '', connecting: false, connectionSource: null }); },
    connectMode(enabled: boolean) {
      if (!destroyed && view.state.runtime.status === 'PREPARATION') publish({ ...view, connecting: enabled, connectionSource: null, building: null, preview: null, notice: '' });
    },
    connectNode(id: string) {
      if (destroyed || !view.connecting || view.state.runtime.status !== 'PREPARATION') return;
      if (!view.state.runtime.architecture.resources.some(r => r.id === id)) return;
      if (view.connectionSource === null) { publish({ ...view, connectionSource: id, selected: id, notice: '' }); return; }
      const from = view.connectionSource;
      if (edit(a => connectResources(a, from, id))) publish({ ...view, connectionSource: null, notice: `Connected ${from} → ${id}.` });
    },
    disconnect(from: string, to: string) {
      if (destroyed || view.state.runtime.status !== 'PREPARATION') return;
      edit(a => disconnectResources(a, from, to));
      publish({ ...view, connectionSource: null });
    },
    preview(point: Point | null) { if (!destroyed && view.building) publish({ ...view, preview: point }); },
    place(point: Point) {
      if (!view.building) return;
      const kind = view.building;
      if (edit(a => placeResource(a, kind, point))) publish({ ...view, building: null, preview: null, selected: kind });
    },
    move(id: string, point: Point) { edit(a => moveResource(a, id, point)); },
    remove(id: string) {
      if (view.state.runtime.status !== 'PREPARATION') return;
      if (edit(a => removeResource(a, id))) {
        const runtime = { ...view.state.runtime };
        if (!runtime.architecture.resources.some(r => r.kind === 'compute')) runtime.preparationScaleDue = null;
        publish({ ...view, selected: null, connectionSource: null, state: { ...view.state, runtime } });
      }
    },
    scalePreparation() {
      if (destroyed || view.error || view.state.runtime.status !== 'PREPARATION') return;
      try {
        publish({ ...view, state: { ...view.state, runtime: requestPreparationScale(view.state.runtime) }, notice: '' });
        if (!cancel) schedule(prepare);
      } catch (error) { publish({ ...view, notice: error instanceof Error ? error.message : 'Scale unavailable' }); }
    },
    reduceInstances() { edit(a => {
      const app = a.resources.find(r => r.kind === 'compute');
      if (!app || app.instances <= 1 || view.state.runtime.preparationScaleDue !== null) throw new Error('Cannot reduce instances while at minimum or provisioning.');
      const next = structuredClone(a); next.resources.find(r => r.kind === 'compute')!.instances--; return next;
    }); },
    setCamera(camera: Camera) { if (!destroyed) publish({ ...view, camera: { x: Math.max(-1200, Math.min(1200, camera.x)), y: Math.max(-900, Math.min(900, camera.y)), zoom: Math.max(.5, Math.min(1.6, camera.zoom)) } }); },
    inspectNextTick() { stop(); advance(); },
    presentationFailed(message: string) {
      if (destroyed) return;
      stop();
      const runtime = view.state.runtime.status === 'RUNNING' ? pauseRuntime(view.state.runtime) : view.state.runtime;
      publish({ ...view, confirmationEpoch: view.confirmationEpoch + 1, state: { ...view.state, runtime }, error: message, recoveringRenderer: false });
    },
    destroy() { stop(); destroyed = true; listeners.clear(); },
  };
}
export type Controller = ReturnType<typeof createController>;

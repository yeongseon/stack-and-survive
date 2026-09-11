import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { advanceSimulation, createSimulation, simulationResult } from '@stack-and-survive/simulation/results';
import { startRuntime } from '@stack-and-survive/simulation/runtime';

export type View = Readonly<{
  state: ReturnType<typeof createSimulation>;
  snapshot: ReturnType<typeof advanceSimulation>['snapshot'];
  result: ReturnType<typeof simulationResult> | null;
  error: string | null;
}>;
export interface Clock {
  start(callback: () => void): () => void;
}
const clock: Clock = {
  start(callback) { const id = globalThis.setInterval(callback, 1000); return () => globalThis.clearInterval(id); },
};

export function createController(timer: Clock = clock) {
  let view: View = { state: createSimulation(baseline(), blackFriday), snapshot: null, result: null, error: null };
  let cancel: (() => void) | undefined;
  let destroyed = false;
  const listeners = new Set<() => void>();
  const publish = (next: View) => { view = next; listeners.forEach(listener => listener()); };
  const stop = () => { cancel?.(); cancel = undefined; };
  const advance = () => {
    if (destroyed || view.error || view.state.runtime.status !== 'RUNNING') return;
    try {
      const transition = advanceSimulation(view.state, blackFriday);
      const terminal = transition.nextState.runtime.status !== 'RUNNING';
      if (terminal) stop();
      publish({ state: transition.nextState, snapshot: transition.snapshot,
        result: terminal ? simulationResult(transition.nextState, blackFriday) : null, error: null });
    } catch (error) {
      stop(); publish({ ...view, error: error instanceof Error ? error.message : 'Simulation could not advance' });
    }
  };
  return {
    getSnapshot: () => view,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      if (destroyed || view.state.runtime.status !== 'PREPARATION' || view.error) return;
      publish({ ...view, state: { ...view.state, runtime: startRuntime(view.state.runtime) } });
      cancel = timer.start(advance);
    },
    reset(instances = 1) {
      if (destroyed) return;
      if (!Number.isInteger(instances) || instances < 1 || instances > 4) throw new Error('Invalid instance configuration');
      stop(); publish({ state: createSimulation(baseline(instances), blackFriday), snapshot: null, result: null, error: null });
    },
    inspectNextTick() { stop(); advance(); },
    presentationFailed(message: string) { stop(); publish({ ...view, error: message }); },
    destroy() { stop(); destroyed = true; listeners.clear(); },
  };
}
export type Controller = ReturnType<typeof createController>;

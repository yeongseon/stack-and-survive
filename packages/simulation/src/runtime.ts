import { integer, type Architecture, type Scenario } from '@stack-and-survive/schema';
import { parseArchitecture, validateStart } from '@stack-and-survive/cloud-domain';
import { processRequests, type RequestSnapshot } from './index';

export type Action = Readonly<{ time: number; sequence: number } & (
  { type: 'SCALE_OUT' } | { type: 'RATE_LIMIT'; enabled: boolean } | { type: 'EMERGENCY_WAF' }
)>;
export type ActionOutcome = { action: Action; accepted: boolean; reason: string | null };
export type Runtime = {
  status: 'PREPARATION' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  architecture: Architecture;
  initialArchitecture: Architecture | null;
  time: number;
  preparationTime: number;
  scaleDue: number | null;
  preparationScaleDue: number | null;
  rateLimit: boolean;
  rateTransition: { due: number; enabled: boolean } | null;
  lastRateToggle: number | null;
  emergency: { start: number; end: number } | null;
  emergencyUsed: boolean;
  lastSequence: number;
  actionLog: ActionOutcome[];
};
export type TickTransition = {
  nextState: Runtime;
  snapshot: { time: number; elapsedTime: number; requests: RequestSnapshot } | null;
  outcomes: ActionOutcome[];
  emergencyCharges: number;
};

// The scheduler cannot assume actions are affordable. The economy layer supplies this gate.
export type ActionGate = (state: Readonly<Runtime>, action: Action, acceptedEmergencyCharges: number) => string | null;

export function createPreparation(architecture: Architecture): Runtime {
  return {
    status: 'PREPARATION', architecture: parseArchitecture(architecture), initialArchitecture: null,
    time: 0, preparationTime: 0, scaleDue: null, preparationScaleDue: null,
    rateLimit: false, rateTransition: null, lastRateToggle: null, emergency: null,
    emergencyUsed: false, lastSequence: -1, actionLog: [],
  };
}
function copy(state: Runtime): Runtime { return structuredClone(state); }

export function advancePreparation(state: Runtime): Runtime {
  if (state.status !== 'PREPARATION') return copy(state);
  const next = copy(state);
  next.preparationTime++;
  for (const r of next.architecture.resources) r.remaining = Math.max(0, r.remaining - 1);
  if (next.preparationScaleDue !== null && next.preparationScaleDue <= next.preparationTime) {
    next.architecture.resources.find(r => r.kind === 'compute')!.instances++;
    next.preparationScaleDue = null;
  }
  return next;
}
export function requestPreparationScale(state: Runtime): Runtime {
  const app = state.architecture.resources.find(r => r.kind === 'compute');
  if (state.status !== 'PREPARATION' || !app || app.remaining > 0 || app.instances >= 4 || state.preparationScaleDue !== null) {
    throw new Error('Preparation scale-out unavailable');
  }
  const next = copy(state); next.preparationScaleDue = next.preparationTime + 8; return next;
}
export function startRuntime(state: Runtime): Runtime {
  if (state.status !== 'PREPARATION') throw new Error('Start requires preparation');
  const errors = validateStart(state.architecture);
  if (state.preparationScaleDue !== null) errors.push('Scale-out is provisioning');
  if (errors.length) throw new Error(errors.join('; '));
  const next = createPreparation(state.architecture);
  next.status = 'RUNNING'; next.initialArchitecture = parseArchitecture(state.architecture);
  return next;
}
export function pauseRuntime(state: Runtime): Runtime {
  if (state.status !== 'RUNNING') throw new Error('Only a running scenario can pause');
  return { ...copy(state), status: 'PAUSED' };
}
export function resumeRuntime(state: Runtime): Runtime {
  if (state.status !== 'PAUSED') throw new Error('Only a paused scenario can resume');
  return { ...copy(state), status: 'RUNNING' };
}
export function retryRuntime(state: Runtime): Runtime {
  if (state.status !== 'COMPLETED' && state.status !== 'FAILED') throw new Error('Retry requires a finished attempt');
  return createPreparation(state.architecture);
}

function validAction(action: Action): void {
  integer(action.time, 'action time'); integer(action.sequence, 'action sequence');
  if (!['SCALE_OUT', 'RATE_LIMIT', 'EMERGENCY_WAF'].includes(action.type)) throw new Error('Unsupported action type');
  if (action.type === 'RATE_LIMIT' && typeof action.enabled !== 'boolean') throw new Error('Rate limit state must be boolean');
}
export function advanceRuntime(state: Runtime, scenario: Scenario, actions: readonly Action[], gate: ActionGate): TickTransition {
  const next = copy(state);
  const outcomes: ActionOutcome[] = [];
  let emergencyCharges = 0;
  for (const action of actions) validAction(action);
  const sorted = [...actions].sort((a, b) => a.sequence - b.sequence);
  const reject = (action: Action, reason: string) => { outcomes.push({ action: structuredClone(action), accepted: false, reason }); };
  if (next.status !== 'RUNNING') {
    for (const action of sorted) reject(action, 'Actions require RUNNING');
    return { nextState: next, snapshot: null, outcomes, emergencyCharges };
  }
  const phase = scenario.traffic.find(p => p.start <= next.time && next.time < p.end);
  if (!phase) throw new Error('Running tick has no traffic phase');
  const app = next.architecture.resources.find(r => r.kind === 'compute')!;
  if (next.scaleDue !== null && next.scaleDue <= next.time) { app.instances++; next.scaleDue = null; }
  if (next.rateTransition && next.rateTransition.due <= next.time) {
    next.rateLimit = next.rateTransition.enabled; next.rateTransition = null;
  }
  if (next.emergency && next.emergency.end <= next.time) next.emergency = null;
  for (const action of sorted) {
    if (action.time !== next.time) { reject(action, 'Action timestamp does not match current tick'); continue; }
    if (action.sequence <= next.lastSequence) { reject(action, 'Action sequence must be unique and monotonic'); continue; }
    next.lastSequence = action.sequence;
    let reason: string | null = null;
    if (action.type === 'SCALE_OUT') {
      if (app.remaining > 0 || app.instances >= 4 || next.scaleDue !== null) reason = 'Scale-out unavailable: pending, inactive, or at limit';
    } else if (action.type === 'RATE_LIMIT') {
      if (next.rateTransition || next.rateLimit === action.enabled || (next.lastRateToggle !== null && next.time - next.lastRateToggle < 5)) {
        reason = 'Rate toggle unavailable: pending, no change, or cooldown';
      }
    } else {
      const edge = next.architecture.resources.find(r => r.kind === 'edge');
      if (!edge || edge.remaining > 0 || !next.architecture.connections.some(c => c.from === edge.id) || next.emergencyUsed) {
        reason = 'Emergency WAF requires active protected ingress and an unused action';
      }
    }
    if (reason === null) reason = gate(next, action, emergencyCharges);
    if (reason !== null) { reject(action, reason); continue; }
    if (action.type === 'SCALE_OUT') next.scaleDue = next.time + 8;
    else if (action.type === 'RATE_LIMIT') {
      next.rateTransition = { due: next.time + 2, enabled: action.enabled }; next.lastRateToggle = next.time;
    } else {
      next.emergencyUsed = true; next.emergency = { start: next.time + 1, end: next.time + 31 }; emergencyCharges += 8;
    }
    outcomes.push({ action: structuredClone(action), accepted: true, reason: null });
  }
  next.actionLog.push(...outcomes);
  const legitimate = phase.rps * (1 - phase.botRatio);
  const requests = processRequests(next.architecture, {
    browse: legitimate * scenario.businessMix.browse,
    order: legitimate * scenario.businessMix.order,
    bot: phase.rps * phase.botRatio,
  }, { rateLimit: next.rateLimit, emergency: !!next.emergency && next.time >= next.emergency.start });
  const time = next.time++;
  // Availability/budget failure precedence is applied by the subsequent outcome layer.
  if (next.time === scenario.duration) next.status = 'COMPLETED';
  return { nextState: next, snapshot: { time, elapsedTime: next.time, requests }, outcomes, emergencyCharges };
}

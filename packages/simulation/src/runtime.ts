import { integer, number, record, type Architecture, type Scenario, type ResourceTier } from '@stack-and-survive/schema';
import { definitions, parseArchitecture, validateStart, resourceTier, appTiers, databaseTiers, readReplica, appHorizontalScaling } from '@stack-and-survive/cloud-domain';
import { processRequests, type RequestSnapshot } from './index';

export type Action = Readonly<{ time: number; sequence: number } & (
  { type: 'SCALE_OUT' } | { type: 'RATE_LIMIT'; enabled: boolean } | { type: 'EMERGENCY_WAF' }
  | { type: 'DEPLOY_RESOURCE'; kind: 'cache' | 'edge'; x: number; y: number }
  | { type: 'SCALE_IN' | 'SCALE_UP_APP' | 'SCALE_DOWN_APP' | 'SCALE_UP_DATABASE' | 'SCALE_DOWN_DATABASE' | 'ADD_READ_REPLICA' | 'REMOVE_READ_REPLICA' }
)>;
export const infrastructureActionTypes = ['SCALE_IN', 'SCALE_UP_APP', 'SCALE_DOWN_APP', 'SCALE_UP_DATABASE', 'SCALE_DOWN_DATABASE', 'ADD_READ_REPLICA', 'REMOVE_READ_REPLICA'] as const;
export type InfrastructureActionType = typeof infrastructureActionTypes[number];
export type InfrastructureChange = { kind: 'compute' | 'database'; type: InfrastructureActionType; due: number; started: number };
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
  deployments: { id: string; due: number }[];
  infrastructureChanges: InfrastructureChange[];
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
    emergencyUsed: false, lastSequence: -1, actionLog: [], deployments: [], infrastructureChanges: [],
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

export function parseAction(input: unknown): Action {
  const raw = record(input, 'action');
  const allowed = ['type', 'time', 'sequence', ...(raw.type === 'RATE_LIMIT' ? ['enabled'] : raw.type === 'DEPLOY_RESOURCE' ? ['kind', 'x', 'y'] : [])];
  if (Object.keys(raw).some(key => !allowed.includes(key))) throw new Error('Unsupported action field');
  const time = integer(raw.time, 'action time', 0, 3600), sequence = integer(raw.sequence, 'action sequence', 0, Number.MAX_SAFE_INTEGER);
  if (raw.type === 'SCALE_OUT' || raw.type === 'EMERGENCY_WAF') return { type: raw.type, time, sequence };
  const infrastructure = infrastructureActionTypes.find(type => type === raw.type);
  if (infrastructure) return { type: infrastructure, time, sequence };
  if (raw.type === 'RATE_LIMIT' && typeof raw.enabled === 'boolean') return { type: raw.type, enabled: raw.enabled, time, sequence };
  if (raw.type === 'DEPLOY_RESOURCE' && (raw.kind === 'cache' || raw.kind === 'edge')) return { type: raw.type, kind: raw.kind, x: number(raw.x, 'x', -900, 900), y: number(raw.y, 'y', -600, 600), time, sequence };
  throw new Error('Unsupported action type');
}
function validAction(action: Action): void {
  parseAction(action);
  integer(action.time, 'action time'); integer(action.sequence, 'action sequence');
  if (!['SCALE_OUT', 'RATE_LIMIT', 'EMERGENCY_WAF', 'DEPLOY_RESOURCE', ...infrastructureActionTypes].includes(action.type)) throw new Error('Unsupported action type');
  if (action.type === 'RATE_LIMIT' && typeof action.enabled !== 'boolean') throw new Error('Rate limit state must be boolean');
  if (action.type === 'DEPLOY_RESOURCE') {
    if (action.kind !== 'cache' && action.kind !== 'edge') throw new Error('Only Cache or Edge can be deployed live');
    number(action.x, 'deployment x', -900, 900); number(action.y, 'deployment y', -600, 600);
  }
}
export function validateActionSchedule(actions: readonly Action[], duration: number): void {
  for (const action of actions) {
    validAction(action);
    if (action.time >= duration) throw new Error('Action timestamp must be within the scenario duration');
  }
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
  for (const change of next.infrastructureChanges.filter(change => change.due <= next.time)) {
    const resource = next.architecture.resources.find(r => r.kind === change.kind)!;
    if (change.type === 'SCALE_IN') resource.instances--;
    else if (change.type === 'ADD_READ_REPLICA') resource.readReplicas = (resource.readReplicas ?? 0) + 1;
    else if (change.type === 'REMOVE_READ_REPLICA') resource.readReplicas = (resource.readReplicas ?? 0) - 1;
    else resource.tier = (resourceTier(resource) + (change.type.startsWith('SCALE_UP') ? 1 : -1)) as ResourceTier;
  }
  next.infrastructureChanges = next.infrastructureChanges.filter(change => change.due > next.time);
  for (const deployment of next.deployments) {
    const resource = next.architecture.resources.find(r => r.id === deployment.id)!;
    resource.remaining = Math.max(0, deployment.due - next.time);
    if (resource.remaining === 0) {
      const internet = next.architecture.resources.find(r => r.kind === 'internet')!;
      const sql = next.architecture.resources.find(r => r.kind === 'database')!;
      if (resource.kind === 'cache') next.architecture.connections.push({ from: app.id, to: resource.id }, { from: resource.id, to: sql.id });
      else {
        next.architecture.connections = next.architecture.connections.filter(c => !(c.from === internet.id && c.to === app.id));
        next.architecture.connections.push({ from: internet.id, to: resource.id }, { from: resource.id, to: app.id });
      }
    }
  }
  next.deployments = next.deployments.filter(d => d.due > next.time);
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
      if (app.remaining > 0 || app.instances >= 4 || next.scaleDue !== null || next.infrastructureChanges.some(c => c.kind === 'compute')) reason = 'Scale-out unavailable: pending, inactive, or at limit';
    } else if (infrastructureActionTypes.some(type => type === action.type)) {
      const kind = action.type.includes('DATABASE') || action.type.includes('REPLICA') ? 'database' : 'compute';
      const resource = next.architecture.resources.find(r => r.kind === kind)!;
      if (scenario.balanceVersion !== '0.4') reason = 'Infrastructure scaling requires rules 0.4';
      else if (resource.remaining > 0 || next.infrastructureChanges.some(c => c.kind === kind) || kind === 'compute' && next.scaleDue !== null) reason = 'A change is already pending or the resource is inactive';
      else if (action.type === 'SCALE_IN' && resource.instances <= 1) reason = 'Keep at least one App instance';
      else if (action.type.startsWith('SCALE_UP') && resourceTier(resource) >= 3) reason = 'Already at maximum tier';
      else if (action.type.startsWith('SCALE_DOWN') && resourceTier(resource) <= 1) reason = 'Already at minimum tier';
      else if (action.type === 'ADD_READ_REPLICA' && (resource.readReplicas ?? 0) >= readReplica.maximum) reason = 'Already at maximum read replicas';
      else if (action.type === 'REMOVE_READ_REPLICA' && !(resource.readReplicas ?? 0)) reason = 'No read replica to remove';
    } else if (action.type === 'RATE_LIMIT') {
      if (next.rateTransition || next.rateLimit === action.enabled || (next.lastRateToggle !== null && next.time - next.lastRateToggle < 5)) {
        reason = 'Rate toggle unavailable: pending, no change, or cooldown';
      }
    } else if (action.type === 'DEPLOY_RESOURCE') {
      if (next.architecture.resources.some(r => r.kind === action.kind || r.id === action.kind)) reason = 'Resource already installed or provisioning';
    } else {
      const edge = next.architecture.resources.find(r => r.kind === 'edge');
      if (!edge || edge.remaining > 0 || !next.architecture.connections.some(c => c.from === edge.id) || next.emergencyUsed) {
        reason = 'Emergency WAF requires active protected ingress and an unused action';
      }
    }
    if (reason === null) reason = gate(next, action, emergencyCharges);
    if (reason !== null) { reject(action, reason); continue; }
    if (action.type === 'SCALE_OUT') next.scaleDue = next.time + appHorizontalScaling.addDelay;
    else if (infrastructureActionTypes.some(type => type === action.type)) {
      const kind = action.type.includes('DATABASE') || action.type.includes('REPLICA') ? 'database' : 'compute';
      const delay = action.type === 'SCALE_IN' ? appHorizontalScaling.removeDelay : action.type === 'REMOVE_READ_REPLICA' ? readReplica.removeDelay : action.type === 'ADD_READ_REPLICA' ? readReplica.addDelay : kind === 'compute' ? appTiers[0].delay : databaseTiers[0].delay;
      next.infrastructureChanges.push({ kind, type: action.type as InfrastructureActionType, started: next.time, due: next.time + delay });
    } else if (action.type === 'RATE_LIMIT') {
      next.rateTransition = { due: next.time + 2, enabled: action.enabled }; next.lastRateToggle = next.time;
    } else if (action.type === 'DEPLOY_RESOURCE') {
      const duration = definitions[action.kind].provisioning;
      next.architecture.resources.push({ id: action.kind, kind: action.kind, x: action.x, y: action.y, remaining: duration, instances: 1 });
      next.deployments.push({ id: action.kind, due: next.time + duration });
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

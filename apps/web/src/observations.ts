import type { View } from './controller';
import { blackFriday } from '@stack-and-survive/scenarios';
import { compare } from '@stack-and-survive/simulation/economy';
import { definitions } from '@stack-and-survive/cloud-domain';

export type GameEvent = { key: string; sequence?: number; time: number; clock: 'prep' | 'run'; text: string };
export function transitionEvents(previous: View, next: View): GameEvent[] {
  const events: GameEvent[] = [];
  const runtime = next.state.runtime;
  const clock = runtime.status === 'PREPARATION' ? 'prep' : 'run';
  const time = clock === 'prep' ? runtime.preparationTime : runtime.time;
  const add = (key: string, text: string) => events.push({ key: `${clock}:${time}:${key}`, time, clock, text });
  if (previous.state.runtime.status !== runtime.status) {
    const text = { PREPARATION: 'Back to build mode', RUNNING: previous.state.runtime.status === 'PAUSED' ? 'Traffic resumed' : 'Black Friday started', PAUSED: 'Traffic paused', COMPLETED: 'All traffic phases survived', FAILED: 'Scenario failed' }[runtime.status];
    add('status', text);
  }
  for (const resource of runtime.architecture.resources) {
    const old = previous.state.runtime.architecture.resources.find(r => r.id === resource.id);
    if (!old) add(`added:${resource.id}`, `${definitions[resource.kind].name} placed — provisioning`);
    else if (old.remaining > 0 && resource.remaining === 0) add(`active:${resource.id}`, `${definitions[resource.kind].name} is active`);
    else if (resource.instances > old.instances) add(`scaled:${resource.id}`, `Scale-out completed: ${resource.instances} active instances`);
  }
  if (next.snapshot && next.snapshot !== previous.snapshot) {
    const old = previous.snapshot?.requests; const current = next.snapshot.requests;
    if (current.offered.bot > 0 && (!old || old.offered.bot === 0)) add('bots', 'Automated traffic detected');
    if (current.edge.filtered.bot > 0 && (!old || old.edge.filtered.bot === 0)) add('filter', 'Protected Edge is filtering bot traffic');
    for (const [key, name, before, after] of [
      ['app', 'App Service', old?.app.utilization ?? 0, current.app.utilization],
      ['sql', 'Azure SQL', old ? Math.max(old.sql.readUtilization, old.sql.writeUtilization) : 0, Math.max(current.sql.readUtilization, current.sql.writeUtilization)],
    ] as const) {
      if (compare(before, 1) <= 0 && compare(after, 1) > 0) add(`overload:${key}`, `${name} overloaded`);
      if (compare(before, 1) > 0 && compare(after, 1) <= 0) add(`recovery:${key}`, `${name} recovered below capacity`);
    }
    if (current.rateLimit.active !== old?.rateLimit.active && (current.rateLimit.active || old)) add('rate', `Rate Limit ${current.rateLimit.active ? 'enabled' : 'disabled'}`);
    const isEmergency = (view: View) => !!view.snapshot && !!view.state.runtime.emergency && view.snapshot.time >= view.state.runtime.emergency.start && view.snapshot.time < view.state.runtime.emergency.end;
    if (isEmergency(next) !== isEmergency(previous)) add('emergency', isEmergency(next) ? 'Emergency WAF filtering active' : 'Emergency WAF expired — normal filtering restored');
    const phase = blackFriday.traffic.findIndex(p => p.start <= next.snapshot!.time && next.snapshot!.time < p.end);
    const oldPhase = previous.snapshot ? blackFriday.traffic.findIndex(p => p.start <= previous.snapshot!.time && previous.snapshot!.time < p.end) : -1;
    if (phase !== oldPhase && phase >= 0) add('phase', `Traffic phase ${phase + 1} / ${blackFriday.traffic.length}`);
  }
  return events;
}
export function updateEvents(history: readonly GameEvent[], previous: View, next: View): GameEvent[] {
  const reset = next.state.runtime.status === 'PREPARATION' && (previous.state.runtime.status !== 'PREPARATION' || next.rendererGeneration !== previous.rendererGeneration && next.state.runtime.preparationTime === 0);
  const base = reset ? [] : history;
  const newEvents = transitionEvents(previous, next);
  const sequence = (base.at(-1)?.sequence ?? -1) + 1;
  return [...base, ...newEvents.map((event, i) => ({ ...event, key: `${event.key}:${sequence + i}`, sequence: sequence + i }))].slice(-30);
}
export type Objective = { name: string; status: 'pending' | 'on-track' | 'at-risk' | 'met' | 'missed'; value: string };
export function objectives(view: View): Objective[] {
  const final = view.result;
  const started = view.state.runtime.time > 0;
  const current = (ok: boolean, met?: boolean): Objective['status'] => final ? met ? 'met' : 'missed' : !started ? 'pending' : ok ? 'on-track' : 'at-risk';
  const totals = view.state.totals;
  return [
    { name: 'Survive Black Friday', status: final ? final.status === 'COMPLETED' ? 'met' : 'missed' : 'pending', value: `${view.state.runtime.time} / ${blackFriday.duration}s` },
    { name: `Availability ≥ ${blackFriday.targets.availability * 100}%`, status: current(compare(totals.availability, blackFriday.targets.availability) >= 0, final?.targetAttainment.availability), value: totals.noDemand ? 'No demand yet' : `${(totals.availability * 100).toFixed(2)}%` },
    { name: `Latency ≤ ${blackFriday.targets.latencyMs} ms`, status: current(totals.averageLatency !== null && compare(totals.averageLatency, blackFriday.targets.latencyMs) <= 0, final?.targetAttainment.latency), value: totals.averageLatency === null ? 'No successes yet' : `${totals.averageLatency.toFixed(0)} ms` },
    { name: 'Stay within budget', status: current(compare(view.state.economy.remainingBudget, 0) > 0, final ? compare(final.economy.remainingBudget, 0) > 0 : undefined), value: `${view.state.economy.remainingBudget.toFixed(1)} credits` },
    { name: `Net value ≥ ${blackFriday.targets.netBusinessValue}`, status: current(compare(view.state.economy.netBusinessValue, blackFriday.targets.netBusinessValue) >= 0, final?.targetAttainment.businessValue), value: `${view.state.economy.netBusinessValue.toFixed(1)} credits` },
  ];
}

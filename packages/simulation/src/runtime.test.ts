import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFridayV02 as blackFriday } from '@stack-and-survive/scenarios';
import { advancePreparation, advanceRuntime, createPreparation, pauseRuntime, requestPreparationScale, resumeRuntime, retryRuntime, startRuntime, type Action, type Runtime } from './runtime';

// Timing fixtures explicitly assume sufficient budget; affordability is owned by issue #11.
const sufficientBudget = () => null;
const tick = (s: Runtime, actions: Action[] = []) => advanceRuntime(s, blackFriday, actions, sufficientBudget);
it('activates scale at42 for action34 and prevents concurrent scale', () => {
  let s = startRuntime(createPreparation(baseline()));
  while (s.time < 34) s = tick(s).nextState;
  const result = tick(s, [{ time: 34, sequence: 2, type: 'SCALE_OUT' }, { time: 34, sequence: 1, type: 'SCALE_OUT' }]);
  expect(result.outcomes.map(o => o.accepted)).toEqual([true, false]);
  s = result.nextState;
  while (s.time < 42) { const r = tick(s); expect(r.snapshot!.requests.app.capacity).toBe(150); s = r.nextState; }
  expect(tick(s).snapshot!.requests.app.capacity).toBe(300);
});
it('keeps preparation time separate and gates start on provisioning', () => {
  const a = baseline(); a.resources[1].remaining = 5;
  let s = createPreparation(a); expect(() => startRuntime(s)).toThrow('provisioning');
  for (let i = 0; i < 5; i++) s = advancePreparation(s);
  expect(s.time).toBe(0); s = requestPreparationScale(s);
  expect(() => startRuntime(s)).toThrow('provisioning');
  for (let i = 0; i < 8; i++) s = advancePreparation(s);
  expect(startRuntime(s).architecture.resources[1].instances).toBe(2);
});
it('pause freezes pending activation, all clocks, and actions', () => {
  const started = tick(startRuntime(createPreparation(baseline())), [{ time: 0, sequence: 0, type: 'SCALE_OUT' }]).nextState;
  const paused = pauseRuntime(started);
  const result = tick(paused, [{ time: 1, sequence: 1, type: 'RATE_LIMIT', enabled: true }]);
  expect(result.nextState).toEqual(paused); expect(result.outcomes[0].accepted).toBe(false);
  expect(advancePreparation(paused)).toEqual(paused);
  expect(resumeRuntime(paused).time).toBe(1);
});
it('rate toggles activate after2 ticks and enforce5-tick request spacing', () => {
  let s = startRuntime(createPreparation(baseline(3, true, true)));
  s = tick(s, [{ time: 0, sequence: 0, type: 'RATE_LIMIT', enabled: true }]).nextState;
  expect(tick(s).snapshot!.requests.rateLimit.active).toBe(false); s = tick(s).nextState;
  const active = tick(s, [{ time: 2, sequence: 1, type: 'RATE_LIMIT', enabled: false }]);
  expect(active.snapshot!.requests.rateLimit.active).toBe(true); expect(active.outcomes[0].accepted).toBe(false);
  s = active.nextState; while (s.time < 5) s = tick(s).nextState;
  s = tick(s, [{ time: 5, sequence: 2, type: 'RATE_LIMIT', enabled: false }]).nextState;
  s = tick(s).nextState; expect(tick(s).snapshot!.requests.rateLimit.active).toBe(false);
});
it('emergency charges once and is effective over exactly30 ticks', () => {
  let s = startRuntime(createPreparation(baseline(3, true, true)));
  while (s.time < 120) s = tick(s).nextState;
  const activation = tick(s, [{ time: 120, sequence: 0, type: 'EMERGENCY_WAF' }]);
  expect(activation.emergencyCharges).toBe(8); expect(activation.snapshot!.requests.edge.filtered.bot).toBe(140);
  s = activation.nextState;
  for (let t = 121; t < 151; t++) { const r = tick(s); expect(r.snapshot!.requests.edge.filtered.bot).toBe(180); expect(r.emergencyCharges).toBe(0); s = r.nextState; }
  const expired = tick(s, [{ time: 151, sequence: 1, type: 'EMERGENCY_WAF' }]);
  expect(expired.snapshot!.requests.edge.filtered.bot).toBe(140); expect(expired.outcomes[0].accepted).toBe(false);
});
it('rejection has no scheduling effect and economic gate is explicit', () => {
  const s = startRuntime(createPreparation(baseline()));
  const action: Action = { time: 0, sequence: 0, type: 'SCALE_OUT' };
  const r = advanceRuntime(s, blackFriday, [action], () => 'Insufficient budget');
  expect(r.nextState.scaleDue).toBeNull(); expect(r.outcomes[0].reason).toBe('Insufficient budget');
  expect(tick(s, [{ time: 0, sequence: 1, type: 'EMERGENCY_WAF' }]).outcomes[0].accepted).toBe(false);
  expect(s.time).toBe(0);
});
it('finishes exactly180 ticks and retry preserves only completed capacity', () => {
  let s = startRuntime(createPreparation(baseline(2)));
  while (s.time < 175) s = tick(s).nextState;
  s = tick(s, [{ time: 175, sequence: 0, type: 'SCALE_OUT' }]).nextState;
  while (s.status === 'RUNNING') s = tick(s).nextState;
  expect(s.time).toBe(180); expect(tick(s).snapshot).toBeNull();
  const retry = retryRuntime(s); expect(retry.architecture.resources[1].instances).toBe(2);
  expect(retry.scaleDue).toBeNull(); expect(retry.time).toBe(0); expect(retry.actionLog).toEqual([]);
});
it('freezes disconnected preparation resource timers during running', () => {
  const a = baseline(3, true); a.connections = baseline(3).connections;
  a.resources.find(r => r.kind === 'cache')!.remaining = 5;
  const s = tick(startRuntime(createPreparation(a))).nextState;
  expect(s.architecture.resources.find(r => r.kind === 'cache')!.remaining).toBe(5);
});

import type { View } from './controller';
import { compare } from '@stack-and-survive/simulation/economy';
import { blackFriday } from '@stack-and-survive/scenarios';
import { formatMoneyRate } from './money';
import { definitions } from '@stack-and-survive/cloud-domain';

export type GuideStage = 'observe' | 'decide' | 'compare';
export type GuideRecord = 'new' | 'skipped' | 'completed';
export const guideStorageKey = 'stack-and-survive.guide.v1';
export function parseGuideRecord(raw: string | null): GuideRecord {
  try {
    const record = JSON.parse(raw ?? 'null');
    return record?.version === 1 && ['skipped', 'completed'].includes(record.status) ? record.status : 'new';
  } catch { return 'new'; }
}
export type GuideHint = { title: string; text: string; target: 'internet' | 'compute' | 'cache' | 'edge' | 'database' | null };
export function guideHint(view: View, stage: GuideStage): GuideHint {
  const runtime = view.state.runtime;
  if (view.error) return { title: 'Restore the world first', text: 'Graphics recovery and restart are available. Guidance does not change your operation.', target: null };
  if (runtime.status === 'FAILED' || runtime.status === 'COMPLETED') return { title: 'Review your decision', text: 'The result shows what actually happened. Compare the cause and business value before trying a different approach.', target: null };
  if (runtime.status === 'PAUSED') return { title: 'Time is paused', text: 'Inspect the last measured flow. Resume when you are ready; this guide never pauses or advances the game itself.', target: null };
  const r = view.snapshot?.requests;
  if (!r || runtime.status !== 'RUNNING') return { title: 'Your business is about to open', text: 'Traffic will enter at the Internet intake. No infrastructure choice is required before the countdown finishes.', target: null };
  if (stage === 'observe') return { title: 'Follow the traffic', text: 'Follow the highlighted intake through App to SQL. Watch where pressure builds.', target: 'internet' };
  if (stage === 'compare') return { title: 'Look for the consequence', text: 'After activation, compare the flow and pressure. Improvement is not guaranteed: more App capacity does not expand SQL.', target: null };
  const resources = runtime.architecture.resources;
  const app = resources.find(resource => resource.kind === 'compute');
  if (resources.some(resource => resource.remaining > 0) || runtime.scaleDue !== null) return { title: 'Construction is not capacity yet', text: 'Wait for the scaffold to become solid before judging its effect. Other options remain available.', target: null };
  if (view.queuedActions.length > 0) return { title: 'Request sent', text: 'Your action is waiting for the next operation tick. A click does not instantly add capacity or filter traffic.', target: null };
  if (compare(view.state.economy.remainingBudget / (view.challenge?.workload.budget ?? blackFriday.budget), .2) < 0) return { title: 'Upgrade Funds are running low', text: 'Only 10% of successful sales returns to Upgrade Funds. Check running costs before expanding.', target: null };
  if (compare(r.sql.writeUtilization, 1) > 0) return { title: 'Writes are pressing on SQL', text: 'Inspect the SQL write side. Cache does not remove Order writes, and adding App instances does not expand this fixed database.', target: 'database' };
  if (compare(r.sql.readUtilization, 1) > 0 && !resources.some(resource => resource.kind === 'cache')) return { title: 'Consider reducing SQL reads', text: `Click the Cache footprint once to deploy: 5s, +${formatMoneyRate(definitions.cache.cost, 'min')}. Eligible reads can finish there; Order writes still need SQL.`, target: 'cache' };
  if (compare(r.app.utilization, 1) > 0 && r.offered.bot > 0 && !resources.some(resource => resource.kind === 'edge')) return { title: 'Bots are using App capacity', text: 'Consider Protected Edge at ingress, or compare adding App capacity. Edge filtering also has a running cost and can reject some legitimate traffic.', target: 'edge' };
  if (compare(r.app.utilization, .7) > 0 && app && app.instances < 4) return { title: 'Consider more App capacity', text: `Click the highlighted empty bay once to expand: 8s, +${formatMoneyRate(definitions.compute.cost, 'min')}. Prepare before the next wave; capacity is not instant.`, target: 'compute' };
  if (compare(r.sql.readUtilization, 1) > 0) return { title: 'SQL reads remain constrained', text: 'Cache is already installed. Inspect the SQL read side; another App server cannot increase database capacity.', target: 'database' };
  if (compare(r.app.utilization, 1) > 0) return { title: 'App is at its expansion limit', text: 'Four servers can still overload. Inspect traffic intake and its filtering trade-off; there is no fifth instance.', target: 'internet' };
  if (compare(r.cache.utilization ?? 0, 1) > 0) return { title: 'Cache is under pressure', text: 'Overflow reads still reach SQL. Inspect the downstream read pressure before adding App capacity.', target: 'database' };
  return { title: 'You do not have to build yet', text: 'No available expansion is clearly indicated by the current pressure. Follow the lanes, inspect a facility, or wait. The guide will adapt to real demand.', target: null };
}

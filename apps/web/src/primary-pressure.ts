import type { View } from './controller';
import { blackFriday } from '@stack-and-survive/scenarios';
import { compare } from '@stack-and-survive/simulation/economy';

export function primaryPressure(view: View): { label: string; why: string; urgent: boolean } {
  const budget = view.state.economy.remainingBudget;
  const reinvests = view.challenge?.rulesVersion === '0.3';
  if (compare(budget / (view.challenge?.workload.budget ?? blackFriday.budget), .2) < 0) return {
    label: compare(budget, 0) <= 0 ? `${reinvests?'Upgrade Funds':'Budget'} exhausted` : `${reinvests?'Upgrade Funds':'Budget'} running low`, urgent: true,
    why: reinvests ? 'Less than 20% of initial Upgrade Funds remains. Only 10% of successful sales is reinvested; watch running costs.' : 'Less than 20% of the operational budget remains. Check running costs before expanding. Revenue does not refill this budget.',
  };
  const r = view.snapshot?.requests;
  if (!r) return { label: 'Awaiting demand', why: 'Start the operation to measure processing pressure. Preparation does not consume the operational budget.', urgent: false };
  const signals = [
    { label: 'SQL writes', u: r.sql.writeUtilization, why: 'Order writes go directly to SQL. Cache does not remove writes, and App scaling does not increase SQL capacity.' },
    { label: 'SQL reads', u: r.sql.readUtilization, why: 'Eligible reads consume SQL read capacity. A connected Cache can reduce those reads; App scaling does not increase SQL capacity.' },
    { label: 'App', u: r.app.utilization, why: 'App demand consumes active compute capacity, including bots. Scale-out adds capacity only after provisioning; check protected ingress too.' },
    { label: 'Cache', u: r.cache.utilization ?? 0, why: 'Cache handles eligible reads, not Order writes. Reads beyond Cache capacity continue to SQL; inspect SQL read pressure before adding App capacity.' },
  ];
  const strongest = signals.reduce((a, b) => compare(b.u, a.u) > 0 ? b : a);
  if (compare(strongest.u, .7) > 0) return {
    label: `${strongest.label} ${compare(strongest.u, 1) > 0 ? 'over capacity' : 'busy'}`,
    why: strongest.why, urgent: compare(strongest.u, 1) > 0,
  };
  if (view.snapshot!.critical) return { label: 'Customer losses', why: 'Check availability and filtering losses. Requests rejected by WAF or Rate Limit still count as failed customers, even when processing capacity is sufficient.', urgent: true };
  return { label: 'Within capacity', why: 'No processing layer is above the healthy utilization boundary in this tick. This is a current reading, not a forecast of the next demand phase.', urgent: false };
}

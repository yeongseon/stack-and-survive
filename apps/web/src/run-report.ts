import { sameChallenge } from '@stack-and-survive/scenarios/challenge';
import { compare } from '@stack-and-survive/simulation/economy';
import { recentComparable, type RunHistory, type RunSummary } from './run-history';

export function compareRuns(current: RunSummary, previous: RunSummary | null) {
  if (!previous || !sameChallenge(current.challenge, previous.challenge)) return null;
  if (current.status !== previous.status || current.elapsed !== previous.elapsed) return {
    kind: 'different-duration' as const, previous,
  };
  return { kind: 'comparable' as const, previous,
    availability: (current.availability - previous.availability) * 100,
    cost: current.cost + current.emergencyCost - previous.cost - previous.emergencyCost,
    value: current.nbv - previous.nbv,
  };
}

export function buildRunReport(run: RunSummary, history: RunHistory) {
  const best = history.bests.find(b => sameChallenge(b.challenge, run.challenge));
  const records: string[] = [];
  if (run.objectiveMet) {
    if (!best || compare(run.availability, best.highestAvailability.availability) > 0) records.push('Availability');
    if (!best || compare(run.cost + run.emergencyCost, best.lowestCost.cost + best.lowestCost.emergencyCost) < 0) records.push('Total cost');
    if (!best || compare(run.nbv, best.highestValue.nbv) > 0) records.push('Business value');
  }
  return { run, previous: compareRuns(run, recentComparable(history, run.challenge)), records,
    baseline: best ? compareRuns(run, best.highestValue) : null };
}
export type RunReport = ReturnType<typeof buildRunReport>;

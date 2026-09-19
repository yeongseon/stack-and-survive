import type { Scenario } from '@stack-and-survive/schema';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';
import { blackFriday } from '@stack-and-survive/scenarios';
import type { View } from './controller';
import { trafficPhaseLabel } from './wave-feedback';

export function missionBrief(scenario: Scenario) {
  const first = scenario.traffic[0];
  const final = scenario.traffic[scenario.traffic.length - 1];
  return { name: scenario.id === 'black-friday' ? 'Black Friday' : scenario.id,
    duration: scenario.duration, opening: first.rps, final: final.rps, bots: Math.round(final.botRatio * 100) };
}

export function objectiveSummary(challenge: Challenge) {
  return challenge.objective.kind === 'availability'
    ? `Finish with ≥${Number((challenge.objective.target * 100).toFixed(4))}% availability`
    : `Finish ${challenge.workload.duration} seconds`;
}

export function phaseArrival(view: View) {
  if (view.error || view.result || view.state.runtime.status !== 'RUNNING' || !view.snapshot) return null;
  const scenario = view.challenge?.workload ?? blackFriday;
  const time = view.snapshot.time;
  const index = scenario.traffic.findIndex(phase => phase.start <= time && time < phase.end);
  const phase = scenario.traffic[index];
  if (!phase || index === 0 || view.snapshot.time - phase.start >= 2) return null;
  return { start: phase.start, label: trafficPhaseLabel(scenario, index), rps: phase.rps, bots: Math.round(phase.botRatio * 100) };
}

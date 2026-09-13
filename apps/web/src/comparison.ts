import type { Result } from './ResultPanel';
import { sameChallenge } from '@stack-and-survive/scenarios/challenge';

export function compareAttempts(previous: Result, current: Result) {
  const sameScenario = previous.scenarioId === current.scenarioId && previous.balanceVersion === current.balanceVersion && previous.schemaVersion === current.schemaVersion
    && (previous.challenge || current.challenge ? !!previous.challenge && !!current.challenge && sameChallenge(previous.challenge, current.challenge) : true);
  const sameDuration = previous.elapsedTime === current.elapsedTime;
  const rows = [
    { label: 'Availability (%)', before: previous.metrics.noDemand ? null : previous.metrics.availability * 100, after: current.metrics.noDemand ? null : current.metrics.availability * 100 },
    { label: 'Average latency (ms)', before: previous.metrics.averageLatency, after: current.metrics.averageLatency },
    { label: 'SQL read peak (%)', before: previous.attribution.peaks.sqlRead * 100, after: current.attribution.peaks.sqlRead * 100 },
    { label: 'SQL write peak (%)', before: previous.attribution.peaks.sqlWrite * 100, after: current.attribution.peaks.sqlWrite * 100 },
    { label: 'Infrastructure cost', before: previous.economy.infrastructureCost, after: current.economy.infrastructureCost },
    { label: 'Net business value', before: previous.economy.netBusinessValue, after: current.economy.netBusinessValue },
    { label: 'Architecture score', before: previous.score, after: current.score },
  ].map(row => ({ ...row, delta: sameScenario && row.before !== null && row.after !== null ? row.after - row.before : null }));
  const phases = previous.phases.flatMap(before => {
    const after = current.phases.find(p => p.start === before.start && p.end === before.end);
    if (!sameScenario || !after || before.partial || after.partial || before.data.ticks !== after.data.ticks) return [];
    return [{ start: before.start, end: before.end, before: before.data, after: after.data }];
  });
  return { sameScenario, sameDuration, rows, phases };
}

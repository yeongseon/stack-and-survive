import { blackFriday } from '@stack-and-survive/scenarios';
import type { View } from './controller';
import { trafficPhaseLabel } from './wave-feedback';

export function missionStatus(view: View) {
  const scenario = view.challenge?.workload ?? blackFriday;
  const elapsed = Math.min(scenario.duration, Math.max(0, view.state.runtime.time));
  const remaining = scenario.duration - elapsed;
  // Runtime time marks the next tick; the world/readouts show the last processed snapshot.
  const observedTime = view.snapshot?.time ?? elapsed;
  const phaseIndex = observedTime >= scenario.duration ? scenario.traffic.length - 1
    : scenario.traffic.findIndex(phase => phase.start <= observedTime && observedTime < phase.end);
  const phase = scenario.traffic[phaseIndex];
  const label = trafficPhaseLabel(scenario, phaseIndex);
  const status = view.error ? 'Operation held' : view.state.runtime.status === 'PREPARATION' ? 'Get ready'
    : view.state.runtime.status === 'PAUSED' ? 'Paused' : view.result ? 'Finished' : 'Live';
  const objective = view.challenge?.objective;
  const failure = view.snapshot?.failureCountdown;
  const risks = failure && !view.result ? [
    ...(view.state.streaks.availability > 0 ? [failure.availability] : []),
    ...(view.state.streaks.order > 0 ? [failure.order] : []),
  ] : [];
  const riskSeconds = risks.length ? Math.min(...risks) : null;
  return {
    elapsed, remaining, duration: scenario.duration, phaseIndex, label, status, riskSeconds,
    phaseRps: phase?.rps ?? 0,
    phaseBots: phase ? Math.round(phase.botRatio * 100) : 0,
    clock: `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`,
    objective: objective?.kind === 'availability' ? `Finish with ≥${Number((objective.target * 100).toFixed(4))}% availability` : 'Keep the business alive',
    tone: label === 'Bot attack' || label === 'FINAL WAVE' ? 'attack' : label === 'Recovery window' ? 'recovery' : 'traffic',
    arriving: status === 'Live' && phaseIndex > 0 && observedTime - phase.start < 3,
    phases: scenario.traffic.map((item, index) => ({
      start: item.start, end: item.end, label: trafficPhaseLabel(scenario, index),
      progress: Math.max(0, Math.min(1, (elapsed - item.start) / (item.end - item.start))),
    })),
  };
}

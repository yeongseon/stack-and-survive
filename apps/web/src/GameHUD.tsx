import type { View } from './controller';
import { primaryPressure } from './primary-pressure';
import { blackFriday } from '@stack-and-survive/scenarios';
import { lostSales, upcomingWave } from './wave-feedback';
import { missionStatus } from './mission-status';
import { formatMoney, formatMoneyRate } from './money';
import './gameplay-hud.css';

export function GameHUD({ view }: { view: View }) {
  const scenario = view.challenge?.workload ?? blackFriday;
  const r = view.snapshot?.requests;
  const demand = r ? r.offered.browse + r.offered.order + r.offered.bot : null;
  const availability = view.snapshot?.metrics.availability;
  const budget = view.state.economy.remainingBudget;
  const pressure = primaryPressure(view);
  const paused = view.state.runtime.status === 'PAUSED';
  const next=upcomingWave(view), loss=lostSales(r);
  const mission = missionStatus(view);
  return <>
    <section className={`mission-hud ${mission.tone}${mission.arriving ? ' phase-arriving' : ''}${mission.riskSeconds !== null ? ' service-risk' : ''}`} aria-label="Operation progress" data-held={mission.status !== 'Live'}>
      <div className="mission-heading">
        <output className="mission-phase" aria-atomic="true"><small>{mission.status} · Phase {mission.phaseIndex + 1}/{mission.phases.length}</small><strong key={mission.phaseIndex}>{mission.label}</strong>{mission.arriving && <span className="phase-detail">{mission.phaseRps} req/s{mission.phaseBots > 0 ? ` · ${mission.phaseBots}% bots` : ''}</span>}</output>
        <div className="mission-clock"><strong data-testid="mission-clock">{mission.clock}</strong><small>remaining</small></div>
      </div>
      <div className="mission-timeline" aria-hidden="true">{mission.phases.map((phase, index) => <span key={phase.start} className={index === mission.phaseIndex ? 'current' : ''} style={{ flexGrow: phase.end - phase.start }}><i style={{ width: `${phase.progress * 100}%` }} /></span>)}</div>
      <progress className="mission-accessible-progress" aria-label="Operation elapsed time" max={mission.duration} value={mission.elapsed} />
      <p className="mission-objective">{mission.objective}</p>
      {mission.riskSeconds !== null && <p className="mission-risk" data-testid="mission-risk"><span aria-hidden="true">⚠ </span>Service at risk · {mission.riskSeconds}s to interruption if losses continue</p>}
    </section>
    <section className="game-hud" aria-label="Business status">
    <div className="hud-reading"><span aria-hidden="true">◈</span><div><small>Upgrade Funds</small><strong data-testid="budget">{formatMoney(budget)}</strong><meter aria-label="Remaining upgrade funds" min={0} max={Math.max(scenario.budget,budget)} value={Math.max(0, budget)} /></div></div>
    <div className="hud-reading"><span aria-hidden="true">⇢</span><div><small>Demand</small><strong data-testid="traffic">{demand ?? '—'} <small>req/s</small></strong><meter aria-label="Demand relative to scenario peak" min={0} max={Math.max(1, ...scenario.traffic.map(p => p.rps))} value={demand ?? 0} /></div></div>
    <div className="hud-reading"><span aria-hidden="true">✓</span><div><small>Availability</small><strong data-testid="availability">{availability === undefined ? '—' : `${(availability * 100).toFixed(1)}%`}</strong><meter aria-label="Current availability" min={0} max={1} value={availability ?? 0} /></div></div>
    <div className="hud-pressure-reading"><small>System pressure</small><output className={`hud-pressure${pressure.urgent ? ' urgent' : ''}`}><span aria-hidden="true">{pressure.urgent ? '⚠' : '◇'}</span>{paused ? 'Paused · ' : view.result ? 'Final · ' : ''}{pressure.label}</output></div>
    <div className="hud-sales"><small>{paused?'Paused · ':view.result?'Final · ':''}Lost sales / sec</small><strong data-testid="lost-sales">{loss===null?'—':formatMoneyRate(loss)}</strong></div>
    {next && <div className={`hud-wave${next.imminent?' imminent':''}`} data-testid="next-wave"><span className="hud-event-label">Next</span><small>{paused?'Paused · ':''}{next.label}<span className="hud-sr-only"> in </span><span aria-hidden="true"> · </span><b>{next.seconds}s</b></small><strong>{next.rps} <small>req/s</small>{next.bots>0&&<span> · Bots {Math.round(next.bots*100)}%</span>}</strong></div>}
  </section></>;
}

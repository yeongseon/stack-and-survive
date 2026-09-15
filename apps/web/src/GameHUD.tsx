import type { View } from './controller';
import { primaryPressure } from './primary-pressure';
import { blackFriday } from '@stack-and-survive/scenarios';
import { lostSales, upcomingWave } from './wave-feedback';
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
  return <section className="game-hud" aria-label="Business status">
    <div className="hud-reading"><span aria-hidden="true">◈</span><div><small>Upgrade Funds</small><strong data-testid="budget">{budget.toFixed(1)} <small>cr</small></strong><meter aria-label="Remaining upgrade funds" min={0} max={Math.max(scenario.budget,budget)} value={Math.max(0, budget)} /></div></div>
    <div className="hud-reading"><span aria-hidden="true">⇢</span><div><small>Demand</small><strong data-testid="traffic">{demand ?? '—'} <small>req/s</small></strong><meter aria-label="Demand relative to scenario peak" min={0} max={Math.max(1, ...scenario.traffic.map(p => p.rps))} value={demand ?? 0} /></div></div>
    <div className="hud-reading"><span aria-hidden="true">✓</span><div><small>Availability</small><strong data-testid="availability">{availability === undefined ? '—' : `${(availability * 100).toFixed(1)}%`}</strong><meter aria-label="Current availability" min={0} max={1} value={availability ?? 0} /></div></div>
    <p className={`hud-pressure${pressure.urgent ? ' urgent' : ''}`} role="status"><span aria-hidden="true">{pressure.urgent ? '⚠' : '◇'}</span>{paused ? 'Paused · ' : view.result ? 'Final · ' : ''}{pressure.label}</p>
    <div className="hud-sales"><small>{paused?'Paused · ':view.result?'Final · ':''}Lost sales / sec</small><strong data-testid="lost-sales">{loss===null?'—':loss.toFixed(2)} <small>cr/s</small></strong></div>
    {next && <div className={`hud-wave${next.imminent?' imminent':''}`} data-testid="next-wave"><small>{paused?'Paused · ':''}{next.label} in <b>{next.seconds}s</b></small><strong>{next.rps} <small>req/s</small>{next.bots>0&&<span> · Bots {Math.round(next.bots*100)}%</span>}</strong></div>}
  </section>;
}

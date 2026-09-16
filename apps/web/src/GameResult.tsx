import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Architecture } from '@stack-and-survive/schema';
import type { View } from './controller';
import { classifyArchitecture } from './architecture-profile';
import { summarizeRun } from './run-history';
import { architectureSummary } from './RunHistoryPanel';
import type { RunReport } from './run-report';

function delta(value: number, unit: string) {
  return `${Math.abs(value) < .005 ? '0.00' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`} ${unit}`;
}

export function GameResult({ result, architecture, report, restart, review, nextLevel, records, leaderboard }: {
  result: NonNullable<View['result']>; architecture: Architecture; report: RunReport | null;
  restart: () => void; review: () => void; nextLevel?: () => void; records?: ReactNode; leaderboard?: ReactNode;
}) {
  const completed = result.status === 'COMPLETED';
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => { primary.current?.focus({ preventScroll: true }); }, [nextLevel]);
  const run = useMemo(() => {
    try { return summarizeRun(result, architecture, 'current-result'); } catch { return null; }
  }, [result, architecture]);
  const profile = useMemo(() => classifyArchitecture(run), [run]);
  const comparison = report?.previous;
  return <section className={`game-result operation-report${completed ? ' success' : ''}`} aria-label="Business result" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), summary, [tabindex="0"]')].filter(element => element.checkVisibility());
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div className="report-banner"><span>Operation report</span><span>{result.elapsedTime}s / {result.challenge?.workload.duration ?? 180}s</span></div>
    <div className="report-scroll">
    <div className="report-heading">
      <div><p className="report-status">{completed ? result.objectiveMet ? 'Objective secured' : 'Operation complete · objective missed' : 'Business interrupted'}</p>
        <h2 id="game-result-heading">{completed && result.objectiveMet ? 'CHALLENGE CLEAR' : completed ? 'OBJECTIVE MISSED' : 'OPERATION FAILED'}</h2><p className="report-cause">{result.primary}</p></div>
      <div className="result-score"><small>Score </small><strong>{result.score}</strong><span>/ 10,000</span></div>
    </div>
    <div className="outcome-summary"><strong>{(result.metrics.availability * 100).toFixed(2)}% <span>availability</span></strong>{run && <p>{architectureSummary(run)}</p>}</div>
    {result.challenge && <p className="report-objective" data-testid="challenge-outcome">{result.challenge.id} · {result.challenge.objective.kind === 'survive' ? 'Complete the operation' : `Availability ≥ ${result.challenge.objective.target * 100}%`} — {result.objectiveMet ? 'met' : 'not met'}</p>}
    {leaderboard}
    <details className="outcome-details"><summary>Details · decisions, tradeoffs &amp; records</summary>
    <div className="report-metrics">
      <div><span>Business value</span><strong>{result.economy.netBusinessValue.toFixed(1)} <small>cr</small></strong></div>
      <div><span>Availability</span><strong>{(result.metrics.availability * 100).toFixed(2)}<small>%</small></strong></div>
      <div><span>Total cost</span><strong>{(result.economy.infrastructureCost + result.economy.emergencyCost).toFixed(2)} <small>cr</small></strong></div>
    </div>
    <div className="report-columns">
      <section className="report-profile" aria-label="Architecture profile">
        <span className="report-kicker">Your architecture</span><h3>{profile.title}</h3>
        {run && <p className="report-topology">{architectureSummary(run)}</p>}
        <p>{profile.summary}</p><ul>{profile.evidence.map(evidence => <li key={evidence}>{evidence}</li>)}</ul>
        <p className="report-tradeoff">{profile.tradeoff}</p>
      </section>
      <section className="report-experiment" aria-label="Next experiment">
        <span className="report-kicker">Next experiment</span><h3>Same workload.<br/>A different decision.</h3>
        <p>{profile.experiment}</p><p className="report-engine-insight">{result.insight}</p>
        <small>A suggestion to test, not a guaranteed improvement.</small>
      </section>
    </div>
    <section className="report-comparison" aria-label="Run comparison">
      {comparison?.kind === 'comparable' ? <><h3>Against your previous attempt</h3><p>Same challenge · {comparison.previous.elapsed}s · {comparison.previous.status.toLowerCase()}</p>
        <div className="report-deltas"><span>Availability <strong>{delta(comparison.availability, 'pp')}</strong></span><span>Total cost <strong>{delta(comparison.cost, 'cr')}</strong></span><span>Business value <strong>{delta(comparison.value, 'cr')}</strong></span></div></>
        : <p>{comparison ? `Previous attempt: ${comparison.previous.elapsed}s, ${comparison.previous.status.toLowerCase()}. Different duration or outcome — no efficiency comparison.` : report ? 'No previous recorded attempt at these conditions. Try another architecture to build a comparison.' : 'Local comparison is unavailable. Your current game result is shown above.'}</p>}
      {report && <p className="report-records-note">{report.records.length ? `New personal best · ${report.records.join(' / ')}` : !result.objectiveMet ? 'Only full objective-valid completions qualify for personal bests.' : 'Existing personal bests retained. Equal results keep the earlier record.'}</p>}
      {report?.baseline?.kind === 'comparable' && <p>Against your previous highest-value completion: {delta(report.baseline.value, 'cr')} business value · {delta(report.baseline.cost, 'cr')} cost · {delta(report.baseline.availability, 'pp')} availability.</p>}
    </section>
    {records}
    </details>
    </div>
    <div className="report-footer">
    <div className="report-actions">
      {nextLevel && <button ref={primary} type="button" aria-label="Next level" className="result-primary" onClick={nextLevel}>Next level<span>Take on the next objective →</span></button>}
      <button ref={nextLevel ? undefined : primary} type="button" className={nextLevel ? 'report-alternate' : 'result-primary'} aria-label="Play again" aria-describedby="game-result-heading" onClick={restart}>Try another architecture<span>Play again · fresh baseline →</span></button>
      <button type="button" className="result-review" onClick={review}>Review business</button>
    </div>
    <p className="report-reset-note">A fresh App + SQL baseline. Same challenge. No upgrades carried over.</p>
    </div>
  </section>;
}
